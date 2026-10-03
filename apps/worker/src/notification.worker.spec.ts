import { connect } from 'amqp-connection-manager';
import type { Channel, ConsumeMessage } from 'amqplib';
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
  const delivery = {
    content: Buffer.from(JSON.stringify(payload)),
  } as ConsumeMessage;

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
    return {
      worker: new NotificationWorker(repository, sender),
      notification,
      findOneBy,
      save,
      send,
      ack,
      nack,
      channel,
      events,
      savedStates,
    };
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

  it('persists FAILED and processedAt before ack after sender failure', async () => {
    const context = setup();
    context.send.mockImplementation(async () => {
      context.events.push('send');
      throw new Error('simulated send failure');
    });

    await context.worker.handleDelivery(context.channel, delivery);

    expect(context.events).toEqual([
      'save:PROCESSING',
      'send',
      'save:FAILED',
      'ack',
    ]);
    expect(context.notification.status).toBe(NotificationStatus.FAILED);
    expect(context.notification.processedAt).toBeInstanceOf(Date);
    expect(context.savedStates[1]).toEqual({
      status: NotificationStatus.FAILED,
      processedAt: expect.any(Date),
    });
    expect(context.nack).not.toHaveBeenCalled();
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

  it('declares topology, prefetches one, consumes with manual ack, and closes', async () => {
    const context = setup();
    const wrapper = {
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

    context.worker.onModuleInit();
    const options = manager.createChannel.mock.calls[0][0];
    const rawChannel = {
      assertExchange: jest.fn().mockResolvedValue(undefined),
      assertQueue: jest.fn().mockResolvedValue(undefined),
      bindQueue: jest.fn().mockResolvedValue(undefined),
      prefetch: jest.fn().mockResolvedValue(undefined),
      consume: jest.fn().mockResolvedValue({ consumerTag: 'worker' }),
    };
    await options.setup(rawChannel as unknown as Channel);

    expect(manager.createChannel).toHaveBeenCalledWith(
      expect.objectContaining({ confirm: false }),
    );
    expect(rawChannel.assertExchange).toHaveBeenCalledWith(
      'notifications.exchange',
      'direct',
      { durable: true },
    );
    expect(rawChannel.assertQueue).toHaveBeenCalledWith(
      'notifications.process',
      { durable: true },
    );
    expect(rawChannel.bindQueue).toHaveBeenCalledWith(
      'notifications.process',
      'notifications.exchange',
      'notification.requested',
    );
    expect(rawChannel.prefetch).toHaveBeenCalledWith(1);
    expect(rawChannel.consume).toHaveBeenCalledWith(
      'notifications.process',
      expect.any(Function),
      { noAck: false },
    );
    await context.worker.onApplicationShutdown();
    expect(wrapper.close).toHaveBeenCalledTimes(1);
    expect(manager.close).toHaveBeenCalledTimes(1);
  });
});
