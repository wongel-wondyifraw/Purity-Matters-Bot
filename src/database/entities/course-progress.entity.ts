import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

@Entity('course_progress')
export class CourseProgress {
  @PrimaryGeneratedColumn()
  id: number;

  @Index()
  @Column({ type: 'bigint' })
  telegramId: string;

  @Column({ type: 'varchar', length: 64 })
  courseId: string;

  @Column({ type: 'int', default: 1 })
  currentDay: number;

  @Column({ type: 'int', default: 7 })
  totalDays: number;

  @Column({ type: 'jsonb', default: [] })
  completedDays: number[];

  @Column({ type: 'boolean', default: false })
  accountabilityRequested: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
