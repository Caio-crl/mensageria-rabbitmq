import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Notification } from '../../../../libs/notifications/src/notification.entity';
import { NotificationStatus } from '../../../../libs/notifications/src/notification.enums';
import { CreateNotificationDto } from './create-notification.dto';

@Injectable()
export class NotificationsService {
  constructor(
    @InjectRepository(Notification)
    private readonly notifications: Repository<Notification>,
  ) {}

  async create(
    dto: CreateNotificationDto,
  ): Promise<{ id: string; status: NotificationStatus }> {
    const notification = this.notifications.create({
      recipient: dto.recipient,
      type: dto.type,
      subject: dto.subject,
      message: dto.message,
      status: NotificationStatus.PENDING,
      processedAt: null,
    });
    const saved = await this.notifications.save(notification);

    return { id: saved.id, status: saved.status };
  }
}
