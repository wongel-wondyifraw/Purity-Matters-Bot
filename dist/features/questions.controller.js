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
import { Controller, Post, Get, Body, Query, BadRequestException, } from '@nestjs/common';
import { AnonymousQuestionsService } from './anonymous-questions.service.js';
let QuestionsController = class QuestionsController {
    questionsService;
    constructor(questionsService) {
        this.questionsService = questionsService;
    }
    async submitQuestion(body) {
        if (!body || !body.question || !body.question.trim()) {
            throw new BadRequestException('Question text is required.');
        }
        if (body.question.trim().length < 10) {
            throw new BadRequestException('Question must be at least 10 characters.');
        }
        return this.questionsService.submitQuestion(body);
    }
    async getPublicQuestions(category, search) {
        return this.questionsService.getPublicAnswered(category, search);
    }
    async getMyQuestionsStatus(body) {
        const ids = Array.isArray(body?.ids) ? body.ids : [];
        return this.questionsService.getMyQuestions(ids);
    }
};
__decorate([
    Post(),
    __param(0, Body()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], QuestionsController.prototype, "submitQuestion", null);
__decorate([
    Get('public'),
    __param(0, Query('category')),
    __param(1, Query('search')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], QuestionsController.prototype, "getPublicQuestions", null);
__decorate([
    Post('my-status'),
    __param(0, Body()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], QuestionsController.prototype, "getMyQuestionsStatus", null);
QuestionsController = __decorate([
    Controller('questions'),
    __metadata("design:paramtypes", [AnonymousQuestionsService])
], QuestionsController);
export { QuestionsController };
//# sourceMappingURL=questions.controller.js.map