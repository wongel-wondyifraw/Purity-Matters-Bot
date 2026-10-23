import { Injectable, Logger } from '@nestjs/common';
import { InjectBot } from 'nestjs-telegraf';
import { Telegraf, Markup } from 'telegraf';
import * as fs from 'fs';
import * as path from 'path';
import { Client } from '../database/entities/client.entity.js';
import { CourseDefinition, CourseLesson } from '../features/courses.service.js';
import { ResourceItem } from '../features/resources.service.js';
import { PaymentAccountsResponse } from '../features/payment-settings.service.js';

@Injectable()
export class BotService {
  private readonly logger = new Logger(BotService.name);

  constructor(
    @InjectBot()
    private readonly bot: Telegraf<any>,
  ) {}

  async sendDocumentToUser(
    telegramId: string | number,
    filePath: string,
    fileName: string,
    caption?: string,
  ): Promise<boolean> {
    try {
      if (!this.bot?.telegram?.sendDocument) {
        this.logger.warn('Telegraf sendDocument skipped: bot not initialized');
        return false;
      }

      const fullDiskPath = path.isAbsolute(filePath)
        ? filePath
        : path.resolve(
            process.cwd(),
            filePath.startsWith('/') ? filePath.slice(1) : filePath,
          );

      if (!fs.existsSync(fullDiskPath)) {
        throw new Error(`File does not exist on disk: ${fullDiskPath}`);
      }

      await this.bot.telegram.sendDocument(
        telegramId,
        {
          source: fs.createReadStream(fullDiskPath),
          filename: fileName,
        },
        {
          caption:
            caption ||
            `🎉 <b>Payment Verified!</b>\nHere is your official copy of: <b>${fileName}</b>.\nGod bless your journey to purity!`,
          parse_mode: 'HTML',
        },
      );
      this.logger.log(
        `Successfully dispatched document ${fileName} to telegram user ${telegramId}`,
      );
      return true;
    } catch (err: any) {
      this.logger.error(`Error sending document to ${telegramId}: ${err.message}`, err);
      throw err;
    }
  }

  async sendMessageToUser(
    telegramId: string | number,
    message: string,
  ): Promise<boolean> {
    try {
      if (!this.bot?.telegram?.sendMessage) {
        return false;
      }
      await this.bot.telegram.sendMessage(telegramId, message, {
        parse_mode: 'HTML',
      });
      return true;
    } catch (err: any) {
      this.logger.error(`Error sending message to ${telegramId}: ${err.message}`, err);
      return false;
    }
  }

  getWelcomeMessage(client: Client): string {
    const name = client.fullName ?? client.firstName ?? client.username ?? 'Friend';
    return (
      `👋 <b>Welcome, ${name}!</b> to the <b>Purity Matters Bot</b>.\n\n` +
      `We are dedicated to helping you live a life of wholeness, freedom, and divine purpose.\n\n` +
      `📋 <b>Your Status:</b> ${client.isRegistered ? '✅ Registered Client' : '⏳ Guest / Not Registered'}\n\n` +
      `Use the persistent menu buttons below to explore our services or get started.`
    );
  }

  // --- Sticky Bottom Persistent Keyboard ---
  getBottomPersistentKeyboard(isRegistered = false) {
    if (isRegistered) {
      return Markup.keyboard([
        ['🛋️ A. Counselling', '🕊️ B. Inner Healing'],
        ['📚 C. Training & Courses', '📖 D. Resources & E-Books'],
        ['👤 My Profile', 'ℹ️ About Us'],
      ])
        .resize()
        .persistent();
    }

    return Markup.keyboard([
      ['✨ Register as Client', 'ℹ️ About Us'],
      ['📋 My Status', '❓ Help'],
    ])
      .resize()
      .persistent();
  }

  getMainKeyboard(isRegistered = false) {
    if (isRegistered) {
      return Markup.inlineKeyboard([
        [
          Markup.button.callback('✨ Browse Services', 'cmd_services'),
          Markup.button.callback('👤 My Profile', 'cmd_status'),
        ],
        [
          Markup.button.callback('ℹ️ About Us', 'cmd_about'),
          Markup.button.callback('❓ Help', 'cmd_help'),
        ],
      ]);
    }

    return Markup.inlineKeyboard([
      [
        Markup.button.callback('✨ Register as Client', 'cmd_register'),
        Markup.button.callback('ℹ️ About Us', 'cmd_about'),
      ],
      [
        Markup.button.callback('📋 My Status', 'cmd_status'),
        Markup.button.callback('❓ Help', 'cmd_help'),
      ],
    ]);
  }

  getServicesMenuMessage(): string {
    return (
      `🌟 <b>Purity Matters Services Menu</b>\n\n` +
      `Please select a service using the buttons below:\n\n` +
      `🛋️ <b>A. Counselling</b> — Confidential 1-on-1 support for personal, family, relationship, or purity concerns.\n\n` +
      `🕊️ <b>B. Inner Healing</b> — Healing prayer and restoration for rejection, abandonment, and emotional wounds.\n\n` +
      `📚 <b>C. Training & Courses</b> — 7-day and 21-day structured transformation journeys.\n\n` +
      `📖 <b>D. Resources & E-Books</b> — Essential guides, workbooks, and paid e-books for your walk.`
    );
  }

