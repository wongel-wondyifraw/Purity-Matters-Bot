import { Logger } from '@nestjs/common';
import { Update, Ctx, Start, Help, Command, Action, On, Hears } from 'nestjs-telegraf';
import { Markup } from 'telegraf';
import * as path from 'path';
import type { BotContext } from './bot.interface.js';
import { BotService, resolveUploadDiskPath } from './bot.service.js';
import { ClientsService } from '../clients/clients.service.js';
import { CounselingService } from '../features/counseling.service.js';
import { InnerHealingService } from '../features/inner-healing.service.js';
import { CoursesService } from '../features/courses.service.js';
import { ResourcesService } from '../features/resources.service.js';
import { PaymentSettingsService } from '../features/payment-settings.service.js';
import { DonationsService } from '../features/donations.service.js';

@Update()
export class BotUpdate {
  private readonly logger = new Logger(BotUpdate.name);

  constructor(
    private readonly botService: BotService,
    private readonly clientsService: ClientsService,
    private readonly counselingService: CounselingService,
    private readonly innerHealingService: InnerHealingService,
    private readonly coursesService: CoursesService,
    private readonly resourcesService: ResourcesService,
    private readonly paymentSettingsService: PaymentSettingsService,
    private readonly donationsService: DonationsService,
  ) {}

  @Start()
  async onStart(@Ctx() ctx: BotContext) {
    if (!ctx.from) return;

    const client = await this.clientsService.findOrCreateFromTelegram(ctx.from);
    const message = this.botService.getWelcomeMessage(client);
    const stickyKeyboard = this.botService.getBottomPersistentKeyboard(client.isRegistered);

    await ctx.replyWithHTML(message, stickyKeyboard);
  }

  @Help()
  @Hears('❓ Help')
  async onHelp(@Ctx() ctx: BotContext) {
    if (ctx.callbackQuery) {
      await ctx.answerCbQuery();
    }
    await ctx.replyWithHTML(this.botService.getHelpMessage());
  }

  @Command('services')
  @Action('cmd_services')
  async onServices(@Ctx() ctx: BotContext) {
    if (ctx.callbackQuery) {
      await ctx.answerCbQuery();
    }
    const client = ctx.from ? await this.clientsService.findByTelegramId(ctx.from.id) : null;
    await ctx.replyWithHTML(
      this.botService.getServicesMenuMessage(),
      this.botService.getBottomPersistentKeyboard(client?.isRegistered ?? false),
    );
  }

  @Action('cmd_main_menu')
  async onMainMenu(@Ctx() ctx: BotContext) {
    if (!ctx.from) return;
    await ctx.answerCbQuery();
    const client = await this.clientsService.findByTelegramId(ctx.from.id);
    await ctx.replyWithHTML(
      '🏠 <b>Main Menu:</b>\n\nChoose an option from the persistent keyboard below:',
      this.botService.getBottomPersistentKeyboard(client?.isRegistered ?? false),
    );
  }

