import { Injectable } from '@nestjs/common';
import { DatabaseService } from './database/database.service';
import { RabbitMqService } from './rabbitmq/rabbitmq.service';

@Injectable()
export class AppService {
  constructor(
    private readonly databaseService: DatabaseService, 
    private readonly rabbitMqService: RabbitMqService
  ) {}

  getHealthCheck() {
    return { message: 'UP' };
  }

  // TODO: criar o DTO e implementar aqui
  async createteste(createDto: any) {
    return this.databaseService.create(createDto);
  }

  async findAlltestes() {
    return this.databaseService.findAll();
  }

  async gettesteById(id: string) {
    return this.databaseService.findOne(id);
  }

  async deletetesteById(id: string) {
    return this.databaseService.delete(id);
  }

  // TODO: criar o DTO e implementar aqui
  async updateOneteste(id: string, updateDto: any) {
    return this.databaseService.updateOne(id, updateDto);
  }
  
  async testeMessageRabbitMq(message: any) {
    return this.rabbitMqService.publishMsg('nome_da_fila', message);
  }
}
