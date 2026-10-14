import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CounselingRequest } from '../database/entities/counseling-request.entity.js';
import { ClientsService } from '../clients/clients.service.js';

export interface CounselingDraft {
  concern?: string;
  description?: string | null;
  preferredMethod?: string;
  preferredTime?: string;
}

@Injectable()
export class CounselingService {
  private readonly logger = new Logger(CounselingService.name);

  constructor(
    @InjectRepository(CounselingRequest)
    private readonly requestRepo: Repository<CounselingRequest>,
    private readonly clientsService: ClientsService,
  ) {}

  private generateRef(): string {
    const num = Math.floor(10000 + Math.random() * 90000);
    return `CN-${num}`;
  }

  async getDraft(telegramId: string | number): Promise<CounselingDraft> {
    const client = await this.clientsService.findByTelegramId(telegramId);
    return (client?.metadata?.counselingDraft as CounselingDraft) ?? {};
  }

  async updateDraft(telegramId: string | number, draft: Partial<CounselingDraft>) {
    const current = await this.getDraft(telegramId);
    const updated = { ...current, ...draft };
    await this.clientsService.updateMetadata(telegramId, { counselingDraft: updated });
    return updated;
  }

  async clearDraft(telegramId: string | number) {
    await this.clientsService.updateMetadata(telegramId, { counselingDraft: null });
  }

  async createRequest(telegramId: string | number): Promise<CounselingRequest | null> {
    const client = await this.clientsService.findByTelegramId(telegramId);
    if (!client) return null;

    const draft = await this.getDraft(telegramId);
    if (!draft.concern || !draft.preferredMethod || !draft.preferredTime) {
      return null;
    }

    const request = this.requestRepo.create({
      referenceNumber: this.generateRef(),
      telegramId: String(telegramId),
      clientName: client.fullName ?? client.firstName ?? 'Client',
      phone: client.phone ?? null,
      concern: draft.concern,
      description: draft.description && draft.description.trim().length > 0 ? draft.description : 'Not specified',
      preferredMethod: draft.preferredMethod,
      preferredTime: draft.preferredTime,
      status: 'pending',
    });

    const saved = await this.requestRepo.save(request);

    // Clear draft and reset any flow state
    await this.clearDraft(telegramId);
    await this.clientsService.setRegistrationStep(telegramId, null);

    this.logger.log(`Created Counseling Request ${saved.referenceNumber} for client ${telegramId}`);
    return saved;
  }

  async getRequestsByClient(telegramId: string | number): Promise<CounselingRequest[]> {
    return this.requestRepo.find({
      where: { telegramId: String(telegramId) },
      order: { createdAt: 'DESC' },
    });
  }

  async findAll(): Promise<CounselingRequest[]> {
    return this.requestRepo.find({ order: { createdAt: 'DESC' } });
  }

  async count(): Promise<number> {
    return this.requestRepo.count();
  }

  async updateStatus(id: number, status: string, assignedTo?: string): Promise<CounselingRequest | null> {
    return this.updateRequest(id, { status, assignedTo });
  }

  async updateRequest(
    id: number,
    data: {
      status?: string;
      assignedTo?: string | null;
      concern?: string;
      description?: string | null;
      preferredMethod?: string;
      preferredTime?: string;
      scheduledAt?: Date | string | null;
    },
  ): Promise<CounselingRequest | null> {
    const req = await this.requestRepo.findOne({ where: { id } });
    if (!req) return null;

    if (data.status !== undefined) req.status = data.status;
    if (data.assignedTo !== undefined) req.assignedTo = data.assignedTo?.trim() || null;
    if (data.concern !== undefined) req.concern = data.concern;
    if (data.description !== undefined) req.description = data.description;
    if (data.preferredMethod !== undefined) req.preferredMethod = data.preferredMethod;
    if (data.preferredTime !== undefined) req.preferredTime = data.preferredTime;
    if (data.scheduledAt !== undefined) {
      req.scheduledAt = data.scheduledAt ? new Date(data.scheduledAt) : null;
    }

    return this.requestRepo.save(req);
  }

  async directCreate(data: {
    clientName: string;
    phone?: string | null;
    telegramId?: string | number | null;
    concern: string;
    description?: string | null;
    preferredMethod: string;
    preferredTime: string;
    status?: string;
    assignedTo?: string | null;
    scheduledAt?: Date | string | null;
  }): Promise<CounselingRequest> {
    let ref = this.generateRef();
    let existing = await this.requestRepo.findOne({ where: { referenceNumber: ref } });
    while (existing) {
      ref = this.generateRef();
      existing = await this.requestRepo.findOne({ where: { referenceNumber: ref } });
    }

    const tid = data.telegramId && String(data.telegramId).trim() !== ''
      ? String(data.telegramId).trim()
      : String(Date.now());

    const request = this.requestRepo.create({
      referenceNumber: ref,
      telegramId: tid,
      clientName: data.clientName.trim(),
      phone: data.phone?.trim() || null,
      concern: data.concern.trim(),
      description:
        data.description && data.description.trim().length > 0
          ? data.description.trim()
          : 'Not specified',
      preferredMethod: data.preferredMethod.trim(),
      preferredTime: data.preferredTime.trim(),
      status: data.status?.trim() || 'pending',
      assignedTo: data.assignedTo?.trim() || null,
      scheduledAt: data.scheduledAt ? new Date(data.scheduledAt) : null,
    });

    const saved = await this.requestRepo.save(request);
    this.logger.log(`Created Direct Counseling Request ${saved.referenceNumber} for client "${saved.clientName}"`);
    return saved;
  }

  async deleteRequest(id: number): Promise<boolean> {
    const req = await this.requestRepo.findOne({ where: { id } });
    if (!req) return false;
    await this.requestRepo.remove(req);
    this.logger.log(`Deleted Counseling Request #${id} (${req.referenceNumber})`);
    return true;
  }
}
