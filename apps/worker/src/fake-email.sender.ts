import { Injectable, Logger } from '@nestjs/common';
import { Notification } from '../../../libs/notifications/src/notification.entity';

@Injectable()
export class FakeEmailSender {
  private readonly logger = new Logger(FakeEmailSender.name);

  async send(notification: Notification): Promise<void> {
    if (process.env.FAKE_EMAIL_FORCE_FAILURE === 'true') {
      throw new Error('Forced fake email failure');
    }
    this.logger.log(`Fake email sent for notification ${notification.id}`);
  }
}
