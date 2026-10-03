import { BadRequestException, ValidationPipe } from '@nestjs/common';
import { NotificationType } from '../../../../libs/notifications/src/notification.enums';
import { CreateNotificationDto } from './create-notification.dto';

describe('CreateNotificationDto', () => {
  const pipe = new ValidationPipe({
    whitelist: true,
    forbidNonWhitelisted: true,
    transform: true,
  });
  const metadata = { type: 'body' as const, metatype: CreateNotificationDto };
  const validRequest = {
    recipient: 'user@example.com',
    type: NotificationType.EMAIL,
    subject: 'Welcome',
    message: 'Welcome to the platform',
  };

  it('accepts a valid creation request', async () => {
    await expect(pipe.transform(validRequest, metadata)).resolves.toMatchObject(
      validRequest,
    );
  });

  it.each([
    { recipient: 'invalid-email' },
    { type: 'SMS' },
    { subject: '' },
    { subject: 'x'.repeat(256) },
    { message: '' },
    { message: undefined },
    { status: 'SENT' },
  ])('rejects invalid or server-controlled fields: %p', async (change) => {
    await expect(
      pipe.transform({ ...validRequest, ...change }, metadata),
    ).rejects.toBeInstanceOf(BadRequestException);
  });
});
