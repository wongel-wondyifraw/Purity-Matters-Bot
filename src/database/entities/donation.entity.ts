import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

export type DonationStatus = 'pending' | 'payment_submitted' | 'verified' | 'rejected';

@Entity('donations')
export class Donation {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar', length: 64, unique: true })
  referenceNumber: string;

  @Column({ type: 'varchar', length: 64 })
  telegramId: string;

  @Column({ type: 'varchar', length: 255 })
  clientName: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  clientUsername?: string | null;

  @Column({ type: 'varchar', length: 64, nullable: true })
  clientPhone?: string | null;

  @Column({ type: 'decimal', precision: 12, scale: 2 })
  amount: number;

  @Column({ type: 'varchar', length: 16, default: 'ETB' })
  currency: string;

  @Column({ type: 'varchar', length: 64, default: 'telebirr' })
  paymentMethod: string; // 'telebirr' | 'cbe' | 'other'

  @Column({ type: 'varchar', length: 32, default: 'pending' })
  status: DonationStatus;

  @Column({ type: 'varchar', length: 255, nullable: true })
  transactionReference?: string | null;

  @Column({ type: 'text', nullable: true })
  notes?: string | null;

  @Column({ type: 'text', nullable: true })
  adminNotes?: string | null;

  @Column({ type: 'timestamp', nullable: true })
  verifiedAt?: Date | null;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
