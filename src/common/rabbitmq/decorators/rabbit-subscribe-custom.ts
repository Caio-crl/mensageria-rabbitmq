import {
  RabbitHandlerConfig,
  RabbitSubscribe,
} from '@golevelup/nestjs-rabbitmq';

export const RabbitSubscribeCustom =
  (
    config: Pick<
      RabbitHandlerConfig,
      | 'queue'
      | 'name'
      | 'deserializer'
      | 'connection'
      | 'exchange'
      | 'routingKey'
      | 'queueOptions'
      | 'errorBehavior'
      | 'errorHandler'
      | 'assertQueueErrorHandler'
      | 'createQueueIfNotExists'
      | 'allowNonJsonMessages'
      | 'usePersistentReplyTo'
      | 'batchOptions'
    >,
  ) =>
  <TFunction extends Function, Y>(
    target: object | TFunction,
    propertyKey?: string | symbol | undefined,
    descriptor?: TypedPropertyDescriptor<Y> | undefined,
  ) => {
    const optionsDefault = {
      routingKey: config.queue,
      createQueueIfNotExists: true,
      queueOptions: {
        durable: true, // A fila persiste após restart
      },
      ackBehavior: 'ackOnSuccess',
    };
    return RabbitSubscribe({
      ...optionsDefault,
      ...config,
    })(target, propertyKey, descriptor);
  };
