export const NOTIFICATION_EXCHANGE = 'notifications.exchange';
export const NOTIFICATION_PROCESS_QUEUE = 'notifications.process';
export const NOTIFICATION_REQUESTED_ROUTING_KEY = 'notification.requested';
export const NOTIFICATION_MESSAGE_VERSION = 1;

export interface NotificationRequestedMessage {
  messageId: string;
  notificationId: string;
  event: typeof NOTIFICATION_REQUESTED_ROUTING_KEY;
  version: typeof NOTIFICATION_MESSAGE_VERSION;
  occurredAt: string;
}
