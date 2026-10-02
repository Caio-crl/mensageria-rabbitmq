import { Injectable } from '@nestjs/common';
import { plainToInstance } from 'class-transformer';
import { CreatetestesDto } from 'src/common/dtos/create-testes.dto';
import { UpdatetestesDto } from 'src/common/dtos/update-testes.dto';
import { teste } from './entities/teste.entity';
import { testesRepository } from './repositories/testes.repository';

@Injectable()
export class DatabaseService {
  constructor(private readonly testesRepository: testesRepository) {}

  async create(createDto: CreatetestesDto): Promise<teste> {
    const event = plainToInstance(teste, createDto);
    return await this.testesRepository.create(event);
  }

  async updateOne(id: any, updateDto: UpdatetestesDto): Promise<teste> {
    const updateData = plainToInstance(teste, updateDto);
    return await this.testesRepository.update(id, updateData);
  }

  async findAll(): Promise<teste[]> {
    return this.testesRepository.findAll();
  }

  async findOne(id: any): Promise<teste> {
    return this.testesRepository.findOne(id);
  }

  async delete(id: any) {
    return await this.testesRepository.delete(id);
  }

}
