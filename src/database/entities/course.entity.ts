import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
} from 'typeorm';
import { CourseModule } from './course-module.entity.js';

export type CourseType = 'free' | 'paid';

@Entity('courses')
export class Course {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar', length: 255 })
  name: string;

  @Column({ type: 'varchar', length: 255, unique: true })
  slug: string;

  @Column({ type: 'varchar', length: 500, nullable: true })
  bannerImage?: string | null;

  @Column({ type: 'varchar', length: 16, default: 'free' })
  type: CourseType;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0.0 })
  price: number;

  @Column({ type: 'varchar', length: 8, default: 'ETB' })
  currency: string;

  @Column({ type: 'varchar', length: 150 })
  theme: string;

  @Column({ type: 'text', nullable: true })
  description?: string | null;

  @Column({ type: 'text', nullable: true })
  generalObjective?: string | null;

  @Column({ type: 'jsonb', default: () => "'[]'" })
  learningOutcomes: string[];

  @Column({ type: 'integer', default: 0 })
  orderIndex: number;

  @Column({ type: 'boolean', default: true })
  isActive: boolean;

  @OneToMany(() => CourseModule, (module) => module.course, {
    cascade: true,
  })
  modules: CourseModule[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
