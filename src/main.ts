import { NestApplication, NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ConfigService } from '@nestjs/config';
import { ValidationPipe } from '@nestjs/common';
import { MyExceptionFilter } from './common/filters/myexception.filter';
import {
  appLogger,
  getSafeErrorLogFields,
} from './common/logger/app-logger';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import metadata from './metadata';

async function bootstrap() {
  const app = await NestFactory.create<NestApplication>(AppModule);
  app.useGlobalPipes(new ValidationPipe()); // Habilita a validação de dados (DTO)
  app.useGlobalFilters(new MyExceptionFilter());
  
  // Configuração do Swagger (Documentação da API automáticamente)
  const config = new DocumentBuilder()
    .setTitle('API worker-nestjs-teste')
    .setDescription('API de gerenciamento do projeto worker-nestjs-teste')
    .setVersion('1.0')
    .addTag('worker-nestjs-teste')
    .build();

  // Carrega os metadados do plugin do Swagger (também gerado automáticamente pelo Script swc -b --check-type )
  await SwaggerModule.loadPluginMetadata(metadata);

  // Cria a documentação da API na rota /v1/docs/swagger
  const documentFactory = () => SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('/v1/docs/swagger', app, documentFactory);  

  // Pega a porta via variável de ambiente ou usa a porta 3000
  const configService: ConfigService = app.get(ConfigService);
  const port = configService.get('PORT') || 3000;
  await app.listen(port).then(() => {
    appLogger.info('Servidor iniciado', { port });
  });
}
bootstrap().catch((error: unknown) => {
  appLogger.fatal('Falha ao iniciar servidor', {
    ...getSafeErrorLogFields(error),
  });
  process.exit(1);
});
