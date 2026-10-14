import {
  Controller,
  Post,
  Get,
  Body,
  Query,
  BadRequestException,
} from '@nestjs/common';
import { AnonymousQuestionsService } from './anonymous-questions.service.js';

@Controller('questions')
export class QuestionsController {
  constructor(
    private readonly questionsService: AnonymousQuestionsService,
  ) {}

  @Post()
  async submitQuestion(
    @Body()
    body: {
      question: string;
      category?: string;
    },
  ) {
    if (!body || !body.question || !body.question.trim()) {
      throw new BadRequestException('Question text is required.');
    }
    if (body.question.trim().length < 10) {
      throw new BadRequestException('Question must be at least 10 characters.');
    }

    return this.questionsService.submitQuestion(body);
  }

  @Get('public')
  async getPublicQuestions(
    @Query('category') category?: string,
    @Query('search') search?: string,
  ) {
    return this.questionsService.getPublicAnswered(category, search);
  }

  @Post('my-status')
  async getMyQuestionsStatus(
    @Body()
    body: {
      ids?: number[];
    },
  ) {
    const ids = Array.isArray(body?.ids) ? body.ids : [];
    return this.questionsService.getMyQuestions(ids);
  }
}
