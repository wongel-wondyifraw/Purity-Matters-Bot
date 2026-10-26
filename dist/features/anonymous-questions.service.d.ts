import { Repository } from 'typeorm';
import { AnonymousQuestion } from '../database/entities/anonymous-question.entity.js';
export declare class AnonymousQuestionsService {
    private readonly questionRepo;
    private readonly logger;
    constructor(questionRepo: Repository<AnonymousQuestion>);
    private generateRef;
    submitQuestion(data: {
        question: string;
        category?: string;
    }): Promise<AnonymousQuestion>;
    getPublicAnswered(category?: string, search?: string): Promise<AnonymousQuestion[]>;
    getMyQuestions(ids: number[]): Promise<AnonymousQuestion[]>;
    getAll(): Promise<AnonymousQuestion[]>;
    findById(id: number): Promise<AnonymousQuestion | null>;
    answerQuestion(id: number, data: {
        answer: string;
        assignedCounselor?: string | null;
        isPublic?: boolean;
    }): Promise<AnonymousQuestion>;
    updateChannelPost(id: number, messageId: number): Promise<void>;
    deleteQuestion(id: number): Promise<boolean>;
}
