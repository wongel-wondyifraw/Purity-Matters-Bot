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

  @Column({ nullable: true })
  clientUsername?: string;

  @Column({ nullable: true })
  clientPhone?: string;

  @Column({ type: 'decimal', precision: 12, scale: 2 })
  amount: number;

  @Column({ default: 'ETB' })
  currency: string;

  @Column({ default: 'telebirr' })
  paymentMethod: string; // 'telebirr' | 'cbe' | 'other'

  @Column({ default: 'pending' })
  status: DonationStatus;

  @Column({ nullable: true })
  transactionReference?: string;

  @Column({ type: 'text', nullable: true })
  notes?: string;

  @Column({ type: 'text', nullable: true })
  adminNotes?: string;

  @Column({ type: 'timestamp', nullable: true })
  verifiedAt?: Date;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
