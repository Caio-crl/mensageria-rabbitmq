import {
  IsEmail,
  IsEnum,
  IsNotEmpty,
  IsString,
  MaxLength,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { NotificationType } from '../../../../libs/notifications/src/notification.enums';

export class CreateNotificationDto {
  @ApiProperty({ example: 'user@example.com', format: 'email' })
  @IsString()
  @IsNotEmpty()
  @IsEmail()
  @MaxLength(255)
  recipient!: string;

  @ApiProperty({ enum: NotificationType, enumName: 'NotificationType' })
  @IsEnum(NotificationType)
  type!: NotificationType;

  @ApiProperty({ example: 'Welcome' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  subject!: string;

  @ApiProperty({ example: 'Welcome to the platform' })
  @IsString()
  @IsNotEmpty()
  message!: string;
}
