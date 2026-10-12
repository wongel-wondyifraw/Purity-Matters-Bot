import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

@Entity('inner_healing_request')
export class InnerHealingRequest {
  @PrimaryGeneratedColumn()
  id: number;

  @Index({ unique: true })
  @Column({ type: 'varchar', length: 32 })
  referenceNumber: string;

  @Index()
  @Column({ type: 'bigint' })
  telegramId: string;

  @Column({ type: 'varchar', length: 255 })
  clientName: string;

  @Column({ type: 'varchar', length: 64, nullable: true })
  phone?: string | null;

  @Column({ type: 'varchar', length: 64 })
  topic: string; // rejection, abandonment, forgiveness, shame, identity, emotional_wounds

  @Column({ type: 'varchar', length: 32, default: 'pending' })
  status: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
