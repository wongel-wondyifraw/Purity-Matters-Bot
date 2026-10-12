import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../database/entities/user.entity.js';

export interface TelegramUserData {
  id: number | string;
  username?: string | null;
  first_name?: string | null;
  last_name?: string | null;
  language_code?: string | null;
}

@Injectable()
export class UsersService {
  private readonly logger = new Logger(UsersService.name);

  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  async findOrCreateFromTelegram(data: TelegramUserData): Promise<User> {
    const telegramId = String(data.id);
    let user = await this.userRepository.findOne({ where: { telegramId } });

    if (!user) {
      user = this.userRepository.create({
        telegramId,
        username: data.username ?? null,
        firstName: data.first_name ?? null,
        lastName: data.last_name ?? null,
        languageCode: data.language_code ?? null,
      });
      await this.userRepository.save(user);
      this.logger.log(`Created new Telegram user: ${telegramId} (@${data.username ?? 'none'})`);
    } else {
      // Keep profile info updated if changed
      let hasChanged = false;
      if (data.username !== undefined && user.username !== data.username) {
        user.username = data.username;
        hasChanged = true;
      }
      if (data.first_name !== undefined && user.firstName !== data.first_name) {
        user.firstName = data.first_name;
        hasChanged = true;
      }
      if (data.last_name !== undefined && user.lastName !== data.last_name) {
        user.lastName = data.last_name;
        hasChanged = true;
      }
      if (hasChanged) {
        await this.userRepository.save(user);
      }
    }

    return user;
  }

  async findByTelegramId(telegramId: number | string): Promise<User | null> {
    return this.userRepository.findOne({
      where: { telegramId: String(telegramId) },
    });
  }

  async updateRegistration(
    telegramId: number | string,
    isRegistered: boolean,
    phone?: string,
  ): Promise<User | null> {
    const user = await this.findByTelegramId(telegramId);
    if (!user) return null;

    user.isRegistered = isRegistered;
    if (phone) {
      user.phone = phone;
    }
    return this.userRepository.save(user);
  }
}
