import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Course } from './course.entity.js';

export type CoursePaymentStatus = 'free' | 'pending_verification' | 'confirmed' | 'rejected';
export type CourseEnrollmentStatus = 'not_started' | 'in_progress' | 'completed';

@Entity('course_enrollments')
export class CourseEnrollment {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar', length: 64 })
  telegramId: string;

  @Column({ type: 'varchar', length: 255 })
  clientName: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  clientUsername?: string | null;

  @Column({ type: 'varchar', length: 64, nullable: true })
  clientPhone?: string | null;

  @Column({ type: 'integer' })
  courseId: number;

  @Column({ type: 'varchar', length: 255 })
  courseName: string;

  @Column({ type: 'varchar', length: 16, default: 'free' })
  courseType: 'free' | 'paid';

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0.0 })
  amount: number;

  @Column({ type: 'varchar', length: 8, default: 'ETB' })
  currency: string;

  @Column({ type: 'varchar', length: 32, default: 'free' })
  paymentStatus: CoursePaymentStatus;

  @Column({ type: 'varchar', length: 64, nullable: true })
  paymentMethod?: string | null;

  @Column({ type: 'varchar', length: 128, nullable: true })
  paymentReference?: string | null;

  @Column({ type: 'text', nullable: true })
  adminNotes?: string | null;

  @Column({ type: 'timestamp', nullable: true })
  verifiedAt?: Date | null;

  @Column({ type: 'varchar', length: 32, default: 'in_progress' })
  status: CourseEnrollmentStatus;

  @Column({ type: 'integer', nullable: true })
  currentModuleId?: number | null;

  @Column({ type: 'jsonb', default: () => "'[]'" })
  completedModuleIds: number[];

  @Column({ type: 'timestamp', nullable: true })
  completedAt?: Date | null;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  lastActiveAt: Date;

  @ManyToOne(() => Course, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'courseId' })
  course: Course;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
