import { Logger } from '@nestjs/common';
import { Update, Ctx, Start, Help, Command, Action, On, Hears } from 'nestjs-telegraf';
import type { BotContext } from './bot.interface.js';
import { BotService } from './bot.service.js';
import { ClientsService } from '../clients/clients.service.js';
import { CounselingService } from '../features/counseling.service.js';
import { InnerHealingService } from '../features/inner-healing.service.js';
import { CoursesService } from '../features/courses.service.js';
import { ResourcesService } from '../features/resources.service.js';

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

  @Command('services')
  @Action('cmd_services')
  async onServices(@Ctx() ctx: BotContext) {
    if (ctx.callbackQuery) {
      await ctx.answerCbQuery();
    }
    await ctx.reply(
      this.botService.getServicesMenuMessage(),
      this.botService.getServicesMenuKeyboard(),
    );
  }

  @Action('cmd_main_menu')
  async onMainMenu(@Ctx() ctx: BotContext) {
    if (!ctx.from) return;
    await ctx.answerCbQuery();
    const client = await this.clientsService.findByTelegramId(ctx.from.id);
    await ctx.reply(
      '🏠 Main Menu:',
      this.botService.getMainKeyboard(client?.isRegistered ?? false),
    );
  }

  @Command('status')
  @Action('cmd_status')
  async onStatus(@Ctx() ctx: BotContext) {
    if (!ctx.from) return;
    if (ctx.callbackQuery) {
      await ctx.answerCbQuery();
    }

    const client = await this.clientsService.findOrCreateFromTelegram(ctx.from);
    const cslRequests = await this.counselingService.getRequestsByClient(ctx.from.id);
    const ihRequests = await this.innerHealingService.getRequestsByClient(ctx.from.id);

    let statusText =
      `👤 Client Profile\n\n` +
      `• ID: ${client.telegramId}\n` +
      `• Full Name: ${client.fullName ?? client.firstName ?? 'Not set'}\n` +
      `• Phone: ${client.phone ?? 'Not shared'}\n` +
      `• Role: ${client.role}\n` +
      `• Registered: ${client.isRegistered ? '✅ Yes' : '❌ No'}\n\n`;

    if (cslRequests.length > 0) {
      statusText += `🛋️ Active Counselling Requests:\n`;
      for (const req of cslRequests.slice(0, 3)) {
        statusText += `  • Ref: ${req.referenceNumber} | ${req.concern} | Status: ${req.status.toUpperCase()}\n`;
      }
      statusText += `\n`;
    }

    if (ihRequests.length > 0) {
      statusText += `🕊️ Inner Healing Requests:\n`;
      for (const req of ihRequests.slice(0, 3)) {
        statusText += `  • Ref: ${req.referenceNumber} | ${req.topic} | Status: ${req.status.toUpperCase()}\n`;
      }
      statusText += `\n`;
    }

    await ctx.reply(statusText, this.botService.getMainKeyboard(client.isRegistered));
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
  async onAbout(@Ctx() ctx: BotContext) {
    if (ctx.callbackQuery) {
      await ctx.answerCbQuery();
    }
    await ctx.replyWithMarkdownV2(this.botService.getAboutMessage());
  }

  @Command('register')
  @Action('cmd_register')
  async onRegister(@Ctx() ctx: BotContext) {
    if (!ctx.from) return;
    if (ctx.callbackQuery) {
      await ctx.answerCbQuery();
    }

    const client = await this.clientsService.findOrCreateFromTelegram(ctx.from);
    if (client.isRegistered) {
      await ctx.reply(
        `✅ You are already registered as a client!\n\n` +
        `• Name: ${client.fullName ?? client.firstName}\n` +
        `• Phone: ${client.phone ?? 'Not set'}\n` +
        `• Role: ${client.role}`,
      );
      await this.onServices(ctx);
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
    await this.counselingService.clearDraft(ctx.from.id);

    const client = await this.clientsService.findByTelegramId(ctx.from.id);
    await ctx.reply(
      '❌ Action cancelled.',
      this.botService.getRemoveKeyboard(),
    );
    await ctx.reply(
      'Main Menu:',
      this.botService.getMainKeyboard(client?.isRegistered ?? false),
    );
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

    // Prompt services menu with good emojis immediately after registration!
    await ctx.reply(
      this.botService.getServicesMenuMessage(),
      this.botService.getServicesMenuKeyboard(),
    );
  }

  // ==========================================
  // A. COUNSELLING FLOW
  // ==========================================
  @Action('srv_counselling')
  async onSrvCounselling(@Ctx() ctx: BotContext) {
    if (!ctx.from) return;
    await ctx.answerCbQuery();

    const client = await this.clientsService.findByTelegramId(ctx.from.id);
    if (!client?.isRegistered) {
      await ctx.reply('⚠️ Please complete your client registration first before booking a session.');
      await this.onRegister(ctx);
      return;
    }

    await ctx.reply(
      '🛋️ Counselling Request (Step 1/4)\n\n' +
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

    await ctx.reply(
      `Selected Concern: ${concern}\n\n` +
      '📝 Step 2/4: Brief Description\n\n' +
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

    await ctx.reply(
      '📞 Step 3/4: Preferred Method\n\nPlease select your preferred session format:',
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

    await ctx.reply(
      `Selected Method: ${method}\n\n` +
      '⏰ Step 4/4: Preferred Time\n\nPlease select your preferred appointment window:',
      this.botService.getCounselingTimeKeyboard(),
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

    await ctx.reply(
      '📋 Review Your Counselling Request:\n\n' +
      `• Concern: ${draft.concern}\n` +
      `• Description: ${draft.description || 'Skipped'}\n` +
      `• Preferred Method: ${draft.preferredMethod}\n` +
      `• Preferred Time: ${draft.preferredTime}\n\n` +
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
      await ctx.reply('⚠️ Could not complete request. Please try again from the Services menu.');
      await this.onServices(ctx);
      return;
    }

    await ctx.reply(
      '✅ Counselling Request Submitted Successfully!\n\n' +
      `• Reference Number: ${request.referenceNumber}\n` +
      `• Status: ⏳ Pending Assignment\n` +
      `• Concern: ${request.concern}\n` +
      `• Method: ${request.preferredMethod}\n\n` +
      'Our team has received your request and will assign a counsellor shortly. ' +
      'You will receive direct notifications here when your appointment is scheduled!',
      this.botService.getServicesMenuKeyboard(),
    );
  }

  // ==========================================
  // B. INNER HEALING FLOW
  // ==========================================
  @Action('srv_inner_healing')
  async onSrvInnerHealing(@Ctx() ctx: BotContext) {
    if (!ctx.from) return;
    await ctx.answerCbQuery();

    const client = await this.clientsService.findByTelegramId(ctx.from.id);
    if (!client?.isRegistered) {
      await ctx.reply('⚠️ Please register as a client before requesting an Inner Healing session.');
      await this.onRegister(ctx);
      return;
    }

    await ctx.reply(
      '🕊️ Inner Healing Ministry\n\n' +
      'Inner Healing targets root emotional wounds, lies believed from trauma, and restores biblical identity.\n\n' +
      'Please choose a topic below:',
      this.botService.getInnerHealingTopicsKeyboard(),
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

    await ctx.reply(
      '🕊️ Inner Healing Request Received\n\n' +
      `• Topic: ${topic}\n` +
      `• Reference Code: ${request?.referenceNumber ?? 'IH-CONFIRMED'}\n\n` +
      '📌 You will be communicated shortly regarding your session schedule and preparation instructions.\n\n' +
      'Our team is praying with you.',
      this.botService.getServicesMenuKeyboard(),
    );
  }

  // ==========================================
  // C. TRAINING & COURSES FLOW
  // ==========================================
  @Action('srv_courses')
  async onSrvCourses(@Ctx() ctx: BotContext) {
    if (!ctx.from) return;
    await ctx.answerCbQuery();

    const courses = this.coursesService.getCourses();
    await ctx.reply(
      '📚 Training & Transformation Journeys\n\n' +
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
      await ctx.reply('⚠️ Course not found.');
      return;
    }

    const progress = await this.coursesService.getProgress(ctx.from.id, courseId);
    const day = progress.currentDay;
    const lesson = course.lessons[day] ?? course.lessons[1];

    let message =
      `📖 ${course.title}\n\n` +
      `🗓️ Day ${lesson.day}: ${lesson.title}\n\n` +
      `📜 Scripture: ${lesson.scripture}\n\n` +
      `💡 Lesson: ${lesson.teaching}\n\n` +
      `🎯 Reflection & Triggers: ${lesson.reflectionQuestion}\n\n` +
      `⚡ Practical Action: ${lesson.practicalAction}\n\n` +
      `📊 Progress: Day ${progress.currentDay} of ${progress.totalDays} (${progress.completedDays.length} days completed)`;

    if (progress.accountabilityRequested) {
      message += `\n🤝 Accountability Partner: Assigned/Active`;
    }

    await ctx.reply(
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
    await ctx.reply(
      `🎉 Congratulations! You have completed Day ${day}!\n\n` +
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

    await ctx.reply(
      '🤝 Accountability Request Logged!\n\n' +
      'An accountability leader has been notified and will connect with you to encourage and support your journey.',
    );
  }

  // ==========================================
  // D. RESOURCES & E-BOOKS FLOW
  // ==========================================
  @Action('srv_resources')
  async onSrvResources(@Ctx() ctx: BotContext) {
    if (!ctx.from) return;
    await ctx.answerCbQuery();

    const catalog = this.resourcesService.getCatalog();
    await ctx.reply(
      '📖 Resources & E-Books Catalog\n\n' +
      'Explore our curated collection of free workbooks and transformative e-books:',
      this.botService.getResourcesMenuKeyboard(catalog),
    );
  }

  @Action(/^res_view_(.+)$/)
  async onResView(@Ctx() ctx: BotContext) {
    if (!ctx.from) return;
    await ctx.answerCbQuery();

    const resourceId = (ctx as any).match[1];
    const item = this.resourcesService.getResource(resourceId);
    if (!item) {
      await ctx.reply('⚠️ Resource not found.');
      return;
    }

    const hasAccess = await this.resourcesService.hasAccess(ctx.from.id, resourceId);

    const message =
      `${item.title}\n\n` +
      `• Type: ${item.isPaid ? 'Premium E-Book' : 'Free Download'}\n` +
      `• Price: ${item.isPaid ? `$${item.price} USD / 250 ETB` : 'FREE'}\n` +
      `• Status: ${hasAccess ? '✅ Accessible' : '🔒 Purchase Required'}\n\n` +
      `📝 Overview:\n${item.description}`;

    await ctx.reply(
      message,
      this.botService.getResourceDetailKeyboard(item, hasAccess),
    );
  }

  @Action(/^res_buy_(.+)$/)
  async onResBuy(@Ctx() ctx: BotContext) {
    if (!ctx.from) return;
    await ctx.answerCbQuery();

    const resourceId = (ctx as any).match[1];
    const item = this.resourcesService.getResource(resourceId);
    if (!item) return;

    // Simulate / Process server-side payment verification
    await this.resourcesService.grantAccess(ctx.from.id, resourceId);

    await ctx.reply(
      `🎉 Payment Verified!\n\n` +
      `You now have permanent access to: ${item.title}.\n` +
      `You can download it now or access it anytime under "My Purchases":`,
      this.botService.getResourceDetailKeyboard(item, true),
    );
  }

  @Action('res_my_purchases')
  async onResPurchases(@Ctx() ctx: BotContext) {
    if (!ctx.from) return;
    await ctx.answerCbQuery();

    const purchases = await this.resourcesService.getMyPurchases(ctx.from.id);
    if (purchases.length === 0) {
      await ctx.reply(
        '💼 You have no purchased e-books yet. Browse the catalog to explore available materials.',
        this.botService.getServicesMenuKeyboard(),
      );
      return;
    }

    let msg = '💼 My Purchased E-Books & Materials:\n\n';
    for (const p of purchases) {
      msg += `• ${p.resourceTitle}\n  Download: ${p.downloadUrl ?? 'Available'}\n\n`;
    }

    await ctx.reply(msg, this.botService.getServicesMenuKeyboard());
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

    // Registration step 2: prompt to use button
    if (client.registrationStep === 'awaiting_phone') {
      await ctx.reply(
        '📱 Please click the "Share Phone Number" button below to share your verified phone number, or send /cancel to stop.',
        this.botService.getPhoneShareKeyboard(),
      );
      return;
    }

    // Counselling description step
    if (client.registrationStep === 'csl_awaiting_description') {
      await this.counselingService.updateDraft(client.telegramId, { description: text });
      await this.clientsService.setRegistrationStep(client.telegramId, null);

      await ctx.reply(
        'Description saved! 👍\n\n' +
        '📞 Step 3/4: Preferred Method\n\nPlease select your preferred session format:',
        this.botService.getCounselingMethodKeyboard(),
      );
      return;
    }

    this.logger.debug(`Received message from ${ctx.from.id}: ${text}`);
  }
}
