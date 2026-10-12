import { Logger } from '@nestjs/common';
import { Update, Ctx, Start, Help, Command, Action, On, Hears } from 'nestjs-telegraf';
import type { BotContext } from './bot.interface.js';
import { BotService } from './bot.service.js';
import { ClientsService } from '../clients/clients.service.js';

@Update()
export class BotUpdate {
  private readonly logger = new Logger(BotUpdate.name);

  constructor(
    private readonly botService: BotService,
    private readonly clientsService: ClientsService,
  ) {}

  @Start()
  async onStart(@Ctx() ctx: BotContext) {
    if (!ctx.from) return;

    const client = await this.clientsService.findOrCreateFromTelegram(ctx.from);
    const message = this.botService.getWelcomeMessage(client);
    const keyboard = this.botService.getMainKeyboard(client.isRegistered);

    await ctx.replyWithMarkdownV2(message, keyboard);
  }

  @Help()
  async onHelp(@Ctx() ctx: BotContext) {
    await ctx.replyWithMarkdownV2(this.botService.getHelpMessage());
  }

  @Command('status')
  async onStatus(@Ctx() ctx: BotContext) {
    if (!ctx.from) return;

    const client = await this.clientsService.findOrCreateFromTelegram(ctx.from);
    const statusText =
      `👤 *Client Profile*\n\n` +
      `• *ID:* \`${client.telegramId}\`\n` +
      `• *Full Name:* ${client.fullName ?? client.firstName ?? 'Not provided'}\n` +
      `• *Phone:* ${client.phone ?? 'Not shared'}\n` +
      `• *Username:* ${client.username ? `@${client.username}` : 'Not set'}\n` +
      `• *Role:* \`${client.role}\`\n` +
      `• *Registered:* ${client.isRegistered ? '✅ Yes' : '❌ No'}\n` +
      `• *Joined:* ${client.createdAt.toLocaleDateString()}`;

    await ctx.replyWithMarkdownV2(statusText);
  }

  @Command('ping')
  async onPing(@Ctx() ctx: BotContext) {
    const start = Date.now();
    const sent = await ctx.reply('🏓 Pong!');
    const latency = Date.now() - start;
    await ctx.telegram.editMessageText(
      ctx.chat?.id,
      sent.message_id,
      undefined,
      `🏓 Pong! Latency: ${latency}ms`,
    );
  }

  @Command('about')
  async onAbout(@Ctx() ctx: BotContext) {
    await ctx.replyWithMarkdownV2(this.botService.getAboutMessage());
  }

  @Command('register')
  async onRegister(@Ctx() ctx: BotContext) {
    if (!ctx.from) return;

    const client = await this.clientsService.findOrCreateFromTelegram(ctx.from);
    if (client.isRegistered) {
      await ctx.reply(
        `✅ You are already registered as a client!\n\n` +
        `• Name: ${client.fullName ?? client.firstName}\n` +
        `• Phone: ${client.phone ?? 'Not set'}\n` +
        `• Role: ${client.role}`,
      );
      return;
    }

    // Begin registration: step 1 is asking for full name
    await this.clientsService.setRegistrationStep(client.telegramId, 'awaiting_name');

    await ctx.reply(
      '📝 Client Registration\n\nPlease enter your Full Name to begin (or send /cancel to abort):',
      this.botService.getRemoveKeyboard(),
    );
  }

  @Command('cancel')
  @Hears('❌ Cancel Registration')
  async onCancel(@Ctx() ctx: BotContext) {
    if (!ctx.from) return;

    await this.clientsService.cancelRegistration(ctx.from.id);
    const client = await this.clientsService.findByTelegramId(ctx.from.id);
    await ctx.reply(
      '❌ Registration cancelled.',
      this.botService.getRemoveKeyboard(),
    );
    await ctx.reply(
      'Main Menu:',
      this.botService.getMainKeyboard(client?.isRegistered ?? false),
    );
  }

  @Action('cmd_status')
  async onActionStatus(@Ctx() ctx: BotContext) {
    await ctx.answerCbQuery();
    await this.onStatus(ctx);
  }

  @Action('cmd_about')
  async onActionAbout(@Ctx() ctx: BotContext) {
    await ctx.answerCbQuery();
    await this.onAbout(ctx);
  }

  @Action('cmd_register')
  async onActionRegister(@Ctx() ctx: BotContext) {
    await ctx.answerCbQuery();
    await this.onRegister(ctx);
  }

  @Action('cmd_help')
  async onActionHelp(@Ctx() ctx: BotContext) {
    await ctx.answerCbQuery();
    await this.onHelp(ctx);
  }

  @On('contact')
  async onContact(@Ctx() ctx: BotContext) {
    if (!ctx.from || !ctx.message || !('contact' in ctx.message)) return;

    const client = await this.clientsService.findByTelegramId(ctx.from.id);
    if (!client) return;

    const phone = ctx.message.contact.phone_number;

    // Complete registration with role = 'client'
    const updated = await this.clientsService.completeRegistration(client.telegramId, phone);

    await ctx.reply(
      '🎉 Registration Successful!\n\n' +
      `Welcome to Purity Matters! You have been successfully registered as a client.\n\n` +
      `• Name: ${updated?.fullName ?? client.firstName ?? 'Client'}\n` +
      `• Phone: ${phone}\n` +
      `• Role: client`,
      this.botService.getRemoveKeyboard(),
    );

    await ctx.reply(
      'You can now access client features using the menu below:',
      this.botService.getMainKeyboard(true),
    );
  }

  @On('text')
  async onText(@Ctx() ctx: BotContext) {
    if (!ctx.from || !ctx.message || !('text' in ctx.message)) return;

    const text = ctx.message.text.trim();
    if (text.startsWith('/')) {
      // Ignore other slash commands so they don't get captured as names
      return;
    }

    const client = await this.clientsService.findByTelegramId(ctx.from.id);
    if (!client) return;

    // Step 1: Client enters name
    if (client.registrationStep === 'awaiting_name') {
      if (text.length < 2) {
        await ctx.reply('⚠️ Please enter a valid full name:');
        return;
      }

      await this.clientsService.saveNameAndPromptPhone(client.telegramId, text);

      await ctx.reply(
        `Thank you, ${text}!\n\nNow please share your phone number using the button below to complete registration:`,
        this.botService.getPhoneShareKeyboard(),
      );
      return;
    }

    // Step 2: Client in phone step but typed text instead of clicking button
    if (client.registrationStep === 'awaiting_phone') {
      await ctx.reply(
        '📱 Please click the "Share Phone Number" button below to share your verified phone number, or send /cancel to stop.',
        this.botService.getPhoneShareKeyboard(),
      );
      return;
    }

    this.logger.debug(`Received message from ${ctx.from.id}: ${text}`);
  }
}
