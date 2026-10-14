import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

export type ResourceType = 'ebook' | 'physical_book';
export type PricingType = 'free' | 'paid';

@Entity('resources')
export class Resource {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar', length: 255 })
  title: string;

  @Column({ type: 'varchar', length: 150, nullable: true })
  author?: string | null;

  @Column({ type: 'text', nullable: true })
  description?: string | null;

  @Column({ type: 'varchar', length: 32, default: 'ebook' })
  type: ResourceType;

  @Column({ type: 'varchar', length: 16, default: 'free' })
  pricingType: PricingType;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0.0 })
  price: number;

  @Column({ type: 'varchar', length: 8, default: 'ETB' })
  currency: string;

  // Digital E-Book fields
  @Column({ type: 'varchar', length: 500, nullable: true })
  filePath?: string | null;

  @Column({ type: 'varchar', length: 255, nullable: true })
  fileName?: string | null;

  @Column({ type: 'integer', nullable: true })
  fileSizeBytes?: number | null;

  @Column({ type: 'varchar', length: 64, nullable: true })
  fileMimeType?: string | null;

  // Physical Book fields
  @Column({ type: 'integer', nullable: true, default: 0 })
  stockQuantity?: number | null;

  // Artwork & visibility
  @Column({ type: 'varchar', length: 500, nullable: true })
  coverImageUrl?: string | null;

  @Column({ type: 'boolean', default: true })
  isActive: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
