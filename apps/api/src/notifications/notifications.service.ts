import {
  Injectable,
  Logger,
  NotFoundException,
  ServiceUnavailableException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Notification } from '../../../../libs/notifications/src/notification.entity';
import { NotificationStatus } from '../../../../libs/notifications/src/notification.enums';
import { CreateNotificationDto } from './create-notification.dto';
import { NotificationPublisher } from './notification.publisher';

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);

  constructor(
    @InjectRepository(Notification)
    private readonly notifications: Repository<Notification>,
    private readonly publisher: NotificationPublisher,
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

    try {
      await this.publisher.publish(saved.id);
    } catch (error) {
      this.logger.error(`Failed to publish notification ${saved.id}`, error);
      throw new ServiceUnavailableException(
        'Notification publication unavailable',
      );
    }

    return { id: saved.id, status: saved.status };
  }

  async findById(
    id: string,
  ): Promise<
    Pick<
      Notification,
      'id' | 'type' | 'recipient' | 'status' | 'createdAt' | 'processedAt'
    >
  > {
    const notification = await this.notifications.findOneBy({ id });
    if (!notification) {
      throw new NotFoundException('Notification not found');
    }

    return {
      id: notification.id,
      type: notification.type,
      recipient: notification.recipient,
      status: notification.status,
      createdAt: notification.createdAt,
      processedAt: notification.processedAt,
    };
  }
}
