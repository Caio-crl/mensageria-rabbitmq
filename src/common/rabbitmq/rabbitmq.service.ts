import { Injectable } from '@nestjs/common';
import { AmqpConnection } from '@golevelup/nestjs-rabbitmq';

@Injectable()
export class RabbitMqService {
  constructor(private readonly amqpConnection: AmqpConnection) {}

  public async publishMsg(queue: string, message: any) {
    if (!queue) {
      throw new Error('Fila não informada');
    }
    if (!message) {
      throw new Error('Mensagem não informada');
    }
    const retorno = await this.amqpConnection.publish(
      'worker-nestjs-teste',
      queue,
      message,
    );

    return retorno;
  }

  // Iniciar agendamento
  async sendStartAgendamento(message: any) {
    if (!message) {
      throw new Error('Mensagem não informada');
    }
    return this.publishMsg('nome_da_fila', message);
  }
}