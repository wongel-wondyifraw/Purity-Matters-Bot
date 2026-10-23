import { Logger } from '@nestjs/common';
import { Update, Ctx, Start, Help, Command, Action, On, Hears } from 'nestjs-telegraf';
import { Markup } from 'telegraf';
import type { BotContext } from './bot.interface.js';
import { BotService } from './bot.service.js';
import { ClientsService } from '../clients/clients.service.js';
import { CounselingService } from '../features/counseling.service.js';
import { InnerHealingService } from '../features/inner-healing.service.js';
import { CoursesService } from '../features/courses.service.js';
import { ResourcesService } from '../features/resources.service.js';
import { PaymentSettingsService } from '../features/payment-settings.service.js';

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
  ) {}

  @Start()
  async onStart(@Ctx() ctx: BotContext) {
    if (!ctx.from) return;

    const client = await this.clientsService.findOrCreateFromTelegram(ctx.from);
    const message = this.botService.getWelcomeMessage(client);
    const stickyKeyboard = this.botService.getBottomPersistentKeyboard(client.isRegistered);

    await ctx.replyWithHTML(message, stickyKeyboard);

    if (client.isRegistered) {
      await ctx.replyWithHTML(
        this.botService.getServicesMenuMessage(),
        this.botService.getServicesMenuKeyboard(),
      );
    }
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
    await ctx.replyWithHTML(
      this.botService.getServicesMenuMessage(),
      this.botService.getServicesMenuKeyboard(),
    );
  }

  @Action('cmd_main_menu')
  async onMainMenu(@Ctx() ctx: BotContext) {
    if (!ctx.from) return;
    await ctx.answerCbQuery();
    const client = await this.clientsService.findByTelegramId(ctx.from.id);
    await ctx.replyWithHTML(
      '🏠 <b>Main Menu:</b>\n\nChoose an option from the bottom persistent keyboard or below:',
      this.botService.getBottomPersistentKeyboard(client?.isRegistered ?? false),
    );
  }

  @Command('status')
  @Action('cmd_status')
  @Hears(['👤 My Profile', '📋 My Status'])
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
  @Hears('ℹ️ About Us')
  async onAbout(@Ctx() ctx: BotContext) {
    if (ctx.callbackQuery) {
      await ctx.answerCbQuery();
    }
    await ctx.replyWithHTML(this.botService.getAboutMessage());
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

    // Complete registration with role = 'client'
    const updated = await this.clientsService.completeRegistration(client.telegramId, phone);

    await ctx.replyWithHTML(
      '🎉 <b>Registration Successful!</b>\n\n' +
      `Welcome to Purity Matters! You have been successfully registered as a client.\n\n` +
      `• <b>Name:</b> ${updated?.fullName ?? client.firstName ?? 'Client'}\n` +
      `• <b>Phone:</b> ${phone}\n` +
      `• <b>Role:</b> client\n\n` +
      `<i>You can now access all services using the sticky buttons at the bottom of your screen!</i>`,
      this.botService.getBottomPersistentKeyboard(true),
    );

    // Prompt services menu with good emojis immediately after registration!
    await ctx.replyWithHTML(
      this.botService.getServicesMenuMessage(),
      this.botService.getServicesMenuKeyboard(),
    );
  }

  // ==========================================
  // A. COUNSELLING FLOW
  // ==========================================
  @Action('srv_counselling')
  @Hears(['🛋️ A. Counselling', '🛋️ Counselling'])
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
      this.botService.getServicesMenuKeyboard(),
    );
  }

  // ==========================================
  // B. INNER HEALING FLOW
  // ==========================================
  @Action('srv_inner_healing')
  @Hears(['🕊️ B. Inner Healing', '🕊️ Inner Healing'])
  async onSrvInnerHealing(@Ctx() ctx: BotContext) {
    if (!ctx.from) return;
    if (ctx.callbackQuery) {
      await ctx.answerCbQuery();
    }

    const client = await this.clientsService.findByTelegramId(ctx.from.id);
    if (!client?.isRegistered) {
      await ctx.replyWithHTML('⚠️ Please register as a client before requesting an Inner Healing session.');
      await this.onRegister(ctx);
      return;
    }

    await ctx.replyWithHTML(
      '🕊️ <b>Inner Healing Ministry</b>\n\n' +
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

    await ctx.replyWithHTML(
      '🕊️ <b>Inner Healing Request Received</b>\n\n' +
      `• <b>Topic:</b> ${topic}\n` +
      `• <b>Reference Code:</b> <code>${request?.referenceNumber ?? 'IH-CONFIRMED'}</code>\n\n` +
      '📌 <b>You will be communicated shortly regarding your session schedule and preparation instructions.</b>\n\n' +
      'Our team is praying with you.',
      this.botService.getServicesMenuKeyboard(),
    );
  }

  // ==========================================
  // C. TRAINING & COURSES FLOW
  // ==========================================
  @Action('srv_courses')
  @Hears(['📚 C. Training & Courses', '📚 Courses'])
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
  @Hears(['📖 D. Resources & E-Books', '📖 Resources', '/resources'])
  async onSrvResources(@Ctx() ctx: BotContext) {
    if (!ctx.from) return;
    if (ctx.callbackQuery) {
      await ctx.answerCbQuery();
    }

    await ctx.replyWithHTML(
      '📖 <b>Ministry Resources & Publications</b>\n\n' +
        'Welcome to Purity Matters Resources. Please select the format you would like to explore:\n\n' +
        '📱 <b>Digital E-Books:</b> Instant digital guides, workbooks, and devotional PDFs\n' +
        '📦 <b>Physical Books:</b> Printed paperback publications delivered by courier',
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

    const isFree = item.pricingType === 'free' || item.isPaid === false || Number(item.price) === 0;
    const hasAccess = isFree || (await this.resourcesService.hasAccess(ctx.from.id, String(item.id)));
    const catType = item.type === 'physical_book' ? 'physical' : 'ebook';

    if (isFree || hasAccess) {
      const message =
        `📖 <b>${item.title}</b>\n\n` +
        `• <b>Author:</b> ${item.author || 'Purity Matters Ministry'}\n` +
        `• <b>Access:</b> ✅ Available for Immediate Download (FREE)\n\n` +
        `📝 <b>Overview:</b>\n${item.description || 'Spiritual purity resource.'}`;

      await ctx.replyWithHTML(
        message,
        this.botService.getResourceFreeKeyboard(item.id, catType),
      );
      return;
    }

    // ==========================================
    // PAID RESOURCE: Directly display account numbers & "I Have Paid" button
    // ==========================================
    const accounts = await this.paymentSettingsService.getFormattedAccounts();

    let order = await this.resourcesService.findPendingOrderByUserAndResource(
      ctx.from.id,
      item.id,
    );

    if (!order) {
      const client = await this.clientsService.findByTelegramId(ctx.from.id);
      order = await this.resourcesService.createResourceOrder({
        resourceId: item.id,
        telegramId: ctx.from.id,
        clientName: client?.fullName || ctx.from.first_name || 'Client',
        username: ctx.from.username,
        phone: client?.phone || undefined,
      });
    }

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

    const isFree = item.pricingType === 'free' || item.isPaid === false || Number(item.price) === 0;
    const hasAccess = isFree || (await this.resourcesService.hasAccess(ctx.from.id, String(item.id)));

    if (!hasAccess) {
      await ctx.replyWithHTML('🔒 Purchase is required to download this resource.');
      return;
    }

    if (item.filePath) {
      await ctx.replyWithHTML('⏳ <i>Sending document to your chat...</i>');
      try {
        await this.botService.sendDocumentToUser(
          ctx.from.id,
          item.filePath,
          item.fileName || `${item.title}.pdf`,
          `📖 <b>${item.title}</b>\nGod bless your journey to purity!`,
        );
      } catch (err) {
        await ctx.replyWithHTML(
          '⚠️ Could not send document directly. Please contact our support team or check back shortly.',
        );
      }
    } else if (item.downloadUrl) {
      await ctx.replyWithHTML(
        `📥 <b>Download Link:</b>\n<a href="${item.downloadUrl}">Click here to open ${item.title}</a>`,
      );
    } else {
      await ctx.replyWithHTML('ℹ️ Document file will be delivered by our pastoral team.');
    }
  }

  @Action(/^res_buy_(.+)$/)
  async onResBuy(@Ctx() ctx: BotContext) {
    // Forward directly to onResView which handles order creation and payment accounts display
    return this.onResView(ctx);
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
        `📥 <b>As soon as confirmed on our admin console, your resource will be automatically delivered directly to you right here in this chat!</b>\n\n` +
        `<i>Tip: You may reply to this chat with your transaction reference number or bank SMS to help our team verify even faster.</i>`,
      Markup.inlineKeyboard([
        [Markup.button.callback('🏠 Main Menu', 'cmd_main_menu')],
        [Markup.button.callback('📖 Browse Other Resources', 'srv_resources')],
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

  @Action('res_my_purchases')
  async onResPurchases(@Ctx() ctx: BotContext) {
    if (!ctx.from) return;
    await ctx.answerCbQuery();

    const purchases = await this.resourcesService.getMyPurchases(ctx.from.id);
    if (purchases.length === 0) {
      await ctx.replyWithHTML(
        '💼 You have no purchased e-books yet. Browse the catalog to explore available materials.',
        this.botService.getServicesMenuKeyboard(),
      );
      return;
    }

    let msg = '💼 <b>My Purchased E-Books & Materials:</b>\n\n';
    for (const p of purchases) {
      msg += `• <b>${p.resourceTitle}</b>\n  Status: ✅ Verified & Accessible\n\n`;
    }

    await ctx.replyWithHTML(msg, this.botService.getServicesMenuKeyboard());
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

    // Registration step 2: prompt to use button
    if (client.registrationStep === 'awaiting_phone') {
      await ctx.replyWithHTML(
        '📱 Please click the "Share Phone Number" button below to share your verified phone number, or send /cancel to stop.',
        this.botService.getPhoneShareKeyboard(),
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
}
