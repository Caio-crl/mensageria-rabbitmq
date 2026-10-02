
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { teste } from '../entities/teste.entity';

@Injectable()
export class testesRepository {
   constructor(
      @InjectRepository(teste)
      private readonly repository: Repository<teste>,
   ) {}

   async create(entity: Partial<teste>): Promise<teste> {
      const newEntity = this.repository.create(entity);
      return this.repository.save(newEntity);
   }

   async findAll(): Promise<teste[]> {
      return this.repository.find();
   }

   async findOne(id: any): Promise<teste | null> {
      return this.repository.findOne({ where: { id } });
   }

   async update(id: any, entity: Partial<teste>): Promise<teste> {
      await this.repository.update(id, entity);
      return this.findOne(id);
   }

   async delete(id: any): Promise<void> {
      await this.repository.delete(id);
   }
}