import 'dotenv/config';
import { DataSource, type DataSourceOptions } from 'typeorm';
import { CreateNotifications1790899200000 } from './migrations/1790899200000-CreateNotifications';
import { Notification } from './notification.entity';

export const notificationDataSourceOptions: DataSourceOptions = {
  type: 'mysql',
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT ?? 3306),
  username: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  timezone: 'Z',
  entities: [Notification],
  migrations: [CreateNotifications1790899200000],
  synchronize: false,
  migrationsRun: false,
};

export default new DataSource(notificationDataSourceOptions);