  getServicesMenuKeyboard() {
    return Markup.inlineKeyboard([
      [Markup.button.callback('🛋️ A. Counselling', 'srv_counselling')],
      [Markup.button.callback('🕊️ B. Inner Healing', 'srv_inner_healing')],
      [Markup.button.callback('📚 C. Training & Courses', 'srv_courses')],
      [Markup.button.callback('📖 D. Resources & E-Books', 'srv_resources')],
      [
        Markup.button.callback('👤 My Requests & Profile', 'cmd_status'),
        Markup.button.callback('🏠 Home', 'cmd_main_menu'),
      ],
    ]);
  }

  // --- A. Counselling Keyboards ---
  getCounselingConcernKeyboard() {
    return Markup.inlineKeyboard([
      [
        Markup.button.callback('👤 Personal', 'csl_concern_personal'),
        Markup.button.callback('💍 Relationship', 'csl_concern_relationship'),
      ],
      [
        Markup.button.callback('👨‍👩‍👧 Family', 'csl_concern_family'),
        Markup.button.callback('🛡️ Purity', 'csl_concern_purity'),
      ],
      [Markup.button.callback('💔 Emotional Concerns', 'csl_concern_emotional')],
      [Markup.button.callback('🔙 Return to Services', 'cmd_services')],
    ]);
  }

  getCounselingDescriptionSkipKeyboard() {
    return Markup.inlineKeyboard([
      [Markup.button.callback('⏩ Skip Sensitive Details', 'csl_skip_desc')],
      [Markup.button.callback('❌ Cancel Request', 'cmd_services')],
    ]);
  }

  getCounselingMethodKeyboard() {
    return Markup.inlineKeyboard([
      [
        Markup.button.callback('💬 Telegram Chat', 'csl_method_telegram'),
        Markup.button.callback('📞 Phone Call', 'csl_method_phone'),
      ],
      [
        Markup.button.callback('📹 Video Call', 'csl_method_video'),
        Markup.button.callback('🤝 In-Person', 'csl_method_in_person'),
      ],
      [Markup.button.callback('❌ Cancel Request', 'cmd_services')],
    ]);
  }

  getCounselingTimeKeyboard() {
    return Markup.inlineKeyboard([
      [Markup.button.callback('⚡ Next Available Appointment', 'csl_time_next')],
      [
        Markup.button.callback('🌅 Morning (9am - 12pm)', 'csl_time_morning'),
        Markup.button.callback('☀️ Afternoon (1pm - 5pm)', 'csl_time_afternoon'),
      ],
      [Markup.button.callback('🌙 Evening (6pm - 9pm)', 'csl_time_evening')],
      [Markup.button.callback('❌ Cancel Request', 'cmd_services')],
    ]);
  }

  getCounselingConfirmKeyboard() {
    return Markup.inlineKeyboard([
      [Markup.button.callback('✅ Confirm & Submit Request', 'csl_submit')],
      [Markup.button.callback('❌ Cancel', 'cmd_services')],
    ]);
  }

  // --- B. Inner Healing Keyboards ---
  getInnerHealingTopicsKeyboard() {
    return Markup.inlineKeyboard([
      [
        Markup.button.callback('💔 Rejection', 'ih_topic_rejection'),
        Markup.button.callback('🏚️ Abandonment', 'ih_topic_abandonment'),
      ],
      [
        Markup.button.callback('🕊️ Forgiveness', 'ih_topic_forgiveness'),
        Markup.button.callback('😔 Shame & Guilt', 'ih_topic_shame'),
      ],
      [
        Markup.button.callback('👑 Identity & Worth', 'ih_topic_identity'),
        Markup.button.callback('❤️‍🩹 Emotional Wounds', 'ih_topic_wounds'),
      ],
      [Markup.button.callback('🔙 Return to Services', 'cmd_services')],
    ]);
  }

  // --- C. Training & Courses Keyboards ---
  getCoursesListKeyboard(courses: CourseDefinition[]) {
    const buttons = courses.map((course) => [
      Markup.button.callback(course.title, `crs_view_${course.id}`),
    ]);
    buttons.push([Markup.button.callback('🔙 Return to Services', 'cmd_services')]);
    return Markup.inlineKeyboard(buttons);
  }

  getCourseLessonKeyboard(courseId: string, currentDay: number, totalDays: number) {
    const buttons: any[] = [];
    if (currentDay <= totalDays) {
      buttons.push([
        Markup.button.callback(`✅ Mark Day ${currentDay} Complete`, `crs_complete_${courseId}_${currentDay}`),
      ]);
    }
    buttons.push([
      Markup.button.callback('🤝 Request Accountability Support', `crs_acc_${courseId}`),
    ]);
    buttons.push([
      Markup.button.callback('🔙 Back to All Courses', 'srv_courses'),
    ]);
    return Markup.inlineKeyboard(buttons);
  }

