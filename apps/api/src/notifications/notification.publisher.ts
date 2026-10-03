import { randomUUID } from 'node:crypto';
import { Injectable, Logger, OnApplicationShutdown } from '@nestjs/common';
import {
  connect,
  type AmqpConnectionManager,
  type ChannelWrapper,
} from 'amqp-connection-manager';
import type { ConfirmChannel } from 'amqplib';

const EXCHANGE = 'notifications.exchange';
const QUEUE = 'notifications.process';
const ROUTING_KEY = 'notification.requested';
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
        await channel.assertExchange(EXCHANGE, 'direct', { durable: true });
        await channel.assertQueue(QUEUE, { durable: true });
        await channel.bindQueue(QUEUE, EXCHANGE, ROUTING_KEY);
      },
    });
    this.channel.on('error', (error: Error) =>
      this.logger.error('RabbitMQ channel setup failed', error),
    );
  }

  async publish(notificationId: string): Promise<void> {
    const messageId = randomUUID();
    const payload = {
      messageId,
      notificationId,
      event: ROUTING_KEY,
      version: 1,
      occurredAt: new Date().toISOString(),
    };

    await this.channel.publish(
      EXCHANGE,
      ROUTING_KEY,
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
