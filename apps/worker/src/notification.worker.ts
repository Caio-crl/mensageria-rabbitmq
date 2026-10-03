import {
  Injectable,
  Logger,
  OnApplicationShutdown,
  OnModuleInit,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import {
  connect,
  type AmqpConnectionManager,
  type ChannelWrapper,
} from 'amqp-connection-manager';
import type { Channel, ConsumeMessage } from 'amqplib';
import { Repository } from 'typeorm';
import { Notification } from '../../../libs/notifications/src/notification.entity';
import { NotificationStatus } from '../../../libs/notifications/src/notification.enums';
import {
  NOTIFICATION_EXCHANGE,
  NOTIFICATION_MESSAGE_VERSION,
  NOTIFICATION_PROCESS_QUEUE,
  NOTIFICATION_REQUESTED_ROUTING_KEY,
  type NotificationRequestedMessage,
} from '../../../libs/notifications/src/notification-requested.message';
import { FakeEmailSender } from './fake-email.sender';

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function parseMessage(content: Buffer): NotificationRequestedMessage | null {
  let value: unknown;
  try {
    value = JSON.parse(content.toString('utf8'));
  } catch {
    return null;
  }
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return null;
  }

  const message = value as Record<string, unknown>;
  if (
    typeof message.messageId !== 'string' ||
    !UUID_PATTERN.test(message.messageId) ||
    typeof message.notificationId !== 'string' ||
    !UUID_PATTERN.test(message.notificationId) ||
    message.messageId === message.notificationId ||
    message.event !== NOTIFICATION_REQUESTED_ROUTING_KEY ||
    message.version !== NOTIFICATION_MESSAGE_VERSION ||
    typeof message.occurredAt !== 'string' ||
    Number.isNaN(Date.parse(message.occurredAt)) ||
    new Date(message.occurredAt).toISOString() !== message.occurredAt
  ) {
    return null;
  }
  return message as unknown as NotificationRequestedMessage;
}

@Injectable()
export class NotificationWorker implements OnModuleInit, OnApplicationShutdown {
  private readonly logger = new Logger(NotificationWorker.name);
  private connection?: AmqpConnectionManager;
  private channel?: ChannelWrapper;

  constructor(
    @InjectRepository(Notification)
    private readonly notifications: Repository<Notification>,
    private readonly sender: FakeEmailSender,
  ) {}

  onModuleInit(): void {
    const url = process.env.RABBITMQ_URL;
    if (!url) {
      throw new Error('RABBITMQ_URL is required');
    }

    this.connection = connect(url);
    this.connection.on('connect', () => this.logger.log('RabbitMQ connected'));
    this.channel = this.connection.createChannel({
      confirm: false,
      setup: async (channel: Channel) => {
        await channel.assertExchange(NOTIFICATION_EXCHANGE, 'direct', {
          durable: true,
        });
        await channel.assertQueue(NOTIFICATION_PROCESS_QUEUE, {
          durable: true,
        });
        await channel.bindQueue(
          NOTIFICATION_PROCESS_QUEUE,
          NOTIFICATION_EXCHANGE,
          NOTIFICATION_REQUESTED_ROUTING_KEY,
        );
        await channel.prefetch(1);
        await channel.consume(
          NOTIFICATION_PROCESS_QUEUE,
          (message) => {
            if (!message) {
              this.logger.warn('RabbitMQ consumer cancelled');
              return;
            }
            void this.handleDelivery(channel, message).catch((error) =>
              this.logger.error('Unable to settle RabbitMQ delivery', error),
            );
          },
          { noAck: false },
        );
        this.logger.log(`Consuming ${NOTIFICATION_PROCESS_QUEUE}`);
      },
    });
    this.channel.on('error', (error: Error) =>
      this.logger.error('RabbitMQ consumer setup failed', error),
    );
  }

  async handleDelivery(
    channel: Channel,
    delivery: ConsumeMessage,
  ): Promise<void> {
    const message = parseMessage(delivery.content);
    if (!message) {
      this.logger.warn('Invalid notification message discarded');
      channel.nack(delivery, false, false);
      return;
    }

    const { notificationId, messageId } = message;
    try {
      const notification = await this.notifications.findOneBy({
        id: notificationId,
      });
      if (!notification) {
        this.logger.error(
          `Notification ${notificationId} not found for message ${messageId}`,
        );
        channel.nack(delivery, false, false);
        return;
      }

      if (
        notification.status === NotificationStatus.SENT ||
        notification.status === NotificationStatus.FAILED
      ) {
        this.logger.log(
          `Notification ${notificationId} already ${notification.status}; acking message ${messageId}`,
        );
        channel.ack(delivery);
        return;
      }
      if (
        notification.status !== NotificationStatus.PENDING &&
        notification.status !== NotificationStatus.PROCESSING
      ) {
        throw new Error(
          `Unsupported notification status ${notification.status}`,
        );
      }

      notification.status = NotificationStatus.PROCESSING;
      await this.notifications.save(notification);
      try {
        await this.sender.send(notification);
        notification.status = NotificationStatus.SENT;
      } catch (error) {
        this.logger.error(
          `Fake email failed for notification ${notificationId}, message ${messageId}`,
          error,
        );
        notification.status = NotificationStatus.FAILED;
      }
      notification.processedAt = new Date();
      await this.notifications.save(notification);
      this.logger.log(
        `Notification ${notificationId} ${notification.status}; acking message ${messageId}`,
      );
      channel.ack(delivery);
    } catch (error) {
      this.logger.error(
        `Infrastructure failure for notification ${notificationId}, message ${messageId}`,
        error,
      );
      channel.nack(delivery, false, true);
    }
  }

  async onApplicationShutdown(): Promise<void> {
    try {
      await this.channel?.close();
    } finally {
      await this.connection?.close();
    }
  }
}
