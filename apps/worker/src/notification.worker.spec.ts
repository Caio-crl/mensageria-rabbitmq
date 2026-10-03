import { connect } from 'amqp-connection-manager';
import type { Channel, ConfirmChannel, ConsumeMessage } from 'amqplib';
import { Repository } from 'typeorm';
import { Notification } from '../../../libs/notifications/src/notification.entity';
import { NotificationStatus } from '../../../libs/notifications/src/notification.enums';
import { FakeEmailSender } from './fake-email.sender';
import { NotificationWorker } from './notification.worker';

jest.mock('amqp-connection-manager', () => ({ connect: jest.fn() }));

describe('NotificationWorker', () => {
  const notificationId = '876f55eb-0bed-466e-bab4-7d478c8b1fb3';
  const messageId = '212d5acb-1775-4e26-ab7b-af7ea8cf7526';
  const payload = {
    messageId,
    notificationId,
    event: 'notification.requested',
    version: 1,
    occurredAt: '2026-10-03T17:34:22.917Z',
  };
  const content = Buffer.from(JSON.stringify(payload));
  const delivery = {
    content,
    properties: { headers: { 'x-attempt': 1 } },
  } as unknown as ConsumeMessage;

  beforeEach(() => jest.clearAllMocks());

  function setup(status: NotificationStatus = NotificationStatus.PENDING) {
    const events: string[] = [];
    const savedStates: {
      status: NotificationStatus;
      processedAt: Date | null;
    }[] = [];
    const notification = {
      id: notificationId,
      status,
      processedAt: null,
    } as Notification;
    const findOneBy = jest.fn().mockResolvedValue(notification);
    const save = jest.fn().mockImplementation(async (item: Notification) => {
      events.push(`save:${item.status}`);
      savedStates.push({ status: item.status, processedAt: item.processedAt });
      return item;
    });
    const repository = {
      findOneBy,
      save,
    } as unknown as Repository<Notification>;
    const send = jest.fn().mockImplementation(async () => {
      events.push('send');
    });
    const sender = { send } as unknown as FakeEmailSender;
    const ack = jest.fn().mockImplementation(() => events.push('ack'));
    const nack = jest.fn().mockImplementation(() => events.push('nack'));
    const channel = { ack, nack } as unknown as Channel;
    const retryPublish = jest.fn().mockImplementation(async () => {
      events.push('retry:confirmed');
      return true;
    });
    const wrapper = {
      publish: retryPublish,
      on: jest.fn(),
      close: jest.fn().mockResolvedValue(undefined),
    };
    const manager = {
      on: jest.fn(),
      createChannel: jest.fn().mockReturnValue(wrapper),
      close: jest.fn().mockResolvedValue(undefined),
    };
    jest
      .mocked(connect)
      .mockReturnValue(manager as unknown as ReturnType<typeof connect>);
    process.env.RABBITMQ_URL = 'amqp://localhost:5672';
    const worker = new NotificationWorker(repository, sender);
    worker.onModuleInit();
    return {
      worker,
      notification,
      findOneBy,
      save,
      send,
      ack,
      nack,
      channel,
      events,
      savedStates,
      retryPublish,
      wrapper,
      manager,
    };
  }

  function failSender(context: ReturnType<typeof setup>) {
    context.send.mockImplementation(async () => {
      context.events.push('send');
      throw new Error('simulated send failure');
    });
  }

  it('moves PENDING through PROCESSING to SENT, then acknowledges', async () => {
    const context = setup();

    await context.worker.handleDelivery(context.channel, delivery);

    expect(context.findOneBy).toHaveBeenCalledWith({ id: notificationId });
    expect(context.events).toEqual([
      'save:PROCESSING',
      'send',
      'save:SENT',
      'ack',
    ]);
    expect(context.notification.status).toBe(NotificationStatus.SENT);
    expect(context.notification.processedAt).toBeInstanceOf(Date);
    expect(context.savedStates[1]).toEqual({
      status: NotificationStatus.SENT,
      processedAt: expect.any(Date),
    });
    expect(context.ack).toHaveBeenCalledWith(delivery);
    expect(context.nack).not.toHaveBeenCalled();
  });

  it.each([NotificationStatus.SENT, NotificationStatus.FAILED])(
    'acks redelivery for terminal status %s without sending again',
    async (status) => {
      const context = setup(status);

      await context.worker.handleDelivery(context.channel, delivery);

      expect(context.send).not.toHaveBeenCalled();
      expect(context.save).not.toHaveBeenCalled();
      expect(context.ack).toHaveBeenCalledWith(delivery);
      expect(context.nack).not.toHaveBeenCalled();
    },
  );

  it('does not send again when the same message is delivered after SENT', async () => {
    const context = setup();
    const redelivery = {
      content,
      properties: { headers: { 'x-attempt': 1 } },
      fields: { redelivered: true },
    } as unknown as ConsumeMessage;

    await context.worker.handleDelivery(context.channel, delivery);
    await context.worker.handleDelivery(context.channel, redelivery);

    expect(context.findOneBy).toHaveBeenCalledTimes(2);
    expect(context.send).toHaveBeenCalledTimes(1);
    expect(context.save).toHaveBeenCalledTimes(2);
    expect(context.ack).toHaveBeenNthCalledWith(1, delivery);
    expect(context.ack).toHaveBeenNthCalledWith(2, redelivery);
    expect(context.nack).not.toHaveBeenCalled();
  });

  it('acks SENT redelivery after the first ack fails', async () => {
    const context = setup();
    const redelivery = {
      content,
      properties: { headers: { 'x-attempt': 1 } },
      fields: { redelivered: true },
    } as unknown as ConsumeMessage;
    context.ack.mockImplementationOnce(() => {
      throw new Error('connection lost before ack');
    });

    await context.worker.handleDelivery(context.channel, delivery);
    expect(context.notification.status).toBe(NotificationStatus.SENT);
    expect(context.notification.processedAt).toBeInstanceOf(Date);
    expect(context.nack).toHaveBeenCalledWith(delivery, false, true);

    await context.worker.handleDelivery(context.channel, redelivery);

    expect(context.send).toHaveBeenCalledTimes(1);
    expect(context.save).toHaveBeenCalledTimes(2);
    expect(context.ack).toHaveBeenLastCalledWith(redelivery);
  });

  it('reprocesses PROCESSING redelivery', async () => {
    const context = setup(NotificationStatus.PROCESSING);

    await context.worker.handleDelivery(context.channel, delivery);

    expect(context.events).toEqual([
      'save:PROCESSING',
      'send',
      'save:SENT',
      'ack',
    ]);
  });

  it.each([1, 2])(
    'failure on attempt %s schedules the next attempt',
    async (attempt) => {
      const context = setup();
      failSender(context);
      const currentDelivery = {
        content,
        properties: { headers: { 'x-attempt': attempt } },
      } as unknown as ConsumeMessage;

      await context.worker.handleDelivery(context.channel, currentDelivery);

      expect(context.events).toEqual([
        'save:PROCESSING',
        'send',
        'save:PENDING',
        'retry:confirmed',
        'ack',
      ]);
      expect(context.savedStates[1]).toEqual({
        status: NotificationStatus.PENDING,
        processedAt: null,
      });
      expect(context.retryPublish).toHaveBeenCalledWith(
        'notifications.retry.exchange',
        'notification.retry',
        content,
        {
          persistent: true,
          contentType: 'application/json',
          messageId,
          headers: { 'x-attempt': attempt + 1 },
        },
      );
      expect(context.ack).toHaveBeenCalledWith(currentDelivery);
      expect(context.nack).not.toHaveBeenCalled();
    },
  );

  it('treats a missing x-attempt header as attempt 1', async () => {
    const context = setup();
    failSender(context);
    const oldDelivery = {
      content,
      properties: { headers: {} },
    } as unknown as ConsumeMessage;

    await context.worker.handleDelivery(context.channel, oldDelivery);

    expect(context.retryPublish.mock.calls[0][3]).toEqual(
      expect.objectContaining({ headers: { 'x-attempt': 2 } }),
    );
  });

  it('acks the original only after retry publisher confirm', async () => {
    const context = setup();
    failSender(context);
    let confirm!: (value: boolean) => void;
    context.retryPublish.mockReturnValue(
      new Promise<boolean>((resolve) => (confirm = resolve)),
    );

    const pending = context.worker.handleDelivery(context.channel, delivery);
    await new Promise((resolve) => setImmediate(resolve));
    expect(context.retryPublish).toHaveBeenCalledTimes(1);
    expect(context.ack).not.toHaveBeenCalled();

    confirm(true);
    await pending;
    expect(context.ack).toHaveBeenCalledWith(delivery);
  });

  it('does not ack the original when retry publication fails', async () => {
    const context = setup();
    failSender(context);
    context.retryPublish.mockRejectedValue(new Error('publisher timeout'));

    await context.worker.handleDelivery(context.channel, delivery);

    expect(context.notification.status).toBe(NotificationStatus.PENDING);
    expect(context.notification.processedAt).toBeNull();
    expect(context.ack).not.toHaveBeenCalled();
    expect(context.nack).toHaveBeenCalledWith(delivery, false, true);
  });

  it('allows original redelivery and confirmed retry to coexist after ack failure', async () => {
    const context = setup();
    failSender(context);
    context.ack.mockImplementationOnce(() => {
      throw new Error('connection lost before ack');
    });

    await context.worker.handleDelivery(context.channel, delivery);

    expect(context.retryPublish).toHaveBeenCalledWith(
      'notifications.retry.exchange',
      'notification.retry',
      content,
      expect.objectContaining({ messageId, headers: { 'x-attempt': 2 } }),
    );
    expect(context.nack).toHaveBeenCalledWith(delivery, false, true);
    expect(context.notification.status).toBe(NotificationStatus.PENDING);

    context.send.mockImplementation(async () => context.events.push('send'));
    const redeliveredOriginal = {
      content,
      properties: { headers: { 'x-attempt': 1 } },
      fields: { redelivered: true },
    } as unknown as ConsumeMessage;
    const confirmedRetry = {
      content,
      properties: { headers: { 'x-attempt': 2 } },
    } as unknown as ConsumeMessage;

    await context.worker.handleDelivery(context.channel, redeliveredOriginal);
    await context.worker.handleDelivery(context.channel, confirmedRetry);

    expect(context.send).toHaveBeenCalledTimes(2);
    expect(context.retryPublish).toHaveBeenCalledTimes(1);
    expect(context.notification.status).toBe(NotificationStatus.SENT);
    expect(context.ack).toHaveBeenCalledWith(redeliveredOriginal);
    expect(context.ack).toHaveBeenCalledWith(confirmedRetry);
  });

  it('persists FAILED with processedAt and dead-letters attempt 3', async () => {
    const context = setup();
    failSender(context);
    const finalDelivery = {
      content,
      properties: { headers: { 'x-attempt': 3 } },
    } as unknown as ConsumeMessage;

    await context.worker.handleDelivery(context.channel, finalDelivery);

    expect(context.events).toEqual([
      'save:PROCESSING',
      'send',
      'save:FAILED',
      'nack',
    ]);
    expect(context.savedStates[1]).toEqual({
      status: NotificationStatus.FAILED,
      processedAt: expect.any(Date),
    });
    expect(context.retryPublish).not.toHaveBeenCalled();
    expect(context.ack).not.toHaveBeenCalled();
    expect(context.nack).toHaveBeenCalledWith(finalDelivery, false, false);
  });

  it('dead-letters FAILED final redelivery without sending again', async () => {
    const context = setup(NotificationStatus.FAILED);
    const finalDelivery = {
      content,
      properties: { headers: { 'x-attempt': 3 } },
    } as unknown as ConsumeMessage;

    await context.worker.handleDelivery(context.channel, finalDelivery);

    expect(context.send).not.toHaveBeenCalled();
    expect(context.save).not.toHaveBeenCalled();
    expect(context.ack).not.toHaveBeenCalled();
    expect(context.nack).toHaveBeenCalledWith(finalDelivery, false, false);
  });

  it('nacks without requeue when the Notification does not exist', async () => {
    const context = setup();
    context.findOneBy.mockResolvedValue(null);

    await context.worker.handleDelivery(context.channel, delivery);

    expect(context.nack).toHaveBeenCalledWith(delivery, false, false);
    expect(context.ack).not.toHaveBeenCalled();
    expect(context.send).not.toHaveBeenCalled();
  });

  it.each([
    Buffer.from('not json'),
    Buffer.from(JSON.stringify({ ...payload, messageId: 'bad-id' })),
    Buffer.from(JSON.stringify({ ...payload, event: 'wrong.event' })),
    Buffer.from(JSON.stringify({ ...payload, version: 2 })),
    Buffer.from(JSON.stringify({ ...payload, occurredAt: 'not-a-date' })),
  ])('nacks invalid messages without requeue', async (content) => {
    const context = setup();
    const invalidDelivery = { content } as ConsumeMessage;

    await context.worker.handleDelivery(context.channel, invalidDelivery);

    expect(context.nack).toHaveBeenCalledWith(invalidDelivery, false, false);
    expect(context.ack).not.toHaveBeenCalled();
    expect(context.findOneBy).not.toHaveBeenCalled();
  });

  it('nacks with requeue without ack when the database cannot load', async () => {
    const context = setup();
    context.findOneBy.mockRejectedValue(new Error('database unavailable'));

    await context.worker.handleDelivery(context.channel, delivery);

    expect(context.nack).toHaveBeenCalledWith(delivery, false, true);
    expect(context.ack).not.toHaveBeenCalled();
    expect(context.send).not.toHaveBeenCalled();
  });

  it('does not ack if terminal status cannot be persisted', async () => {
    const context = setup();
    context.save
      .mockResolvedValueOnce(context.notification)
      .mockRejectedValueOnce(new Error('database unavailable'));

    await context.worker.handleDelivery(context.channel, delivery);

    expect(context.nack).toHaveBeenCalledWith(delivery, false, true);
    expect(context.ack).not.toHaveBeenCalled();
  });

  it('may send again when saving SENT fails after the effect', async () => {
    const context = setup();
    let persistedStatus = NotificationStatus.PENDING;
    let saveCount = 0;
    context.findOneBy.mockImplementation(async () => ({
      id: notificationId,
      status: persistedStatus,
      processedAt: null,
    }));
    context.save.mockImplementation(async (item: Notification) => {
      saveCount += 1;
      if (saveCount === 2) {
        throw new Error('database unavailable after send');
      }
      persistedStatus = item.status;
      return item;
    });

    await context.worker.handleDelivery(context.channel, delivery);

    expect(context.send).toHaveBeenCalledTimes(1);
    expect(persistedStatus).toBe(NotificationStatus.PROCESSING);
    expect(context.ack).not.toHaveBeenCalled();
    expect(context.nack).toHaveBeenCalledWith(delivery, false, true);

    const redelivery = {
      content,
      properties: { headers: { 'x-attempt': 1 } },
      fields: { redelivered: true },
    } as unknown as ConsumeMessage;
    await context.worker.handleDelivery(context.channel, redelivery);

    expect(context.send).toHaveBeenCalledTimes(2);
    expect(persistedStatus).toBe(NotificationStatus.SENT);
    expect(context.ack).toHaveBeenCalledWith(redelivery);
  });

  it('declares topology, prefetches one, consumes with manual ack, and closes', async () => {
    const context = setup();
    const options = context.manager.createChannel.mock.calls[0][0];
    const rawChannel = {
      assertExchange: jest.fn().mockResolvedValue(undefined),
      assertQueue: jest.fn().mockResolvedValue(undefined),
      bindQueue: jest.fn().mockResolvedValue(undefined),
      prefetch: jest.fn().mockResolvedValue(undefined),
      consume: jest.fn().mockResolvedValue({ consumerTag: 'worker' }),
    };
    await options.setup(rawChannel as unknown as ConfirmChannel);

    expect(context.manager.createChannel).toHaveBeenCalledWith(
      expect.objectContaining({ confirm: true, publishTimeout: 5000 }),
    );
    expect(rawChannel.assertExchange).toHaveBeenCalledWith(
      'notifications.exchange',
      'direct',
      { durable: true },
    );
    expect(rawChannel.assertQueue).toHaveBeenCalledWith(
      'notifications.process',
      {
        durable: true,
        arguments: {
          'x-dead-letter-exchange': 'notifications.dlx',
          'x-dead-letter-routing-key': 'notification.dead-letter',
        },
      },
    );
    expect(rawChannel.assertQueue).toHaveBeenCalledWith('notifications.retry', {
      durable: true,
      arguments: {
        'x-message-ttl': 5000,
        'x-dead-letter-exchange': 'notifications.exchange',
        'x-dead-letter-routing-key': 'notification.requested',
      },
    });
    expect(rawChannel.assertQueue).toHaveBeenCalledWith('notifications.dlq', {
      durable: true,
    });
    expect(rawChannel.bindQueue).toHaveBeenCalledWith(
      'notifications.process',
      'notifications.exchange',
      'notification.requested',
    );
    expect(rawChannel.bindQueue).toHaveBeenCalledWith(
      'notifications.retry',
      'notifications.retry.exchange',
      'notification.retry',
    );
    expect(rawChannel.bindQueue).toHaveBeenCalledWith(
      'notifications.dlq',
      'notifications.dlx',
      'notification.dead-letter',
    );
    expect(rawChannel.prefetch).toHaveBeenCalledWith(1);
    expect(rawChannel.consume).toHaveBeenCalledWith(
      'notifications.process',
      expect.any(Function),
      { noAck: false },
    );
    await context.worker.onApplicationShutdown();
    expect(context.wrapper.close).toHaveBeenCalledTimes(1);
    expect(context.manager.close).toHaveBeenCalledTimes(1);
  });
});
