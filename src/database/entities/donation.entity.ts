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

  @Column({ unique: true })
  referenceNumber: string;

  @Column({ type: 'varchar' })
  telegramId: string;

  @Column()
  clientName: string;

  @Column({ type: 'varchar', nullable: true })
  clientUsername?: string | null;

  @Column({ type: 'varchar', nullable: true })
  clientPhone?: string | null;

  @Column({ type: 'decimal', precision: 12, scale: 2 })
  amount: number;

  @Column({ default: 'ETB' })
  currency: string;

  @Column({ default: 'telebirr' })
  paymentMethod: string; // 'telebirr' | 'cbe' | 'other'

  @Column({ default: 'pending' })
  status: DonationStatus;

  @Column({ nullable: true })
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
