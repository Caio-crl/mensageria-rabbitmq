import {
  HttpStatus,
  NotFoundException,
  ServiceUnavailableException,
} from '@nestjs/common';
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
    const findOneBy = jest.fn();
    const repository = {
      create,
      save,
      findOneBy,
    } as unknown as Repository<Notification>;
    const publisher = { publish } as unknown as NotificationPublisher;
    return {
      service: new NotificationsService(repository, publisher),
      create,
      save,
      findOneBy,
      publish,
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

  it.each([
    [NotificationStatus.PENDING, null],
    [NotificationStatus.PROCESSING, null],
    [NotificationStatus.SENT, new Date('2026-10-03T12:00:05.000Z')],
    [NotificationStatus.FAILED, new Date('2026-10-03T12:00:05.000Z')],
  ])('returns only public fields for %s', async (status, processedAt) => {
    const { service, findOneBy, save, publish } = createService(jest.fn());
    const createdAt = new Date('2026-10-03T12:00:00.000Z');
    findOneBy.mockResolvedValue({
      id,
      type: NotificationType.EMAIL,
      recipient: 'user@example.com',
      status,
      createdAt,
      processedAt,
      subject: 'private subject',
      message: 'private message',
      updatedAt: new Date(),
    } as Notification);

    await expect(service.findById(id)).resolves.toEqual({
      id,
      type: NotificationType.EMAIL,
      recipient: 'user@example.com',
      status,
      createdAt,
      processedAt,
    });
    expect(findOneBy).toHaveBeenCalledWith({ id });
    expect(save).not.toHaveBeenCalled();
    expect(publish).not.toHaveBeenCalled();
  });

  it('returns 404 for a valid UUID missing from the database', async () => {
    const { service, findOneBy } = createService(jest.fn());
    findOneBy.mockResolvedValue(null);

    await expect(service.findById(id)).rejects.toBeInstanceOf(
      NotFoundException,
    );
    expect(findOneBy).toHaveBeenCalledWith({ id });
  });
});
