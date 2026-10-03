import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { notificationDataSourceOptions } from '../../../libs/notifications/src/typeorm.config';

@Module({ imports: [TypeOrmModule.forRoot(notificationDataSourceOptions)] })
export class ApiModule {}
