import { Logger } from '@nestjs/common';
import { Update, Ctx, Start, Help, Command, Action, On } from 'nestjs-telegraf';
import type { BotContext } from './bot.interface.js';
import { BotService } from './bot.service.js';
import { UsersService } from '../users/users.service.js';

@Update()
export class BotUpdate {
  private readonly logger = new Logger(BotUpdate.name);

  constructor(
    private readonly botService: BotService,
    private readonly usersService: UsersService,
  ) {}

  @Start()
  async onStart(@Ctx() ctx: BotContext) {
    if (!ctx.from) return;

    const user = await this.usersService.findOrCreateFromTelegram(ctx.from);
    const message = this.botService.getWelcomeMessage(user);
    const keyboard = this.botService.getMainKeyboard();

    await ctx.replyWithMarkdownV2(message, keyboard);
  }

  @Help()
  async onHelp(@Ctx() ctx: BotContext) {
    await ctx.replyWithMarkdownV2(this.botService.getHelpMessage());
  }

  @Command('status')
  async onStatus(@Ctx() ctx: BotContext) {
    if (!ctx.from) return;

    const user = await this.usersService.findOrCreateFromTelegram(ctx.from);
    const statusText =
      `👤 *User Profile*\n\n` +
      `• *ID:* \`${user.telegramId}\`\n` +
      `• *Username:* ${user.username ? `@${user.username}` : 'Not set'}\n` +
      `• *Name:* ${user.firstName ?? ''} ${user.lastName ?? ''}\n` +
      `• *Registered:* ${user.isRegistered ? '✅ Yes' : '❌ No'}\n` +
      `• *Role:* ${user.role}\n` +
      `• *Joined:* ${user.createdAt.toLocaleDateString()}`;

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

    const user = await this.usersService.findOrCreateFromTelegram(ctx.from);
    if (user.isRegistered) {
      await ctx.reply('✅ You are already registered as a member! Thank you for being part of our community.');
      return;
    }

    // Set registration flag (can be expanded to an interactive wizard/scene)
    await this.usersService.updateRegistration(user.telegramId, true);
    await ctx.reply('🎉 Congratulations! You have been successfully registered with Purity Matters.');
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

  @On('text')
  async onText(@Ctx() ctx: BotContext) {
    // Graceful response for arbitrary text
    if (!ctx.from) return;
    this.logger.debug(`Received text message from ${ctx.from.id}`);
  }
}
