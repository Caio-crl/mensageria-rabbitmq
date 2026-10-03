import { Repository } from 'typeorm';
import { Notification } from '../../../../libs/notifications/src/notification.entity';
import {
  NotificationStatus,
  NotificationType,
} from '../../../../libs/notifications/src/notification.enums';
import { NotificationsService } from './notifications.service';

describe('NotificationsService', () => {
  it('creates a pending notification and ignores server fields in the input', async () => {
    const id = '876f55eb-0bed-466e-bab4-7d478c8b1fb3';
    const create = jest.fn().mockImplementation((input: Notification) => input);
    const save = jest
      .fn()
      .mockImplementation(async (input: Notification) => ({ ...input, id }));
    const repository = { create, save } as unknown as Repository<Notification>;
    const service = new NotificationsService(repository);
    const request = {
      recipient: 'user@example.com',
      type: NotificationType.EMAIL,
      subject: 'Welcome',
      message: 'Welcome to the platform',
      id: 'external-id',
      status: NotificationStatus.FAILED,
      processedAt: new Date(),
    };

    await expect(service.create(request)).resolves.toEqual({
      id,
      status: NotificationStatus.PENDING,
    });
    expect(create).toHaveBeenCalledWith({
      recipient: request.recipient,
      type: NotificationType.EMAIL,
      subject: request.subject,
      message: request.message,
      status: NotificationStatus.PENDING,
      processedAt: null,
    });
    expect(save).toHaveBeenCalledWith(
      expect.objectContaining({
        status: NotificationStatus.PENDING,
        processedAt: null,
      }),
    );
  });
});
