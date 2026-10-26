import { AnonymousQuestionsService } from './anonymous-questions.service.js';
export declare class QuestionsController {
    private readonly questionsService;
    constructor(questionsService: AnonymousQuestionsService);
    submitQuestion(body: {
        question: string;
        category?: string;
    }): Promise<import("../database/entities/anonymous-question.entity.js").AnonymousQuestion>;
    getPublicQuestions(category?: string, search?: string): Promise<import("../database/entities/anonymous-question.entity.js").AnonymousQuestion[]>;
    getMyQuestionsStatus(body: {
        ids?: number[];
    }): Promise<import("../database/entities/anonymous-question.entity.js").AnonymousQuestion[]>;
}
