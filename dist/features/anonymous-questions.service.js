var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
var AnonymousQuestionsService_1;
import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { AnonymousQuestion } from '../database/entities/anonymous-question.entity.js';
let AnonymousQuestionsService = AnonymousQuestionsService_1 = class AnonymousQuestionsService {
    questionRepo;
    logger = new Logger(AnonymousQuestionsService_1.name);
    constructor(questionRepo) {
        this.questionRepo = questionRepo;
    }
    generateRef() {
        const num = Math.floor(10000 + Math.random() * 90000);
        return `AQ-${num}`;
    }
    async submitQuestion(data) {
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
    async getPublicAnswered(category, search) {
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
    async getMyQuestions(ids) {
        if (!ids || ids.length === 0)
            return [];
        const validIds = ids.map((id) => Number(id)).filter((id) => !isNaN(id) && id > 0);
        if (validIds.length === 0)
            return [];
        return this.questionRepo.find({
            where: { id: In(validIds) },
            order: { createdAt: 'DESC' },
        });
    }
    async getAll() {
        return this.questionRepo.find({
            order: { createdAt: 'DESC' },
        });
    }
    async findById(id) {
        return this.questionRepo.findOne({ where: { id } });
    }
    async answerQuestion(id, data) {
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
    async updateChannelPost(id, messageId) {
        await this.questionRepo.update(id, {
            postedToChannel: true,
            telegramMessageId: messageId,
            postedToChannelAt: new Date(),
        });
        this.logger.log(`Recorded Telegram channel broadcast for Question #${id} (Message ID: ${messageId})`);
    }
    async deleteQuestion(id) {
        const question = await this.findById(id);
        if (!question)
            return false;
        await this.questionRepo.remove(question);
        this.logger.log(`Deleted Anonymous Question #${id} (${question.referenceNumber})`);
        return true;
    }
};
AnonymousQuestionsService = AnonymousQuestionsService_1 = __decorate([
    Injectable(),
    __param(0, InjectRepository(AnonymousQuestion)),
    __metadata("design:paramtypes", [Repository])
], AnonymousQuestionsService);
export { AnonymousQuestionsService };
//# sourceMappingURL=anonymous-questions.service.js.map