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
import { CourseModule } from './course-module.entity.js';
import { CourseMaterial } from './course-material.entity.js';

@Entity('course_sections')
export class CourseSection {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'integer' })
  moduleId: number;

  @Column({ type: 'varchar', length: 255 })
  title: string;

  @Column({ type: 'text', nullable: true })
  additionalContent?: string | null;

  @Column({ type: 'integer', default: 0 })
  orderIndex: number;

  @ManyToOne(() => CourseModule, (module) => module.sections, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'moduleId' })
  module: CourseModule;

  @OneToMany(() => CourseMaterial, (mat) => mat.section, {
    cascade: true,
  })
  materials: CourseMaterial[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
