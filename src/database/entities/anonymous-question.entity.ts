import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

@Entity('anonymous_question')
export class AnonymousQuestion {
  @PrimaryGeneratedColumn()
  id: number;

  @Index({ unique: true })
  @Column({ type: 'varchar', length: 32 })
  referenceNumber: string;

  @Column({ type: 'varchar', length: 128, default: 'General' })
  category: string;

  @Column({ type: 'text' })
  question: string;

  @Column({ type: 'varchar', length: 32, default: 'pending' })
  status: string; // 'pending' | 'answered' | 'archived'

  @Column({ type: 'text', nullable: true })
  answer?: string | null;

  @Column({ type: 'timestamp', nullable: true })
  answeredAt?: Date | null;

  @Column({ type: 'varchar', length: 255, nullable: true })
  assignedCounselor?: string | null;

  @Column({ type: 'boolean', default: true })
  isPublic: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
