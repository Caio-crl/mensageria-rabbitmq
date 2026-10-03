import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Notification } from '../../../../libs/notifications/src/notification.entity';
import { NotificationPublisher } from './notification.publisher';
import { NotificationsController } from './notifications.controller';
import { NotificationsService } from './notifications.service';

@Module({
  imports: [TypeOrmModule.forFeature([Notification])],
  controllers: [NotificationsController],
  providers: [NotificationsService, NotificationPublisher],
})
export class NotificationsModule {}
