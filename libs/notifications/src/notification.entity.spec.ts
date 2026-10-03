import { Notification } from './notification.entity';
import { NotificationStatus, NotificationType } from './notification.enums';
import { notificationDataSourceOptions } from './typeorm.config';

describe('Notification persistence configuration', () => {
  it('uses explicit migrations without schema synchronization', () => {
    expect(notificationDataSourceOptions).toMatchObject({
      type: 'mysql',
      synchronize: false,
      migrationsRun: false,
    });
    expect(notificationDataSourceOptions.entities).toContain(Notification);
    expect(notificationDataSourceOptions.migrations).toHaveLength(1);
  });

  it('defines only the notification types and statuses in this checkpoint', () => {
    expect(Object.values(NotificationType)).toEqual(['EMAIL']);
    expect(Object.values(NotificationStatus)).toEqual([
      'PENDING',
      'PROCESSING',
      'SENT',
      'FAILED',
    ]);
  });
});
