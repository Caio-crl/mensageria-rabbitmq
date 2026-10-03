import { randomUUID } from 'node:crypto';
import { Injectable, Logger, OnApplicationShutdown } from '@nestjs/common';
import {
  connect,
  type AmqpConnectionManager,
  type ChannelWrapper,
} from 'amqp-connection-manager';
import type { ConfirmChannel } from 'amqplib';
import {
  NOTIFICATION_EXCHANGE,
  NOTIFICATION_MESSAGE_VERSION,
  NOTIFICATION_PROCESS_QUEUE,
  NOTIFICATION_REQUESTED_ROUTING_KEY,
  type NotificationRequestedMessage,
} from '../../../../libs/notifications/src/notification-requested.message';

const PUBLISH_TIMEOUT_MS = 5000;

@Injectable()
export class NotificationPublisher implements OnApplicationShutdown {
  private readonly logger = new Logger(NotificationPublisher.name);
  private readonly connection: AmqpConnectionManager;
  private readonly channel: ChannelWrapper;

  constructor() {
    const url = process.env.RABBITMQ_URL;
    if (!url) {
      throw new Error('RABBITMQ_URL is required');
    }

    this.connection = connect(url);
    this.connection.on('connect', () => this.logger.log('RabbitMQ connected'));
    this.channel = this.connection.createChannel({
      confirm: true,
      publishTimeout: PUBLISH_TIMEOUT_MS,
      setup: async (channel: ConfirmChannel) => {
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
      },
    });
    this.channel.on('error', (error: Error) =>
      this.logger.error('RabbitMQ channel setup failed', error),
    );
  }

  async publish(notificationId: string): Promise<void> {
    const messageId = randomUUID();
    const payload: NotificationRequestedMessage = {
      messageId,
      notificationId,
      event: NOTIFICATION_REQUESTED_ROUTING_KEY,
      version: NOTIFICATION_MESSAGE_VERSION,
      occurredAt: new Date().toISOString(),
    };

    await this.channel.publish(
      NOTIFICATION_EXCHANGE,
      NOTIFICATION_REQUESTED_ROUTING_KEY,
      Buffer.from(JSON.stringify(payload)),
      {
        persistent: true,
        contentType: 'application/json',
        messageId,
      },
    );
  }

  async onApplicationShutdown(): Promise<void> {
    await this.channel.close();
    await this.connection.close();
  }
}
