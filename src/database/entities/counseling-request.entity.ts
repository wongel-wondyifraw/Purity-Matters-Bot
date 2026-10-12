import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

@Entity('counseling_request')
export class CounselingRequest {
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
  concern: string;

  @Column({ type: 'text', nullable: true })
  description?: string | null;

  @Column({ type: 'varchar', length: 64 })
  preferredMethod: string;

  @Column({ type: 'varchar', length: 64 })
  preferredTime: string;

  @Column({ type: 'varchar', length: 32, default: 'pending' })
  status: string; // 'pending' | 'assigned' | 'scheduled' | 'completed'

  @Column({ type: 'varchar', length: 255, nullable: true })
  assignedTo?: string | null;

  @Column({ type: 'timestamp', nullable: true })
  scheduledAt?: Date | null;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
