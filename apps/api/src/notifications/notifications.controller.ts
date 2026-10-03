import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { CreateNotificationDto } from './create-notification.dto';
import { NotificationsService } from './notifications.service';

@Controller('notifications')
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Post()
  @HttpCode(HttpStatus.ACCEPTED)
  create(@Body() dto: CreateNotificationDto) {
    return this.notificationsService.create(dto);
  }
}
