import {
  IsEmail,
  IsEnum,
  IsNotEmpty,
  IsString,
  MaxLength,
} from 'class-validator';
import { NotificationType } from '../../../../libs/notifications/src/notification.enums';

export class CreateNotificationDto {
  @IsString()
  @IsNotEmpty()
  @IsEmail()
  @MaxLength(255)
  recipient!: string;

  @IsEnum(NotificationType)
  type!: NotificationType;

  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  subject!: string;

  @IsString()
  @IsNotEmpty()
  message!: string;
}
