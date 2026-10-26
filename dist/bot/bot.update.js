var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
var BotUpdate_1;
import { Logger } from '@nestjs/common';
import { Update, Ctx, Start, Help, Command, Action, On, Hears, Next } from 'nestjs-telegraf';
import { Markup } from 'telegraf';
import * as fs from 'fs';
import { BotService, resolveUploadDiskPath } from './bot.service.js';
import { ClientsService } from '../clients/clients.service.js';
import { CounselingService } from '../features/counseling.service.js';
import { InnerHealingService } from '../features/inner-healing.service.js';
import { CoursesService } from '../features/courses.service.js';
import { CourseEnrollmentsService } from '../features/course-enrollments.service.js';
import { ResourcesService } from '../features/resources.service.js';
import { PaymentSettingsService } from '../features/payment-settings.service.js';
import { DonationsService } from '../features/donations.service.js';
let BotUpdate = BotUpdate_1 = class BotUpdate {
    botService;
    clientsService;
    counselingService;
    innerHealingService;
    coursesService;
    courseEnrollmentsService;
    resourcesService;
    paymentSettingsService;
    donationsService;
    logger = new Logger(BotUpdate_1.name);
    constructor(botService, clientsService, counselingService, innerHealingService, coursesService, courseEnrollmentsService, resourcesService, paymentSettingsService, donationsService) {
        this.botService = botService;
        this.clientsService = clientsService;
        this.counselingService = counselingService;
        this.innerHealingService = innerHealingService;
        this.coursesService = coursesService;
        this.courseEnrollmentsService = courseEnrollmentsService;
        this.resourcesService = resourcesService;
        this.paymentSettingsService = paymentSettingsService;
        this.donationsService = donationsService;
    }
    async onStart(ctx) {
        if (!ctx.from)
            return;
        const client = await this.clientsService.findOrCreateFromTelegram(ctx.from);
        const message = this.botService.getWelcomeMessage(client);
        const stickyKeyboard = this.botService.getBottomPersistentKeyboard(client.isRegistered);
        await ctx.replyWithHTML(message, stickyKeyboard);
    }
    async onStartRefresh(ctx) {
        if (!ctx.from)
            return;
        if (ctx.callbackQuery) {
            await ctx.answerCbQuery('Bot menu refreshed!', { show_alert: false });
        }
        const client = await this.clientsService.findOrCreateFromTelegram(ctx.from);
        const welcome = `✅ <b>Bot Successfully Refreshed & Updated!</b>\n\n` +
            `Your persistent menu below is now fully synchronized with our latest services, dynamic courses, and features.\n\n` +
            `Please select a service using the menu buttons below to continue:`;
        const stickyKeyboard = this.botService.getBottomPersistentKeyboard(client.isRegistered);
        await ctx.replyWithHTML(welcome, stickyKeyboard);
    }
    async onHelp(ctx) {
        if (ctx.callbackQuery) {
            await ctx.answerCbQuery();
        }
        await ctx.replyWithHTML(this.botService.getHelpMessage());
    }
    async onServices(ctx) {
        if (ctx.callbackQuery) {
            await ctx.answerCbQuery();
        }
        const client = ctx.from ? await this.clientsService.findByTelegramId(ctx.from.id) : null;
        await ctx.replyWithHTML(this.botService.getServicesMenuMessage(), this.botService.getBottomPersistentKeyboard(client?.isRegistered ?? false));
    }
    async onMainMenu(ctx) {
        if (!ctx.from)
            return;
        await ctx.answerCbQuery();
        const client = await this.clientsService.findByTelegramId(ctx.from.id);
        await ctx.replyWithHTML('🏠 <b>Main Menu:</b>\n\nChoose an option from the persistent keyboard below:', this.botService.getBottomPersistentKeyboard(client?.isRegistered ?? false));
    }
    async onStatus(ctx) {
        if (!ctx.from)
            return;
        if (ctx.callbackQuery) {
            await ctx.answerCbQuery();
        }
        const client = await this.clientsService.findOrCreateFromTelegram(ctx.from);
        const cslRequests = await this.counselingService.getRequestsByClient(ctx.from.id);
        const ihRequests = await this.innerHealingService.getRequestsByClient(ctx.from.id);
        let statusText = `👤 <b>Client Profile</b>\n\n` +
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
    async onPing(ctx) {
        const start = Date.now();
        const sent = await ctx.reply('🏓 Pong!');
        const latency = Date.now() - start;
        await ctx.telegram.editMessageText(ctx.chat?.id, sent.message_id, undefined, `🏓 Pong! Latency: ${latency}ms`);
    }
    async onAbout(ctx) {
        if (ctx.callbackQuery) {
            await ctx.answerCbQuery();
        }
        await ctx.replyWithHTML(this.botService.getAboutMessage(), this.botService.getBottomPersistentKeyboard());
    }
    async onRegister(ctx) {
        if (!ctx.from)
            return;
        if (ctx.callbackQuery) {
            await ctx.answerCbQuery();
        }
        const client = await this.clientsService.findOrCreateFromTelegram(ctx.from);
        if (client.isRegistered) {
            await ctx.replyWithHTML(`✅ <b>You are already registered as a client!</b>\n\n` +
                `• <b>Name:</b> ${client.fullName ?? client.firstName}\n` +
                `• <b>Phone:</b> ${client.phone ?? 'Not set'}\n` +
                `• <b>Role:</b> ${client.role}`);
            await this.onServices(ctx);
            return;
        }
        await this.clientsService.setRegistrationStep(client.telegramId, 'awaiting_name');
        await ctx.replyWithHTML('📝 <b>Client Registration</b>\n\nPlease enter your <b>Full Name</b> to begin (or send /cancel to abort):', this.botService.getRemoveKeyboard());
    }
    async onCancel(ctx) {
        if (!ctx.from)
            return;
        await this.clientsService.cancelRegistration(ctx.from.id);
        await this.counselingService.clearDraft(ctx.from.id);
        const client = await this.clientsService.findByTelegramId(ctx.from.id);
        await ctx.replyWithHTML('❌ <b>Action cancelled.</b>', this.botService.getBottomPersistentKeyboard(client?.isRegistered ?? false));
    }
    async onContact(ctx) {
        if (!ctx.from || !ctx.message || !('contact' in ctx.message))
            return;
        const client = await this.clientsService.findByTelegramId(ctx.from.id);
        if (!client)
            return;
        const phone = ctx.message.contact.phone_number;
        if (client.registrationStep === 'ih_awaiting_phone') {
            await this.clientsService.completeRegistration(client.telegramId, phone);
            await this.clientsService.setRegistrationStep(client.telegramId, 'ih_awaiting_issue');
            await ctx.replyWithHTML('🕊️ <b>Inner Healing</b>\n\n' +
                'Please describe what you would like prayer and inner healing for.\n' +
                '<i>(Optional — reply with a message or tap Skip below):</i>', Markup.inlineKeyboard([
                [Markup.button.callback('⏩ Skip (General Prayer)', 'ih_skip_issue')],
            ]));
            return;
        }
        const updated = await this.clientsService.completeRegistration(client.telegramId, phone);
        await ctx.replyWithHTML('🎉 <b>Registration Complete!</b>\n\n' +
            `Welcome to Purity Matters, <b>${updated?.fullName ?? client.firstName ?? 'Friend'}</b>!\n\n` +
            `You can now access our services anytime using the menu below.`, this.botService.getBottomPersistentKeyboard(true));
    }
    async onSrvCounselling(ctx) {
        if (!ctx.from)
            return;
        if (ctx.callbackQuery) {
            await ctx.answerCbQuery();
        }
        const client = await this.clientsService.findByTelegramId(ctx.from.id);
        if (!client?.isRegistered) {
            await ctx.replyWithHTML('⚠️ Please complete your client registration first before booking a session.');
            await this.onRegister(ctx);
            return;
        }
        await ctx.replyWithHTML('🛋️ <b>Counselling Request (Step 1/4)</b>\n\n' +
            'Confidential 1-on-1 biblical and emotional counselling.\n' +
            'Please select your primary area of concern:', this.botService.getCounselingConcernKeyboard());
    }
    async onCslConcern(ctx) {
        if (!ctx.from)
            return;
        await ctx.answerCbQuery();
        const match = ctx.match[1];
        const concernLabels = {
            personal: 'Personal Concern',
            relationship: 'Relationship Concern',
            family: 'Family Concern',
            purity: 'Purity & Mindset Concern',
            emotional: 'Emotional Concern',
        };
        const concern = concernLabels[match] ?? match;
        await this.counselingService.updateDraft(ctx.from.id, { concern });
        await this.clientsService.setRegistrationStep(ctx.from.id, 'csl_awaiting_description');
        await ctx.replyWithHTML(`Selected Concern: <b>${concern}</b>\n\n` +
            '📝 <b>Step 2/4: Brief Description</b>\n\n' +
            'Please provide a brief description of what you are experiencing (or tap Skip if you prefer to share during the appointment):', this.botService.getCounselingDescriptionSkipKeyboard());
    }
    async onCslSkipDesc(ctx) {
        if (!ctx.from)
            return;
        await ctx.answerCbQuery();
        await this.counselingService.updateDraft(ctx.from.id, { description: 'Skipped by client' });
        await this.clientsService.setRegistrationStep(ctx.from.id, null);
        await ctx.replyWithHTML('📞 <b>Step 3/3: Preferred Method</b>\n\nPlease select your preferred session format:', this.botService.getCounselingMethodKeyboard());
    }
    async onCslMethod(ctx) {
        if (!ctx.from)
            return;
        await ctx.answerCbQuery();
        const match = ctx.match[1];
        const methodLabels = {
            telegram: 'Telegram Chat / Audio',
            phone: 'Direct Phone Call',
            video: 'Secure Video Call',
            in_person: 'In-Person (if available)',
        };
        const method = methodLabels[match] ?? match;
        await this.counselingService.updateDraft(ctx.from.id, { preferredMethod: method });
        const draft = await this.counselingService.getDraft(ctx.from.id);
        await ctx.replyWithHTML('📋 <b>Review Your Counselling Request:</b>\n\n' +
            `• <b>Concern:</b> ${draft.concern}\n` +
            `• <b>Description:</b> ${draft.description || 'Skipped'}\n` +
            `• <b>Preferred Method:</b> ${draft.preferredMethod}\n\n` +
            'Please review and submit your request below:', this.botService.getCounselingConfirmKeyboard());
    }
    async onCslTime(ctx) {
        if (!ctx.from)
            return;
        await ctx.answerCbQuery();
        const match = ctx.match[1];
        const timeLabels = {
            next: 'Next Available Appointment',
            morning: 'Morning (9:00 AM - 12:00 PM)',
            afternoon: 'Afternoon (1:00 PM - 5:00 PM)',
            evening: 'Evening (6:00 PM - 9:00 PM)',
        };
        const time = timeLabels[match] ?? match;
        await this.counselingService.updateDraft(ctx.from.id, { preferredTime: time });
        const draft = await this.counselingService.getDraft(ctx.from.id);
        await ctx.replyWithHTML('📋 <b>Review Your Counselling Request:</b>\n\n' +
            `• <b>Concern:</b> ${draft.concern}\n` +
            `• <b>Description:</b> ${draft.description || 'Skipped'}\n` +
            `• <b>Preferred Method:</b> ${draft.preferredMethod}\n` +
            `• <b>Preferred Time:</b> ${draft.preferredTime}\n\n` +
            'Please review and submit your request below:', this.botService.getCounselingConfirmKeyboard());
    }
    async onCslSubmit(ctx) {
        if (!ctx.from)
            return;
        await ctx.answerCbQuery();
        const request = await this.counselingService.createRequest(ctx.from.id);
        if (!request) {
            await ctx.replyWithHTML('⚠️ Could not complete request. Please try again from the Services menu.');
            await this.onServices(ctx);
            return;
        }
        await ctx.replyWithHTML('✅ <b>Counselling Request Submitted Successfully!</b>\n\n' +
            `• <b>Reference Number:</b> <code>${request.referenceNumber}</code>\n` +
            `• <b>Status:</b> ⏳ PENDING ASSIGNMENT\n` +
            `• <b>Concern:</b> ${request.concern}\n` +
            `• <b>Method:</b> ${request.preferredMethod}\n\n` +
            'Our team has received your request and will assign a counsellor shortly. ' +
            'You will receive direct notifications here when your appointment is scheduled!', this.botService.getBottomPersistentKeyboard());
    }
    async onSrvInnerHealing(ctx) {
        if (!ctx.from)
            return;
        if (ctx.callbackQuery) {
            await ctx.answerCbQuery();
        }
        const client = await this.clientsService.findOrCreateFromTelegram(ctx.from);
        if (!client.isRegistered) {
            if (!client.fullName || client.fullName.length < 2) {
                await this.clientsService.setRegistrationStep(ctx.from.id, 'ih_awaiting_name');
                await ctx.replyWithHTML('🕊️ <b>Inner Healing Registration</b>\n\n' +
                    'Welcome! To begin, please enter your full name:');
                return;
            }
            if (!client.phone) {
                await this.clientsService.setRegistrationStep(ctx.from.id, 'ih_awaiting_phone');
                await ctx.replyWithHTML(`Thank you, <b>${client.fullName}</b>!\n\n` +
                    'Please share your phone number using the button below (or type it):', this.botService.getPhoneShareKeyboard());
                return;
            }
            await this.clientsService.completeRegistration(client.telegramId, client.phone);
        }
        await this.clientsService.setRegistrationStep(ctx.from.id, 'ih_awaiting_issue');
        await ctx.replyWithHTML('🕊️ <b>Inner Healing</b>\n\n' +
            'Please describe what you would like prayer and inner healing for.\n' +
            '<i>(Optional — type your response or tap Skip below):</i>', Markup.inlineKeyboard([
            [Markup.button.callback('⏩ Skip (General Prayer)', 'ih_skip_issue')],
        ]));
    }
    async onIhSkipIssue(ctx) {
        if (!ctx.from)
            return;
        await ctx.answerCbQuery();
        await this.clientsService.setRegistrationStep(ctx.from.id, null);
        const request = await this.innerHealingService.createRequest(ctx.from.id, 'General Inner Healing');
        await ctx.replyWithHTML('✅ <b>Inner Healing Request Received!</b>\n\n' +
            `• <b>Reference Code:</b> <code>${request?.referenceNumber ?? 'IH-CONFIRMED'}</code>\n` +
            `• <b>Focus Area:</b> General Inner Healing\n\n` +
            'Our ministry team has received your request and will communicate with you shortly regarding your session schedule.\n\n' +
            'Our team is praying with you!', this.botService.getBottomPersistentKeyboard(true));
    }
    async onIhTopic(ctx) {
        if (!ctx.from)
            return;
        await ctx.answerCbQuery();
        const match = ctx.match[1];
        const topicLabels = {
            rejection: 'Rejection & Healing from Hurt',
            abandonment: 'Abandonment & Fear of Loneliness',
            forgiveness: 'Forgiveness & Releasing Bitterness',
            shame: 'Shame & Guilt Removal',
            identity: 'Identity & God-given Worth',
            wounds: 'Emotional Wounds & Heart Restoration',
        };
        const topic = topicLabels[match] ?? match;
        const request = await this.innerHealingService.createRequest(ctx.from.id, topic);
        await ctx.replyWithHTML('🕊️ <b>Inner Healing Request Received</b>\n\n' +
            `• <b>Topic:</b> ${topic}\n` +
            `• <b>Reference Code:</b> <code>${request?.referenceNumber ?? 'IH-CONFIRMED'}</code>\n\n` +
            '📌 <b>You will be communicated shortly regarding your session schedule and preparation instructions.</b>\n\n' +
            'Our team is praying with you.', this.botService.getBottomPersistentKeyboard(true));
    }
    async onSrvCourses(ctx) {
        if (!ctx.from)
            return;
        if (ctx.callbackQuery) {
            await ctx.answerCbQuery();
        }
        const courses = await this.coursesService.findAllCourses({ type: 'all' });
        if (!courses || courses.length === 0) {
            const client = await this.clientsService.findByTelegramId(ctx.from.id);
            await ctx.replyWithHTML('📚 <b>Training & Transformation Courses</b>\n\n' +
                'There are no courses currently published. Please check back soon!', this.botService.getBottomPersistentKeyboard(client?.isRegistered ?? false));
            return;
        }
        await ctx.replyWithHTML('📚 <b>Training & Courses</b>\n\n' +
            'Explore our dynamic learning journeys below. Complete lessons sequentially, deepen your spiritual walk, and track your progress.\n\n' +
            '<i>Select a course to view details and begin:</i>', this.botService.getCoursesListKeyboard(courses, 1, 5));
    }
    async onCrsPage(ctx) {
        if (!ctx.from)
            return;
        await ctx.answerCbQuery();
        const page = parseInt(ctx.match[1], 10) || 1;
        const courses = await this.coursesService.findAllCourses({ type: 'all' });
        try {
            await ctx.editMessageText('📚 <b>Training & Courses</b>\n\n' +
                'Explore our dynamic learning journeys below. Complete lessons sequentially, deepen your spiritual walk, and track your progress.\n\n' +
                '<i>Select a course to view details and begin:</i>', {
                parse_mode: 'HTML',
                ...this.botService.getCoursesListKeyboard(courses, page, 5),
            });
        }
        catch {
            await ctx.replyWithHTML('📚 <b>Training & Courses</b>\n\n' +
                'Explore our dynamic learning journeys below. Complete lessons sequentially, deepen your spiritual walk, and track your progress.\n\n' +
                '<i>Select a course to view details and begin:</i>', this.botService.getCoursesListKeyboard(courses, page, 5));
        }
    }
    async onCrsSel(ctx) {
        if (!ctx.from)
            return;
        await ctx.answerCbQuery();
        const courseId = parseInt(ctx.match[1], 10);
        const course = await this.coursesService.findCourseById(courseId);
        if (!course) {
            await ctx.replyWithHTML('⚠️ Course not found.');
            return;
        }
        const enrollment = await this.courseEnrollmentsService.getEnrollment(ctx.from.id, courseId);
        const isPaid = course.type === 'paid' || Number(course.price) > 0;
        const hasAccess = !isPaid || enrollment?.paymentStatus === 'confirmed';
        let message = `📖 <b>${course.name}</b>\n\n` +
            `🏷️ <b>Theme:</b> ${course.theme}\n` +
            `💰 <b>Access:</b> ${isPaid ? `${course.price} ${course.currency || 'ETB'}` : 'FREE'}\n` +
            `📚 <b>Curriculum:</b> ${course.modules?.length || 0} sequential modules\n\n`;
        if (course.description) {
            message += `📝 <b>Overview:</b>\n${course.description}\n\n`;
        }
        if (course.generalObjective) {
            message += `🎯 <b>General Objective:</b>\n${course.generalObjective}\n\n`;
        }
        if (course.learningOutcomes && course.learningOutcomes.length > 0) {
            message += `✨ <b>Learning Outcomes:</b>\n` +
                course.learningOutcomes.map((item) => `• ${item}`).join('\n') + '\n\n';
        }
        if (enrollment) {
            if (enrollment.paymentStatus === 'confirmed') {
                const completedCount = enrollment.completedModuleIds?.length || 0;
                const total = course.modules?.length || 0;
                const pct = total > 0 ? Math.round((completedCount / total) * 100) : 0;
                message += `📊 <b>Your Progress:</b> ${completedCount}/${total} modules (${pct}% complete)\n\n`;
            }
            else if (enrollment.paymentStatus === 'pending_verification') {
                message += `⏳ <b>Payment Status:</b> Pending Administrator Verification\n\n`;
            }
            else if (enrollment.paymentStatus === 'rejected') {
                message += `⚠️ <b>Payment Status:</b> Verification could not be confirmed. (${enrollment.adminNotes || 'Please retry transfer'})\n\n`;
            }
        }
        if (isPaid && !hasAccess && enrollment?.paymentStatus !== 'pending_verification') {
            const accounts = await this.paymentSettingsService.getPaymentAccounts();
            message += this.botService.getCoursePaymentInstructions(course, accounts);
        }
        await ctx.replyWithHTML(message, this.botService.getCourseActionKeyboard(course, enrollment));
    }
    async onCrsPaid(ctx) {
        if (!ctx.from)
            return;
        await ctx.answerCbQuery();
        const courseId = parseInt(ctx.match[1], 10);
        const course = await this.coursesService.findCourseById(courseId);
        if (!course) {
            await ctx.replyWithHTML('⚠️ Course not found.');
            return;
        }
        const clientName = [ctx.from.first_name, ctx.from.last_name].filter(Boolean).join(' ') || ctx.from.username || 'Student';
        await this.courseEnrollmentsService.submitPaymentRequest({
            telegramId: ctx.from.id,
            clientName,
            clientUsername: ctx.from.username || null,
            courseId: course.id,
            courseName: course.name,
            amount: Number(course.price) || 0,
            currency: course.currency || 'ETB',
        });
        await ctx.replyWithHTML(`⏳ <b>Payment Verification Submitted!</b>\n\n` +
            `Thank you! We have received your payment verification request for <b>${course.name}</b> (${course.price} ${course.currency || 'ETB'}).\n\n` +
            `Our administration team will verify your transfer in our Telebirr / CBE statements shortly.\n\n` +
            `Once confirmed, you will receive an automated notification right here in Telegram with direct access to begin your studies.\n\n` +
            `<i>Status: Pending Verification</i>`, Markup.inlineKeyboard([
            [Markup.button.callback('🔙 Back to Courses', 'srv_courses')],
        ]));
    }
    async onCrsOpen(ctx) {
        if (!ctx.from)
            return;
        if (ctx.callbackQuery) {
            await ctx.answerCbQuery();
        }
        const courseId = parseInt(ctx.match[1], 10);
        await this.renderCourseOverview(ctx, courseId);
    }
    async renderCourseOverview(ctx, courseId) {
        if (!ctx.from)
            return;
        const course = await this.coursesService.findCourseById(courseId);
        if (!course) {
            await ctx.replyWithHTML('⚠️ Course not found.');
            return;
        }
        let enrollment = await this.courseEnrollmentsService.getEnrollment(ctx.from.id, courseId);
        const isPaid = course.type === 'paid' || Number(course.price) > 0;
        if (isPaid && (!enrollment || enrollment.paymentStatus !== 'confirmed')) {
            await ctx.replyWithHTML('⚠️ <b>Access Restricted</b>\n\nThis paid course requires administrator verification before access is granted.', Markup.inlineKeyboard([[Markup.button.callback('💳 View Payment Instructions', `crs_sel_${courseId}`)]]));
            return;
        }
        if (!enrollment) {
            const clientName = [ctx.from.first_name, ctx.from.last_name].filter(Boolean).join(' ') || ctx.from.username || 'Student';
            enrollment = await this.courseEnrollmentsService.enrollFreeCourse({
                telegramId: ctx.from.id,
                clientName,
                clientUsername: ctx.from.username || null,
                courseId: course.id,
                courseName: course.name,
            });
        }
        const modules = [...(course.modules || [])].sort((a, b) => (a.orderIndex || 0) - (b.orderIndex || 0));
        const completedSet = new Set(enrollment.completedModuleIds || []);
        let overviewMsg = `📖 <b>${course.name} — Learning Interface</b>\n\n` +
            `🏷️ <b>Theme:</b> ${course.theme}\n\n`;
        if (course.description) {
            overviewMsg += `📝 <b>Overview:</b>\n${course.description}\n\n`;
        }
        if (course.generalObjective) {
            overviewMsg += `🎯 <b>General Objective:</b>\n${course.generalObjective}\n\n`;
        }
        if (course.learningOutcomes && course.learningOutcomes.length > 0) {
            overviewMsg += `✨ <b>Learning Outcomes:</b>\n` +
                course.learningOutcomes.map((item) => `• ${item}`).join('\n') + '\n\n';
        }
        overviewMsg += `📚 <b>Curriculum & Progress:</b>\n`;
        if (modules.length === 0) {
            overviewMsg += `<i>No modules have been published for this course yet.</i>\n`;
        }
        else {
            modules.forEach((mod, idx) => {
                const isCompleted = completedSet.has(mod.id);
                const isUnlocked = idx === 0 || completedSet.has(modules[idx - 1].id);
                const icon = isCompleted ? '🟢' : isUnlocked ? '📖' : '🔒';
                const statusText = isCompleted ? 'Completed' : isUnlocked ? 'Unlocked' : 'Locked';
                overviewMsg += `${icon} <b>Module ${idx + 1}:</b> ${mod.title} (<i>${statusText}</i>)\n`;
            });
        }
        overviewMsg += `\n<i>Use the persistent keyboard below to navigate modules at any time, or click below:</i>`;
        const nextMod = modules.find((m) => !completedSet.has(m.id)) || modules[0];
        const inlineButtons = [];
        if (nextMod) {
            inlineButtons.push([
                Markup.button.callback(`▶️ Open: ${nextMod.title}`, `crs_mod_${course.id}_${nextMod.id}`),
            ]);
        }
        inlineButtons.push([
            Markup.button.callback('🔙 Back to Courses', 'srv_courses'),
        ]);
        await ctx.replyWithHTML(overviewMsg, this.botService.getCourseModulesReplyKeyboard(course, enrollment));
        if (inlineButtons.length > 0) {
            await ctx.reply('Action:', Markup.inlineKeyboard(inlineButtons));
        }
    }
    async onCrsMod(ctx) {
        if (!ctx.from)
            return;
        if (ctx.callbackQuery) {
            await ctx.answerCbQuery();
        }
        const courseId = parseInt(ctx.match[1], 10);
        const moduleId = parseInt(ctx.match[2], 10);
        await this.renderModuleView(ctx, courseId, moduleId);
    }
    async renderModuleView(ctx, courseId, moduleId) {
        if (!ctx.from)
            return;
        const course = await this.coursesService.findCourseById(courseId);
        const enrollment = await this.courseEnrollmentsService.getEnrollment(ctx.from.id, courseId);
        const isPaid = course.type === 'paid' || Number(course.price) > 0;
        if (isPaid && (!enrollment || enrollment.paymentStatus !== 'confirmed')) {
            await ctx.replyWithHTML('⚠️ Access restricted. Please complete payment verification.');
            return;
        }
        const modules = [...(course.modules || [])].sort((a, b) => (a.orderIndex || 0) - (b.orderIndex || 0));
        const modIndex = modules.findIndex((m) => m.id === moduleId);
        if (modIndex === -1) {
            await ctx.replyWithHTML('⚠️ Module not found.');
            return;
        }
        const completedSet = new Set(enrollment?.completedModuleIds || []);
        const isUnlocked = modIndex === 0 || completedSet.has(modules[modIndex - 1].id) || completedSet.has(moduleId);
        if (!isUnlocked) {
            await ctx.replyWithHTML('🔒 <b>Module Locked</b>\n\n' +
                'Please complete the preceding module first before unlocking this module.');
            return;
        }
        const module = await this.coursesService.findModuleWithSections(moduleId);
        if (!module) {
            await ctx.replyWithHTML('⚠️ Module details not found.');
            return;
        }
        const sections = [...(module.sections || [])].sort((a, b) => (a.orderIndex || 0) - (b.orderIndex || 0));
        let moduleHeader = `📖 <b>Module ${modIndex + 1}: ${module.title}</b>\n\n`;
        if (module.description) {
            moduleHeader += `📝 ${module.description}\n\n`;
        }
        if (sections.length > 0) {
            moduleHeader += `<b>Sections (${sections.length}):</b>\n`;
            sections.forEach((sec, sIdx) => {
                moduleHeader += `• Section ${sIdx + 1}: ${sec.title}\n`;
            });
        }
        await ctx.replyWithHTML(moduleHeader);
        for (let i = 0; i < sections.length; i++) {
            const sec = sections[i];
            let secMsg = `📌 <b>Section ${i + 1}: ${sec.title}</b>\n\n`;
            if (sec.additionalContent) {
                secMsg += `${sec.additionalContent}\n\n`;
            }
            await ctx.replyWithHTML(secMsg);
            if (sec.materials && sec.materials.length > 0) {
                for (const mat of sec.materials) {
                    const diskPath = resolveUploadDiskPath(mat.filePath, mat.fileName);
                    try {
                        if (fs.existsSync(diskPath)) {
                            const isAudio = mat.fileType === 'audio' || mat.fileMimeType?.startsWith('audio/');
                            if (isAudio) {
                                await ctx.replyWithAudio({ source: fs.readFileSync(diskPath), filename: mat.fileName }, { caption: `🎧 <b>${mat.title}</b>`, parse_mode: 'HTML' });
                            }
                            else {
                                await ctx.replyWithDocument({ source: fs.readFileSync(diskPath), filename: mat.fileName }, { caption: `📎 <b>${mat.title}</b>`, parse_mode: 'HTML' });
                            }
                        }
                        else {
                            await ctx.replyWithHTML(`📎 <b>Resource Material:</b> ${mat.title} (<i>${mat.fileName}</i>)`);
                        }
                    }
                    catch (fileErr) {
                        this.logger.warn(`Could not dispatch material ${mat.fileName}:`, fileErr);
                        await ctx.replyWithHTML(`📎 <b>Resource Material:</b> ${mat.title}`);
                    }
                }
            }
        }
        const isCompleted = completedSet.has(moduleId);
        const nextModId = modIndex < modules.length - 1 ? modules[modIndex + 1].id : null;
        await ctx.replyWithHTML(isCompleted
            ? `🟢 <i>You have already completed Module ${modIndex + 1}. You can review it anytime!</i>`
            : `👉 <i>When you have finished reviewing this module, click below to mark it as complete and unlock the next module:</i>`, this.botService.getModuleDoneKeyboard(courseId, moduleId, isCompleted, isCompleted ? nextModId : null));
    }
    async onCrsModDone(ctx) {
        if (!ctx.from)
            return;
        await ctx.answerCbQuery();
        const courseId = parseInt(ctx.match[1], 10);
        const moduleId = parseInt(ctx.match[2], 10);
        const result = await this.courseEnrollmentsService.completeModule(ctx.from.id, courseId, moduleId);
        const course = await this.coursesService.findCourseById(courseId);
        const replyKb = this.botService.getCourseModulesReplyKeyboard(course, result.enrollment);
        if (result.isCourseCompleted) {
            await ctx.replyWithHTML(`🏆 <b>Hallelujah! Course Completed!</b>\n\n` +
                `Congratulations! You have completed all modules in <b>${course.name}</b>!\n\n` +
                `May God continue to bless your journey of purity, holiness, and purpose.\n\n` +
                `All modules remain unlocked and accessible for your lifelong review.`, replyKb);
        }
        else if (result.nextModule) {
            await ctx.replyWithHTML(`✅ <b>Module Complete!</b>\n\n` +
                `You have successfully completed this module!\n\n` +
                `Module <b>${result.nextModule.title}</b> is now unlocked.\n\n` +
                `Click below or select it from the persistent keyboard to continue:`, replyKb);
            await ctx.reply('Next Module:', Markup.inlineKeyboard([
                [Markup.button.callback(`▶️ Open: ${result.nextModule.title}`, `crs_mod_${courseId}_${result.nextModule.id}`)],
                [Markup.button.callback('📚 Course Overview', `crs_open_${courseId}`)],
            ]));
        }
        else {
            await ctx.replyWithHTML(`✅ <b>Module Complete!</b>\n\nGreat progress! Your completion has been saved.`, replyKb);
        }
    }
    async onCourseModuleTextSelect(ctx) {
        if (!ctx.from || !ctx.message || !('text' in ctx.message))
            return;
        const match = ctx.message.text.match(/^([🟢📖🔒])\s*(\d+)\.\s*(.+)$/);
        if (!match)
            return;
        const icon = match[1];
        const moduleIndex = parseInt(match[2], 10) - 1;
        const moduleTitle = match[3].trim();
        const enrollments = await this.courseEnrollmentsService.getUserEnrollments(ctx.from.id);
        if (!enrollments.length) {
            await ctx.replyWithHTML('⚠️ You are not currently enrolled in any course. Please browse 📚 Training & Courses.');
            return;
        }
        const activeEnrollment = enrollments.find(e => e.status === 'in_progress' || e.paymentStatus === 'confirmed') || enrollments[0];
        const course = await this.coursesService.findCourseById(activeEnrollment.courseId);
        const sortedModules = [...(course.modules || [])].sort((a, b) => (a.orderIndex || 0) - (b.orderIndex || 0));
        const selectedMod = sortedModules[moduleIndex] || sortedModules.find(m => m.title.trim() === moduleTitle);
        if (!selectedMod) {
            await ctx.replyWithHTML('⚠️ Module not found.');
            return;
        }
        if (icon === '🔒') {
            await ctx.replyWithHTML('🔒 <b>Module Locked</b>\n\n' +
                'This module is not yet unlocked. Please complete the preceding module first to unlock this content.');
            return;
        }
        await this.renderModuleView(ctx, course.id, selectedMod.id);
    }
    async onCourseOverviewText(ctx) {
        if (!ctx.from)
            return;
        const enrollments = await this.courseEnrollmentsService.getUserEnrollments(ctx.from.id);
        if (!enrollments.length) {
            await ctx.replyWithHTML('⚠️ You are not currently enrolled in any course. Please browse 📚 Training & Courses.');
            return;
        }
        const activeEnrollment = enrollments.find(e => e.status === 'in_progress' || e.paymentStatus === 'confirmed') || enrollments[0];
        await this.renderCourseOverview(ctx, activeEnrollment.courseId);
    }
    async onExitCourseText(ctx) {
        if (!ctx.from)
            return;
        const client = await this.clientsService.findByTelegramId(ctx.from.id);
        await ctx.replyWithHTML('👋 <b>Exited Course View</b>\n\n' +
            'You have returned to the main menu. Your learning progress is safely saved. You can resume anytime under <b>📚 Training & Courses</b>.', this.botService.getBottomPersistentKeyboard(client?.isRegistered ?? false));
    }
    async onCrsNoop(ctx) {
        if (ctx.callbackQuery) {
            await ctx.answerCbQuery();
        }
    }
    async onCrsPending(ctx) {
        if (ctx.callbackQuery) {
            await ctx.answerCbQuery('Payment verification pending. Our team will verify your transfer shortly.', { show_alert: true });
        }
    }
    async onCrsModNoop(ctx) {
        if (ctx.callbackQuery) {
            await ctx.answerCbQuery('Module already completed.', { show_alert: false });
        }
    }
    async onSrvResources(ctx) {
        if (!ctx.from)
            return;
        if (ctx.callbackQuery) {
            await ctx.answerCbQuery();
        }
        await ctx.replyWithHTML('📖 <b>Ministry Resources</b>\n\n' +
            'Please select an option below:', this.botService.getResourceFormatsKeyboard());
    }
    async onResCatEbook(ctx) {
        if (!ctx.from)
            return;
        await ctx.answerCbQuery();
        const dbResources = await this.resourcesService.findAllResources({ type: 'ebook' });
        const ebooks = dbResources.length > 0 ? dbResources : this.resourcesService.getCatalog().filter((i) => i.category !== 'devotional');
        await ctx.replyWithHTML('📱 <b>Available Digital E-Books & Guides</b>\n\n' +
            'Select a publication below to view details and download or purchase:', this.botService.getResourceCategoryKeyboard(ebooks, 'ebook'));
    }
    async onResCatPhysical(ctx) {
        if (!ctx.from)
            return;
        await ctx.answerCbQuery();
        const dbResources = await this.resourcesService.findAllResources({ type: 'physical_book' });
        const physical = dbResources.length > 0 ? dbResources : this.resourcesService.getCatalog().filter((i) => i.type === 'physical_book');
        if (physical.length === 0) {
            await ctx.replyWithHTML('📦 <b>Physical Print Publications</b>\n\n' +
                'No physical paperback books are currently in stock. Please browse our digital e-books for instant access.', Markup.inlineKeyboard([
                [Markup.button.callback('📱 Browse Digital E-Books', 'res_cat_ebook')],
                [Markup.button.callback('🔙 Back to Formats', 'srv_resources')],
            ]));
            return;
        }
        await ctx.replyWithHTML('📦 <b>Available Physical Books & Devotionals</b>\n\n' +
            'Select a publication below to view details and place an order:', this.botService.getResourceCategoryKeyboard(physical, 'physical_book'));
    }
    async onResView(ctx) {
        if (!ctx.from)
            return;
        await ctx.answerCbQuery();
        const rawId = ctx.match[1];
        let item = null;
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
        const activeOrder = await this.resourcesService.findActiveOrderByUserAndResource(ctx.from.id, item.id);
        if (activeOrder && activeOrder.paymentStatus === 'payment_submitted') {
            const providerName = activeOrder.paymentMethod === 'cbe'
                ? 'Commercial Bank of Ethiopia (CBE)'
                : 'Telebirr';
            const pendingMsg = `📖 <b>${item.title}</b>\n\n` +
                `• <b>Author:</b> ${item.author || 'Purity Matters Ministry'}\n` +
                `• <b>Order Number:</b> <code>${activeOrder.orderNumber}</code>\n` +
                `• <b>Amount:</b> <b>${activeOrder.amount} ${activeOrder.currency || 'ETB'}</b>\n` +
                `• <b>Payment Method:</b> <b>${providerName}</b>\n` +
                `• <b>Status:</b> ⏳ <b>Payment Awaiting Verification</b>\n\n` +
                `We have received your payment confirmation. Our ministry administration team is currently verifying the transfer.\n\n` +
                (item.type === 'physical_book'
                    ? `📦 <b>As soon as verified on our admin console, our courier team will contact you for delivery!</b>`
                    : `📥 <b>As soon as verified on our admin console, your e-book will be automatically delivered directly to you right here in this chat!</b>`);
            await ctx.replyWithHTML(pendingMsg, Markup.inlineKeyboard([
                [Markup.button.callback('🔄 Refresh Status', `res_view_${item.id}`)],
                [Markup.button.callback('🔙 Back to List', `res_cat_${catType}`)],
                [Markup.button.callback('🏠 Main Menu', 'cmd_main_menu')],
            ]));
            return;
        }
        if (activeOrder && activeOrder.paymentStatus === 'pending') {
            const accounts = await this.paymentSettingsService.getFormattedAccounts();
            const paymentMsg = this.botService.getPaymentInstructionsMessage(item.title, activeOrder.amount || item.price, activeOrder.currency || item.currency || 'ETB', activeOrder.orderNumber, accounts, item.description, item.author);
            await ctx.replyWithHTML(paymentMsg, this.botService.getPaidResourceActionKeyboard(activeOrder.id, catType));
            return;
        }
        if (isFree) {
            if (item.type === 'physical_book') {
                const message = `📦 <b>${item.title}</b>\n\n` +
                    `• <b>Author:</b> ${item.author || 'Purity Matters Ministry'}\n` +
                    `• <b>Status:</b> ✅ Free Print Ministry Resource\n\n` +
                    `📝 <b>Overview:</b>\n${item.description || 'Ministry physical publication.'}\n\n` +
                    `📦 <i>Our fulfillment team manages courier delivery dispatch for this publication.</i>`;
                await ctx.replyWithHTML(message, Markup.inlineKeyboard([
                    [Markup.button.callback('🔙 Back to Physical Books', 'res_cat_physical')],
                    [Markup.button.callback('🏠 Main Menu', 'cmd_main_menu')],
                ]));
                return;
            }
            const message = `📖 <b>${item.title}</b>\n\n` +
                `• <b>Author:</b> ${item.author || 'Purity Matters Ministry'}\n` +
                `• <b>Access:</b> ✅ Available for Immediate Download (FREE)\n\n` +
                `📝 <b>Overview:</b>\n${item.description || 'Spiritual purity resource.'}`;
            await ctx.replyWithHTML(message, this.botService.getResourceFreeKeyboard(item.id, catType, '📥 Download Free E-Book'));
            return;
        }
        const client = await this.clientsService.findByTelegramId(ctx.from.id);
        const order = await this.resourcesService.createResourceOrder({
            resourceId: item.id,
            telegramId: ctx.from.id,
            clientName: client?.fullName || ctx.from.first_name || 'Client',
            username: ctx.from.username,
            phone: client?.phone || undefined,
        });
        const accounts = await this.paymentSettingsService.getFormattedAccounts();
        const paymentMsg = this.botService.getPaymentInstructionsMessage(item.title, item.price, item.currency || 'ETB', order.orderNumber, accounts, item.description, item.author);
        await ctx.replyWithHTML(paymentMsg, this.botService.getPaidResourceActionKeyboard(order.id, catType));
    }
    async onResDl(ctx) {
        if (!ctx.from)
            return;
        await ctx.answerCbQuery();
        const rawId = ctx.match[1];
        let item = null;
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
            const fullDiskPath = resolveUploadDiskPath(item.filePath, item.fileName || `${(item.title || 'resource').replace(/[^a-zA-Z0-9_-]/g, '_')}.pdf`);
            await this.botService.sendDocumentToUser(ctx.from.id, fullDiskPath, item.fileName || `${item.title}.pdf`, `📖 <b>${item.title}</b>\nGod bless your journey to purity!`);
        }
        catch (err) {
            this.logger.error(`Error sending document to ${ctx.from.id}: ${err?.message}`, err);
            await ctx.replyWithHTML('⚠️ Could not send document directly. Please contact our support team or check back shortly.');
        }
    }
    async onResReorder(ctx) {
        if (!ctx.from)
            return;
        await ctx.answerCbQuery();
        const rawId = ctx.match[1];
        let item = null;
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
        const activeOrder = await this.resourcesService.findActiveOrderByUserAndResource(ctx.from.id, item.id);
        if (activeOrder && activeOrder.paymentStatus === 'payment_submitted') {
            await ctx.replyWithHTML(`⏳ <b>Order Already Pending Verification</b>\n\n` +
                `You already have an order (<code>${activeOrder.orderNumber}</code>) for <b>${item.title}</b> currently awaiting verification by our administration team.\n\n` +
                `As soon as our team confirms it, you will receive your resource and can place further orders if desired.`, Markup.inlineKeyboard([
                [Markup.button.callback('🔄 Refresh Status', `res_view_${item.id}`)],
                [Markup.button.callback('🔙 Back to List', `res_cat_${catType}`)],
                [Markup.button.callback('🏠 Main Menu', 'cmd_main_menu')],
            ]));
            return;
        }
        const client = await this.clientsService.findByTelegramId(ctx.from.id);
        const order = await this.resourcesService.createResourceOrder({
            resourceId: item.id,
            telegramId: ctx.from.id,
            clientName: client?.fullName || ctx.from.first_name || 'Client',
            username: ctx.from.username,
            phone: client?.phone || undefined,
        });
        const accounts = await this.paymentSettingsService.getFormattedAccounts();
        const headerNotice = item.type === 'physical_book'
            ? `📦 <b>Ordering Another Physical Copy</b>\n\n`
            : `🛍️ <b>Ordering Another Copy / Gift</b>\n\n`;
        const paymentMsg = headerNotice +
            `A new separate order has been generated for you (Order: <code>${order.orderNumber}</code>).\n\n` +
            this.botService.getPaymentInstructionsMessage(item.title, order.amount || item.price, order.currency || item.currency || 'ETB', order.orderNumber, accounts, item.description, item.author);
        await ctx.replyWithHTML(paymentMsg, this.botService.getPaidResourceActionKeyboard(order.id, catType));
    }
    async onResBuy(ctx) {
        return this.onResReorder(ctx);
    }
    async onPayConfirm(ctx) {
        if (!ctx.from)
            return;
        await ctx.answerCbQuery();
        const orderId = parseInt(ctx.match[1], 10);
        const method = ctx.match[2];
        const order = await this.resourcesService.submitOrderPayment(orderId, method);
        if (!order) {
            await ctx.replyWithHTML('⚠️ Could not locate order record.');
            return;
        }
        const providerName = method === 'telebirr' ? 'Telebirr' : 'Commercial Bank of Ethiopia (CBE)';
        await ctx.replyWithHTML(`⏳ <b>Payment Confirmation Received!</b>\n\n` +
            `Order Number: <code>${order.orderNumber}</code>\n` +
            `Resource: <b>${order.resourceTitle}</b>\n` +
            `Payment Method: <b>${providerName}</b>\n\n` +
            `<b>Please wait while our administration team verifies your payment.</b>\n\n` +
            `📥 <b>As soon as confirmed on our admin console, your resource will be automatically delivered directly to you right here in this chat!</b>`, Markup.inlineKeyboard([
            [Markup.button.callback('🔄 Refresh Status', `res_view_${order.resourceId}`)],
            [Markup.button.callback('📖 Browse Other Resources', 'srv_resources')],
            [Markup.button.callback('🏠 Main Menu', 'cmd_main_menu')],
        ]));
    }
    async onPayCancel(ctx) {
        if (!ctx.from)
            return;
        await ctx.answerCbQuery();
        const orderId = parseInt(ctx.match[1], 10);
        await this.resourcesService.rejectOrderPayment(orderId, 'Cancelled by user');
        await ctx.replyWithHTML('❌ <b>Order Cancelled</b>\n\nYou can browse our resources anytime using the button below:', Markup.inlineKeyboard([
            [Markup.button.callback('📖 Browse Resources', 'srv_resources')],
            [Markup.button.callback('🏠 Main Menu', 'cmd_main_menu')],
        ]));
    }
    async onResPurchases(ctx) {
        if (!ctx.from)
            return;
        if (ctx.callbackQuery) {
            await ctx.answerCbQuery();
        }
        const [purchases, orders] = await Promise.all([
            this.resourcesService.getMyPurchases(ctx.from.id),
            this.resourcesService.findOrdersByTelegramId(ctx.from.id),
        ]);
        if (purchases.length === 0 && orders.length === 0) {
            await ctx.replyWithHTML('📦 <b>My Orders & Purchases</b>\n\n' +
                'You have no orders or purchased materials yet.\n' +
                'Browse our catalog to explore available books and e-books.', Markup.inlineKeyboard([
                [Markup.button.callback('📱 Browse Digital E-Books', 'res_cat_ebook')],
                [Markup.button.callback('📦 Browse Physical Books', 'res_cat_physical')],
                [Markup.button.callback('🔙 Back to Catalog', 'srv_resources')],
                [Markup.button.callback('🔙 Return to Services', 'cmd_services')],
            ]));
            return;
        }
        const buttons = [];
        let msg = '📦 <b>My Orders & Purchases</b>\n\n';
        if (purchases.length > 0) {
            msg += '📖 <b>Verified Digital E-Books:</b>\n';
            for (const p of purchases) {
                msg += `• <b>${p.resourceTitle}</b>\n  Status: ✅ Verified & Available for Download\n\n`;
                buttons.push([
                    Markup.button.callback(`📥 Download: ${p.resourceTitle}`, `res_dl_${p.resourceId}`),
                ]);
            }
        }
        const physicalOrders = orders.filter((o) => o.resourceType === 'physical_book');
        if (physicalOrders.length > 0) {
            msg += '📦 <b>Physical Book Orders:</b>\n';
            for (const po of physicalOrders) {
                const payStatus = po.paymentStatus === 'verified'
                    ? '✅ Paid & Verified'
                    : po.paymentStatus === 'payment_submitted'
                        ? '⏳ Verification Pending'
                        : '⏳ Awaiting Payment';
                const fulfill = po.fulfillmentStatus === 'delivered'
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
    async onDonate(ctx) {
        if (!ctx.from)
            return;
        if (ctx.callbackQuery) {
            await ctx.answerCbQuery();
        }
        const accounts = await this.paymentSettingsService.getFormattedAccounts();
        await ctx.replyWithHTML(this.botService.getDonationAccountInstructionsMessage(null, null, accounts), this.botService.getDonationAmountsKeyboard());
    }
    async onDonationPresetAmount(ctx) {
        if (!ctx.from)
            return;
        await ctx.answerCbQuery();
        const amount = parseInt(ctx.match[1], 10);
        const client = await this.clientsService.findOrCreateFromTelegram(ctx.from);
        const accounts = await this.paymentSettingsService.getFormattedAccounts();
        const donation = await this.donationsService.create({
            telegramId: ctx.from.id,
            clientName: client.fullName || client.firstName || 'Friend',
            clientUsername: ctx.from.username,
            clientPhone: client.phone,
            amount,
        });
        await ctx.replyWithHTML(this.botService.getDonationAccountInstructionsMessage(amount, donation.referenceNumber, accounts), this.botService.getDonationActionKeyboard(donation.id));
    }
    async onDonationCustomAmount(ctx) {
        if (!ctx.from)
            return;
        await ctx.answerCbQuery();
        const client = await this.clientsService.findOrCreateFromTelegram(ctx.from);
        await this.clientsService.setRegistrationStep(client.telegramId, 'don_awaiting_amount');
        await ctx.replyWithHTML('✏️ <b>Enter Donation Amount</b>\n\n' +
            'Please type the amount in ETB you wish to donate (e.g. <code>300</code> or <code>1500</code>):', Markup.inlineKeyboard([
            [Markup.button.callback('🔙 Back to Donations', 'cmd_donate')],
            [Markup.button.callback('🏠 Main Menu', 'cmd_main_menu')],
        ]));
    }
    async onDonationPaid(ctx) {
        if (!ctx.from)
            return;
        await ctx.answerCbQuery();
        const match = ctx.match;
        const donationId = parseInt(match[1], 10);
        const method = match[2] || 'telebirr';
        const donation = await this.donationsService.markAsDonated(donationId, method);
        await ctx.replyWithHTML('🙏 <b>Thank You for Your Generous Heart!</b>\n\n' +
            `Your gift of <b>${donation.amount} ${donation.currency}</b> has been received and submitted for verification.\n\n` +
            `• <b>Donation Reference:</b> <code>${donation.referenceNumber}</code>\n` +
            `• <b>Payment Method:</b> <b>${donation.paymentMethod.toUpperCase()}</b>\n` +
            `• <b>Status:</b> ⏳ <b>Pending Verification</b>\n\n` +
            `Our administration team will verify your transfer on our console shortly.\n\n` +
            `<i>"Each of you should give what you have decided in your heart to give, not reluctantly or under compulsion, for God loves a cheerful giver." — 2 Cor 9:7</i>`, Markup.inlineKeyboard([
            [Markup.button.callback('🔙 Return to Services', 'cmd_services')],
            [Markup.button.callback('🏠 Main Menu', 'cmd_main_menu')],
        ]));
    }
    async onDonationCancel(ctx) {
        if (!ctx.from)
            return;
        await ctx.answerCbQuery();
        const match = ctx.match;
        const donationId = parseInt(match[1], 10);
        await this.donationsService.delete(donationId);
        await ctx.replyWithHTML('❌ <b>Donation Cancelled</b>\n\nYou can donate anytime using the 💝 Donate button below.', this.botService.getBottomPersistentKeyboard());
    }
    async onText(ctx, next) {
        if (!ctx.from || !ctx.message || !('text' in ctx.message))
            return;
        const text = ctx.message.text.trim();
        if (text.startsWith('/')) {
            return;
        }
        const client = await this.clientsService.findByTelegramId(ctx.from.id);
        if (!client)
            return;
        if (client.registrationStep === 'awaiting_name') {
            if (text.length < 2) {
                await ctx.replyWithHTML('⚠️ Please enter a valid full name:');
                return;
            }
            await this.clientsService.saveNameAndPromptPhone(client.telegramId, text);
            await ctx.replyWithHTML(`Thank you, <b>${text}</b>!\n\nNow please share your phone number using the button below to complete registration:`, this.botService.getPhoneShareKeyboard());
            return;
        }
        if (client.registrationStep === 'ih_awaiting_name') {
            if (text.length < 2) {
                await ctx.replyWithHTML('⚠️ Please enter a valid full name:');
                return;
            }
            await this.clientsService.saveNameAndPromptPhone(client.telegramId, text);
            await this.clientsService.setRegistrationStep(client.telegramId, 'ih_awaiting_phone');
            await ctx.replyWithHTML(`Thank you, <b>${text}</b>!\n\nPlease share your phone number using the button below (or type it):`, this.botService.getPhoneShareKeyboard());
            return;
        }
        if (client.registrationStep === 'awaiting_phone') {
            await ctx.replyWithHTML('📱 Please click the "Share Phone Number" button below to share your verified phone number, or send /cancel to stop.', this.botService.getPhoneShareKeyboard());
            return;
        }
        if (client.registrationStep === 'ih_awaiting_phone') {
            const cleanPhone = text.replace(/[^0-9+]/g, '');
            if (cleanPhone.length >= 7) {
                await this.clientsService.completeRegistration(client.telegramId, cleanPhone);
                await this.clientsService.setRegistrationStep(client.telegramId, 'ih_awaiting_issue');
                await ctx.replyWithHTML('🕊️ <b>Inner Healing</b>\n\n' +
                    'Please describe what you would like prayer and inner healing for.\n' +
                    '<i>(Optional — type your response or tap Skip below):</i>', Markup.inlineKeyboard([
                    [Markup.button.callback('⏩ Skip (General Prayer)', 'ih_skip_issue')],
                ]));
                return;
            }
            await ctx.replyWithHTML('📱 Please click the "Share Phone Number" button below or type a valid phone number:', this.botService.getPhoneShareKeyboard());
            return;
        }
        if (client.registrationStep === 'ih_awaiting_issue') {
            const issueText = text.trim();
            await this.clientsService.setRegistrationStep(client.telegramId, null);
            const request = await this.innerHealingService.createRequest(client.telegramId, issueText);
            await ctx.replyWithHTML('✅ <b>Inner Healing Request Received!</b>\n\n' +
                `• <b>Reference Code:</b> <code>${request?.referenceNumber ?? 'IH-CONFIRMED'}</code>\n` +
                `• <b>Focus Area:</b> ${issueText}\n\n` +
                'Our ministry team has received your request and will communicate with you shortly regarding your session schedule.\n\n' +
                'Our team is praying with you!', this.botService.getBottomPersistentKeyboard(true));
            return;
        }
        if (client.registrationStep === 'csl_awaiting_description') {
            await this.counselingService.updateDraft(client.telegramId, { description: text });
            await this.clientsService.setRegistrationStep(client.telegramId, null);
            await ctx.replyWithHTML('Description saved! 👍\n\n' +
                '📞 <b>Step 3/4: Preferred Method</b>\n\nPlease select your preferred session format:', this.botService.getCounselingMethodKeyboard());
            return;
        }
        if (client.registrationStep === 'don_awaiting_amount') {
            const cleanNum = text.replace(/[^0-9.]/g, '');
            const parsedAmount = parseFloat(cleanNum);
            if (isNaN(parsedAmount) || parsedAmount <= 0) {
                await ctx.replyWithHTML('⚠️ <b>Invalid Amount:</b> Please enter a valid donation amount in ETB (e.g. <code>250</code> or <code>1000</code>):', Markup.inlineKeyboard([
                    [Markup.button.callback('🔙 Back to Donations', 'cmd_donate')],
                    [Markup.button.callback('🏠 Main Menu', 'cmd_main_menu')],
                ]));
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
            await ctx.replyWithHTML(this.botService.getDonationAccountInstructionsMessage(parsedAmount, donation.referenceNumber, accounts), this.botService.getDonationActionKeyboard(donation.id));
            return;
        }
        const pendingOrders = await this.resourcesService.findAllResourceOrders({
            paymentStatus: 'payment_submitted',
        });
        const fromId = ctx.from.id;
        const awaitingRefOrder = pendingOrders.find((o) => String(o.telegramId) === String(fromId) && !o.paymentReference);
        if (awaitingRefOrder && text.length >= 3 && text.length <= 60) {
            await this.resourcesService.submitOrderPayment(awaitingRefOrder.id, awaitingRefOrder.paymentMethod, text);
            await ctx.replyWithHTML(`👍 <b>Reference Code Recorded!</b>\n` +
                `Transaction code <code>${text}</code> attached to Order <code>${awaitingRefOrder.orderNumber}</code>.\n` +
                `Our pastoral team will review and deliver your e-book shortly!`);
            return;
        }
        this.logger.debug(`Received message from ${ctx.from.id}: ${text}`);
        if (next) {
            await next();
        }
    }
};
__decorate([
    Start(),
    __param(0, Ctx()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], BotUpdate.prototype, "onStart", null);
__decorate([
    Action('cmd_start_refresh'),
    __param(0, Ctx()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], BotUpdate.prototype, "onStartRefresh", null);
__decorate([
    Help(),
    Hears('❓ Help'),
    __param(0, Ctx()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], BotUpdate.prototype, "onHelp", null);
__decorate([
    Command('services'),
    Action('cmd_services'),
    __param(0, Ctx()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], BotUpdate.prototype, "onServices", null);
__decorate([
    Action('cmd_main_menu'),
    __param(0, Ctx()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], BotUpdate.prototype, "onMainMenu", null);
__decorate([
    Command('status'),
    Action('cmd_status'),
    Hears(['👤 My Requests & Profile', '👤 My Profile', '📋 My Status']),
    __param(0, Ctx()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], BotUpdate.prototype, "onStatus", null);
__decorate([
    Command('ping'),
    __param(0, Ctx()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], BotUpdate.prototype, "onPing", null);
__decorate([
    Command('about'),
    Action('cmd_about'),
    Hears(['ℹ️ About Us', 'About Us']),
    __param(0, Ctx()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], BotUpdate.prototype, "onAbout", null);
__decorate([
    Command('register'),
    Action('cmd_register'),
    Hears('✨ Register as Client'),
    __param(0, Ctx()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], BotUpdate.prototype, "onRegister", null);
__decorate([
    Command('cancel'),
    Hears('❌ Cancel Registration'),
    __param(0, Ctx()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], BotUpdate.prototype, "onCancel", null);
__decorate([
    On('contact'),
    __param(0, Ctx()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], BotUpdate.prototype, "onContact", null);
__decorate([
    Action('srv_counselling'),
    Hears(['🛋️ Counselling Request', '🛋️ A. Counselling', '🛋️ Counselling']),
    __param(0, Ctx()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], BotUpdate.prototype, "onSrvCounselling", null);
__decorate([
    Action(/^csl_concern_(personal|relationship|family|purity|emotional)$/),
    __param(0, Ctx()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], BotUpdate.prototype, "onCslConcern", null);
__decorate([
    Action('csl_skip_desc'),
    __param(0, Ctx()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], BotUpdate.prototype, "onCslSkipDesc", null);
__decorate([
    Action(/^csl_method_(telegram|phone|video|in_person)$/),
    __param(0, Ctx()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], BotUpdate.prototype, "onCslMethod", null);
__decorate([
    Action(/^csl_time_(next|morning|afternoon|evening)$/),
    __param(0, Ctx()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], BotUpdate.prototype, "onCslTime", null);
__decorate([
    Action('csl_submit'),
    __param(0, Ctx()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], BotUpdate.prototype, "onCslSubmit", null);
__decorate([
    Action('srv_inner_healing'),
    Hears(['🕊️ Inner Healing', '🕊️ B. Inner Healing', 'Inner Healing', '/inner_healing']),
    __param(0, Ctx()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], BotUpdate.prototype, "onSrvInnerHealing", null);
__decorate([
    Action('ih_skip_issue'),
    __param(0, Ctx()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], BotUpdate.prototype, "onIhSkipIssue", null);
__decorate([
    Action(/^ih_topic_(rejection|abandonment|forgiveness|shame|identity|wounds)$/),
    __param(0, Ctx()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], BotUpdate.prototype, "onIhTopic", null);
__decorate([
    Action('srv_courses'),
    Hears(['📚 Training & Courses', '📚 C. Training & Courses', '📚 Courses']),
    __param(0, Ctx()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], BotUpdate.prototype, "onSrvCourses", null);
__decorate([
    Action(/^crs_page_(\d+)$/),
    __param(0, Ctx()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], BotUpdate.prototype, "onCrsPage", null);
__decorate([
    Action(/^crs_sel_(\d+)$/),
    __param(0, Ctx()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], BotUpdate.prototype, "onCrsSel", null);
__decorate([
    Action(/^crs_paid_(\d+)$/),
    __param(0, Ctx()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], BotUpdate.prototype, "onCrsPaid", null);
__decorate([
    Action(/^crs_open_(\d+)$/),
    __param(0, Ctx()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], BotUpdate.prototype, "onCrsOpen", null);
__decorate([
    Action(/^crs_mod_(\d+)_(\d+)$/),
    __param(0, Ctx()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], BotUpdate.prototype, "onCrsMod", null);
__decorate([
    Action(/^crs_mod_done_(\d+)_(\d+)$/),
    __param(0, Ctx()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], BotUpdate.prototype, "onCrsModDone", null);
__decorate([
    Hears(/^([🟢📖🔒])\s*(\d+)\.\s*(.+)$/),
    __param(0, Ctx()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], BotUpdate.prototype, "onCourseModuleTextSelect", null);
__decorate([
    Hears(['ℹ️ Course Overview', 'Course Overview']),
    __param(0, Ctx()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], BotUpdate.prototype, "onCourseOverviewText", null);
__decorate([
    Hears(['🔙 Exit Course', 'Exit Course']),
    __param(0, Ctx()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], BotUpdate.prototype, "onExitCourseText", null);
__decorate([
    Action('crs_noop'),
    __param(0, Ctx()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], BotUpdate.prototype, "onCrsNoop", null);
__decorate([
    Action(/^crs_pending_(\d+)$/),
    __param(0, Ctx()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], BotUpdate.prototype, "onCrsPending", null);
__decorate([
    Action(/^crs_mod_noop_(\d+)$/),
    __param(0, Ctx()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], BotUpdate.prototype, "onCrsModNoop", null);
__decorate([
    Action('srv_resources'),
    Hears(['📖 Resource Request', '📖 D. Resources & E-Books', '📖 Resources', '/resources']),
    __param(0, Ctx()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], BotUpdate.prototype, "onSrvResources", null);
__decorate([
    Action('res_cat_ebook'),
    __param(0, Ctx()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], BotUpdate.prototype, "onResCatEbook", null);
__decorate([
    Action('res_cat_physical'),
    __param(0, Ctx()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], BotUpdate.prototype, "onResCatPhysical", null);
__decorate([
    Action(/^res_view_(.+)$/),
    __param(0, Ctx()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], BotUpdate.prototype, "onResView", null);
__decorate([
    Action(/^res_dl_(.+)$/),
    __param(0, Ctx()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], BotUpdate.prototype, "onResDl", null);
__decorate([
    Action(/^res_reorder_(.+)$/),
    __param(0, Ctx()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], BotUpdate.prototype, "onResReorder", null);
__decorate([
    Action(/^res_buy_(.+)$/),
    __param(0, Ctx()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], BotUpdate.prototype, "onResBuy", null);
__decorate([
    Action(/^pay_confirm_(\d+)_(telebirr|cbe)$/),
    __param(0, Ctx()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], BotUpdate.prototype, "onPayConfirm", null);
__decorate([
    Action(/^pay_cancel_(\d+)$/),
    __param(0, Ctx()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], BotUpdate.prototype, "onPayCancel", null);
__decorate([
    Action(['res_my_purchases', 'res_my_orders']),
    Command(['orders', 'myorders']),
    __param(0, Ctx()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], BotUpdate.prototype, "onResPurchases", null);
__decorate([
    Command('donate'),
    Action('cmd_donate'),
    Hears(['💝 Donate', '🎁 Donate', 'Donate', '/donate', /^\s*💝?\s*Donate\s*$/i]),
    __param(0, Ctx()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], BotUpdate.prototype, "onDonate", null);
__decorate([
    Action(/^don_amt_(\d+)$/),
    __param(0, Ctx()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], BotUpdate.prototype, "onDonationPresetAmount", null);
__decorate([
    Action('don_amt_custom'),
    __param(0, Ctx()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], BotUpdate.prototype, "onDonationCustomAmount", null);
__decorate([
    Action(/^don_paid_(\d+)(?:_(telebirr|cbe|other))?$/),
    __param(0, Ctx()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], BotUpdate.prototype, "onDonationPaid", null);
__decorate([
    Action(/^don_cancel_(\d+)$/),
    __param(0, Ctx()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], BotUpdate.prototype, "onDonationCancel", null);
__decorate([
    On('text'),
    __param(0, Ctx()),
    __param(1, Next()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Function]),
    __metadata("design:returntype", Promise)
], BotUpdate.prototype, "onText", null);
BotUpdate = BotUpdate_1 = __decorate([
    Update(),
    __metadata("design:paramtypes", [BotService,
        ClientsService,
        CounselingService,
        InnerHealingService,
        CoursesService,
        CourseEnrollmentsService,
        ResourcesService,
        PaymentSettingsService,
        DonationsService])
], BotUpdate);
export { BotUpdate };
//# sourceMappingURL=bot.update.js.map