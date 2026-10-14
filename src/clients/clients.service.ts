import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Client } from '../database/entities/client.entity.js';

export interface TelegramUserData {
  id: number | string;
  username?: string | null;
  first_name?: string | null;
  last_name?: string | null;
  language_code?: string | null;
}

@Injectable()
export class ClientsService {
  private readonly logger = new Logger(ClientsService.name);

  constructor(
    @InjectRepository(Client)
    private readonly clientRepository: Repository<Client>,
  ) {}

  async findOrCreateFromTelegram(data: TelegramUserData): Promise<Client> {
    const telegramId = String(data.id);
    let client = await this.clientRepository.findOne({ where: { telegramId } });

    if (!client) {
      client = this.clientRepository.create({
        telegramId,
        username: data.username ?? null,
        firstName: data.first_name ?? null,
        lastName: data.last_name ?? null,
        languageCode: data.language_code ?? null,
        role: 'client',
        isRegistered: false,
      });
      await this.clientRepository.save(client);
      this.logger.log(`Created new Telegram client: ${telegramId} (@${data.username ?? 'none'})`);
    } else {
      let hasChanged = false;
      if (data.username !== undefined && client.username !== data.username) {
        client.username = data.username;
        hasChanged = true;
      }
      if (data.first_name !== undefined && client.firstName !== data.first_name) {
        client.firstName = data.first_name;
        hasChanged = true;
      }
      if (data.last_name !== undefined && client.lastName !== data.last_name) {
        client.lastName = data.last_name;
        hasChanged = true;
      }
      if (hasChanged) {
        await this.clientRepository.save(client);
      }
    }

    return client;
  }

  async findByTelegramId(telegramId: number | string): Promise<Client | null> {
    return this.clientRepository.findOne({
      where: { telegramId: String(telegramId) },
    });
  }

  async setRegistrationStep(
    telegramId: number | string,
    step: string | null,
  ): Promise<Client | null> {
    const client = await this.findByTelegramId(telegramId);
    if (!client) return null;

    client.registrationStep = step;
    return this.clientRepository.save(client);
  }

  async saveNameAndPromptPhone(
    telegramId: number | string,
    fullName: string,
  ): Promise<Client | null> {
    const client = await this.findByTelegramId(telegramId);
    if (!client) return null;

    client.fullName = fullName;
    client.registrationStep = 'awaiting_phone';
    return this.clientRepository.save(client);
  }

  async completeRegistration(
    telegramId: number | string,
    phone: string,
  ): Promise<Client | null> {
    const client = await this.findByTelegramId(telegramId);
    if (!client) return null;

    client.phone = phone;
    client.isRegistered = true;
    client.role = 'client';
    client.registrationStep = null;
    return this.clientRepository.save(client);
  }

  async saveClient(client: Client): Promise<Client> {
    return this.clientRepository.save(client);
  }

  async updateMetadata(telegramId: number | string, metadata: Record<string, any>): Promise<Client | null> {
    const client = await this.findByTelegramId(telegramId);
    if (!client) return null;
    client.metadata = { ...(client.metadata ?? {}), ...metadata };
    return this.clientRepository.save(client);
  }

  async cancelRegistration(telegramId: number | string): Promise<Client | null> {
    const client = await this.findByTelegramId(telegramId);
    if (!client) return null;
    client.registrationStep = null;
    return this.clientRepository.save(client);
  }

  async findAll(): Promise<Client[]> {
    return this.clientRepository.find({ order: { createdAt: 'DESC' } });
  }

  async findById(id: number): Promise<Client | null> {
    return this.clientRepository.findOne({ where: { id } });
  }

  async updateRole(id: number, role: string): Promise<Client | null> {
    const client = await this.findById(id);
    if (!client) return null;
    client.role = role;
    return this.clientRepository.save(client);
  }

  async findByPhone(phone: string): Promise<Client | null> {
    if (!phone || !phone.trim()) return null;
    const clean = phone.trim();
    const direct = await this.clientRepository.findOne({ where: { phone: clean } });
    if (direct) return direct;

    const digitsOnly = clean.replace(/\D/g, '');
    if (digitsOnly.length >= 7) {
      const allWithPhone = await this.clientRepository.find({
        select: { id: true, phone: true, fullName: true, telegramId: true },
      });
      const match = allWithPhone.find(
        (c) => c.phone && c.phone.replace(/\D/g, '') === digitsOnly,
      );
      if (match) {
        return this.findById(match.id);
      }
    }
    return null;
  }

  async count(): Promise<number> {
    return this.clientRepository.count();
  }

  async createClient(data: {
    fullName: string;
    telegramId?: string | number | null;
    username?: string | null;
    phone?: string | null;
    languageCode?: string | null;
    role?: string;
    isRegistered?: boolean;
  }): Promise<Client> {
    const telegramId = data.telegramId && String(data.telegramId).trim().length > 0
      ? String(data.telegramId).trim()
      : String(Date.now());

    const trimmedName = data.fullName.trim();
    const parts = trimmedName.split(/\s+/);
    const firstName = parts[0] || null;
    const lastName = parts.slice(1).join(' ') || null;

    const client = this.clientRepository.create({
      telegramId,
      fullName: trimmedName,
      firstName,
      lastName,
      username: data.username ? data.username.replace(/^@/, '').trim() : null,
      phone: data.phone ? data.phone.trim() : null,
      languageCode: data.languageCode || 'en',
      role: data.role || 'client',
      isRegistered: data.isRegistered !== undefined ? data.isRegistered : true,
      registrationStep: 'completed',
    });

    return this.clientRepository.save(client);
  }

  async deleteClient(id: number): Promise<boolean> {
    const res = await this.clientRepository.delete(id);
    return (res.affected ?? 0) > 0;
  }
}
