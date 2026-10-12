import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { InnerHealingRequest } from '../database/entities/inner-healing-request.entity.js';
import { ClientsService } from '../clients/clients.service.js';

@Injectable()
export class InnerHealingService {
  private readonly logger = new Logger(InnerHealingService.name);

  constructor(
    @InjectRepository(InnerHealingRequest)
    private readonly requestRepo: Repository<InnerHealingRequest>,
    private readonly clientsService: ClientsService,
  ) {}

  private generateRef(): string {
    const num = Math.floor(10000 + Math.random() * 90000);
    return `IH-${num}`;
  }

  async createRequest(
    telegramId: string | number,
    topic: string,
  ): Promise<InnerHealingRequest | null> {
    const client = await this.clientsService.findByTelegramId(telegramId);
    if (!client) return null;

    const request = this.requestRepo.create({
      referenceNumber: this.generateRef(),
      telegramId: String(telegramId),
      clientName: client.fullName ?? client.firstName ?? 'Client',
      phone: client.phone ?? null,
      topic,
      status: 'pending',
    });

    const saved = await this.requestRepo.save(request);
    this.logger.log(`Created Inner Healing Request ${saved.referenceNumber} for client ${telegramId}`);
    return saved;
  }

  async getRequestsByClient(telegramId: string | number): Promise<InnerHealingRequest[]> {
    return this.requestRepo.find({
      where: { telegramId: String(telegramId) },
      order: { createdAt: 'DESC' },
    });
  }
}
