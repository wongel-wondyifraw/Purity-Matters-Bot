import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

@Entity('client')
export class Client {
  @PrimaryGeneratedColumn()
  id: number;

  @Index({ unique: true })
  @Column({ type: 'bigint' })
  telegramId: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  fullName?: string | null;

  @Column({ type: 'varchar', length: 255, nullable: true })
  username?: string | null;

  @Column({ type: 'varchar', length: 255, nullable: true })
  firstName?: string | null;

  @Column({ type: 'varchar', length: 255, nullable: true })
  lastName?: string | null;

  @Column({ type: 'varchar', length: 16, nullable: true })
  languageCode?: string | null;

  @Column({ type: 'varchar', length: 64, nullable: true })
  phone?: string | null;

  @Column({ type: 'boolean', default: false })
  isRegistered: boolean;

  @Column({ type: 'varchar', length: 32, default: 'client' })
  role: string;

  @Column({ type: 'varchar', length: 32, nullable: true })
  registrationStep?: string | null;

  @Column({ type: 'jsonb', nullable: true, default: {} })
  metadata?: Record<string, any> | null;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
