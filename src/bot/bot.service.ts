import { Injectable, Logger } from '@nestjs/common';
import { Markup } from 'telegraf';
import { User } from '../database/entities/user.entity.js';

@Injectable()
export class BotService {
  private readonly logger = new Logger(BotService.name);

  getWelcomeMessage(user: User): string {
    const name = user.firstName ?? user.username ?? 'Friend';
    return (
      `👋 *Welcome, ${name}\\!* to the *Purity Matters Bot*\\.\n\n` +
      `We are delighted to have you here\\. This bot provides updates, member services, and community resources\\.\n\n` +
      `📋 *Your Status:* ${user.isRegistered ? '✅ Registered Member' : '⏳ Guest / Not Registered'}\n\n` +
      `Use the buttons below or send commands to navigate\\.`
    );
  }

  getMainKeyboard() {
    return Markup.inlineKeyboard([
      [
        Markup.button.callback('📋 My Status', 'cmd_status'),
        Markup.button.callback('ℹ️ About Us', 'cmd_about'),
      ],
      [
        Markup.button.callback('✨ Register', 'cmd_register'),
        Markup.button.callback('❓ Help', 'cmd_help'),
      ],
    ]);
  }

  getHelpMessage(): string {
    return (
      `📖 *Available Commands:*\n\n` +
      `• /start \\- Start the bot and show main menu\n` +
      `• /status \\- View your registration status\n` +
      `• /register \\- Start member registration\n` +
      `• /ping \\- Check server status\n` +
      `• /help \\- Display this help message\n`
    );
  }

  getAboutMessage(): string {
    return (
      `🌟 *About Purity Matters*\n\n` +
      `Purity Matters is dedicated to inspiring, educating, and supporting individuals ` +
      `in living purposeful, pure, and wholesome lives\\.\n\n` +
      `Stay tuned for community updates, events, and programs\\.`
    );
  }
}
