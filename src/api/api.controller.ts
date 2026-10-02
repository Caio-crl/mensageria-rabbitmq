import {
  Controller,
  Get,  
  Delete,
  Put,
  Param,
  Body,
  Post,
}
from '@nestjs/common';
import { ApiService } from './api.service';
import { CreatetestesDto } from 'src/common/dtos/create-testes.dto';
import { UpdatetestesDto } from 'src/common/dtos/update-testes.dto';

@Controller()
export class ApiController {
  constructor(private readonly apiService: ApiService) {}
  
  @Get('/health')
  healthCheck() {
    return this.apiService.getHealthCheck();
  }

  @Post('/testes/')
  async createteste(@Body() createtestesDto: CreatetestesDto) {
    return this.apiService.createteste(createtestesDto);
  }

  @Put('/testes/:id/edit/')
  async update(
    @Param('id') id,
    @Body() updatetestesDto: UpdatetestesDto,
  ) {
    return await this.apiService.updateOneteste(id, updatetestesDto);
  }

  @Get('/testes/')
  async findAll() {
    return this.apiService.getAlltestes();
  }

  @Get('/testes/:id/detail/')
  async findOne(@Param('id') id: string){
    return this.apiService.gettesteById(id);
  }

  @Delete('/testes/:id/delete/')
  async remove(@Param('id') id: string) {
    await this.apiService.deletetesteById(id);
  }
  
  @Post('/teste-rabbitmq/')
  async testeMessageRabbitMq(@Body() message: any) {
    return this.apiService.testeMessageRabbitMq(message);
  }
}
