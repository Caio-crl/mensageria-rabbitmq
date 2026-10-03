import { randomUUID } from 'node:crypto';
import { connect } from 'amqp-connection-manager';
import type { ConfirmChannel } from 'amqplib';
import { NotificationPublisher } from './notification.publisher';

jest.mock('amqp-connection-manager', () => ({ connect: jest.fn() }));

describe('NotificationPublisher', () => {
  const notificationId = '876f55eb-0bed-466e-bab4-7d478c8b1fb3';
  const publish = jest.fn();
  const channel = {
    publish,
    on: jest.fn(),
    close: jest.fn().mockResolvedValue(undefined),
  };
  const connection = {
    createChannel: jest.fn().mockReturnValue(channel),
    on: jest.fn(),
    close: jest.fn().mockResolvedValue(undefined),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    process.env.RABBITMQ_URL = 'amqp://localhost:5672';
    jest
      .mocked(connect)
      .mockReturnValue(connection as unknown as ReturnType<typeof connect>);
    publish.mockResolvedValue(true);
  });

  it('declares durable direct topology on a confirm channel', async () => {
    const publisher = new NotificationPublisher();
    const options = connection.createChannel.mock.calls[0][0];
    const setup = options.setup as (channel: ConfirmChannel) => Promise<void>;
    const amqpChannel = {
      assertExchange: jest.fn().mockResolvedValue(undefined),
      assertQueue: jest.fn().mockResolvedValue(undefined),
      bindQueue: jest.fn().mockResolvedValue(undefined),
    };

    expect(connection.createChannel).toHaveBeenCalledWith(
      expect.objectContaining({ confirm: true, publishTimeout: 5000 }),
    );
    await setup(amqpChannel as unknown as ConfirmChannel);
    expect(amqpChannel.assertExchange).toHaveBeenCalledWith(
      'notifications.exchange',
      'direct',
      { durable: true },
    );
    expect(amqpChannel.assertQueue).toHaveBeenCalledWith(
      'notifications.process',
      { durable: true },
    );
    expect(amqpChannel.bindQueue).toHaveBeenCalledWith(
      'notifications.process',
      'notifications.exchange',
      'notification.requested',
    );
    await publisher.onApplicationShutdown();
    expect(channel.close).toHaveBeenCalledTimes(1);
    expect(connection.close).toHaveBeenCalledTimes(1);
  });

  it('publishes only the message contract as persistent and waits for confirm', async () => {
    const publisher = new NotificationPublisher();
    let confirm!: (value: boolean) => void;
    publish.mockReturnValue(
      new Promise<boolean>((resolve) => (confirm = resolve)),
    );

    const pending = publisher.publish(notificationId);
    let settled = false;
    void pending.then(() => (settled = true));
    await Promise.resolve();
    expect(settled).toBe(false);

    const [exchange, routingKey, content, options] = publish.mock.calls[0];
    const payload = JSON.parse((content as Buffer).toString()) as Record<
      string,
      unknown
    >;
    expect(exchange).toBe('notifications.exchange');
    expect(routingKey).toBe('notification.requested');
    expect(Object.keys(payload).sort()).toEqual(
      ['messageId', 'notificationId', 'event', 'version', 'occurredAt'].sort(),
    );
    expect(payload.messageId).toEqual(expect.any(String));
    expect(payload.messageId).not.toBe(notificationId);
    expect(payload.notificationId).toBe(notificationId);
    expect(payload.event).toBe('notification.requested');
    expect(payload.version).toBe(1);
    expect(payload.occurredAt).toEqual(expect.any(String));
    expect(new Date(payload.occurredAt as string).toISOString()).toBe(
      payload.occurredAt,
    );
    expect(options).toEqual({
      persistent: true,
      contentType: 'application/json',
      messageId: payload.messageId,
    });

    confirm(true);
    await pending;
    expect(settled).toBe(true);
    await publisher.onApplicationShutdown();
  });

  it('propagates a rejected publisher confirm', async () => {
    const publisher = new NotificationPublisher();
    publish.mockRejectedValue(new Error('nack'));

    await expect(publisher.publish(randomUUID())).rejects.toThrow('nack');
    await publisher.onApplicationShutdown();
  });
});
