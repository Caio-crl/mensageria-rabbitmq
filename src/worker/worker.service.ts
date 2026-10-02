import { Injectable } from '@nestjs/common';
import { RabbitMqService } from 'src/common/rabbitmq/rabbitmq.service';
import { RabbitSubscribeCustom } from 'src/common/rabbitmq/decorators/rabbit-subscribe-custom';
import { appLogger } from 'src/common/logger/app-logger';

@Injectable()
export class WorkerService {
  constructor(
    private readonly rabbitMqService: RabbitMqService,
  ) {}
  @RabbitSubscribeCustom({
    exchange: 'worker-nestjs-teste',
    queue: 'nome_da_fila',
    createQueueIfNotExists: true,
  })
  async handleMessage(message: any): Promise<void> {
    appLogger.info('Mensagem RabbitMQ recebida', {
      messageType: typeof message,
    });
    return;

    // Aqui você pode processar a mensagem recebida
    // Por exemplo, salvar em um banco de dados, enviar uma resposta, etc.
  }
}
