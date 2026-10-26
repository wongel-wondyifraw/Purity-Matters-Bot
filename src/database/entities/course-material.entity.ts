import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { CourseSection } from './course-section.entity.js';

@Entity('course_materials')
export class CourseMaterial {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'integer' })
  sectionId: number;

  @Column({ type: 'varchar', length: 255 })
  title: string;

  @Column({ type: 'varchar', length: 255 })
  fileName: string;

  @Column({ type: 'varchar', length: 500 })
  filePath: string;

  @Column({ type: 'bigint', nullable: true })
  fileSizeBytes?: number | null;

  @Column({ type: 'varchar', length: 128, nullable: true })
  fileMimeType?: string | null;

  @Column({ type: 'varchar', length: 64, default: 'document' })
  fileType: string;

  @ManyToOne(() => CourseSection, (section) => section.materials, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'sectionId' })
  section: CourseSection | null;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
