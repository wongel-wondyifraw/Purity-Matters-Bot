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
var ResourcesService_1;
import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like, In } from 'typeorm';
import * as path from 'path';
import * as fs from 'fs';
import { ResourcePurchase } from '../database/entities/resource-purchase.entity.js';
import { Resource } from '../database/entities/resource.entity.js';
import { PhysicalBookOrder, } from '../database/entities/physical-book-order.entity.js';
import { ResourceOrder, } from '../database/entities/resource-order.entity.js';
let ResourcesService = ResourcesService_1 = class ResourcesService {
    purchaseRepo;
    resourceRepo;
    physicalOrderRepo;
    orderRepo;
    logger = new Logger(ResourcesService_1.name);
    catalog = [
        {
            id: 'res_free_guide',
            title: '🛡️ Daily Purity Battle Guide (PDF)',
            category: 'guide',
            isPaid: false,
            price: 0,
            currency: 'ETB',
            description: 'Essential practical disciplines, morning declarations, and mind renewal tools for daily victory.',
            downloadUrl: '/uploads/resources/ebooks/daily-purity-battle-guide.pdf',
        },
        {
            id: 'res_ebook_wholeness',
            title: '📖 Breaking Chains: The Wholeness Journey (E-Book)',
            category: 'ebook',
            isPaid: true,
            price: 250,
            currency: 'ETB',
            description: 'A deep-dive handbook tackling neurological patterns, generational cycles, and sustained freedom.',
            downloadUrl: '/uploads/resources/ebooks/breaking-chains-ebook.pdf',
        },
        {
            id: 'res_ebook_wounds',
            title: '🕊️ Healing Father & Mother Wounds (E-Book)',
            category: 'ebook',
            isPaid: true,
            price: 350,
            currency: 'ETB',
            description: 'Overcoming deep rejection and restoring God-given identity through biblical inner healing.',
            downloadUrl: '/uploads/resources/ebooks/healing-family-wounds.pdf',
        },
    ];
    constructor(purchaseRepo, resourceRepo, physicalOrderRepo, orderRepo) {
        this.purchaseRepo = purchaseRepo;
        this.resourceRepo = resourceRepo;
        this.physicalOrderRepo = physicalOrderRepo;
        this.orderRepo = orderRepo;
    }
    async onModuleInit() {
        if (process.env.SEED_SAMPLE_RESOURCES === 'true') {
            try {
                const count = await this.resourceRepo.count();
                if (count === 0) {
                    this.logger.log('SEED_SAMPLE_RESOURCES=true: Seeding initial Resources into database...');
                    await this.resourceRepo.save([
                        {
                            title: '🛡️ Daily Purity Battle Guide (PDF)',
                            author: 'Pastoral Care Team',
                            description: 'Essential practical disciplines, morning declarations, and scripture-rooted mind renewal tools for daily victory.',
                            type: 'ebook',
                            pricingType: 'free',
                            price: 0,
                            currency: 'ETB',
                            filePath: '/uploads/resources/ebooks/daily-purity-battle-guide.pdf',
                            fileName: 'daily-purity-battle-guide.pdf',
                            fileSizeBytes: 2450000,
                            fileMimeType: 'application/pdf',
                            stockQuantity: null,
                            coverImageUrl: null,
                            isActive: true,
                        },
                        {
                            title: '📖 Breaking Chains: The Wholeness Journey',
                            author: 'Dr. Selamawit & Team',
                            description: 'A deep-dive handbook tackling neurological habit loops, emotional triggers, and sustained spiritual freedom.',
                            type: 'ebook',
                            pricingType: 'paid',
                            price: 250,
                            currency: 'ETB',
                            filePath: '/uploads/resources/ebooks/breaking-chains-ebook.pdf',
                            fileName: 'breaking-chains-ebook.pdf',
                            fileSizeBytes: 5800000,
                            fileMimeType: 'application/pdf',
                            stockQuantity: null,
                            coverImageUrl: null,
                            isActive: true,
                        },
                        {
                            title: '🕊️ Healing Father & Mother Wounds (Physical Paperback)',
                            author: 'Pastor Daniel & Dr. Selamawit',
                            description: 'Printed physical copy addressing identity restoration, breaking rejection patterns, and deep healing.',
                            type: 'physical_book',
                            pricingType: 'paid',
                            price: 350,
                            currency: 'ETB',
                            filePath: null,
                            fileName: null,
                            fileSizeBytes: null,
                            fileMimeType: null,
                            stockQuantity: 85,
                            coverImageUrl: null,
                            isActive: true,
                        },
                        {
                            title: '🌱 40 Days to Clean Hands & Pure Heart (Physical Devotional)',
                            author: 'Purity Matters Ministry',
                            description: 'Deluxe physical journal with 40 daily readings, trigger reflection templates, and prayer declarations.',
                            type: 'physical_book',
                            pricingType: 'paid',
                            price: 450,
                            currency: 'ETB',
                            filePath: null,
                            fileName: null,
                            fileSizeBytes: null,
                            fileMimeType: null,
                            stockQuantity: 120,
                            coverImageUrl: null,
                            isActive: true,
                        },
                    ]);
                    this.logger.log('Initial resources successfully seeded.');
                }
            }
            catch (err) {
                this.logger.warn('Resource seed skipped or deferred', err);
            }
        }
    }
    async findAllResources(filter) {
        const where = { isActive: true };
        if (filter?.type && filter.type !== 'all') {
            where.type = filter.type;
        }
        if (filter?.pricingType && filter.pricingType !== 'all') {
            where.pricingType = filter.pricingType;
        }
        if (filter?.search) {
            where.title = Like(`%${filter.search}%`);
        }
        return this.resourceRepo.find({
            where,
            order: { createdAt: 'DESC' },
        });
    }
    async findResourceById(id) {
        return this.resourceRepo.findOne({ where: { id } });
    }
    async createResource(data) {
        const entity = this.resourceRepo.create({
            ...data,
            price: data.pricingType === 'free' ? 0 : Number(data.price) || 0,
            stockQuantity: data.type === 'physical_book' ? Number(data.stockQuantity) || 0 : null,
            isActive: true,
        });
        return this.resourceRepo.save(entity);
    }
    async updateResource(id, data) {
        const item = await this.findResourceById(id);
        if (!item)
            return null;
        if (data.filePath && item.filePath && data.filePath !== item.filePath) {
            try {
                const oldFileRel = item.filePath.startsWith('/') ? item.filePath.slice(1) : item.filePath;
                const oldDiskPath = path.resolve(process.cwd(), oldFileRel);
                if (fs.existsSync(oldDiskPath)) {
                    fs.unlinkSync(oldDiskPath);
                    this.logger.log(`Removed previous file version: ${oldDiskPath}`);
                }
            }
            catch (err) {
                this.logger.warn(`Could not delete previous file for resource #${id}:`, err);
            }
        }
        Object.assign(item, data);
        if (data.pricingType === 'free') {
            item.price = 0;
        }
        else if (data.price !== undefined) {
            item.price = Number(data.price) || 0;
        }
        if (data.type === 'physical_book') {
            if (data.stockQuantity !== undefined) {
                item.stockQuantity = Number(data.stockQuantity) || 0;
            }
        }
        else if (data.type === 'ebook') {
            item.stockQuantity = null;
        }
        return this.resourceRepo.save(item);
    }
    async deleteResource(id) {
        const item = await this.findResourceById(id);
        if (!item)
            return false;
        if (item.filePath) {
            try {
                const fileRel = item.filePath.startsWith('/') ? item.filePath.slice(1) : item.filePath;
                const fullDiskPath = path.resolve(process.cwd(), fileRel);
                if (fs.existsSync(fullDiskPath)) {
                    fs.unlinkSync(fullDiskPath);
                    this.logger.log(`Successfully deleted file from disk: ${fullDiskPath}`);
                }
            }
            catch (err) {
                this.logger.warn(`Could not remove file for resource #${id}:`, err);
            }
        }
        await this.resourceRepo.remove(item);
        this.logger.log(`Permanently removed resource #${id} ("${item.title}") from database.`);
        return true;
    }
    async findAllPhysicalOrders(filter) {
        const where = {};
        if (filter?.status && filter.status !== 'all') {
            where.status = filter.status;
        }
        return this.physicalOrderRepo.find({
            where,
            order: { createdAt: 'DESC' },
        });
    }
    async findPhysicalOrderById(id) {
        return this.physicalOrderRepo.findOne({ where: { id } });
    }
    async createPhysicalOrder(data) {
        const orderNumber = `PBO-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;
        const entity = this.physicalOrderRepo.create({
            ...data,
            orderNumber,
            currency: data.currency || 'ETB',
            status: 'pending',
            paymentStatus: 'pending',
        });
        if (data.resourceId) {
            const book = await this.findResourceById(data.resourceId);
            if (book && typeof book.stockQuantity === 'number') {
                const qty = data.quantity || 1;
                book.stockQuantity = Math.max(0, book.stockQuantity - qty);
                await this.resourceRepo.save(book);
            }
        }
        return this.physicalOrderRepo.save(entity);
    }
    async updatePhysicalOrderStatus(id, status, dispatchNotes) {
        const order = await this.findPhysicalOrderById(id);
        if (!order)
            return null;
        order.status = status;
        if (dispatchNotes !== undefined) {
            order.dispatchNotes = dispatchNotes;
        }
        if (status === 'delivered') {
            order.paymentStatus = 'verified';
        }
        return this.physicalOrderRepo.save(order);
    }
    getCatalog() {
        return this.catalog;
    }
    getResource(id) {
        return this.catalog.find((item) => item.id === id);
    }
    async hasAccess(telegramId, resourceId) {
        const strId = String(resourceId);
        const numId = Number(resourceId);
        if (!isNaN(numId)) {
            const dbRes = await this.findResourceById(numId);
            if (dbRes) {
                if (dbRes.pricingType === 'free' || Number(dbRes.price) === 0) {
                    return true;
                }
                const verifiedOrder = await this.orderRepo.findOne({
                    where: {
                        telegramId: String(telegramId),
                        resourceId: numId,
                        paymentStatus: 'verified',
                    },
                });
                if (verifiedOrder)
                    return true;
                const purchase = await this.purchaseRepo.findOne({
                    where: {
                        telegramId: String(telegramId),
                        resourceId: strId,
                        status: 'completed',
                    },
                });
                return !!purchase;
            }
        }
        const mockRes = this.getResource(strId);
        if (mockRes) {
            if (!mockRes.isPaid || Number(mockRes.price) === 0) {
                return true;
            }
            const purchase = await this.purchaseRepo.findOne({
                where: {
                    telegramId: String(telegramId),
                    resourceId: strId,
                    status: 'completed',
                },
            });
            return !!purchase;
        }
        return false;
    }
    async grantAccess(telegramId, resourceId) {
        const strId = String(resourceId);
        let title = 'Resource Document';
        let amount = 0;
        let currency = 'ETB';
        let downloadUrl = null;
        if (!isNaN(Number(resourceId))) {
            const dbRes = await this.findResourceById(Number(resourceId));
            if (dbRes) {
                title = dbRes.title;
                amount = dbRes.price;
                currency = dbRes.currency || 'ETB';
                downloadUrl = dbRes.filePath || null;
            }
        }
        if (title === 'Resource Document') {
            const mockRes = this.getResource(strId);
            if (mockRes) {
                title = mockRes.title;
                amount = mockRes.price;
                currency = mockRes.currency || 'ETB';
                downloadUrl = mockRes.downloadUrl;
            }
        }
        let purchase = await this.purchaseRepo.findOne({
            where: { telegramId: String(telegramId), resourceId: strId },
        });
        if (!purchase) {
            purchase = this.purchaseRepo.create({
                telegramId: String(telegramId),
                resourceId: strId,
                resourceTitle: title,
                amount,
                currency,
                status: 'completed',
                downloadUrl: downloadUrl || null,
            });
            await this.purchaseRepo.save(purchase);
            this.logger.log(`Access granted to ${resourceId} for client ${telegramId}`);
        }
        return purchase;
    }
    async getMyPurchases(telegramId) {
        const purchases = await this.purchaseRepo.find({
            where: { telegramId: String(telegramId), status: 'completed' },
            order: { createdAt: 'DESC' },
        });
        const verifiedOrders = await this.orderRepo.find({
            where: {
                telegramId: String(telegramId),
                paymentStatus: 'verified',
            },
            order: { createdAt: 'DESC' },
        });
        for (const order of verifiedOrders) {
            const exists = purchases.some((p) => p.resourceId === String(order.resourceId));
            if (!exists) {
                purchases.push({
                    id: order.id,
                    telegramId: order.telegramId,
                    resourceId: String(order.resourceId),
                    resourceTitle: order.resourceTitle,
                    amount: order.amount,
                    currency: order.currency,
                    status: 'completed',
                    downloadUrl: null,
                    createdAt: order.createdAt,
                });
            }
        }
        return purchases;
    }
    async getAllPurchases() {
        return this.purchaseRepo.find({
            order: { createdAt: 'DESC' },
        });
    }
    async countPurchases() {
        return this.purchaseRepo.count();
    }
    async createResourceOrder(data) {
        const resource = await this.findResourceById(data.resourceId);
        if (!resource) {
            throw new Error(`Resource #${data.resourceId} not found.`);
        }
        const orderNumber = `PM-ORD-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;
        const entity = this.orderRepo.create({
            orderNumber,
            resourceId: resource.id,
            resourceTitle: resource.title,
            resourceType: resource.type,
            telegramId: String(data.telegramId),
            clientName: data.clientName || 'Telegram Client',
            username: data.username || null,
            phone: data.phone || null,
            amount: resource.price,
            currency: resource.currency || 'ETB',
            paymentMethod: data.paymentMethod || 'telebirr',
            paymentStatus: 'pending',
            fulfillmentStatus: 'pending',
        });
        const saved = await this.orderRepo.save(entity);
        this.logger.log(`Created ResourceOrder #${saved.orderNumber} for client ${saved.telegramId}`);
        return saved;
    }
    async submitOrderPayment(orderId, paymentMethod, paymentReference) {
        const order = await this.orderRepo.findOne({ where: { id: orderId } });
        if (!order)
            return null;
        order.paymentMethod = paymentMethod;
        if (paymentReference) {
            order.paymentReference = paymentReference;
        }
        order.paymentStatus = 'payment_submitted';
        order.paymentSubmittedAt = new Date();
        const saved = await this.orderRepo.save(order);
        this.logger.log(`Order #${saved.orderNumber} payment submitted via ${paymentMethod} (Ref: ${paymentReference || 'none'}).`);
        return saved;
    }
    async findAllResourceOrders(filter) {
        const where = {};
        if (filter?.paymentStatus && filter.paymentStatus !== 'all') {
            where.paymentStatus = filter.paymentStatus;
        }
        const orders = await this.orderRepo.find({
            where,
            order: { createdAt: 'DESC' },
        });
        if (filter?.search) {
            const q = filter.search.toLowerCase().trim();
            return orders.filter((o) => o.orderNumber.toLowerCase().includes(q) ||
                o.resourceTitle.toLowerCase().includes(q) ||
                (o.clientName && o.clientName.toLowerCase().includes(q)) ||
                (o.phone && o.phone.toLowerCase().includes(q)) ||
                (o.paymentReference && o.paymentReference.toLowerCase().includes(q)) ||
                o.telegramId.includes(q));
        }
        return orders;
    }
    async findResourceOrderById(id) {
        return this.orderRepo.findOne({ where: { id } });
    }
    async findPendingOrderByUserAndResource(telegramId, resourceId) {
        return this.orderRepo.findOne({
            where: {
                telegramId: String(telegramId),
                resourceId,
                paymentStatus: 'pending',
            },
            order: { createdAt: 'DESC' },
        });
    }
    async findActiveOrderByUserAndResource(telegramId, resourceId) {
        return this.orderRepo.findOne({
            where: {
                telegramId: String(telegramId),
                resourceId,
                paymentStatus: In(['pending', 'payment_submitted']),
            },
            order: { createdAt: 'DESC' },
        });
    }
    async findOrdersByTelegramId(telegramId) {
        return this.orderRepo.find({
            where: { telegramId: String(telegramId) },
            order: { createdAt: 'DESC' },
        });
    }
    async confirmOrderPayment(orderId, adminNotes) {
        const order = await this.findResourceOrderById(orderId);
        if (!order) {
            throw new Error(`Order #${orderId} not found.`);
        }
        const resource = await this.findResourceById(order.resourceId);
        if (order.paymentStatus === 'verified' && order.fulfillmentStatus === 'delivered') {
            return { order, resource, alreadyVerified: true };
        }
        order.paymentStatus = 'verified';
        order.verifiedAt = new Date();
        if (adminNotes) {
            order.adminNotes = adminNotes;
        }
        const savedOrder = await this.orderRepo.save(order);
        if (resource) {
            await this.purchaseRepo.save({
                telegramId: savedOrder.telegramId,
                resourceId: String(resource.id),
                resourceTitle: resource.title,
                amount: savedOrder.amount,
                currency: savedOrder.currency,
                status: 'completed',
                downloadUrl: resource.filePath || null,
            });
        }
        this.logger.log(`Confirmed payment for order #${savedOrder.orderNumber}`);
        return { order: savedOrder, resource, alreadyVerified: false };
    }
    async rejectOrderPayment(orderId, reason) {
        const order = await this.findResourceOrderById(orderId);
        if (!order)
            return null;
        order.paymentStatus = 'rejected';
        order.adminNotes = reason || 'Payment could not be verified.';
        const saved = await this.orderRepo.save(order);
        this.logger.log(`Rejected payment for order #${saved.orderNumber}: ${reason}`);
        return saved;
    }
    async markOrderDelivered(orderId) {
        const order = await this.findResourceOrderById(orderId);
        if (!order)
            return null;
        order.fulfillmentStatus = 'delivered';
        return this.orderRepo.save(order);
    }
    async markOrderDeliveryFailed(orderId, errorMsg) {
        const order = await this.findResourceOrderById(orderId);
        if (!order)
            return null;
        order.fulfillmentStatus = 'failed_delivery';
        order.adminNotes = `${order.adminNotes ? `${order.adminNotes} | ` : ''}Delivery Error: ${errorMsg}`;
        return this.orderRepo.save(order);
    }
    async deletePhysicalOrder(id) {
        const order = await this.findPhysicalOrderById(id);
        if (!order)
            return false;
        await this.physicalOrderRepo.remove(order);
        this.logger.log(`Deleted PhysicalBookOrder #${id} (${order.orderNumber})`);
        return true;
    }
    async deleteResourceOrder(id) {
        const order = await this.findResourceOrderById(id);
        if (!order)
            return false;
        await this.orderRepo.remove(order);
        this.logger.log(`Deleted ResourceOrder #${id} (${order.orderNumber})`);
        return true;
    }
};
ResourcesService = ResourcesService_1 = __decorate([
    Injectable(),
    __param(0, InjectRepository(ResourcePurchase)),
    __param(1, InjectRepository(Resource)),
    __param(2, InjectRepository(PhysicalBookOrder)),
    __param(3, InjectRepository(ResourceOrder)),
    __metadata("design:paramtypes", [Repository,
        Repository,
        Repository,
        Repository])
], ResourcesService);
export { ResourcesService };
//# sourceMappingURL=resources.service.js.map