import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Notification } from '../../../libs/notifications/src/notification.entity';
import { notificationDataSourceOptions } from '../../../libs/notifications/src/typeorm.config';
import { FakeEmailSender } from './fake-email.sender';
import { NotificationWorker } from './notification.worker';

@Module({
  imports: [
    TypeOrmModule.forRoot(notificationDataSourceOptions),
    TypeOrmModule.forFeature([Notification]),
  ],
  providers: [FakeEmailSender, NotificationWorker],
})
export class WorkerModule {}
