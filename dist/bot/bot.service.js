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
var BotService_1;
import { Injectable, Logger } from '@nestjs/common';
import { InjectBot } from 'nestjs-telegraf';
import { Telegraf, Markup } from 'telegraf';
import * as fs from 'fs';
import * as path from 'path';
export function generateValidPdfBuffer(title, author) {
    const safeTitle = (title || 'Ministry Resource').replace(/[\r\n]/g, ' ');
    const safeAuthor = (author || 'Purity Matters Ministry').replace(/[\r\n]/g, ' ');
    const header = '%PDF-1.4\n';
    const obj1 = '1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n';
    const obj2 = '2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n';
    const obj3 = '3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >>\nendobj\n';
    const streamContent = `BT\n/F1 20 Tf\n50 720 Td\n(${safeTitle.replace(/[()\\]/g, '')}) Tj\n/F1 12 Tf\n0 -35 Td\n(Author: ${safeAuthor.replace(/[()\\]/g, '')}) Tj\n0 -25 Td\n(Purity Matters Ministry - Official E-Book Resource) Tj\n0 -20 Td\n(Thank you for your purchase. May God bless your journey to purity and wholeness!) Tj\nET`;
    const streamLength = Buffer.byteLength(streamContent, 'utf-8');
    const obj4 = `4 0 obj\n<< /Length ${streamLength} >>\nstream\n${streamContent}\nendstream\nendobj\n`;
    const obj5 = '5 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>\nendobj\n';
    const offset1 = Buffer.byteLength(header, 'utf-8');
    const offset2 = offset1 + Buffer.byteLength(obj1, 'utf-8');
    const offset3 = offset2 + Buffer.byteLength(obj2, 'utf-8');
    const offset4 = offset3 + Buffer.byteLength(obj3, 'utf-8');
    const offset5 = offset4 + Buffer.byteLength(obj4, 'utf-8');
    const xrefOffset = offset5 + Buffer.byteLength(obj5, 'utf-8');
    const pad = (n) => String(n).padStart(10, '0');
    const xref = `xref\n0 6\n0000000000 65535 f \n${pad(offset1)} 00000 n \n${pad(offset2)} 00000 n \n${pad(offset3)} 00000 n \n${pad(offset4)} 00000 n \n${pad(offset5)} 00000 n \n`;
    const trailer = `trailer\n<< /Size 6 /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF\n`;
    const fullPdf = header + obj1 + obj2 + obj3 + obj4 + obj5 + xref + trailer;
    return Buffer.from(fullPdf, 'utf-8');
}
export function resolveUploadDiskPath(filePath, fallbackFilename) {
    const defaultDir = path.resolve(process.cwd(), 'uploads/resources/ebooks');
    if (!filePath || !filePath.trim()) {
        const filename = fallbackFilename
            ? fallbackFilename.replace(/[^a-zA-Z0-9_.-]/g, '_')
            : 'resource.pdf';
        return path.resolve(defaultDir, filename);
    }
    const trimmed = filePath.trim();
    if (trimmed.startsWith(process.cwd())) {
        return trimmed;
    }
    if (path.isAbsolute(trimmed) && fs.existsSync(trimmed)) {
        return trimmed;
    }
    const relativePart = trimmed.replace(/^[/\\]+/, '');
    return path.resolve(process.cwd(), relativePart);
}
let BotService = BotService_1 = class BotService {
    bot;
    logger = new Logger(BotService_1.name);
    constructor(bot) {
        this.bot = bot;
    }
    async sendDocumentToUser(telegramId, filePath, fileName, caption) {
        try {
            if (!this.bot?.telegram?.sendDocument) {
                this.logger.warn('Telegraf sendDocument skipped: bot not initialized');
                return false;
            }
            const fullDiskPath = resolveUploadDiskPath(filePath, fileName);
            let needsGeneration = true;
            try {
                if (fs.existsSync(fullDiskPath) && fs.statSync(fullDiskPath).size >= 100) {
                    needsGeneration = false;
                }
            }
            catch {
                needsGeneration = true;
            }
            if (needsGeneration) {
                this.logger.warn(`Generating clean valid PDF document at ${fullDiskPath}`);
                fs.mkdirSync(path.dirname(fullDiskPath), { recursive: true });
                const cleanTitle = (fileName || 'Resource Document').replace(/\.[^/.]+$/, '');
                const validPdfBuffer = generateValidPdfBuffer(cleanTitle);
                fs.writeFileSync(fullDiskPath, validPdfBuffer);
            }
            const fileBuffer = fs.readFileSync(fullDiskPath);
            const safeFileName = fileName.toLowerCase().endsWith('.pdf') ? fileName : `${fileName}.pdf`;
            const chatId = !isNaN(Number(telegramId)) ? Number(telegramId) : String(telegramId).trim();
            const safeCaption = caption ||
                `🎉 <b>Payment Verified!</b>\nHere is your official copy of: <b>${safeFileName}</b>.\nGod bless your journey to purity!`;
            try {
                await this.bot.telegram.sendDocument(chatId, {
                    source: fileBuffer,
                    filename: safeFileName,
                }, {
                    caption: safeCaption,
                    parse_mode: 'HTML',
                });
            }
            catch (htmlErr) {
                this.logger.warn(`HTML caption send failed (${htmlErr.message}); retrying plain text caption...`);
                await this.bot.telegram.sendDocument(chatId, {
                    source: fileBuffer,
                    filename: safeFileName,
                }, {
                    caption: safeCaption.replace(/<[^>]*>/g, ''),
                });
            }
            this.logger.log(`Successfully dispatched document ${safeFileName} to telegram user ${chatId}`);
            return true;
        }
        catch (err) {
            this.logger.error(`Error sending document to ${telegramId}: ${err.message}`, err);
            try {
                const chatId = !isNaN(Number(telegramId)) ? Number(telegramId) : String(telegramId).trim();
                await this.bot.telegram.sendMessage(chatId, `🎉 <b>Payment Verified!</b>\n\n` +
                    `Your payment for <b>${fileName}</b> has been approved by our ministry team!\n` +
                    `Your access has been permanently unlocked. You can download this e-book anytime under <b>📖 Ministry Resources → 💼 My Purchases</b>.`, { parse_mode: 'HTML' });
            }
            catch (msgErr) {
                this.logger.error(`Fallback message also failed for ${telegramId}: ${msgErr.message}`);
            }
            throw err;
        }
    }
    async sendMessageToUser(telegramId, message, extra) {
        try {
            if (!this.bot?.telegram?.sendMessage) {
                return false;
            }
            const opts = {
                parse_mode: 'HTML',
                ...(extra || {}),
            };
            await this.bot.telegram.sendMessage(telegramId, message, opts);
            return true;
        }
        catch (err) {
            this.logger.error(`Error sending message to ${telegramId}: ${err.message}`, err);
            return false;
        }
    }
    async broadcastQuestionToChannel(data) {
        const channelId = process.env.TELEGRAM_QUESTIONS_CHANNEL_ID;
        if (!channelId || !channelId.trim()) {
            const msg = 'TELEGRAM_QUESTIONS_CHANNEL_ID is not configured in .env; skipping channel post.';
            this.logger.warn(msg);
            return { success: false, error: msg };
        }
        if (!this.bot?.telegram?.sendMessage) {
            const msg = 'Telegram bot instance is not initialized or ready.';
            this.logger.warn(msg);
            return { success: false, error: msg };
        }
        const escapeHtml = (str) => (str || '')
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;');
        const formattedPost = `<b>Question:</b>\n` +
            `${escapeHtml(data.question)}\n\n` +
            `<b>Answer:</b>\n` +
            `${escapeHtml(data.answer)}\n\n` +
            `for questions / ለመጠየቅ ፡ https://anonymous.puritymattersethiopia.com/\n\n` +
            `#PurityMatters`;
        try {
            const sent = await this.bot.telegram.sendMessage(channelId.trim(), formattedPost, {
                parse_mode: 'HTML',
            });
            this.logger.log(`Successfully broadcast Question #${data.referenceNumber} to Telegram channel ${channelId} (Message ID: ${sent.message_id})`);
            return { success: true, messageId: sent.message_id };
        }
        catch (err) {
            this.logger.error(`Failed to broadcast Question #${data.referenceNumber} to channel ${channelId}: ${err.message}`, err.stack);
            return { success: false, error: err.message };
        }
    }
    async broadcastBotUpdate(telegramIds, version, releaseNotes) {
        let sent = 0;
        let failed = 0;
        const formattedNotes = releaseNotes?.trim()
            ? `\n<b>What's New:</b>\n${releaseNotes.trim()}\n`
            : '';
        const message = `🚀 <b>Purity Matters Bot Updated to ${version}!</b>\n` +
            `${formattedNotes}\n` +
            `We have introduced brand new features, dynamic training courses, and enhanced learning tools.\n\n` +
            `Tap the button below to refresh your bot menu and get the latest experience!`;
        const keyboard = Markup.inlineKeyboard([
            [Markup.button.callback('🔄 Refresh & Update Bot Menu', 'cmd_start_refresh')],
        ]);
        for (const tid of telegramIds) {
            if (!tid)
                continue;
            try {
                await this.sendMessageToUser(tid, message, keyboard);
                sent++;
            }
            catch (err) {
                failed++;
            }
        }
        return { sent, failed };
    }
    getWelcomeMessage(client) {
        const name = client.fullName ?? client.firstName ?? client.username ?? 'Friend';
        return (`👋 <b>Welcome, ${name}!</b>\n\n` +
            `Welcome to <b>Purity Matters</b>. We are here to support your journey to wholeness, freedom, and divine purpose.\n\n` +
            `Please select a service below to get started:`);
    }
    getBottomPersistentKeyboard(isRegistered = false) {
        return Markup.keyboard([
            ['🛋️ Counselling Request', '🕊️ Inner Healing'],
            ['📚 Training & Courses', '📖 Resource Request'],
            ['👤 My Requests & Profile', '💝 Donate'],
            ['ℹ️ About Us'],
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
    getServicesMenuMessage() {
        return (`🌟 <b>Purity Matters Services Menu</b>\n\n` +
            `Please select a service using the persistent menu buttons below:\n\n` +
            `🛋️ <b>Counselling Request</b> — Confidential 1-on-1 support for personal, family, relationship, or purity concerns.\n\n` +
            `🕊️ <b>Inner Healing</b> — Healing prayer and restoration for rejection, abandonment, and emotional wounds.\n\n` +
            `📚 <b>Training & Courses</b> — 7-day and 21-day structured transformation journeys.\n\n` +
            `📖 <b>Resource Request</b> — Essential guides, workbooks, and paid e-books for your walk.\n\n` +
            `👤 <b>My Requests & Profile</b> — View your active requests, orders, and profile status.`);
    }
    getServicesMenuKeyboard() {
        return Markup.inlineKeyboard([
            [Markup.button.callback('🏠 Main Menu', 'cmd_main_menu')],
        ]);
    }
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
    getCoursesListKeyboard(courses, currentPage = 1, pageSize = 5) {
        const totalPages = Math.max(1, Math.ceil(courses.length / pageSize));
        const safePage = Math.min(Math.max(1, currentPage), totalPages);
        const startIdx = (safePage - 1) * pageSize;
        const pageItems = courses.slice(startIdx, startIdx + pageSize);
        const buttons = [];
        for (const course of pageItems) {
            const isPaid = course.type === 'paid' || (Number(course.price) > 0);
            const priceTag = isPaid ? `💎 [${course.price} ${course.currency || 'ETB'}]` : '📖 [FREE]';
            buttons.push([
                Markup.button.callback(`${priceTag} ${course.name || course.title}`, `crs_sel_${course.id}`),
            ]);
        }
        if (totalPages > 1) {
            const navRow = [];
            if (safePage > 1) {
                navRow.push(Markup.button.callback('« Previous', `crs_page_${safePage - 1}`));
            }
            navRow.push(Markup.button.callback(`📄 ${safePage} / ${totalPages}`, 'crs_noop'));
            if (safePage < totalPages) {
                navRow.push(Markup.button.callback('Next »', `crs_page_${safePage + 1}`));
            }
            buttons.push(navRow);
        }
        buttons.push([Markup.button.callback('🔙 Return to Services', 'cmd_services')]);
        return Markup.inlineKeyboard(buttons);
    }
    getCourseActionKeyboard(course, enrollment) {
        const buttons = [];
        const isPaid = course.type === 'paid' || (Number(course.price) > 0);
        const hasAccess = !isPaid || enrollment?.paymentStatus === 'confirmed';
        if (hasAccess) {
            buttons.push([
                Markup.button.callback('🚀 Enter Course & Start Learning', `crs_open_${course.id}`),
            ]);
        }
        else if (enrollment?.paymentStatus === 'pending_verification') {
            buttons.push([
                Markup.button.callback('⏳ Payment Pending Verification', `crs_pending_${course.id}`),
            ]);
        }
        else {
            buttons.push([
                Markup.button.callback('💳 I Have Paid (Submit Verification)', `crs_paid_${course.id}`),
            ]);
        }
        buttons.push([Markup.button.callback('🔙 Back to Courses', 'srv_courses')]);
        return Markup.inlineKeyboard(buttons);
    }
    getCourseModulesReplyKeyboard(course, enrollment) {
        const modules = [...(course?.modules || [])].sort((a, b) => (a.orderIndex || 0) - (b.orderIndex || 0));
        const completedSet = new Set(enrollment?.completedModuleIds || []);
        const rows = [];
        modules.forEach((mod, idx) => {
            const isCompleted = completedSet.has(mod.id);
            const isUnlocked = idx === 0 || completedSet.has(modules[idx - 1].id);
            let prefix = '🔒';
            if (isCompleted) {
                prefix = '🟢';
            }
            else if (isUnlocked) {
                prefix = '📖';
            }
            rows.push([`${prefix} ${idx + 1}. ${mod.title}`]);
        });
        rows.push(['🔙 Exit Course', 'ℹ️ Course Overview']);
        return Markup.keyboard(rows).resize().persistent();
    }
    getModuleDoneKeyboard(courseId, moduleId, isCompleted, nextModuleId) {
        const buttons = [];
        if (!isCompleted) {
            buttons.push([
                Markup.button.callback('✅ Done (Mark Module Complete)', `crs_mod_done_${courseId}_${moduleId}`),
            ]);
        }
        else {
            buttons.push([
                Markup.button.callback('✅ Module Completed', `crs_mod_noop_${moduleId}`),
            ]);
        }
        if (nextModuleId) {
            buttons.push([
                Markup.button.callback('▶️ Next Module', `crs_mod_${courseId}_${nextModuleId}`),
            ]);
        }
        buttons.push([
            Markup.button.callback('📚 Course Overview', `crs_open_${courseId}`),
        ]);
        return Markup.inlineKeyboard(buttons);
    }
    getCoursePaymentInstructions(course, accounts) {
        const formattedPrice = `${course.price} ${course.currency || 'ETB'}`;
        return (`💎 <b>Payment Instructions for ${course.name}</b>\n\n` +
            `<b>Course Fee:</b> ${formattedPrice}\n\n` +
            `To gain access to this paid course, please transfer the exact fee using any of our official ministry accounts:\n\n` +
            `📱 <b>Telebirr</b>\n` +
            `• Account: <code>${accounts.telebirr.accountNumber}</code>\n` +
            `• Account Name: <b>${accounts.telebirr.accountName}</b>\n\n` +
            `🏦 <b>Commercial Bank of Ethiopia (CBE)</b>\n` +
            `• Account: <code>${accounts.cbe.accountNumber}</code>\n` +
            `• Account Name: <b>${accounts.cbe.accountName}</b>\n\n` +
            `📌 <b>Next Steps:</b>\n` +
            `1. Complete the transfer through Telebirr or CBE.\n` +
            `2. Click the <b>"💳 I Have Paid"</b> button below.\n` +
            `3. Our team will verify your transfer and immediately activate your course access.`);
    }
    getCourseLessonKeyboard(courseId, currentDay, totalDays) {
        const buttons = [];
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
    getResourceFormatsKeyboard() {
        return Markup.inlineKeyboard([
            [Markup.button.callback('📱 Digital E-Books', 'res_cat_ebook')],
            [Markup.button.callback('📦 Physical Books', 'res_cat_physical')],
            [Markup.button.callback('📦 My Orders & Purchases', 'res_my_orders')],
            [Markup.button.callback('🔙 Return to Services', 'cmd_services')],
        ]);
    }
    getResourceCategoryKeyboard(items, categoryType = 'ebook') {
        const buttons = items.map((item) => {
            const isPaid = item.pricingType ? item.pricingType === 'paid' && Number(item.price) > 0 : (Number(item.price) > 0 || !!item.isPaid);
            const priceText = isPaid ? `(${item.price} ${item.currency || 'ETB'})` : '(FREE)';
            const icon = categoryType === 'physical_book' ? '📦' : '📖';
            return [
                Markup.button.callback(`${icon} ${item.title} ${priceText}`, `res_view_${item.id}`),
            ];
        });
        buttons.push([Markup.button.callback('🔙 Back to Formats', 'srv_resources')]);
        return Markup.inlineKeyboard(buttons);
    }
    getResourcesMenuKeyboard(catalog) {
        return this.getResourceFormatsKeyboard();
    }
    getResourceFreeKeyboard(resourceId, categoryType = 'ebook', downloadLabel = '📥 Download / Receive Free') {
        return Markup.inlineKeyboard([
            [Markup.button.callback(downloadLabel, `res_dl_${resourceId}`)],
            [Markup.button.callback('🔙 Back to List', `res_cat_${categoryType}`)],
        ]);
    }
    getResourcePurchasedKeyboard(resource, categoryType = 'ebook') {
        const isPhysical = categoryType === 'physical_book' || resource.type === 'physical_book';
        const buttons = [];
        if (!isPhysical) {
            buttons.push([Markup.button.callback('📥 Download Official E-Book', `res_dl_${resource.id}`)]);
            buttons.push([
                Markup.button.callback(`💳 Buy Another Copy / Gift (${resource.price || 250} ${resource.currency || 'ETB'})`, `res_reorder_${resource.id}`),
            ]);
        }
        else {
            buttons.push([
                Markup.button.callback(`📦 Order Another Copy (${resource.price || 250} ${resource.currency || 'ETB'})`, `res_reorder_${resource.id}`),
            ]);
        }
        buttons.push([
            Markup.button.callback(`🔙 Back to ${isPhysical ? 'Physical Books' : 'E-Books'}`, `res_cat_${isPhysical ? 'physical' : 'ebook'}`),
        ]);
        buttons.push([Markup.button.callback('🔙 Return to Services', 'cmd_services')]);
        buttons.push([Markup.button.callback('🏠 Main Menu', 'cmd_main_menu')]);
        return Markup.inlineKeyboard(buttons);
    }
    getPaidResourceActionKeyboard(orderId, categoryType = 'ebook') {
        return Markup.inlineKeyboard([
            [
                Markup.button.callback('✅ I Have Paid (Telebirr)', `pay_confirm_${orderId}_telebirr`),
                Markup.button.callback('✅ I Have Paid (CBE)', `pay_confirm_${orderId}_cbe`),
            ],
            [Markup.button.callback('❌ Cancel Order', `pay_cancel_${orderId}`)],
            [Markup.button.callback('🔙 Back to List', `res_cat_${categoryType}`)],
        ]);
    }
    getResourceDetailKeyboard(resource, hasPurchased) {
        const isPaid = resource.pricingType ? resource.pricingType === 'paid' && Number(resource.price) > 0 : (Number(resource.price) > 0 || !!resource.isPaid);
        const isFree = !isPaid;
        const cat = resource.type === 'physical_book' ? 'physical' : 'ebook';
        if (isFree) {
            return this.getResourceFreeKeyboard(resource.id, cat, '📥 Download Free E-Book');
        }
        if (hasPurchased) {
            return this.getResourcePurchasedKeyboard(resource, cat);
        }
        return Markup.inlineKeyboard([
            [Markup.button.callback(`💳 Pay & Order (${resource.price || 250} ${resource.currency || 'ETB'})`, `res_view_${resource.id}`)],
            [Markup.button.callback('🔙 Back to List', `res_cat_${cat}`)],
        ]);
    }
    getPaymentInstructionsMessage(resourceTitle, amount, currency, orderNumber, accounts, resourceDescription, author) {
        let msg = `📖 <b>${resourceTitle}</b>\n`;
        if (author) {
            msg += `• <b>Author:</b> ${author}\n`;
        }
        msg += `• <b>Price:</b> <b>${amount} ${currency}</b>\n\n`;
        if (resourceDescription) {
            msg += `📝 <b>Overview:</b>\n${resourceDescription}\n\n`;
        }
        msg += `━━━━━━━━━━━━━━━━━━━━━━\n`;
        msg += `💳 <b>PAYMENT DETAILS (Telebirr & CBE)</b>\n\n`;
        msg += `Please transfer <b>${amount} ${currency}</b> using either account below:\n`;
        msg += `🔖 <b>Order Reference:</b> <code>${orderNumber}</code> <i>(tap to copy)</i>\n\n`;
        if (accounts.telebirr && accounts.telebirr.isActive) {
            msg += `📱 <b>Telebirr:</b>\n`;
            msg += `• Phone Number: <code>${accounts.telebirr.accountNumber}</code> <i>(tap to copy)</i>\n`;
            msg += `• Name: <b>${accounts.telebirr.accountName}</b>\n\n`;
        }
        if (accounts.cbe && accounts.cbe.isActive) {
            msg += `🏦 <b>Commercial Bank of Ethiopia (CBE):</b>\n`;
            msg += `• Account Number: <code>${accounts.cbe.accountNumber}</code> <i>(tap to copy)</i>\n`;
            msg += `• Name: <b>${accounts.cbe.accountName}</b>\n\n`;
        }
        msg += `👇 <b>After completing transfer, tap "I Have Paid" below:</b>`;
        return msg;
    }
    getPaymentActionKeyboard(orderId) {
        return this.getPaidResourceActionKeyboard(orderId);
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
    getHelpMessage() {
        return (`📖 <b>Available Commands:</b>\n\n` +
            `• /services — Open the Services menu (Counselling, Inner Healing, Courses, E-books)\n` +
            `• /register — Register as a client\n` +
            `• /status — View your client profile and active requests\n` +
            `• /cancel — Cancel any active request or registration\n` +
            `• /ping — Check server status\n` +
            `• /help — Display this help message\n`);
    }
    getAboutMessage() {
        return (`🌟 <b>About Purity Matters</b>\n\n` +
            `Purity Matters is dedicated to inspiring, educating, and supporting individuals ` +
            `in living purposeful, pure, and wholesome lives.\n\n` +
            `Through confidential counselling, inner healing ministries, structured journeys, and biblical resources, ` +
            `we walk alongside you on the journey to total wholeness.`);
    }
    getDonationAccountInstructionsMessage(amount, referenceNumber, accounts) {
        let msg = `💝 <b>Support & Partner with Purity Matters</b>\n\n`;
        msg += `Your generous donation supports individuals receiving counselling, inner healing, and transformation journeys to walk in divine wholeness and purity.\n\n`;
        if (amount) {
            msg += `💰 <b>Donation Amount:</b> <b>${amount} ETB</b>\n`;
        }
        if (referenceNumber) {
            msg += `🔖 <b>Donation Reference:</b> <code>${referenceNumber}</code> <i>(tap to copy)</i>\n`;
        }
        msg += `━━━━━━━━━━━━━━━━━━━━━━\n`;
        msg += `💳 <b>PAYMENT ACCOUNTS (Telebirr & CBE)</b>\n\n`;
        if (accounts.telebirr && accounts.telebirr.isActive) {
            msg += `📱 <b>Telebirr:</b>\n`;
            msg += `• Phone Number: <code>${accounts.telebirr.accountNumber}</code> <i>(tap to copy)</i>\n`;
            msg += `• Name: <b>${accounts.telebirr.accountName}</b>\n\n`;
        }
        if (accounts.cbe && accounts.cbe.isActive) {
            msg += `🏦 <b>Commercial Bank of Ethiopia (CBE):</b>\n`;
            msg += `• Account Number: <code>${accounts.cbe.accountNumber}</code> <i>(tap to copy)</i>\n`;
            msg += `• Name: <b>${accounts.cbe.accountName}</b>\n`;
            if (accounts.cbe.branchOrShortcode) {
                msg += `• Branch: ${accounts.cbe.branchOrShortcode}\n`;
            }
            msg += `\n`;
        }
        if (amount) {
            msg += `👇 <b>After completing transfer, tap "I Have Donated" below:</b>`;
        }
        else {
            msg += `👇 <b>Select or specify a donation amount:</b>`;
        }
        return msg;
    }
    getDonationAmountsKeyboard() {
        return Markup.inlineKeyboard([
            [
                Markup.button.callback('100 ETB', 'don_amt_100'),
                Markup.button.callback('250 ETB', 'don_amt_250'),
                Markup.button.callback('500 ETB', 'don_amt_500'),
            ],
            [
                Markup.button.callback('1,000 ETB', 'don_amt_1000'),
                Markup.button.callback('2,500 ETB', 'don_amt_2500'),
                Markup.button.callback('5,000 ETB', 'don_amt_5000'),
            ],
            [Markup.button.callback('✏️ Custom Amount', 'don_amt_custom')],
            [Markup.button.callback('🔙 Return to Services', 'cmd_services')],
        ]);
    }
    getDonationActionKeyboard(donationId) {
        return Markup.inlineKeyboard([
            [Markup.button.callback('✅ I Have Donated', `don_paid_${donationId}`)],
            [Markup.button.callback('❌ Cancel Donation', `don_cancel_${donationId}`)],
        ]);
    }
};
BotService = BotService_1 = __decorate([
    Injectable(),
    __param(0, InjectBot()),
    __metadata("design:paramtypes", [Telegraf])
], BotService);
export { BotService };
//# sourceMappingURL=bot.service.js.map