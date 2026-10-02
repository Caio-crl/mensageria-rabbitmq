import { Module } from '@nestjs/common';
import { RabbitMQModule } from '@golevelup/nestjs-rabbitmq';
import { RabbitMqService } from './rabbitmq.service';
import { ConfigService } from '@nestjs/config';
@Module({
  imports: [
    RabbitMQModule.forRootAsync({
      useFactory: function (config: ConfigService) {
        const uri = config.getOrThrow<string>('RABBITMQ_URI');
        let protocol: string;
        try {
          protocol = new URL(uri).protocol;
        } catch {
          throw new Error('RABBITMQ_URI must be a valid AMQP URL');
        }
        if (protocol !== 'amqp:' && protocol !== 'amqps:') {
          throw new Error('RABBITMQ_URI must be a valid AMQP URL');
        }
        return {
          uri,
          exchanges: [
            {
              name: 'worker-nestjs-teste',
              type: 'direct',
              durable: true, // A exchange persiste após restart
              autoDelete: false, // Não apaga automaticamente
              prefetchCount: 1,
              options: {
                durable: true, // A fila persiste após restart
                autoDelete: false, // Não apaga automaticamente
              },
            },
          ],
          queues: [{ name: 'nome_da_fila' }],
          connectionInitOptions: { wait: true },
        };
      },
      inject: [ConfigService],
    }),
  ],
  providers: [RabbitMqService],
  exports: [RabbitMqService],
})
export class RabbitMqModule {}
