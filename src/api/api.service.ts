import { Injectable } from '@nestjs/common';
import { AppService } from 'src/common/app.service';

@Injectable()
export class ApiService {
  constructor(private readonly appService: AppService) {}

  getHealthCheck() {
    return this.appService.getHealthCheck();
  }
  async createteste(createDto: any) {
    return this.appService.createteste(createDto);
  }

  async getAlltestes() {
    return this.appService.findAlltestes();
  }

  async gettesteById(id: string) {
    return this.appService.gettesteById(id);
  }

  async deletetesteById(id: string) {
    return this.appService.deletetesteById(id);
  }

  // TODO: criar o DTO
  async updateOneteste(id: string, updateDto: any) {
    return this.appService.updateOneteste(id, updateDto);
  }
  
  async testeMessageRabbitMq(message: any) {
    return this.appService.testeMessageRabbitMq(message);
  }
}
