import { Injectable, Logger } from '@nestjs/common';
import { Markup } from 'telegraf';
import { Client } from '../database/entities/client.entity.js';

@Injectable()
export class BotService {
  private readonly logger = new Logger(BotService.name);

  getWelcomeMessage(client: Client): string {
    const name = client.fullName ?? client.firstName ?? client.username ?? 'Friend';
    return (
      `👋 *Welcome, ${name}\\!* to the *Purity Matters Bot*\\.\n\n` +
      `We are delighted to have you here\\. This bot provides updates, client services, and community resources\\.\n\n` +
      `📋 *Your Status:* ${client.isRegistered ? '✅ Registered Client' : '⏳ Guest / Not Registered'}\n\n` +
      `Use the buttons below or send commands to navigate\\.`
    );
  }

  getMainKeyboard(isRegistered = false) {
    const registerButton = isRegistered
      ? Markup.button.callback('👤 My Profile', 'cmd_status')
      : Markup.button.callback('✨ Register as Client', 'cmd_register');

    return Markup.inlineKeyboard([
      [
        Markup.button.callback('📋 My Status', 'cmd_status'),
        Markup.button.callback('ℹ️ About Us', 'cmd_about'),
      ],
      [
        registerButton,
        Markup.button.callback('❓ Help', 'cmd_help'),
      ],
    ]);
  }

  getPhoneShareKeyboard() {
    return Markup.keyboard([
      [Markup.button.contactRequest('📱 Share Phone Number')],
      ['❌ Cancel Registration'],
    ])
      .oneTime()
      .resize();
  }

  getRemoveKeyboard() {
    return Markup.removeKeyboard();
  }

  getHelpMessage(): string {
    return (
      `📖 *Available Commands:*\n\n` +
      `• /start \\- Start the bot and show main menu\n` +
      `• /register \\- Register as a client\n` +
      `• /cancel \\- Cancel ongoing registration\n` +
      `• /status \\- View your client profile\n` +
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
