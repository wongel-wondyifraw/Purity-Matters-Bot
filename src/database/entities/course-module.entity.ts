import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  OneToMany,
  JoinColumn,
} from 'typeorm';
import { Course } from './course.entity.js';
import { CourseSection } from './course-section.entity.js';

@Entity('course_modules')
export class CourseModule {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'integer' })
  courseId: number;

  @Column({ type: 'varchar', length: 255 })
  title: string;

  @Column({ type: 'varchar', length: 255 })
  slug: string;

  @Column({ type: 'text', nullable: true })
  description?: string | null;

  @Column({ type: 'varchar', length: 500, nullable: true })
  bannerImage?: string | null;

  @Column({ type: 'integer', default: 0 })
  orderIndex: number;

  @ManyToOne(() => Course, (course) => course.modules, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'courseId' })
  course: Course;

  @OneToMany(() => CourseSection, (section) => section.module, {
    cascade: true,
  })
  sections: CourseSection[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
