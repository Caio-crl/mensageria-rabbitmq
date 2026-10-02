import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity('testes')
export class teste {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 2, nullable: true })
  nome: string;

  @Column({ type: 'varchar', length: 3, nullable: true })
  codigo: string;

  @Column('text', { nullable: true })
  descricao: string;

  @Column({ type: 'datetime', default: () => 'now()' })
  createdAt: Date;

  @Column({ type: 'datetime', default: () => 'now()', onUpdate: 'now()' })
  updatedAt: Date;
}