  @Command('status')
  @Action('cmd_status')
  @Hears(['👤 My Requests & Profile', '👤 My Profile', '📋 My Status'])
  async onStatus(@Ctx() ctx: BotContext) {
    if (!ctx.from) return;
    if (ctx.callbackQuery) {
      await ctx.answerCbQuery();
    }

    const client = await this.clientsService.findOrCreateFromTelegram(ctx.from);
    const cslRequests = await this.counselingService.getRequestsByClient(ctx.from.id);
    const ihRequests = await this.innerHealingService.getRequestsByClient(ctx.from.id);

    let statusText =
      `👤 <b>Client Profile</b>\n\n` +
      `• <b>ID:</b> <code>${client.telegramId}</code>\n` +
      `• <b>Full Name:</b> ${client.fullName ?? client.firstName ?? 'Not set'}\n` +
      `• <b>Phone:</b> ${client.phone ?? 'Not shared'}\n` +
      `• <b>Role:</b> <code>${client.role}</code>\n` +
      `• <b>Registered:</b> ${client.isRegistered ? '✅ Yes' : '⏳ No'}\n\n`;

    if (cslRequests.length > 0) {
      statusText += `🛋️ <b>Active Counselling Requests:</b>\n`;
      for (const req of cslRequests.slice(0, 3)) {
        statusText += `  • Ref: <code>${req.referenceNumber}</code> | ${req.concern} | Status: <b>${req.status.toUpperCase()}</b>\n`;
      }
      statusText += `\n`;
    }

    if (ihRequests.length > 0) {
      statusText += `🕊️ <b>Inner Healing Requests:</b>\n`;
      for (const req of ihRequests.slice(0, 3)) {
        statusText += `  • Ref: <code>${req.referenceNumber}</code> | ${req.topic} | Status: <b>${req.status.toUpperCase()}</b>\n`;
      }
      statusText += `\n`;
    }

    await ctx.replyWithHTML(statusText, this.botService.getBottomPersistentKeyboard(client.isRegistered));
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
  @Action('cmd_about')
  @Hears(['ℹ️ About Us', 'About Us'])
  async onAbout(@Ctx() ctx: BotContext) {
    if (ctx.callbackQuery) {
      await ctx.answerCbQuery();
    }
    await ctx.replyWithHTML(
      this.botService.getAboutMessage(),
      this.botService.getBottomPersistentKeyboard(),
    );
  }

  @Command('register')
  @Action('cmd_register')
  @Hears('✨ Register as Client')
  async onRegister(@Ctx() ctx: BotContext) {
    if (!ctx.from) return;
    if (ctx.callbackQuery) {
      await ctx.answerCbQuery();
    }

    const client = await this.clientsService.findOrCreateFromTelegram(ctx.from);
    if (client.isRegistered) {
      await ctx.replyWithHTML(
        `✅ <b>You are already registered as a client!</b>\n\n` +
        `• <b>Name:</b> ${client.fullName ?? client.firstName}\n` +
        `• <b>Phone:</b> ${client.phone ?? 'Not set'}\n` +
        `• <b>Role:</b> ${client.role}`,
      );
      await this.onServices(ctx);
      return;
    }

    // Begin registration: step 1 is asking for full name
    await this.clientsService.setRegistrationStep(client.telegramId, 'awaiting_name');

    await ctx.replyWithHTML(
      '📝 <b>Client Registration</b>\n\nPlease enter your <b>Full Name</b> to begin (or send /cancel to abort):',
      this.botService.getRemoveKeyboard(),
    );
  }

  @Command('cancel')
  @Hears('❌ Cancel Registration')
  async onCancel(@Ctx() ctx: BotContext) {
    if (!ctx.from) return;

    await this.clientsService.cancelRegistration(ctx.from.id);
    await this.counselingService.clearDraft(ctx.from.id);

    const client = await this.clientsService.findByTelegramId(ctx.from.id);
    await ctx.replyWithHTML(
      '❌ <b>Action cancelled.</b>',
      this.botService.getBottomPersistentKeyboard(client?.isRegistered ?? false),
    );
  }

  @On('contact')
  async onContact(@Ctx() ctx: BotContext) {
    if (!ctx.from || !ctx.message || !('contact' in ctx.message)) return;

    const client = await this.clientsService.findByTelegramId(ctx.from.id);
    if (!client) return;

    const phone = ctx.message.contact.phone_number;

    if (client.registrationStep === 'ih_awaiting_phone') {
      await this.clientsService.completeRegistration(client.telegramId, phone);
      await this.clientsService.setRegistrationStep(client.telegramId, 'ih_awaiting_issue');

      await ctx.replyWithHTML(
        '🕊️ <b>Inner Healing</b>\n\n' +
        'Please describe what you would like prayer and inner healing for.\n' +
        '<i>(Optional — reply with a message or tap Skip below):</i>',
        Markup.inlineKeyboard([
          [Markup.button.callback('⏩ Skip (General Prayer)', 'ih_skip_issue')],
        ]),
      );
      return;
    }

    // Complete registration with role = 'client'
    const updated = await this.clientsService.completeRegistration(client.telegramId, phone);

    await ctx.replyWithHTML(
      '🎉 <b>Registration Complete!</b>\n\n' +
      `Welcome to Purity Matters, <b>${updated?.fullName ?? client.firstName ?? 'Friend'}</b>!\n\n` +
      `You can now access our services anytime using the menu below.`,
      this.botService.getBottomPersistentKeyboard(true),
    );
  }

  // ==========================================
  // A. COUNSELLING FLOW
  // ==========================================
  @Action('srv_counselling')
  @Hears(['🛋️ Counselling Request', '🛋️ A. Counselling', '🛋️ Counselling'])
  async onSrvCounselling(@Ctx() ctx: BotContext) {
    if (!ctx.from) return;
    if (ctx.callbackQuery) {
      await ctx.answerCbQuery();
    }

    const client = await this.clientsService.findByTelegramId(ctx.from.id);
    if (!client?.isRegistered) {
      await ctx.replyWithHTML('⚠️ Please complete your client registration first before booking a session.');
      await this.onRegister(ctx);
      return;
    }

    await ctx.replyWithHTML(
      '🛋️ <b>Counselling Request (Step 1/4)</b>\n\n' +
      'Confidential 1-on-1 biblical and emotional counselling.\n' +
      'Please select your primary area of concern:',
      this.botService.getCounselingConcernKeyboard(),
    );
  }

  @Action(/^csl_concern_(personal|relationship|family|purity|emotional)$/)
  async onCslConcern(@Ctx() ctx: BotContext) {
    if (!ctx.from) return;
    await ctx.answerCbQuery();

    const match = (ctx as any).match[1];
    const concernLabels: Record<string, string> = {
      personal: 'Personal Concern',
      relationship: 'Relationship Concern',
      family: 'Family Concern',
      purity: 'Purity & Mindset Concern',
      emotional: 'Emotional Concern',
    };

    const concern = concernLabels[match] ?? match;
    await this.counselingService.updateDraft(ctx.from.id, { concern });
    await this.clientsService.setRegistrationStep(ctx.from.id, 'csl_awaiting_description');

    await ctx.replyWithHTML(
      `Selected Concern: <b>${concern}</b>\n\n` +
      '📝 <b>Step 2/4: Brief Description</b>\n\n' +
      'Please provide a brief description of what you are experiencing (or tap Skip if you prefer to share during the appointment):',
      this.botService.getCounselingDescriptionSkipKeyboard(),
    );
  }

  @Action('csl_skip_desc')
  async onCslSkipDesc(@Ctx() ctx: BotContext) {
    if (!ctx.from) return;
    await ctx.answerCbQuery();

    await this.counselingService.updateDraft(ctx.from.id, { description: 'Skipped by client' });
    await this.clientsService.setRegistrationStep(ctx.from.id, null);

    await ctx.replyWithHTML(
      '📞 <b>Step 3/3: Preferred Method</b>\n\nPlease select your preferred session format:',
      this.botService.getCounselingMethodKeyboard(),
    );
  }

  @Action(/^csl_method_(telegram|phone|video|in_person)$/)
  async onCslMethod(@Ctx() ctx: BotContext) {
    if (!ctx.from) return;
    await ctx.answerCbQuery();

    const match = (ctx as any).match[1];
    const methodLabels: Record<string, string> = {
      telegram: 'Telegram Chat / Audio',
      phone: 'Direct Phone Call',
      video: 'Secure Video Call',
      in_person: 'In-Person (if available)',
    };

    const method = methodLabels[match] ?? match;
    await this.counselingService.updateDraft(ctx.from.id, { preferredMethod: method });

    const draft = await this.counselingService.getDraft(ctx.from.id);

    await ctx.replyWithHTML(
      '📋 <b>Review Your Counselling Request:</b>\n\n' +
      `• <b>Concern:</b> ${draft.concern}\n` +
      `• <b>Description:</b> ${draft.description || 'Skipped'}\n` +
      `• <b>Preferred Method:</b> ${draft.preferredMethod}\n\n` +
      'Please review and submit your request below:',
      this.botService.getCounselingConfirmKeyboard(),
    );
  }

  @Action(/^csl_time_(next|morning|afternoon|evening)$/)
  async onCslTime(@Ctx() ctx: BotContext) {
    if (!ctx.from) return;
    await ctx.answerCbQuery();

    const match = (ctx as any).match[1];
    const timeLabels: Record<string, string> = {
      next: 'Next Available Appointment',
      morning: 'Morning (9:00 AM - 12:00 PM)',
      afternoon: 'Afternoon (1:00 PM - 5:00 PM)',
      evening: 'Evening (6:00 PM - 9:00 PM)',
    };

    const time = timeLabels[match] ?? match;
    await this.counselingService.updateDraft(ctx.from.id, { preferredTime: time });

    const draft = await this.counselingService.getDraft(ctx.from.id);

    await ctx.replyWithHTML(
      '📋 <b>Review Your Counselling Request:</b>\n\n' +
      `• <b>Concern:</b> ${draft.concern}\n` +
      `• <b>Description:</b> ${draft.description || 'Skipped'}\n` +
      `• <b>Preferred Method:</b> ${draft.preferredMethod}\n` +
      `• <b>Preferred Time:</b> ${draft.preferredTime}\n\n` +
      'Please review and submit your request below:',
      this.botService.getCounselingConfirmKeyboard(),
    );
  }

  @Action('csl_submit')
  async onCslSubmit(@Ctx() ctx: BotContext) {
    if (!ctx.from) return;
    await ctx.answerCbQuery();

    const request = await this.counselingService.createRequest(ctx.from.id);
    if (!request) {
      await ctx.replyWithHTML('⚠️ Could not complete request. Please try again from the Services menu.');
      await this.onServices(ctx);
      return;
    }

    await ctx.replyWithHTML(
      '✅ <b>Counselling Request Submitted Successfully!</b>\n\n' +
      `• <b>Reference Number:</b> <code>${request.referenceNumber}</code>\n` +
      `• <b>Status:</b> ⏳ PENDING ASSIGNMENT\n` +
      `• <b>Concern:</b> ${request.concern}\n` +
      `• <b>Method:</b> ${request.preferredMethod}\n\n` +
      'Our team has received your request and will assign a counsellor shortly. ' +
      'You will receive direct notifications here when your appointment is scheduled!',
      this.botService.getBottomPersistentKeyboard(),
    );
  }

  // ==========================================
  // B. INNER HEALING FLOW
  // ==========================================
  @Action('srv_inner_healing')
  @Hears(['🕊️ Inner Healing', '🕊️ B. Inner Healing', 'Inner Healing', '/inner_healing'])
  async onSrvInnerHealing(@Ctx() ctx: BotContext) {
    if (!ctx.from) return;
    if (ctx.callbackQuery) {
      await ctx.answerCbQuery();
    }

    const client = await this.clientsService.findOrCreateFromTelegram(ctx.from);

    // If client is not yet registered, start registration
    if (!client.isRegistered) {
      if (!client.fullName || client.fullName.length < 2) {
        await this.clientsService.setRegistrationStep(ctx.from.id, 'ih_awaiting_name');
        await ctx.replyWithHTML(
          '🕊️ <b>Inner Healing Registration</b>\n\n' +
          'Welcome! To begin, please enter your full name:',
        );
        return;
      }

      if (!client.phone) {
        await this.clientsService.setRegistrationStep(ctx.from.id, 'ih_awaiting_phone');
        await ctx.replyWithHTML(
          `Thank you, <b>${client.fullName}</b>!\n\n` +
          'Please share your phone number using the button below (or type it):',
          this.botService.getPhoneShareKeyboard(),
        );
        return;
      }

      await this.clientsService.completeRegistration(client.telegramId, client.phone);
    }

    // Client is registered: prompt for optional issue description
    await this.clientsService.setRegistrationStep(ctx.from.id, 'ih_awaiting_issue');
    await ctx.replyWithHTML(
      '🕊️ <b>Inner Healing</b>\n\n' +
      'Please describe what you would like prayer and inner healing for.\n' +
      '<i>(Optional — type your response or tap Skip below):</i>',
      Markup.inlineKeyboard([
        [Markup.button.callback('⏩ Skip (General Prayer)', 'ih_skip_issue')],
      ]),
    );
  }

  @Action('ih_skip_issue')
  async onIhSkipIssue(@Ctx() ctx: BotContext) {
    if (!ctx.from) return;
    await ctx.answerCbQuery();

    await this.clientsService.setRegistrationStep(ctx.from.id, null);
    const request = await this.innerHealingService.createRequest(ctx.from.id, 'General Inner Healing');

    await ctx.replyWithHTML(
      '✅ <b>Inner Healing Request Received!</b>\n\n' +
      `• <b>Reference Code:</b> <code>${request?.referenceNumber ?? 'IH-CONFIRMED'}</code>\n` +
      `• <b>Focus Area:</b> General Inner Healing\n\n` +
      'Our ministry team has received your request and will communicate with you shortly regarding your session schedule.\n\n' +
      'Our team is praying with you!',
      this.botService.getBottomPersistentKeyboard(true),
    );
  }

  @Action(/^ih_topic_(rejection|abandonment|forgiveness|shame|identity|wounds)$/)
  async onIhTopic(@Ctx() ctx: BotContext) {
    if (!ctx.from) return;
    await ctx.answerCbQuery();

    const match = (ctx as any).match[1];
    const topicLabels: Record<string, string> = {
      rejection: 'Rejection & Healing from Hurt',
      abandonment: 'Abandonment & Fear of Loneliness',
      forgiveness: 'Forgiveness & Releasing Bitterness',
      shame: 'Shame & Guilt Removal',
      identity: 'Identity & God-given Worth',
      wounds: 'Emotional Wounds & Heart Restoration',
    };

    const topic = topicLabels[match] ?? match;
    const request = await this.innerHealingService.createRequest(ctx.from.id, topic);

    await ctx.replyWithHTML(
      '🕊️ <b>Inner Healing Request Received</b>\n\n' +
      `• <b>Topic:</b> ${topic}\n` +
      `• <b>Reference Code:</b> <code>${request?.referenceNumber ?? 'IH-CONFIRMED'}</code>\n\n` +
      '📌 <b>You will be communicated shortly regarding your session schedule and preparation instructions.</b>\n\n' +
      'Our team is praying with you.',
      this.botService.getBottomPersistentKeyboard(true),
    );
  }

  // ==========================================
  // C. TRAINING & COURSES FLOW
  // ==========================================
  @Action('srv_courses')
  @Hears(['📚 Training & Courses', '📚 C. Training & Courses', '📚 Courses'])
  async onSrvCourses(@Ctx() ctx: BotContext) {
    if (!ctx.from) return;
    if (ctx.callbackQuery) {
      await ctx.answerCbQuery();
    }

    const courses = this.coursesService.getCourses();
    await ctx.replyWithHTML(
      '📚 <b>Training & Transformation Journeys</b>\n\n' +
      'Choose a journey below to start reading daily lessons, identify personal triggers, and track progress:',
      this.botService.getCoursesListKeyboard(courses),
    );
  }

  @Action(/^crs_view_(.+)$/)
  async onCrsView(@Ctx() ctx: BotContext) {
    if (!ctx.from) return;
    await ctx.answerCbQuery();

    const courseId = (ctx as any).match[1];
    const course = this.coursesService.getCourse(courseId);
    if (!course) {
      await ctx.replyWithHTML('⚠️ Course not found.');
      return;
    }

    const progress = await this.coursesService.getProgress(ctx.from.id, courseId);
    const day = progress.currentDay;
    const lesson = course.lessons[day] ?? course.lessons[1];

    let message =
      `📖 <b>${course.title}</b>\n\n` +
      `🗓️ <b>Day ${lesson.day}: ${lesson.title}</b>\n\n` +
      `📜 <b>Scripture:</b> ${lesson.scripture}\n\n` +
      `💡 <b>Lesson:</b> ${lesson.teaching}\n\n` +
      `🎯 <b>Reflection & Triggers:</b> ${lesson.reflectionQuestion}\n\n` +
      `⚡ <b>Practical Action:</b> ${lesson.practicalAction}\n\n` +
      `📊 <b>Progress:</b> Day ${progress.currentDay} of ${progress.totalDays} (${progress.completedDays.length} days completed)`;

    if (progress.accountabilityRequested) {
      message += `\n🤝 <b>Accountability Partner:</b> Assigned/Active`;
    }

    await ctx.replyWithHTML(
      message,
      this.botService.getCourseLessonKeyboard(courseId, lesson.day, course.durationDays),
    );
  }

  @Action(/^crs_complete_(.+)_(.+)$/)
  async onCrsComplete(@Ctx() ctx: BotContext) {
    if (!ctx.from) return;
    await ctx.answerCbQuery();

    const courseId = (ctx as any).match[1];
    const day = parseInt((ctx as any).match[2], 10);

    const progress = await this.coursesService.markDayComplete(ctx.from.id, courseId, day);
    await ctx.replyWithHTML(
      `🎉 <b>Congratulations! You have completed Day ${day}!</b>\n\n` +
      `Total Days Completed: ${progress.completedDays.length}/${progress.totalDays}.\n` +
      'Keep up the dedication to your spiritual and mental growth!',
    );

    // Refresh course view
    (ctx as any).match = [null, courseId];
    await this.onCrsView(ctx);
  }

  @Action(/^crs_acc_(.+)$/)
  async onCrsAcc(@Ctx() ctx: BotContext) {
    if (!ctx.from) return;
    await ctx.answerCbQuery();

    const courseId = (ctx as any).match[1];
    await this.coursesService.requestAccountability(ctx.from.id, courseId);

    await ctx.replyWithHTML(
      '🤝 <b>Accountability Request Logged!</b>\n\n' +
      'An accountability leader has been notified and will connect with you to encourage and support your journey.',
    );
  }

  // ==========================================
  // D. RESOURCES & E-BOOKS FLOW (Telebirr & CBE)
  // ==========================================
  @Action('srv_resources')
  @Hears(['📖 Resource Request', '📖 D. Resources & E-Books', '📖 Resources', '/resources'])
  async onSrvResources(@Ctx() ctx: BotContext) {
    if (!ctx.from) return;
    if (ctx.callbackQuery) {
      await ctx.answerCbQuery();
    }

    await ctx.replyWithHTML(
      '📖 <b>Ministry Resources</b>\n\n' +
        'Please select an option below:',
      this.botService.getResourceFormatsKeyboard(),
    );
  }

  @Action('res_cat_ebook')
  async onResCatEbook(@Ctx() ctx: BotContext) {
    if (!ctx.from) return;
    await ctx.answerCbQuery();

    const dbResources = await this.resourcesService.findAllResources({ type: 'ebook' });
    const ebooks = dbResources.length > 0 ? dbResources : this.resourcesService.getCatalog().filter((i) => i.category !== 'devotional');

    await ctx.replyWithHTML(
      '📱 <b>Available Digital E-Books & Guides</b>\n\n' +
        'Select a publication below to view details and download or purchase:',
      this.botService.getResourceCategoryKeyboard(ebooks, 'ebook'),
    );
  }

  @Action('res_cat_physical')
  async onResCatPhysical(@Ctx() ctx: BotContext) {
    if (!ctx.from) return;
    await ctx.answerCbQuery();

    const dbResources = await this.resourcesService.findAllResources({ type: 'physical_book' });
    const physical = dbResources.length > 0 ? dbResources : this.resourcesService.getCatalog().filter((i) => (i as any).type === 'physical_book');

    if (physical.length === 0) {
      await ctx.replyWithHTML(
        '📦 <b>Physical Print Publications</b>\n\n' +
          'No physical paperback books are currently in stock. Please browse our digital e-books for instant access.',
        Markup.inlineKeyboard([
          [Markup.button.callback('📱 Browse Digital E-Books', 'res_cat_ebook')],
          [Markup.button.callback('🔙 Back to Formats', 'srv_resources')],
        ]),
      );
      return;
    }

    await ctx.replyWithHTML(
      '📦 <b>Available Physical Books & Devotionals</b>\n\n' +
        'Select a publication below to view details and place an order:',
      this.botService.getResourceCategoryKeyboard(physical, 'physical_book'),
    );
  }

  @Action(/^res_view_(.+)$/)
  async onResView(@Ctx() ctx: BotContext) {
    if (!ctx.from) return;
    await ctx.answerCbQuery();

    const rawId = (ctx as any).match[1];
    let item: any = null;

    if (!isNaN(Number(rawId))) {
      item = await this.resourcesService.findResourceById(Number(rawId));
    }
    if (!item) {
      item = this.resourcesService.getResource(rawId);
    }
    if (!item) {
      await ctx.replyWithHTML('⚠️ Resource not found or no longer active.');
      return;
    }

    const isPaid = item.pricingType ? item.pricingType === 'paid' && Number(item.price) > 0 : (!!item.isPaid && Number(item.price) > 0);
    const isFree = !isPaid;
    const catType = item.type === 'physical_book' ? 'physical' : 'ebook';

    // 1. Check if user already has an active order (pending or payment_submitted) for this resource
    const activeOrder = await this.resourcesService.findActiveOrderByUserAndResource(
      ctx.from.id,
      item.id,
    );

    if (activeOrder && activeOrder.paymentStatus === 'payment_submitted') {
      const providerName =
        activeOrder.paymentMethod === 'cbe'
          ? 'Commercial Bank of Ethiopia (CBE)'
          : 'Telebirr';

      const pendingMsg =
        `📖 <b>${item.title}</b>\n\n` +
        `• <b>Author:</b> ${item.author || 'Purity Matters Ministry'}\n` +
        `• <b>Order Number:</b> <code>${activeOrder.orderNumber}</code>\n` +
        `• <b>Amount:</b> <b>${activeOrder.amount} ${activeOrder.currency || 'ETB'}</b>\n` +
        `• <b>Payment Method:</b> <b>${providerName}</b>\n` +
        `• <b>Status:</b> ⏳ <b>Payment Awaiting Verification</b>\n\n` +
        `We have received your payment confirmation. Our ministry administration team is currently verifying the transfer.\n\n` +
        (item.type === 'physical_book'
          ? `📦 <b>As soon as verified on our admin console, our courier team will contact you for delivery!</b>`
          : `📥 <b>As soon as verified on our admin console, your e-book will be automatically delivered directly to you right here in this chat!</b>`);

      await ctx.replyWithHTML(
        pendingMsg,
        Markup.inlineKeyboard([
          [Markup.button.callback('🔄 Refresh Status', `res_view_${item.id}`)],
          [Markup.button.callback('🔙 Back to List', `res_cat_${catType}`)],
          [Markup.button.callback('🏠 Main Menu', 'cmd_main_menu')],
        ]),
      );
      return;
    }

    if (activeOrder && activeOrder.paymentStatus === 'pending') {
      const accounts = await this.paymentSettingsService.getFormattedAccounts();
      const paymentMsg = this.botService.getPaymentInstructionsMessage(
        item.title,
        activeOrder.amount || item.price,
        activeOrder.currency || item.currency || 'ETB',
        activeOrder.orderNumber,
        accounts,
        item.description,
        item.author,
      );

      await ctx.replyWithHTML(
        paymentMsg,
        this.botService.getPaidResourceActionKeyboard(activeOrder.id, catType),
      );
      return;
    }

    // 2. Resource is FREE
    if (isFree) {
      if (item.type === 'physical_book') {
        const message =
          `📦 <b>${item.title}</b>\n\n` +
          `• <b>Author:</b> ${item.author || 'Purity Matters Ministry'}\n` +
          `• <b>Status:</b> ✅ Free Print Ministry Resource\n\n` +
          `📝 <b>Overview:</b>\n${item.description || 'Ministry physical publication.'}\n\n` +
          `📦 <i>Our fulfillment team manages courier delivery dispatch for this publication.</i>`;

        await ctx.replyWithHTML(
          message,
          Markup.inlineKeyboard([
            [Markup.button.callback('🔙 Back to Physical Books', 'res_cat_physical')],
            [Markup.button.callback('🏠 Main Menu', 'cmd_main_menu')],
          ]),
        );
        return;
      }

      // Digital E-Book (Free)
      const message =
        `📖 <b>${item.title}</b>\n\n` +
        `• <b>Author:</b> ${item.author || 'Purity Matters Ministry'}\n` +
        `• <b>Access:</b> ✅ Available for Immediate Download (FREE)\n\n` +
        `📝 <b>Overview:</b>\n${item.description || 'Spiritual purity resource.'}`;

      await ctx.replyWithHTML(
        message,
        this.botService.getResourceFreeKeyboard(item.id, catType, '📥 Download Free E-Book'),
      );
      return;
    }

    // 3. Resource is PAID: proceed with normal buying process even if previously purchased.
    // Previous verified purchases and downloads remain accessible under "My Orders & Purchases".
    const client = await this.clientsService.findByTelegramId(ctx.from.id);
    const order = await this.resourcesService.createResourceOrder({
      resourceId: item.id,
      telegramId: ctx.from.id,
      clientName: client?.fullName || ctx.from.first_name || 'Client',
      username: ctx.from.username,
      phone: client?.phone || undefined,
    });

    const accounts = await this.paymentSettingsService.getFormattedAccounts();

    const paymentMsg = this.botService.getPaymentInstructionsMessage(
      item.title,
      item.price,
      item.currency || 'ETB',
      order.orderNumber,
      accounts,
      item.description,
      item.author,
    );

    await ctx.replyWithHTML(
      paymentMsg,
      this.botService.getPaidResourceActionKeyboard(order.id, catType),
    );
  }

  @Action(/^res_dl_(.+)$/)
  async onResDl(@Ctx() ctx: BotContext) {
    if (!ctx.from) return;
    await ctx.answerCbQuery();

    const rawId = (ctx as any).match[1];
    let item: any = null;

    if (!isNaN(Number(rawId))) {
      item = await this.resourcesService.findResourceById(Number(rawId));
    }
    if (!item) {
      item = this.resourcesService.getResource(rawId);
    }
    if (!item) {
      await ctx.replyWithHTML('⚠️ Resource not found.');
      return;
    }

    const isPaid = item.pricingType ? item.pricingType === 'paid' && Number(item.price) > 0 : (!!item.isPaid && Number(item.price) > 0);
    const isFree = !isPaid;
    const hasAccess = isFree || (await this.resourcesService.hasAccess(ctx.from.id, String(item.id)));

    if (!hasAccess) {
      await ctx.replyWithHTML('🔒 Purchase is required to download this resource.');
      return this.onResView(ctx);
    }

    if (item.type === 'physical_book') {
      await ctx.replyWithHTML('📦 This is a physical paperback book delivered by courier. Our team is managing fulfillment.');
      return;
    }

    await ctx.replyWithHTML('⏳ <i>Sending document to your chat...</i>');
    try {
      const fullDiskPath = resolveUploadDiskPath(
        item.filePath,
        item.fileName || `${(item.title || 'resource').replace(/[^a-zA-Z0-9_-]/g, '_')}.pdf`,
      );
      await this.botService.sendDocumentToUser(
        ctx.from.id,
        fullDiskPath,
        item.fileName || `${item.title}.pdf`,
        `📖 <b>${item.title}</b>\nGod bless your journey to purity!`,
      );
    } catch (err: any) {
      this.logger.error(`Error sending document to ${ctx.from.id}: ${err?.message}`, err);
      await ctx.replyWithHTML(
        '⚠️ Could not send document directly. Please contact our support team or check back shortly.',
      );
    }
  }

  @Action(/^res_reorder_(.+)$/)
  async onResReorder(@Ctx() ctx: BotContext) {
    if (!ctx.from) return;
    await ctx.answerCbQuery();

    const rawId = (ctx as any).match[1];
    let item: any = null;

    if (!isNaN(Number(rawId))) {
      item = await this.resourcesService.findResourceById(Number(rawId));
    }
    if (!item) {
      item = this.resourcesService.getResource(rawId);
    }
    if (!item) {
      await ctx.replyWithHTML('⚠️ Resource not found or no longer active.');
      return;
    }

    const catType = item.type === 'physical_book' ? 'physical' : 'ebook';

    // Check if user already has an active order waiting for verification
    const activeOrder = await this.resourcesService.findActiveOrderByUserAndResource(
      ctx.from.id,
      item.id,
    );

    if (activeOrder && activeOrder.paymentStatus === 'payment_submitted') {
      await ctx.replyWithHTML(
        `⏳ <b>Order Already Pending Verification</b>\n\n` +
          `You already have an order (<code>${activeOrder.orderNumber}</code>) for <b>${item.title}</b> currently awaiting verification by our administration team.\n\n` +
          `As soon as our team confirms it, you will receive your resource and can place further orders if desired.`,
        Markup.inlineKeyboard([
          [Markup.button.callback('🔄 Refresh Status', `res_view_${item.id}`)],
          [Markup.button.callback('🔙 Back to List', `res_cat_${catType}`)],
          [Markup.button.callback('🏠 Main Menu', 'cmd_main_menu')],
        ]),
      );
      return;
    }

    // Always create a brand-new separate order when reordering another copy!
    const client = await this.clientsService.findByTelegramId(ctx.from.id);
    const order = await this.resourcesService.createResourceOrder({
      resourceId: item.id,
      telegramId: ctx.from.id,
      clientName: client?.fullName || ctx.from.first_name || 'Client',
      username: ctx.from.username,
      phone: client?.phone || undefined,
    });

    const accounts = await this.paymentSettingsService.getFormattedAccounts();

    const headerNotice =
      item.type === 'physical_book'
        ? `📦 <b>Ordering Another Physical Copy</b>\n\n`
        : `🛍️ <b>Ordering Another Copy / Gift</b>\n\n`;

    const paymentMsg =
      headerNotice +
      `A new separate order has been generated for you (Order: <code>${order.orderNumber}</code>).\n\n` +
      this.botService.getPaymentInstructionsMessage(
        item.title,
        order.amount || item.price,
        order.currency || item.currency || 'ETB',
        order.orderNumber,
        accounts,
        item.description,
        item.author,
      );

    await ctx.replyWithHTML(
      paymentMsg,
      this.botService.getPaidResourceActionKeyboard(order.id, catType),
    );
  }

  @Action(/^res_buy_(.+)$/)
  async onResBuy(@Ctx() ctx: BotContext) {
    return this.onResReorder(ctx);
  }

  @Action(/^pay_confirm_(\d+)_(telebirr|cbe)$/)
  async onPayConfirm(@Ctx() ctx: BotContext) {
    if (!ctx.from) return;
    await ctx.answerCbQuery();

    const orderId = parseInt((ctx as any).match[1], 10);
    const method = (ctx as any).match[2];

    const order = await this.resourcesService.submitOrderPayment(orderId, method);
    if (!order) {
      await ctx.replyWithHTML('⚠️ Could not locate order record.');
      return;
    }

    const providerName = method === 'telebirr' ? 'Telebirr' : 'Commercial Bank of Ethiopia (CBE)';

    await ctx.replyWithHTML(
      `⏳ <b>Payment Confirmation Received!</b>\n\n` +
        `Order Number: <code>${order.orderNumber}</code>\n` +
        `Resource: <b>${order.resourceTitle}</b>\n` +
        `Payment Method: <b>${providerName}</b>\n\n` +
        `<b>Please wait while our administration team verifies your payment.</b>\n\n` +
        `📥 <b>As soon as confirmed on our admin console, your resource will be automatically delivered directly to you right here in this chat!</b>`,
      Markup.inlineKeyboard([
        [Markup.button.callback('🔄 Refresh Status', `res_view_${order.resourceId}`)],
        [Markup.button.callback('📖 Browse Other Resources', 'srv_resources')],
        [Markup.button.callback('🏠 Main Menu', 'cmd_main_menu')],
      ]),
    );
  }

  @Action(/^pay_cancel_(\d+)$/)
  async onPayCancel(@Ctx() ctx: BotContext) {
    if (!ctx.from) return;
    await ctx.answerCbQuery();

    const orderId = parseInt((ctx as any).match[1], 10);
    await this.resourcesService.rejectOrderPayment(orderId, 'Cancelled by user');

    await ctx.replyWithHTML(
      '❌ <b>Order Cancelled</b>\n\nYou can browse our resources anytime using the button below:',
      Markup.inlineKeyboard([
        [Markup.button.callback('📖 Browse Resources', 'srv_resources')],
        [Markup.button.callback('🏠 Main Menu', 'cmd_main_menu')],
      ]),
    );
  }

  @Action(['res_my_purchases', 'res_my_orders'])
  @Command(['orders', 'myorders'])
  async onResPurchases(@Ctx() ctx: BotContext) {
    if (!ctx.from) return;
    if (ctx.callbackQuery) {
      await ctx.answerCbQuery();
    }

    const [purchases, orders] = await Promise.all([
      this.resourcesService.getMyPurchases(ctx.from.id),
      this.resourcesService.findOrdersByTelegramId(ctx.from.id),
    ]);

    if (purchases.length === 0 && orders.length === 0) {
      await ctx.replyWithHTML(
        '📦 <b>My Orders & Purchases</b>\n\n' +
          'You have no orders or purchased materials yet.\n' +
          'Browse our catalog to explore available books and e-books.',
        Markup.inlineKeyboard([
          [Markup.button.callback('📱 Browse Digital E-Books', 'res_cat_ebook')],
          [Markup.button.callback('📦 Browse Physical Books', 'res_cat_physical')],
          [Markup.button.callback('🔙 Back to Catalog', 'srv_resources')],
          [Markup.button.callback('🔙 Return to Services', 'cmd_services')],
        ]),
      );
      return;
    }

    const buttons: any[] = [];
    let msg = '📦 <b>My Orders & Purchases</b>\n\n';

    if (purchases.length > 0) {
      msg += '📖 <b>Verified Digital E-Books:</b>\n';
      for (const p of purchases) {
        msg += `• <b>${p.resourceTitle}</b>\n  Status: ✅ Verified & Available for Download\n\n`;
        buttons.push([
          Markup.button.callback(
            `📥 Download: ${p.resourceTitle}`,
            `res_dl_${p.resourceId}`,
          ),
        ]);
      }
    }

    const physicalOrders = orders.filter((o) => o.resourceType === 'physical_book');
    if (physicalOrders.length > 0) {
      msg += '📦 <b>Physical Book Orders:</b>\n';
      for (const po of physicalOrders) {
        const payStatus =
          po.paymentStatus === 'verified'
            ? '✅ Paid & Verified'
            : po.paymentStatus === 'payment_submitted'
              ? '⏳ Verification Pending'
              : '⏳ Awaiting Payment';
        const fulfill =
          po.fulfillmentStatus === 'delivered'
            ? '🚀 Delivered'
            : '📦 Courier Dispatch In Progress';
        msg +=
          `• <b>${po.resourceTitle}</b> (Order <code>${po.orderNumber}</code>)\n` +
          `  Payment: ${payStatus}\n` +
          `  Delivery: ${fulfill}\n\n`;
      }
    }

    buttons.push([Markup.button.callback('🔙 Back to Catalog', 'srv_resources')]);
    buttons.push([Markup.button.callback('🔙 Return to Services', 'cmd_services')]);

    await ctx.replyWithHTML(msg, Markup.inlineKeyboard(buttons));
  }

  // ==========================================
  // TEXT MESSAGE HANDLER
  // ==========================================
  @On('text')
  async onText(@Ctx() ctx: BotContext) {
    if (!ctx.from || !ctx.message || !('text' in ctx.message)) return;

    const text = ctx.message.text.trim();
    if (text.startsWith('/')) {
      return;
    }

    const client = await this.clientsService.findByTelegramId(ctx.from.id);
    if (!client) return;

    // Registration step 1: entering name
    if (client.registrationStep === 'awaiting_name') {
      if (text.length < 2) {
        await ctx.replyWithHTML('⚠️ Please enter a valid full name:');
        return;
      }

      await this.clientsService.saveNameAndPromptPhone(client.telegramId, text);

      await ctx.replyWithHTML(
        `Thank you, <b>${text}</b>!\n\nNow please share your phone number using the button below to complete registration:`,
        this.botService.getPhoneShareKeyboard(),
      );
      return;
    }

    // Inner Healing Registration: Name
    if (client.registrationStep === 'ih_awaiting_name') {
      if (text.length < 2) {
        await ctx.replyWithHTML('⚠️ Please enter a valid full name:');
        return;
      }

      await this.clientsService.saveNameAndPromptPhone(client.telegramId, text);
      await this.clientsService.setRegistrationStep(client.telegramId, 'ih_awaiting_phone');

      await ctx.replyWithHTML(
        `Thank you, <b>${text}</b>!\n\nPlease share your phone number using the button below (or type it):`,
        this.botService.getPhoneShareKeyboard(),
      );
      return;
    }

    // Registration step 2: prompt to use button
    if (client.registrationStep === 'awaiting_phone') {
      await ctx.replyWithHTML(
        '📱 Please click the "Share Phone Number" button below to share your verified phone number, or send /cancel to stop.',
        this.botService.getPhoneShareKeyboard(),
      );
      return;
    }

    // Inner Healing Registration: Phone typed as text
    if (client.registrationStep === 'ih_awaiting_phone') {
      const cleanPhone = text.replace(/[^0-9+]/g, '');
      if (cleanPhone.length >= 7) {
        await this.clientsService.completeRegistration(client.telegramId, cleanPhone);
        await this.clientsService.setRegistrationStep(client.telegramId, 'ih_awaiting_issue');

        await ctx.replyWithHTML(
          '🕊️ <b>Inner Healing</b>\n\n' +
          'Please describe what you would like prayer and inner healing for.\n' +
          '<i>(Optional — type your response or tap Skip below):</i>',
          Markup.inlineKeyboard([
            [Markup.button.callback('⏩ Skip (General Prayer)', 'ih_skip_issue')],
          ]),
        );
        return;
      }

      await ctx.replyWithHTML(
        '📱 Please click the "Share Phone Number" button below or type a valid phone number:',
        this.botService.getPhoneShareKeyboard(),
      );
      return;
    }

    // Inner Healing: Optional Issue description
    if (client.registrationStep === 'ih_awaiting_issue') {
      const issueText = text.trim();
      await this.clientsService.setRegistrationStep(client.telegramId, null);

      const request = await this.innerHealingService.createRequest(client.telegramId, issueText);

      await ctx.replyWithHTML(
        '✅ <b>Inner Healing Request Received!</b>\n\n' +
        `• <b>Reference Code:</b> <code>${request?.referenceNumber ?? 'IH-CONFIRMED'}</code>\n` +
        `• <b>Focus Area:</b> ${issueText}\n\n` +
        'Our ministry team has received your request and will communicate with you shortly regarding your session schedule.\n\n' +
        'Our team is praying with you!',
        this.botService.getBottomPersistentKeyboard(true),
      );
      return;
    }

    // Counselling description step
    if (client.registrationStep === 'csl_awaiting_description') {
      await this.counselingService.updateDraft(client.telegramId, { description: text });
      await this.clientsService.setRegistrationStep(client.telegramId, null);

      await ctx.replyWithHTML(
        'Description saved! 👍\n\n' +
        '📞 <b>Step 3/4: Preferred Method</b>\n\nPlease select your preferred session format:',
        this.botService.getCounselingMethodKeyboard(),
      );
      return;
    }

    // Donation custom amount input step
    if (client.registrationStep === 'don_awaiting_amount') {
      const cleanNum = text.replace(/[^0-9.]/g, '');
      const parsedAmount = parseFloat(cleanNum);
      if (isNaN(parsedAmount) || parsedAmount <= 0) {
        await ctx.replyWithHTML(
          '⚠️ <b>Invalid Amount:</b> Please enter a valid donation amount in ETB (e.g. <code>250</code> or <code>1000</code>):',
          Markup.inlineKeyboard([
            [Markup.button.callback('🔙 Back to Donations', 'cmd_donate')],
            [Markup.button.callback('🏠 Main Menu', 'cmd_main_menu')],
          ]),
        );
        return;
      }

      await this.clientsService.setRegistrationStep(client.telegramId, null);
      const accounts = await this.paymentSettingsService.getFormattedAccounts();
      const donation = await this.donationsService.create({
        telegramId: ctx.from.id,
        clientName: client.fullName || client.firstName || 'Friend',
        clientUsername: ctx.from.username,
        clientPhone: client.phone,
        amount: parsedAmount,
      });

      await ctx.replyWithHTML(
        this.botService.getDonationAccountInstructionsMessage(
          parsedAmount,
          donation.referenceNumber,
          accounts,
        ),
        this.botService.getDonationActionKeyboard(donation.id),
      );
      return;
    }

    // Check if user has an order awaiting payment reference and sent reference code/SMS
    const pendingOrders = await this.resourcesService.findAllResourceOrders({
      paymentStatus: 'payment_submitted',
    });
    const fromId = ctx.from.id;
    const awaitingRefOrder = pendingOrders.find(
      (o) => String(o.telegramId) === String(fromId) && !o.paymentReference,
    );

    if (awaitingRefOrder && text.length >= 3 && text.length <= 60) {
      await this.resourcesService.submitOrderPayment(
        awaitingRefOrder.id,
        awaitingRefOrder.paymentMethod,
        text,
      );
      await ctx.replyWithHTML(
        `👍 <b>Reference Code Recorded!</b>\n` +
          `Transaction code <code>${text}</code> attached to Order <code>${awaitingRefOrder.orderNumber}</code>.\n` +
          `Our pastoral team will review and deliver your e-book shortly!`,
      );
      return;
    }

    this.logger.debug(`Received message from ${ctx.from.id}: ${text}`);
  }

  // ==========================================
  // DONATIONS FLOW (Telebirr & CBE)
  // ==========================================
  @Command('donate')
  @Action('cmd_donate')
  @Hears(['💝 Donate', '🎁 Donate', 'Donate', '/donate'])
  async onDonate(@Ctx() ctx: BotContext) {
    if (!ctx.from) return;
    if (ctx.callbackQuery) {
      await ctx.answerCbQuery();
    }

    const accounts = await this.paymentSettingsService.getFormattedAccounts();

    await ctx.replyWithHTML(
      this.botService.getDonationAccountInstructionsMessage(null, null, accounts),
      this.botService.getDonationAmountsKeyboard(),
    );
  }

  @Action(/^don_amt_(\d+)$/)
  async onDonationPresetAmount(@Ctx() ctx: BotContext) {
    if (!ctx.from) return;
    await ctx.answerCbQuery();

    const amount = parseInt((ctx as any).match[1], 10);
    const client = await this.clientsService.findOrCreateFromTelegram(ctx.from);
    const accounts = await this.paymentSettingsService.getFormattedAccounts();

    const donation = await this.donationsService.create({
      telegramId: ctx.from.id,
      clientName: client.fullName || client.firstName || 'Friend',
      clientUsername: ctx.from.username,
      clientPhone: client.phone,
      amount,
    });

    await ctx.replyWithHTML(
      this.botService.getDonationAccountInstructionsMessage(
        amount,
        donation.referenceNumber,
        accounts,
      ),
      this.botService.getDonationActionKeyboard(donation.id),
    );
  }

  @Action('don_amt_custom')
  async onDonationCustomAmount(@Ctx() ctx: BotContext) {
    if (!ctx.from) return;
    await ctx.answerCbQuery();

    const client = await this.clientsService.findOrCreateFromTelegram(ctx.from);
    await this.clientsService.setRegistrationStep(client.telegramId, 'don_awaiting_amount');

    await ctx.replyWithHTML(
      '✏️ <b>Enter Donation Amount</b>\n\n' +
        'Please type the amount in ETB you wish to donate (e.g. <code>300</code> or <code>1500</code>):',
      Markup.inlineKeyboard([
        [Markup.button.callback('🔙 Back to Donations', 'cmd_donate')],
        [Markup.button.callback('🏠 Main Menu', 'cmd_main_menu')],
      ]),
    );
  }

  @Action(/^don_paid_(\d+)(?:_(telebirr|cbe|other))?$/)
  async onDonationPaid(@Ctx() ctx: BotContext) {
    if (!ctx.from) return;
    await ctx.answerCbQuery();

    const match = (ctx as any).match;
    const donationId = parseInt(match[1], 10);
    const method = match[2] || 'telebirr';

    const donation = await this.donationsService.markAsDonated(donationId, method);

    await ctx.replyWithHTML(
      '🙏 <b>Thank You for Your Generous Heart!</b>\n\n' +
        `Your gift of <b>${donation.amount} ${donation.currency}</b> has been received and submitted for verification.\n\n` +
        `• <b>Donation Reference:</b> <code>${donation.referenceNumber}</code>\n` +
        `• <b>Payment Method:</b> <b>${donation.paymentMethod.toUpperCase()}</b>\n` +
        `• <b>Status:</b> ⏳ <b>Pending Verification</b>\n\n` +
        `Our administration team will verify your transfer on our console shortly.\n\n` +
        `<i>"Each of you should give what you have decided in your heart to give, not reluctantly or under compulsion, for God loves a cheerful giver." — 2 Cor 9:7</i>`,
      Markup.inlineKeyboard([
        [Markup.button.callback('🔙 Return to Services', 'cmd_services')],
        [Markup.button.callback('🏠 Main Menu', 'cmd_main_menu')],
      ]),
    );
  }

  @Action(/^don_cancel_(\d+)$/)
  async onDonationCancel(@Ctx() ctx: BotContext) {
    if (!ctx.from) return;
    await ctx.answerCbQuery();

    const match = (ctx as any).match;
    const donationId = parseInt(match[1], 10);
    await this.donationsService.delete(donationId);

    await ctx.replyWithHTML(
      '❌ <b>Donation Cancelled</b>\n\nYou can donate anytime using the 💝 Donate button below.',
      this.botService.getBottomPersistentKeyboard(),
    );
  }
}
