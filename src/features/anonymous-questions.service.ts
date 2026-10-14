import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In, ILike } from 'typeorm';
import { AnonymousQuestion } from '../database/entities/anonymous-question.entity.js';

@Injectable()
export class AnonymousQuestionsService {
  private readonly logger = new Logger(AnonymousQuestionsService.name);

  constructor(
    @InjectRepository(AnonymousQuestion)
    private readonly questionRepo: Repository<AnonymousQuestion>,
  ) {}

  private generateRef(): string {
    const num = Math.floor(10000 + Math.random() * 90000);
    return `AQ-${num}`;
  }

  async submitQuestion(data: {
    question: string;
    category?: string;
  }): Promise<AnonymousQuestion> {
    let ref = this.generateRef();
    let existing = await this.questionRepo.findOne({ where: { referenceNumber: ref } });
    while (existing) {
      ref = this.generateRef();
      existing = await this.questionRepo.findOne({ where: { referenceNumber: ref } });
    }

    const question = this.questionRepo.create({
      referenceNumber: ref,
      category: data.category?.trim() || 'General Inquiry',
      question: data.question.trim(),
      status: 'pending',
      isPublic: true,
    });

    const saved = await this.questionRepo.save(question);
    this.logger.log(`Created Anonymous Question #${saved.id} (${saved.referenceNumber}) in category "${saved.category}"`);
    return saved;
  }

  async getPublicAnswered(category?: string, search?: string): Promise<AnonymousQuestion[]> {
    const qb = this.questionRepo
      .createQueryBuilder('q')
      .where('q.status = :status', { status: 'answered' })
      .andWhere('q.isPublic = :isPublic', { isPublic: true });

    if (category && category !== 'all' && category.trim().length > 0) {
      qb.andWhere('LOWER(q.category) = LOWER(:category)', { category: category.trim() });
    }

    if (search && search.trim().length > 0) {
      qb.andWhere('(LOWER(q.question) LIKE :search OR LOWER(q.answer) LIKE :search)', {
        search: `%${search.trim().toLowerCase()}%`,
      });
    }

    qb.orderBy('q.answeredAt', 'DESC');
    return qb.getMany();
  }

  async getMyQuestions(ids: number[]): Promise<AnonymousQuestion[]> {
    if (!ids || ids.length === 0) return [];
    // Ensure ids are valid positive integers
    const validIds = ids.map((id) => Number(id)).filter((id) => !isNaN(id) && id > 0);
    if (validIds.length === 0) return [];

    return this.questionRepo.find({
      where: { id: In(validIds) },
      order: { createdAt: 'DESC' },
    });
  }

  async getAll(): Promise<AnonymousQuestion[]> {
    return this.questionRepo.find({
      order: { createdAt: 'DESC' },
    });
  }

  async findById(id: number): Promise<AnonymousQuestion | null> {
    return this.questionRepo.findOne({ where: { id } });
  }

  async answerQuestion(
    id: number,
    data: {
      answer: string;
      assignedCounselor?: string | null;
      isPublic?: boolean;
    },
  ): Promise<AnonymousQuestion> {
    const question = await this.findById(id);
    if (!question) {
      throw new NotFoundException(`Question #${id} not found.`);
    }

    question.answer = data.answer.trim();
    question.status = 'answered';
    question.answeredAt = new Date();
    if (data.assignedCounselor !== undefined) {
      question.assignedCounselor = data.assignedCounselor?.trim() || null;
    }
    if (data.isPublic !== undefined) {
      question.isPublic = data.isPublic;
    }

    const saved = await this.questionRepo.save(question);
    this.logger.log(`Answered Anonymous Question #${id} (${saved.referenceNumber}) by counselor "${saved.assignedCounselor || 'Admin'}"`);
    return saved;
  }

  async deleteQuestion(id: number): Promise<boolean> {
    const question = await this.findById(id);
    if (!question) return false;
    await this.questionRepo.remove(question);
    this.logger.log(`Deleted Anonymous Question #${id} (${question.referenceNumber})`);
    return true;
  }
}
