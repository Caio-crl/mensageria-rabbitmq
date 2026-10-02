import { Module } from '@nestjs/common';
import { WorkerService } from './worker.service';
import { RabbitMqModule } from 'src/common/rabbitmq/rabbitmq.module';


@Module({
  imports: [RabbitMqModule],
  exports: [WorkerService],
  providers: [WorkerService],
})
export class WorkerModule {}
