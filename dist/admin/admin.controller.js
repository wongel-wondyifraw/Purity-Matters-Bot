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
import { Controller, Get, Patch, Post, Delete, Param, Body, Query, ParseIntPipe, UseInterceptors, UploadedFile, NotFoundException, BadRequestException, } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import * as path from 'path';
import * as fs from 'fs';
import { ClientsService } from '../clients/clients.service.js';
import { CounselingService } from '../features/counseling.service.js';
import { InnerHealingService } from '../features/inner-healing.service.js';
import { CoursesService } from '../features/courses.service.js';
import { CourseEnrollmentsService } from '../features/course-enrollments.service.js';
import { ResourcesService } from '../features/resources.service.js';
import { AnonymousQuestionsService } from '../features/anonymous-questions.service.js';
import { PaymentSettingsService } from '../features/payment-settings.service.js';
import { DonationsService } from '../features/donations.service.js';
import { BotService, generateValidPdfBuffer, resolveUploadDiskPath } from '../bot/bot.service.js';
let AdminController = class AdminController {
    clientsService;
    counselingService;
    innerHealingService;
    coursesService;
    courseEnrollmentsService;
    resourcesService;
    questionsService;
    paymentSettingsService;
    donationsService;
    botService;
    constructor(clientsService, counselingService, innerHealingService, coursesService, courseEnrollmentsService, resourcesService, questionsService, paymentSettingsService, donationsService, botService) {
        this.clientsService = clientsService;
        this.counselingService = counselingService;
        this.innerHealingService = innerHealingService;
        this.coursesService = coursesService;
        this.courseEnrollmentsService = courseEnrollmentsService;
        this.resourcesService = resourcesService;
        this.questionsService = questionsService;
        this.paymentSettingsService = paymentSettingsService;
        this.donationsService = donationsService;
        this.botService = botService;
    }
    async getStats() {
        const [totalClients, counselingList, innerHealingList, courseProgressList, purchaseList, donationList,] = await Promise.all([
            this.clientsService.count(),
            this.counselingService.findAll(),
            this.innerHealingService.findAll(),
            this.coursesService.getAllProgress(),
            this.resourcesService.getAllPurchases(),
            this.donationsService.findAll(),
        ]);
        const pendingCounseling = counselingList.filter((c) => c.status === 'pending').length;
        const pendingInnerHealing = innerHealingList.filter((i) => i.status === 'pending').length;
        const accountabilityNeeded = courseProgressList.filter((cp) => cp.accountabilityRequested).length;
        const totalSales = purchaseList.reduce((acc, curr) => acc + (Number(curr.amount) || 0), 0);
        const verifiedDonations = donationList.filter((d) => d.status === 'verified');
        const totalDonatedAmount = verifiedDonations.reduce((acc, curr) => acc + (Number(curr.amount) || 0), 0);
        const pendingDonations = donationList.filter((d) => d.status === 'payment_submitted' || d.status === 'pending').length;
        return {
            totalClients,
            totalCounseling: counselingList.length,
            pendingCounseling,
            totalInnerHealing: innerHealingList.length,
            pendingInnerHealing,
            totalCourseEnrolled: courseProgressList.length,
            accountabilityNeeded,
            totalPurchases: purchaseList.length,
            totalSales,
            totalDonations: donationList.length,
            totalDonatedAmount,
            pendingDonations,
        };
    }
    async getClients() {
        const [clients, counseling, innerHealing, courses, purchases] = await Promise.all([
            this.clientsService.findAll(),
            this.counselingService.findAll(),
            this.innerHealingService.findAll(),
            this.coursesService.getAllProgress(),
            this.resourcesService.getAllPurchases(),
        ]);
        const counselingMap = new Map();
        for (const c of counseling) {
            const tid = String(c.telegramId);
            counselingMap.set(tid, (counselingMap.get(tid) || 0) + 1);
        }
        const innerHealingMap = new Map();
        for (const ih of innerHealing) {
            const tid = String(ih.telegramId);
            innerHealingMap.set(tid, (innerHealingMap.get(tid) || 0) + 1);
        }
        const coursesMap = new Map();
        for (const cp of courses) {
            const tid = String(cp.telegramId);
            coursesMap.set(tid, (coursesMap.get(tid) || 0) + 1);
        }
        const purchasesMap = new Map();
        for (const rp of purchases) {
            const tid = String(rp.telegramId);
            purchasesMap.set(tid, (purchasesMap.get(tid) || 0) + 1);
        }
        return clients.map((c) => {
            const tid = String(c.telegramId);
            return {
                ...c,
                counselingCount: counselingMap.get(tid) || 0,
                innerHealingCount: innerHealingMap.get(tid) || 0,
                coursesCount: coursesMap.get(tid) || 0,
                purchasesCount: purchasesMap.get(tid) || 0,
            };
        });
    }
    async createClient(body) {
        return this.clientsService.createClient(body);
    }
    async updateClient(id, body) {
        const client = await this.clientsService.findById(id);
        if (!client)
            return null;
        if (body.role !== undefined)
            client.role = body.role;
        if (body.phone !== undefined)
            client.phone = body.phone;
        if (body.fullName !== undefined)
            client.fullName = body.fullName;
        if (body.username !== undefined)
            client.username = body.username ? body.username.replace(/^@/, '').trim() : null;
        if (body.languageCode !== undefined)
            client.languageCode = body.languageCode;
        if (body.isRegistered !== undefined)
            client.isRegistered = body.isRegistered;
        return this.clientsService.saveClient(client);
    }
    async deleteClient(id) {
        const success = await this.clientsService.deleteClient(id);
        return { success };
    }
    async getCounseling() {
        return this.counselingService.findAll();
    }
    async createCounseling(body) {
        if (!body || !body.clientName || !body.concern || !body.preferredMethod) {
            throw new BadRequestException('Client name, concern, and preferred method are required fields.');
        }
        return this.counselingService.directCreate(body);
    }
    async updateCounseling(id, body) {
        const updated = await this.counselingService.updateRequest(id, body);
        if (!updated) {
            throw new NotFoundException(`Counseling request #${id} not found.`);
        }
        return updated;
    }
    async deleteCounseling(id) {
        const success = await this.counselingService.deleteRequest(id);
        if (!success) {
            throw new NotFoundException(`Counseling request #${id} not found.`);
        }
        return { success: true, message: `Counseling request #${id} deleted successfully.` };
    }
    async getInnerHealing() {
        const [requests, clients] = await Promise.all([
            this.innerHealingService.findAll(),
            this.clientsService.findAll(),
        ]);
        const clientMap = new Map(clients.map((c) => [String(c.telegramId), c]));
        return requests.map((item) => {
            const client = clientMap.get(String(item.telegramId));
            return {
                ...item,
                clientName: item.clientName || client?.fullName || client?.firstName || `User #${item.telegramId}`,
                phone: item.phone || client?.phone || 'N/A',
            };
        });
    }
    async updateInnerHealing(id, body) {
        return this.innerHealingService.updateStatus(id, body.status);
    }
    async getCourses() {
        const [progressList, clients] = await Promise.all([
            this.coursesService.getAllProgress(),
            this.clientsService.findAll(),
        ]);
        const clientMap = new Map(clients.map((c) => [String(c.telegramId), c]));
        return progressList.map((item) => {
            const client = clientMap.get(String(item.telegramId));
            return {
                ...item,
                clientName: client?.fullName || client?.firstName || `User #${item.telegramId}`,
                phone: client?.phone || 'N/A',
            };
        });
    }
    async getCoursesCatalog(query) {
        return this.coursesService.findAllCourses(query);
    }
    async getCourseDetails(id) {
        return this.coursesService.findCourseById(id);
    }
    async createCourse(body, bannerFile) {
        if (!body || !body.name || !body.theme) {
            throw new BadRequestException('Course name and theme are required.');
        }
        let learningOutcomes = body.learningOutcomes;
        if (typeof learningOutcomes === 'string') {
            try {
                learningOutcomes = JSON.parse(learningOutcomes);
            }
            catch {
                learningOutcomes = learningOutcomes.split('\n').map((s) => s.trim()).filter(Boolean);
            }
        }
        return this.coursesService.createCourse({
            name: body.name,
            type: body.type || 'free',
            price: Number(body.price) || 0,
            currency: body.currency || 'ETB',
            theme: body.theme,
            description: body.description || null,
            generalObjective: body.generalObjective || null,
            learningOutcomes: Array.isArray(learningOutcomes) ? learningOutcomes : [],
            orderIndex: Number(body.orderIndex) || 0,
            bannerImage: body.bannerImage || null,
        }, bannerFile);
    }
    async updateCourse(id, body, bannerFile) {
        let learningOutcomes = body.learningOutcomes;
        if (typeof learningOutcomes === 'string') {
            try {
                learningOutcomes = JSON.parse(learningOutcomes);
            }
            catch {
                learningOutcomes = learningOutcomes.split('\n').map((s) => s.trim()).filter(Boolean);
            }
        }
        const payload = { ...body };
        if (learningOutcomes !== undefined) {
            payload.learningOutcomes = learningOutcomes;
        }
        return this.coursesService.updateCourse(id, payload, bannerFile);
    }
    async deleteCourse(id) {
        const success = await this.coursesService.deleteCourse(id);
        if (!success) {
            throw new NotFoundException(`Course #${id} not found.`);
        }
        return { success: true, message: `Course #${id} deleted successfully.` };
    }
    async createModule(courseId, body, bannerFile) {
        if (!body || !body.title) {
            throw new BadRequestException('Module title is required.');
        }
        return this.coursesService.createModule(courseId, body, bannerFile);
    }
    async updateModule(courseId, moduleId, body, bannerFile) {
        return this.coursesService.updateModule(courseId, moduleId, body, bannerFile);
    }
    async deleteModule(courseId, moduleId) {
        const success = await this.coursesService.deleteModule(courseId, moduleId);
        if (!success) {
            throw new NotFoundException(`Module #${moduleId} not found.`);
        }
        return { success: true, message: `Module #${moduleId} deleted successfully.` };
    }
    async createSection(moduleId, body) {
        if (!body || !body.title) {
            throw new BadRequestException('Section title is required.');
        }
        return this.coursesService.createSection(moduleId, body);
    }
    async updateSection(sectionId, body) {
        return this.coursesService.updateSection(sectionId, body);
    }
    async deleteSection(sectionId) {
        const success = await this.coursesService.deleteSection(sectionId);
        if (!success) {
            throw new NotFoundException(`Section #${sectionId} not found.`);
        }
        return { success: true, message: `Section #${sectionId} deleted successfully.` };
    }
    async uploadSectionMaterial(courseId, moduleId, sectionId, body, file) {
        if (!file) {
            throw new BadRequestException('No file provided for upload.');
        }
        return this.coursesService.uploadMaterial(courseId, moduleId, sectionId, file, body.title);
    }
    async deleteMaterial(materialId) {
        const success = await this.coursesService.deleteMaterial(materialId);
        if (!success) {
            throw new NotFoundException(`Material #${materialId} not found.`);
        }
        return { success: true, message: `Material #${materialId} deleted successfully.` };
    }
    async getCourseEnrollments(courseId, paymentStatus, status, search) {
        const parsedCourseId = courseId ? parseInt(courseId, 10) : undefined;
        return this.courseEnrollmentsService.findAll({
            courseId: isNaN(parsedCourseId) ? undefined : parsedCourseId,
            paymentStatus,
            status,
            search,
        });
    }
    async getCourseEnrollmentById(id) {
        return this.courseEnrollmentsService.findById(id);
    }
    async verifyCourseEnrollment(id, body) {
        const enrollment = await this.courseEnrollmentsService.verifyPayment(id, body?.adminNotes);
        const openKeyboard = {
            reply_markup: {
                inline_keyboard: [
                    [
                        {
                            text: '🚀 Open Course Now',
                            callback_data: `crs_open_${enrollment.courseId}`,
                        },
                    ],
                ],
            },
        };
        const notificationText = `🎉 <b>Payment Approved! Access Granted!</b>\n\n` +
            `Your payment for <b>${enrollment.courseName}</b> has been verified by our ministry team!\n\n` +
            `Your course access is now permanently unlocked. You can begin exploring the modules and lessons right away.`;
        await this.botService.sendMessageToUser(enrollment.telegramId, notificationText, openKeyboard);
        return {
            success: true,
            enrollment,
            message: `Course enrollment #${id} verified and user notified.`,
        };
    }
    async rejectCourseEnrollment(id, body) {
        const reason = body?.reason?.trim() || 'Payment could not be verified.';
        const enrollment = await this.courseEnrollmentsService.rejectPayment(id, reason);
        const notificationText = `⚠️ <b>Course Payment Notice</b>\n\n` +
            `Our team could not verify the transfer for <b>${enrollment.courseName}</b>.\n\n` +
            `<b>Reason:</b> ${reason}\n\n` +
            `Please check your transaction in your Telebirr / CBE app or contact our team if you need assistance.`;
        await this.botService.sendMessageToUser(enrollment.telegramId, notificationText);
        return {
            success: true,
            enrollment,
            message: `Course enrollment #${id} rejected.`,
        };
    }
    async deleteCourseEnrollment(id) {
        const success = await this.courseEnrollmentsService.deleteEnrollment(id);
        if (!success) {
            throw new NotFoundException(`Enrollment #${id} not found.`);
        }
        return { success: true, message: `Enrollment #${id} deleted successfully.` };
    }
    async getResourcesCatalog(query) {
        return this.resourcesService.findAllResources(query);
    }
    async createResource(body, file) {
        const data = {
            title: body.title,
            author: body.author || null,
            description: body.description || null,
            type: body.type || 'ebook',
            pricingType: body.pricingType || (Number(body.price) > 0 ? 'paid' : 'free'),
            price: Number(body.price) || 0,
            currency: body.currency || 'ETB',
            stockQuantity: body.type === 'physical_book' ? Number(body.stockQuantity) || 0 : null,
            coverImageUrl: body.coverImageUrl || null,
        };
        if (file) {
            data.filePath = `/uploads/resources/ebooks/${file.filename}`;
            data.fileName = file.originalname;
            data.fileSizeBytes = file.size;
            data.fileMimeType = file.mimetype;
        }
        return this.resourcesService.createResource(data);
    }
    async updateResource(id, body, file) {
        const data = {};
        if (body.title !== undefined)
            data.title = body.title;
        if (body.author !== undefined)
            data.author = body.author;
        if (body.description !== undefined)
            data.description = body.description;
        if (body.type !== undefined)
            data.type = body.type;
        if (body.pricingType !== undefined)
            data.pricingType = body.pricingType;
        if (body.price !== undefined)
            data.price = Number(body.price) || 0;
        if (body.currency !== undefined)
            data.currency = body.currency;
        if (body.stockQuantity !== undefined) {
            data.stockQuantity =
                body.type === 'ebook'
                    ? null
                    : Number(body.stockQuantity) || 0;
        }
        if (body.coverImageUrl !== undefined)
            data.coverImageUrl = body.coverImageUrl;
        if (file) {
            data.filePath = `/uploads/resources/ebooks/${file.filename}`;
            data.fileName = file.originalname;
            data.fileSizeBytes = file.size;
            data.fileMimeType = file.mimetype;
        }
        const updated = await this.resourcesService.updateResource(id, data);
        if (!updated) {
            throw new NotFoundException(`Resource with ID ${id} not found`);
        }
        return updated;
    }
    async deleteResource(id) {
        const success = await this.resourcesService.deleteResource(id);
        if (!success) {
            throw new NotFoundException(`Resource with ID ${id} not found`);
        }
        return { success: true, message: `Resource #${id} permanently deleted` };
    }
    async getPhysicalOrders(query) {
        return this.resourcesService.findAllPhysicalOrders(query);
    }
    async createPhysicalOrder(body) {
        return this.resourcesService.createPhysicalOrder(body);
    }
    async updatePhysicalOrderStatus(id, body) {
        return this.resourcesService.updatePhysicalOrderStatus(id, body.status, body.dispatchNotes);
    }
    async getResources() {
        const physicalOrders = await this.resourcesService.findAllPhysicalOrders();
        if (physicalOrders.length > 0) {
            return physicalOrders.map((o) => ({
                id: o.id,
                telegramId: String(o.telegramId),
                clientName: o.clientName,
                phone: o.phone,
                resourceTitle: o.resourceTitle,
                amount: Number(o.totalAmount),
                currency: o.currency,
                status: o.status,
                date: new Date(o.createdAt).toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric',
                }),
            }));
        }
        const [purchases, clients] = await Promise.all([
            this.resourcesService.getAllPurchases(),
            this.clientsService.findAll(),
        ]);
        const clientMap = new Map(clients.map((c) => [String(c.telegramId), c]));
        return purchases.map((item) => {
            const client = clientMap.get(String(item.telegramId));
            return {
                ...item,
                clientName: client?.fullName || client?.firstName || `User #${item.telegramId}`,
                phone: client?.phone || 'N/A',
            };
        });
    }
    async getQuestions() {
        return this.questionsService.getAll();
    }
    async answerQuestion(id, body) {
        if (!body || !body.answer || !body.answer.trim()) {
            throw new BadRequestException('Answer text is required.');
        }
        const saved = await this.questionsService.answerQuestion(id, body);
        let channelBroadcast = null;
        if (body.postToChannel) {
            channelBroadcast = await this.botService.broadcastQuestionToChannel({
                referenceNumber: saved.referenceNumber,
                category: saved.category,
                question: saved.question,
                answer: saved.answer,
                counselorName: saved.assignedCounselor,
            });
            if (channelBroadcast.success && channelBroadcast.messageId) {
                await this.questionsService.updateChannelPost(saved.id, channelBroadcast.messageId);
                saved.postedToChannel = true;
                saved.telegramMessageId = channelBroadcast.messageId;
                saved.postedToChannelAt = new Date();
            }
        }
        return {
            ...saved,
            channelBroadcast,
        };
    }
    async deleteQuestion(id) {
        const success = await this.questionsService.deleteQuestion(id);
        if (!success) {
            throw new NotFoundException(`Question #${id} not found.`);
        }
        return { success: true, message: `Question #${id} deleted successfully.` };
    }
    async getPaymentSettings() {
        return this.paymentSettingsService.getFormattedAccounts();
    }
    async updatePaymentSettings(body) {
        return this.paymentSettingsService.updateAccounts(body);
    }
    async getResourceOrders(status, search) {
        return this.resourcesService.findAllResourceOrders({
            paymentStatus: status,
            search,
        });
    }
    async confirmResourceOrderPayment(id, body) {
        const { order, resource, alreadyVerified } = await this.resourcesService.confirmOrderPayment(id, body?.adminNotes);
        if (alreadyVerified) {
            return {
                success: true,
                order,
                message: 'Order was already verified and delivered.',
            };
        }
        let dispatchResult = false;
        let dispatchError = null;
        if (order.resourceType === 'ebook' || (resource && resource.type === 'ebook') || (resource && resource.filePath)) {
            try {
                const fullDiskPath = resolveUploadDiskPath(resource?.filePath, resource?.fileName || `${order.resourceTitle}.pdf`);
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
                    fs.mkdirSync(path.dirname(fullDiskPath), { recursive: true });
                    const cleanTitle = (resource?.title || order.resourceTitle);
                    fs.writeFileSync(fullDiskPath, generateValidPdfBuffer(cleanTitle, resource?.author || undefined));
                }
                const caption = `🎉 <b>Payment Verified!</b>\n\n` +
                    `Thank you for your purchase of <b>${order.resourceTitle}</b>.\n` +
                    `Here is your official digital e-book. You can download and keep it permanently!`;
                dispatchResult = await this.botService.sendDocumentToUser(order.telegramId, fullDiskPath, resource?.fileName || `${order.resourceTitle}.pdf`, caption);
                if (dispatchResult) {
                    await this.resourcesService.markOrderDelivered(order.id);
                    order.fulfillmentStatus = 'delivered';
                }
            }
            catch (err) {
                dispatchError = err.message || 'Failed to dispatch document';
                await this.resourcesService.markOrderDeliveryFailed(order.id, dispatchError || 'Unknown dispatch error');
                order.fulfillmentStatus = 'failed_delivery';
            }
        }
        else {
            await this.botService.sendMessageToUser(order.telegramId, `🎉 <b>Payment Verified!</b>\n\n` +
                `Your payment for <b>${order.resourceTitle}</b> (Order <code>${order.orderNumber}</code>) has been approved by our ministry team!\n\n` +
                `📦 Our courier fulfillment team is preparing your print copy. We will contact you at your phone number with tracking and delivery updates.`);
            await this.resourcesService.markOrderDelivered(order.id);
            order.fulfillmentStatus = 'delivered';
            dispatchResult = true;
        }
        return {
            success: true,
            order,
            dispatched: dispatchResult,
            dispatchError,
        };
    }
    async rejectResourceOrderPayment(id, body) {
        if (!body || !body.reason || !body.reason.trim()) {
            throw new BadRequestException('Rejection reason is required.');
        }
        const order = await this.resourcesService.rejectOrderPayment(id, body.reason.trim());
        if (!order) {
            throw new NotFoundException(`Order #${id} not found.`);
        }
        await this.botService.sendMessageToUser(order.telegramId, `⚠️ <b>Payment Notice for Order ${order.orderNumber}</b>\n\n` +
            `Our team could not verify the transfer for <b>${order.resourceTitle}</b>.\n\n` +
            `<b>Reason:</b> ${body.reason.trim()}\n\n` +
            `Please verify your transfer in your Telebirr / CBE app or contact our team if you believe this is an error.`);
        return { success: true, order };
    }
    async deletePhysicalOrder(id) {
        const success = await this.resourcesService.deletePhysicalOrder(id);
        if (!success) {
            throw new NotFoundException(`Physical order #${id} not found.`);
        }
        return { success: true, message: `Physical order #${id} deleted successfully.` };
    }
    async deleteResourceOrder(id) {
        const success = await this.resourcesService.deleteResourceOrder(id);
        if (!success) {
            throw new NotFoundException(`Resource order #${id} not found.`);
        }
        return { success: true, message: `Resource order #${id} deleted successfully.` };
    }
    async getDonations(status, search) {
        return this.donationsService.findAll({ status, search });
    }
    async verifyDonation(id, body) {
        const donation = await this.donationsService.updateStatus(id, 'verified', body?.adminNotes);
        return { success: true, donation, message: 'Donation verified successfully.' };
    }
    async rejectDonation(id, body) {
        const donation = await this.donationsService.updateStatus(id, 'rejected', body?.reason);
        return { success: true, donation, message: 'Donation marked as rejected.' };
    }
    async deleteDonation(id) {
        const success = await this.donationsService.delete(id);
        if (!success) {
            throw new NotFoundException(`Donation #${id} not found.`);
        }
        return { success: true, message: `Donation #${id} deleted successfully.` };
    }
    async broadcastBotUpdate(body) {
        if (!body?.version?.trim()) {
            throw new BadRequestException('Version number is required.');
        }
        const clients = await this.clientsService.findAll();
        const telegramIds = Array.from(new Set(clients.map((c) => c.telegramId).filter(Boolean)));
        const result = await this.botService.broadcastBotUpdate(telegramIds, body.version.trim(), body.releaseNotes?.trim());
        return {
            success: true,
            sent: result.sent,
            failed: result.failed,
            message: `Bot update announcement sent to ${result.sent} user(s).`,
        };
    }
};
__decorate([
    Get('stats'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "getStats", null);
__decorate([
    Get('clients'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "getClients", null);
__decorate([
    Post('clients'),
    __param(0, Body()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "createClient", null);
__decorate([
    Patch('clients/:id'),
    __param(0, Param('id', ParseIntPipe)),
    __param(1, Body()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, Object]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "updateClient", null);
__decorate([
    Delete('clients/:id'),
    __param(0, Param('id', ParseIntPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "deleteClient", null);
__decorate([
    Get('counseling'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "getCounseling", null);
__decorate([
    Post('counseling'),
    __param(0, Body()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "createCounseling", null);
__decorate([
    Patch('counseling/:id'),
    __param(0, Param('id', ParseIntPipe)),
    __param(1, Body()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, Object]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "updateCounseling", null);
__decorate([
    Delete('counseling/:id'),
    __param(0, Param('id', ParseIntPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "deleteCounseling", null);
__decorate([
    Get('inner-healing'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "getInnerHealing", null);
__decorate([
    Patch('inner-healing/:id'),
    __param(0, Param('id', ParseIntPipe)),
    __param(1, Body()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, Object]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "updateInnerHealing", null);
__decorate([
    Get('courses'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "getCourses", null);
__decorate([
    Get('courses/catalog'),
    __param(0, Query()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "getCoursesCatalog", null);
__decorate([
    Get('courses/catalog/:id'),
    __param(0, Param('id', ParseIntPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "getCourseDetails", null);
__decorate([
    Post('courses/catalog'),
    UseInterceptors(FileInterceptor('banner', {
        storage: diskStorage({
            destination: (req, file, cb) => {
                const dir = path.resolve(process.cwd(), 'uploads/temp');
                fs.mkdirSync(dir, { recursive: true });
                cb(null, dir);
            },
            filename: (req, file, cb) => {
                const clean = file.originalname.replace(/[^a-zA-Z0-9.-]/g, '_');
                cb(null, `temp-${Date.now()}-${clean}`);
            },
        }),
        limits: { fileSize: 15 * 1024 * 1024 },
    })),
    __param(0, Body()),
    __param(1, UploadedFile()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "createCourse", null);
__decorate([
    Patch('courses/catalog/:id'),
    UseInterceptors(FileInterceptor('banner', {
        storage: diskStorage({
            destination: (req, file, cb) => {
                const dir = path.resolve(process.cwd(), 'uploads/temp');
                fs.mkdirSync(dir, { recursive: true });
                cb(null, dir);
            },
            filename: (req, file, cb) => {
                const clean = file.originalname.replace(/[^a-zA-Z0-9.-]/g, '_');
                cb(null, `temp-${Date.now()}-${clean}`);
            },
        }),
        limits: { fileSize: 15 * 1024 * 1024 },
    })),
    __param(0, Param('id', ParseIntPipe)),
    __param(1, Body()),
    __param(2, UploadedFile()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, Object, Object]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "updateCourse", null);
__decorate([
    Delete('courses/catalog/:id'),
    __param(0, Param('id', ParseIntPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "deleteCourse", null);
__decorate([
    Post('courses/catalog/:courseId/modules'),
    UseInterceptors(FileInterceptor('banner', {
        storage: diskStorage({
            destination: (req, file, cb) => {
                const dir = path.resolve(process.cwd(), 'uploads/temp');
                fs.mkdirSync(dir, { recursive: true });
                cb(null, dir);
            },
            filename: (req, file, cb) => {
                const clean = file.originalname.replace(/[^a-zA-Z0-9.-]/g, '_');
                cb(null, `temp-mod-${Date.now()}-${clean}`);
            },
        }),
        limits: { fileSize: 15 * 1024 * 1024 },
    })),
    __param(0, Param('courseId', ParseIntPipe)),
    __param(1, Body()),
    __param(2, UploadedFile()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, Object, Object]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "createModule", null);
__decorate([
    Patch('courses/catalog/:courseId/modules/:moduleId'),
    UseInterceptors(FileInterceptor('banner', {
        storage: diskStorage({
            destination: (req, file, cb) => {
                const dir = path.resolve(process.cwd(), 'uploads/temp');
                fs.mkdirSync(dir, { recursive: true });
                cb(null, dir);
            },
            filename: (req, file, cb) => {
                const clean = file.originalname.replace(/[^a-zA-Z0-9.-]/g, '_');
                cb(null, `temp-mod-${Date.now()}-${clean}`);
            },
        }),
        limits: { fileSize: 15 * 1024 * 1024 },
    })),
    __param(0, Param('courseId', ParseIntPipe)),
    __param(1, Param('moduleId', ParseIntPipe)),
    __param(2, Body()),
    __param(3, UploadedFile()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, Number, Object, Object]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "updateModule", null);
__decorate([
    Delete('courses/catalog/:courseId/modules/:moduleId'),
    __param(0, Param('courseId', ParseIntPipe)),
    __param(1, Param('moduleId', ParseIntPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, Number]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "deleteModule", null);
__decorate([
    Post('courses/catalog/:courseId/modules/:moduleId/sections'),
    __param(0, Param('moduleId', ParseIntPipe)),
    __param(1, Body()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, Object]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "createSection", null);
__decorate([
    Patch('courses/catalog/sections/:sectionId'),
    __param(0, Param('sectionId', ParseIntPipe)),
    __param(1, Body()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, Object]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "updateSection", null);
__decorate([
    Delete('courses/catalog/sections/:sectionId'),
    __param(0, Param('sectionId', ParseIntPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "deleteSection", null);
__decorate([
    Post('courses/catalog/:courseId/modules/:moduleId/sections/:sectionId/materials'),
    UseInterceptors(FileInterceptor('file', {
        storage: diskStorage({
            destination: (req, file, cb) => {
                const dir = path.resolve(process.cwd(), 'uploads/temp');
                fs.mkdirSync(dir, { recursive: true });
                cb(null, dir);
            },
            filename: (req, file, cb) => {
                const clean = file.originalname.replace(/[^a-zA-Z0-9.-]/g, '_');
                cb(null, `temp-mat-${Date.now()}-${clean}`);
            },
        }),
        limits: { fileSize: 100 * 1024 * 1024 },
    })),
    __param(0, Param('courseId', ParseIntPipe)),
    __param(1, Param('moduleId', ParseIntPipe)),
    __param(2, Param('sectionId', ParseIntPipe)),
    __param(3, Body()),
    __param(4, UploadedFile()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, Number, Number, Object, Object]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "uploadSectionMaterial", null);
__decorate([
    Delete('courses/catalog/materials/:materialId'),
    __param(0, Param('materialId', ParseIntPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "deleteMaterial", null);
__decorate([
    Get('courses/enrollments'),
    __param(0, Query('courseId')),
    __param(1, Query('paymentStatus')),
    __param(2, Query('status')),
    __param(3, Query('search')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String, String]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "getCourseEnrollments", null);
__decorate([
    Get('courses/enrollments/:id'),
    __param(0, Param('id', ParseIntPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "getCourseEnrollmentById", null);
__decorate([
    Post('courses/enrollments/:id/verify'),
    __param(0, Param('id', ParseIntPipe)),
    __param(1, Body()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, Object]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "verifyCourseEnrollment", null);
__decorate([
    Post('courses/enrollments/:id/reject'),
    __param(0, Param('id', ParseIntPipe)),
    __param(1, Body()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, Object]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "rejectCourseEnrollment", null);
__decorate([
    Delete('courses/enrollments/:id'),
    __param(0, Param('id', ParseIntPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "deleteCourseEnrollment", null);
__decorate([
    Get('resources/catalog'),
    __param(0, Query()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "getResourcesCatalog", null);
__decorate([
    Post('resources'),
    UseInterceptors(FileInterceptor('file', {
        storage: diskStorage({
            destination: (req, file, cb) => {
                const dir = path.resolve(process.cwd(), 'uploads/resources/ebooks');
                fs.mkdirSync(dir, { recursive: true });
                cb(null, dir);
            },
            filename: (req, file, cb) => {
                const clean = file.originalname.replace(/[^a-zA-Z0-9.-]/g, '_');
                cb(null, `${Date.now()}-${clean}`);
            },
        }),
        limits: { fileSize: 50 * 1024 * 1024 },
    })),
    __param(0, Body()),
    __param(1, UploadedFile()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "createResource", null);
__decorate([
    Patch('resources/:id'),
    UseInterceptors(FileInterceptor('file', {
        storage: diskStorage({
            destination: (req, file, cb) => {
                const dir = path.resolve(process.cwd(), 'uploads/resources/ebooks');
                fs.mkdirSync(dir, { recursive: true });
                cb(null, dir);
            },
            filename: (req, file, cb) => {
                const clean = file.originalname.replace(/[^a-zA-Z0-9.-]/g, '_');
                cb(null, `${Date.now()}-${clean}`);
            },
        }),
        limits: { fileSize: 50 * 1024 * 1024 },
    })),
    __param(0, Param('id', ParseIntPipe)),
    __param(1, Body()),
    __param(2, UploadedFile()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, Object, Object]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "updateResource", null);
__decorate([
    Delete('resources/:id'),
    __param(0, Param('id', ParseIntPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "deleteResource", null);
__decorate([
    Get('resources/orders'),
    __param(0, Query()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "getPhysicalOrders", null);
__decorate([
    Post('resources/orders'),
    __param(0, Body()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "createPhysicalOrder", null);
__decorate([
    Patch('resources/orders/:id/status'),
    __param(0, Param('id', ParseIntPipe)),
    __param(1, Body()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, Object]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "updatePhysicalOrderStatus", null);
__decorate([
    Get('resources'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "getResources", null);
__decorate([
    Get('questions'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "getQuestions", null);
__decorate([
    Patch('questions/:id/answer'),
    __param(0, Param('id', ParseIntPipe)),
    __param(1, Body()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, Object]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "answerQuestion", null);
__decorate([
    Delete('questions/:id'),
    __param(0, Param('id', ParseIntPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "deleteQuestion", null);
__decorate([
    Get('payment-settings'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "getPaymentSettings", null);
__decorate([
    Patch('payment-settings'),
    __param(0, Body()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "updatePaymentSettings", null);
__decorate([
    Get('resource-orders'),
    __param(0, Query('status')),
    __param(1, Query('search')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "getResourceOrders", null);
__decorate([
    Post('resource-orders/:id/confirm-payment'),
    __param(0, Param('id', ParseIntPipe)),
    __param(1, Body()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, Object]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "confirmResourceOrderPayment", null);
__decorate([
    Post('resource-orders/:id/reject-payment'),
    __param(0, Param('id', ParseIntPipe)),
    __param(1, Body()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, Object]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "rejectResourceOrderPayment", null);
__decorate([
    Delete('resources/orders/:id'),
    __param(0, Param('id', ParseIntPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "deletePhysicalOrder", null);
__decorate([
    Delete('resource-orders/:id'),
    __param(0, Param('id', ParseIntPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "deleteResourceOrder", null);
__decorate([
    Get('donations'),
    __param(0, Query('status')),
    __param(1, Query('search')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "getDonations", null);
__decorate([
    Post('donations/:id/verify'),
    __param(0, Param('id', ParseIntPipe)),
    __param(1, Body()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, Object]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "verifyDonation", null);
__decorate([
    Post('donations/:id/reject'),
    __param(0, Param('id', ParseIntPipe)),
    __param(1, Body()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, Object]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "rejectDonation", null);
__decorate([
    Delete('donations/:id'),
    __param(0, Param('id', ParseIntPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "deleteDonation", null);
__decorate([
    Post('bot/broadcast-update'),
    __param(0, Body()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "broadcastBotUpdate", null);
AdminController = __decorate([
    Controller('api/admin'),
    __metadata("design:paramtypes", [ClientsService,
        CounselingService,
        InnerHealingService,
        CoursesService,
        CourseEnrollmentsService,
        ResourcesService,
        AnonymousQuestionsService,
        PaymentSettingsService,
        DonationsService,
        BotService])
], AdminController);
export { AdminController };
//# sourceMappingURL=admin.controller.js.map