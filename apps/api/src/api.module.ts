import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { notificationDataSourceOptions } from '../../../libs/notifications/src/typeorm.config';
import { NotificationsModule } from './notifications/notifications.module';

@Module({
  imports: [
    TypeOrmModule.forRoot(notificationDataSourceOptions),
    NotificationsModule,
  ],
})
export class ApiModule {}
