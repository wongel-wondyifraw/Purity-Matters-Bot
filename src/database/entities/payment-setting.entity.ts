import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

export type PaymentProvider = 'telebirr' | 'cbe';

@Entity('payment_settings')
export class PaymentSetting {
  @PrimaryGeneratedColumn()
  id: number;

  @Index({ unique: true })
  @Column({ type: 'varchar', length: 32 })
  provider: PaymentProvider;

  @Column({ type: 'varchar', length: 150 })
  accountName: string;

  @Column({ type: 'varchar', length: 100 })
  accountNumber: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  branchOrShortcode?: string | null;

  @Column({ type: 'text', nullable: true })
  instructions?: string | null;

  @Column({ type: 'boolean', default: true })
  isActive: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
