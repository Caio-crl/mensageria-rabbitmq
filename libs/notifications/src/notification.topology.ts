import type { Channel } from 'amqplib';
import {
  NOTIFICATION_DEAD_LETTER_ROUTING_KEY,
  NOTIFICATION_DLQ,
  NOTIFICATION_DLX,
  NOTIFICATION_EXCHANGE,
  NOTIFICATION_PROCESS_QUEUE,
  NOTIFICATION_REQUESTED_ROUTING_KEY,
  NOTIFICATION_RETRY_DELAY_MS,
  NOTIFICATION_RETRY_EXCHANGE,
  NOTIFICATION_RETRY_QUEUE,
  NOTIFICATION_RETRY_ROUTING_KEY,
} from './notification-requested.message';

export async function assertNotificationTopology(
  channel: Channel,
): Promise<void> {
  await channel.assertExchange(NOTIFICATION_EXCHANGE, 'direct', {
    durable: true,
  });
  await channel.assertExchange(NOTIFICATION_RETRY_EXCHANGE, 'direct', {
    durable: true,
  });
  await channel.assertExchange(NOTIFICATION_DLX, 'direct', { durable: true });

  await channel.assertQueue(NOTIFICATION_PROCESS_QUEUE, {
    durable: true,
    arguments: {
      'x-dead-letter-exchange': NOTIFICATION_DLX,
      'x-dead-letter-routing-key': NOTIFICATION_DEAD_LETTER_ROUTING_KEY,
    },
  });
  await channel.assertQueue(NOTIFICATION_RETRY_QUEUE, {
    durable: true,
    arguments: {
      'x-message-ttl': NOTIFICATION_RETRY_DELAY_MS,
      'x-dead-letter-exchange': NOTIFICATION_EXCHANGE,
      'x-dead-letter-routing-key': NOTIFICATION_REQUESTED_ROUTING_KEY,
    },
  });
  await channel.assertQueue(NOTIFICATION_DLQ, { durable: true });

  await channel.bindQueue(
    NOTIFICATION_PROCESS_QUEUE,
    NOTIFICATION_EXCHANGE,
    NOTIFICATION_REQUESTED_ROUTING_KEY,
  );
  await channel.bindQueue(
    NOTIFICATION_RETRY_QUEUE,
    NOTIFICATION_RETRY_EXCHANGE,
    NOTIFICATION_RETRY_ROUTING_KEY,
  );
  await channel.bindQueue(
    NOTIFICATION_DLQ,
    NOTIFICATION_DLX,
    NOTIFICATION_DEAD_LETTER_ROUTING_KEY,
  );
}
