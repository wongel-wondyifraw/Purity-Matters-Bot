import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

export type PhysicalOrderStatus =
  | 'pending'
  | 'processing'
  | 'dispatched'
  | 'delivered'
  | 'cancelled';

export type PhysicalPaymentStatus = 'pending' | 'verified' | 'refunded';

@Entity('physical_book_orders')
export class PhysicalBookOrder {
  @PrimaryGeneratedColumn()
  id: number;

  @Index({ unique: true })
  @Column({ type: 'varchar', length: 32 })
  orderNumber: string;

  @Column({ type: 'integer' })
  resourceId: number;

  @Column({ type: 'varchar', length: 255 })
  resourceTitle: string;

  @Index()
  @Column({ type: 'bigint' })
  telegramId: string;

  @Column({ type: 'varchar', length: 150 })
  clientName: string;

  @Column({ type: 'varchar', length: 32 })
  phone: string;

  @Column({ type: 'text' })
  shippingAddress: string;

  @Column({ type: 'varchar', length: 100, default: 'Addis Ababa' })
  city: string;

  @Column({ type: 'integer', default: 1 })
  quantity: number;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  unitPrice: number;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  totalAmount: number;

  @Column({ type: 'varchar', length: 8, default: 'ETB' })
  currency: string;

  @Column({ type: 'varchar', length: 32, default: 'pending' })
  paymentStatus: PhysicalPaymentStatus;

  @Column({ type: 'varchar', length: 100, nullable: true })
  paymentReference?: string | null;

  @Column({ type: 'varchar', length: 32, default: 'pending' })
  status: PhysicalOrderStatus;

  @Column({ type: 'text', nullable: true })
  dispatchNotes?: string | null;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