  // --- D. Resources & E-Books Keyboards ---
  getResourcesMenuKeyboard(catalog: any[]) {
    const buttons = catalog.map((item) => {
      const isPaid = item.pricingType ? item.pricingType === 'paid' : !!item.isPaid;
      const priceText = isPaid ? `(${item.price} ${item.currency || 'ETB'})` : '(FREE)';
      return [
        Markup.button.callback(
          `${item.title} ${priceText}`,
          `res_view_${item.id}`,
        ),
      ];
    });
    buttons.push([Markup.button.callback('💼 My Purchases', 'res_my_purchases')]);
    buttons.push([Markup.button.callback('🔙 Return to Services', 'cmd_services')]);
    return Markup.inlineKeyboard(buttons);
  }

  getResourceDetailKeyboard(resource: any, hasPurchased: boolean) {
    const buttons: any[] = [];
    const isFree = resource.pricingType === 'free' || resource.isPaid === false || Number(resource.price) === 0;

    if (isFree || hasPurchased) {
      buttons.push([
        Markup.button.callback('📥 Download / Receive File', `res_dl_${resource.id}`),
      ]);
    } else {
      const price = resource.price || 250;
      const currency = resource.currency || 'ETB';
      buttons.push([
        Markup.button.callback(
          `💳 Purchase (${price} ${currency})`,
          `res_buy_${resource.id}`,
        ),
      ]);
    }
    buttons.push([Markup.button.callback('🔙 Back to Catalog', 'srv_resources')]);
    return Markup.inlineKeyboard(buttons);
  }

  getPaymentInstructionsMessage(
    resourceTitle: string,
    amount: number,
    currency: string,
    orderNumber: string,
    accounts: PaymentAccountsResponse,
  ): string {
    let msg = `💳 <b>Payment Required for:</b>\n<b>${resourceTitle}</b>\n\n`;
    msg += `💰 <b>Amount:</b> <b>${amount} ${currency}</b>\n`;
    msg += `🔖 <b>Order Reference:</b> <code>${orderNumber}</code> <i>(tap to copy)</i>\n\n`;
    msg += `Please transfer <b>${amount} ${currency}</b> using either account below, putting <code>${orderNumber}</code> in the transfer reason/remarks:\n\n`;

    if (accounts.telebirr.isActive) {
      msg += `📱 <b>Telebirr:</b>\n`;
      msg += `• Account: <code>${accounts.telebirr.accountNumber}</code> <i>(tap to copy)</i>\n`;
      msg += `• Receiver: <b>${accounts.telebirr.accountName}</b>\n`;
      if (accounts.telebirr.instructions) {
        msg += `• Note: <i>${accounts.telebirr.instructions}</i>\n`;
      }
      msg += `\n`;
    }

    if (accounts.cbe.isActive) {
      msg += `🏦 <b>Commercial Bank of Ethiopia (CBE):</b>\n`;
      msg += `• Account: <code>${accounts.cbe.accountNumber}</code> <i>(tap to copy)</i>\n`;
      msg += `• Receiver: <b>${accounts.cbe.accountName}</b>\n`;
      if (accounts.cbe.branchOrShortcode) {
        msg += `• Branch: ${accounts.cbe.branchOrShortcode}\n`;
      }
      if (accounts.cbe.instructions) {
        msg += `• Note: <i>${accounts.cbe.instructions}</i>\n`;
      }
      msg += `\n`;
    }

    msg += `👇 <b>After transferring, tap your payment method below:</b>`;
    return msg;
  }

  getPaymentActionKeyboard(orderId: number) {
    return Markup.inlineKeyboard([
      [
        Markup.button.callback('📱 Paid via Telebirr', `pay_confirm_${orderId}_telebirr`),
        Markup.button.callback('🏦 Paid via CBE', `pay_confirm_${orderId}_cbe`),
      ],
      [Markup.button.callback('❌ Cancel Order', `pay_cancel_${orderId}`)],
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
      `📖 <b>Available Commands:</b>\n\n` +
      `• /services — Open the Services menu (Counselling, Inner Healing, Courses, E-books)\n` +
      `• /register — Register as a client\n` +
      `• /status — View your client profile and active requests\n` +
      `• /cancel — Cancel any active request or registration\n` +
      `• /ping — Check server status\n` +
      `• /help — Display this help message\n`
    );
  }

  getAboutMessage(): string {
    return (
      `🌟 <b>About Purity Matters</b>\n\n` +
      `Purity Matters is dedicated to inspiring, educating, and supporting individuals ` +
      `in living purposeful, pure, and wholesome lives.\n\n` +
      `Through confidential counselling, inner healing ministries, structured journeys, and biblical resources, ` +
      `we walk alongside you on the journey to total wholeness.`
    );
  }
}
