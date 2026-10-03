export const NOTIFICATION_EXCHANGE = 'notifications.exchange';
export const NOTIFICATION_PROCESS_QUEUE = 'notifications.process';
export const NOTIFICATION_REQUESTED_ROUTING_KEY = 'notification.requested';
export const NOTIFICATION_MESSAGE_VERSION = 1;
export const NOTIFICATION_ATTEMPT_HEADER = 'x-attempt';
export const NOTIFICATION_MAX_ATTEMPTS = 3;
export const NOTIFICATION_PUBLISH_TIMEOUT_MS = 5000;
export const NOTIFICATION_RETRY_DELAY_MS = 5000;
export const NOTIFICATION_RETRY_EXCHANGE = 'notifications.retry.exchange';
export const NOTIFICATION_RETRY_ROUTING_KEY = 'notification.retry';
export const NOTIFICATION_RETRY_QUEUE = 'notifications.retry';
export const NOTIFICATION_DLX = 'notifications.dlx';
export const NOTIFICATION_DEAD_LETTER_ROUTING_KEY = 'notification.dead-letter';
export const NOTIFICATION_DLQ = 'notifications.dlq';

export interface NotificationRequestedMessage {
  messageId: string;
  notificationId: string;
  event: typeof NOTIFICATION_REQUESTED_ROUTING_KEY;
  version: typeof NOTIFICATION_MESSAGE_VERSION;
  occurredAt: string;
}
