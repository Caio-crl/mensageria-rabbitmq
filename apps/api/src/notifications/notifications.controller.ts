import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Post,
} from '@nestjs/common';
import {
  ApiAcceptedResponse,
  ApiBadRequestResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiServiceUnavailableResponse,
  ApiNotFoundResponse,
  ApiTags,
} from '@nestjs/swagger';
import { CreateNotificationDto } from './create-notification.dto';
import {
  CreateNotificationResponseDto,
  NotificationResponseDto,
} from './notification-response.dto';
import { NotificationsService } from './notifications.service';

@ApiTags('notifications')
@Controller('notifications')
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Post()
  @HttpCode(HttpStatus.ACCEPTED)
  @ApiOperation({ summary: 'Request asynchronous notification processing' })
  @ApiAcceptedResponse({
    description: 'Notification persisted and RabbitMQ publication confirmed.',
    type: CreateNotificationResponseDto,
  })
  @ApiBadRequestResponse({ description: 'Invalid notification request.' })
  @ApiServiceUnavailableResponse({
    description:
      'Notification remains PENDING in MySQL, but RabbitMQ publication failed or was not confirmed.',
  })
  create(@Body() dto: CreateNotificationDto) {
    return this.notificationsService.create(dto);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get the current notification status' })
  @ApiParam({ name: 'id', format: 'uuid', description: 'Notification ID' })
  @ApiOkResponse({
    description: 'Current notification state from MySQL.',
    type: NotificationResponseDto,
  })
  @ApiBadRequestResponse({ description: 'Invalid notification UUID.' })
  @ApiNotFoundResponse({ description: 'Notification not found.' })
  findById(@Param('id', new ParseUUIDPipe()) id: string) {
    return this.notificationsService.findById(id);
  }
}
