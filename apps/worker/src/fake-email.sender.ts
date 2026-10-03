import { Injectable, Logger } from '@nestjs/common';
import { Notification } from '../../../libs/notifications/src/notification.entity';

@Injectable()
export class FakeEmailSender {
  private readonly logger = new Logger(FakeEmailSender.name);

  async send(notification: Notification): Promise<void> {
    this.logger.log(`Fake email sent for notification ${notification.id}`);
  }
}
