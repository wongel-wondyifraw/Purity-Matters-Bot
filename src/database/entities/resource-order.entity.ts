import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

export type ResourcePaymentStatus =
  | 'pending'
  | 'payment_submitted'
  | 'verified'
  | 'rejected'
  | 'cancelled';

export type ResourceFulfillmentStatus =
  | 'pending'
  | 'delivered'
  | 'failed_delivery';

@Entity('resource_orders')
export class ResourceOrder {
  @PrimaryGeneratedColumn()
  id: number;

  @Index({ unique: true })
  @Column({ type: 'varchar', length: 32 })
  orderNumber: string;

  @Column({ type: 'integer' })
  resourceId: number;

  @Column({ type: 'varchar', length: 255 })
  resourceTitle: string;

  @Column({ type: 'varchar', length: 32, default: 'ebook' })
  resourceType: string;

  @Index()
  @Column({ type: 'bigint' })
  telegramId: string;

  @Column({ type: 'varchar', length: 150, nullable: true })
  clientName?: string | null;

  @Column({ type: 'varchar', length: 64, nullable: true })
  username?: string | null;

  @Column({ type: 'varchar', length: 32, nullable: true })
  phone?: string | null;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  amount: number;

  @Column({ type: 'varchar', length: 8, default: 'ETB' })
  currency: string;

  @Column({ type: 'varchar', length: 32, default: 'telebirr' })
  paymentMethod: string;

  @Column({ type: 'varchar', length: 150, nullable: true })
  paymentReference?: string | null;

  @Column({ type: 'varchar', length: 32, default: 'pending' })
  paymentStatus: ResourcePaymentStatus;

  @Column({ type: 'varchar', length: 32, default: 'pending' })
  fulfillmentStatus: ResourceFulfillmentStatus;

  @Column({ type: 'text', nullable: true })
  adminNotes?: string | null;

  @Column({ type: 'timestamp', nullable: true })
  paymentSubmittedAt?: Date | null;

  @Column({ type: 'timestamp', nullable: true })
  verifiedAt?: Date | null;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
