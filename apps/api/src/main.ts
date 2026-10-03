import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { ApiModule } from './api.module';

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(ApiModule);
  app.enableShutdownHooks();
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );
  await app.listen(process.env.PORT ?? 3000);
}

void bootstrap();
