import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigService } from '@nestjs/config';
import { DatabaseService } from './database.service';
import { testesRepository } from './repositories/testes.repository';
import * as path from 'node:path';
import * as fs from 'node:fs';

const entitiesPath = path.resolve(__dirname, './entities');

if (!fs.existsSync(entitiesPath)) {
  throw new Error(`Entities path does not exist: ${entitiesPath}`);
}

function loadEntities(): Function[] {
  const entities: Function[] = [];

  const files = fs.readdirSync(entitiesPath);
  for (const file of files) {
    if (file.endsWith('.entity.ts') || file.endsWith('.entity.js')) {
      // Importa o arquivo
      const entityModule = require(path.join(entitiesPath, file));

      // Pega todas as exportações e adiciona (assumindo que exporta 1 entidade por arquivo)
      for (const exported of Object.values(entityModule)) {
        if (typeof exported === 'function') {
          entities.push(exported);
        }
      }
    }
  }

  return entities;
}

@Module({
  imports: [
    // Conexão com o banco de dados
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => {
        const host = config.getOrThrow<string>('DB_HOST');
        const username = config.getOrThrow<string>('DB_USER');
        const password = config.getOrThrow<string>('DB_PASSWORD');
        const database = config.getOrThrow<string>('DB_NAME');
        if (!host.trim() || !username.trim() || !password || !database.trim()) {
          throw new Error('MySQL configuration is incomplete');
        }
        const port = Number(config.get<string>('DB_PORT') ?? '3306');
        if (!Number.isInteger(port) || port < 1 || port > 65535) {
          throw new Error('DB_PORT must be a valid TCP port');
        }
        return {
          type: 'mysql',
          host,
          port,
          username,
          password,
          database,
          entities: [__dirname + '/entities/*.entity{.ts,.js}'],
          synchronize: false, // altere para true se estiver em desenvolvimento
        };
      },
    }),
    TypeOrmModule.forFeature(loadEntities()),
  ],
  providers: [DatabaseService, testesRepository],
  exports: [TypeOrmModule, DatabaseService],
})
export class DatabaseModule {}
