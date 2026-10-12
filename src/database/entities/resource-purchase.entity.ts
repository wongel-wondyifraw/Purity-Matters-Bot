import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  Index,
} from 'typeorm';

@Entity('resource_purchase')
export class ResourcePurchase {
  @PrimaryGeneratedColumn()
  id: number;

  @Index()
  @Column({ type: 'bigint' })
  telegramId: string;

  @Column({ type: 'varchar', length: 64 })
  resourceId: string;

  @Column({ type: 'varchar', length: 255 })
  resourceTitle: string;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  amount: number;

  @Column({ type: 'varchar', length: 8, default: 'USD' })
  currency: string;

  @Column({ type: 'varchar', length: 32, default: 'completed' })
  status: string;

  @Column({ type: 'varchar', length: 500, nullable: true })
  downloadUrl?: string | null;

  @CreateDateColumn()
  createdAt: Date;
}
