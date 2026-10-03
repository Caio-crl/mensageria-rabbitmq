import { ApiProperty } from '@nestjs/swagger';
import {
  NotificationStatus,
  NotificationType,
} from '../../../../libs/notifications/src/notification.enums';

export class CreateNotificationResponseDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty({ enum: [NotificationStatus.PENDING] })
  status!: NotificationStatus.PENDING;
}

export class NotificationResponseDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty({ enum: NotificationType, enumName: 'NotificationType' })
  type!: NotificationType;

  @ApiProperty({ example: 'user@example.com', format: 'email' })
  recipient!: string;

  @ApiProperty({ enum: NotificationStatus, enumName: 'NotificationStatus' })
  status!: NotificationStatus;

  @ApiProperty({ type: String, format: 'date-time' })
  createdAt!: Date;

  @ApiProperty({ type: String, format: 'date-time', nullable: true })
  processedAt!: Date | null;
}
