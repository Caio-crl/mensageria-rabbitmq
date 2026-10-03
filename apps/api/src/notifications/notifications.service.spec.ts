import { HttpStatus, ServiceUnavailableException } from '@nestjs/common';
import { Repository } from 'typeorm';
import { Notification } from '../../../../libs/notifications/src/notification.entity';
import {
  NotificationStatus,
  NotificationType,
} from '../../../../libs/notifications/src/notification.enums';
import { NotificationPublisher } from './notification.publisher';
import { NotificationsService } from './notifications.service';

describe('NotificationsService', () => {
  const id = '876f55eb-0bed-466e-bab4-7d478c8b1fb3';
  const request = {
    recipient: 'user@example.com',
    type: NotificationType.EMAIL,
    subject: 'Welcome',
    message: 'Welcome to the platform',
    id: 'external-id',
    status: NotificationStatus.FAILED,
    processedAt: new Date(),
  };

  function createService(publish: jest.Mock) {
    const create = jest.fn().mockImplementation((input: Notification) => input);
    const save = jest
      .fn()
      .mockImplementation(async (input: Notification) => ({ ...input, id }));
    const repository = { create, save } as unknown as Repository<Notification>;
    const publisher = { publish } as unknown as NotificationPublisher;
    return {
      service: new NotificationsService(repository, publisher),
      create,
      save,
    };
  }

  it('persists PENDING before publishing and returns only id and status', async () => {
    const publish = jest.fn().mockResolvedValue(undefined);
    const { service, create, save } = createService(publish);

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
    expect(publish).toHaveBeenCalledWith(id);
    expect(save.mock.invocationCallOrder[0]).toBeLessThan(
      publish.mock.invocationCallOrder[0],
    );
  });

  it('keeps the saved notification PENDING and returns 503 on publish failure', async () => {
    const publish = jest
      .fn()
      .mockRejectedValue(new Error('broker unavailable'));
    const { service, save } = createService(publish);

    const result = service.create(request);
    await expect(result).rejects.toBeInstanceOf(ServiceUnavailableException);
    await expect(result).rejects.toMatchObject({
      status: HttpStatus.SERVICE_UNAVAILABLE,
    });
    expect(save).toHaveBeenCalledTimes(1);
    await expect(save.mock.results[0].value).resolves.toEqual(
      expect.objectContaining({ id, status: NotificationStatus.PENDING }),
    );
  });
});
