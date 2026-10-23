import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like, FindOptionsWhere, In } from 'typeorm';
import * as path from 'path';
import * as fs from 'fs';
import { ResourcePurchase } from '../database/entities/resource-purchase.entity.js';
import { Resource, ResourceType, PricingType } from '../database/entities/resource.entity.js';
import {
  PhysicalBookOrder,
  PhysicalOrderStatus,
} from '../database/entities/physical-book-order.entity.js';
import {
  ResourceOrder,
  ResourcePaymentStatus,
  ResourceFulfillmentStatus,
} from '../database/entities/resource-order.entity.js';

export interface ResourceItem {
  id: string;
  title: string;
  category: 'guide' | 'ebook' | 'devotional';
  isPaid: boolean;
  price: number;
  currency: string;
  description: string;
  downloadUrl: string;
}

@Injectable()
export class ResourcesService implements OnModuleInit {
  private readonly logger = new Logger(ResourcesService.name);

  // In-memory fallback catalog for instant bot replies
  private readonly catalog: ResourceItem[] = [
    {
      id: 'res_free_guide',
      title: '🛡️ Daily Purity Battle Guide (PDF)',
      category: 'guide',
      isPaid: false,
      price: 0,
      currency: 'ETB',
      description:
        'Essential practical disciplines, morning declarations, and mind renewal tools for daily victory.',
      downloadUrl: '/uploads/resources/ebooks/daily-purity-battle-guide.pdf',
    },
    {
      id: 'res_ebook_wholeness',
      title: '📖 Breaking Chains: The Wholeness Journey (E-Book)',
      category: 'ebook',
      isPaid: true,
      price: 250,
      currency: 'ETB',
      description:
        'A deep-dive handbook tackling neurological patterns, generational cycles, and sustained freedom.',
      downloadUrl: '/uploads/resources/ebooks/breaking-chains-ebook.pdf',
    },
    {
      id: 'res_ebook_wounds',
      title: '🕊️ Healing Father & Mother Wounds (E-Book)',
      category: 'ebook',
      isPaid: true,
      price: 350,
      currency: 'ETB',
      description:
        'Overcoming deep rejection and restoring God-given identity through biblical inner healing.',
      downloadUrl: '/uploads/resources/ebooks/healing-family-wounds.pdf',
    },
  ];

  constructor(
    @InjectRepository(ResourcePurchase)
    private readonly purchaseRepo: Repository<ResourcePurchase>,
    @InjectRepository(Resource)
    private readonly resourceRepo: Repository<Resource>,
    @InjectRepository(PhysicalBookOrder)
    private readonly physicalOrderRepo: Repository<PhysicalBookOrder>,
    @InjectRepository(ResourceOrder)
    private readonly orderRepo: Repository<ResourceOrder>,
  ) {}

  async onModuleInit() {
    try {
      const count = await this.resourceRepo.count();
      if (count === 0) {
        this.logger.log('Seeding initial Resources into database...');
        await this.resourceRepo.save([
          {
            title: '🛡️ Daily Purity Battle Guide (PDF)',
            author: 'Pastoral Care Team',
            description:
              'Essential practical disciplines, morning declarations, and scripture-rooted mind renewal tools for daily victory.',
            type: 'ebook' as ResourceType,
            pricingType: 'free' as PricingType,
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
            description:
              'A deep-dive handbook tackling neurological habit loops, emotional triggers, and sustained spiritual freedom.',
            type: 'ebook' as ResourceType,
            pricingType: 'paid' as PricingType,
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
            description:
              'Printed physical copy addressing identity restoration, breaking rejection patterns, and deep healing.',
            type: 'physical_book' as ResourceType,
            pricingType: 'paid' as PricingType,
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
            description:
              'Deluxe physical journal with 40 daily readings, trigger reflection templates, and prayer declarations.',
            type: 'physical_book' as ResourceType,
            pricingType: 'paid' as PricingType,
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
    } catch (err) {
      this.logger.warn('Resource seed skipped or deferred', err);
    }
  }

  // ==========================================
  // RESOURCE CATALOG (E-Books & Physical Books)
  // ==========================================

  async findAllResources(filter?: {
    type?: string;
    pricingType?: string;
    search?: string;
  }): Promise<Resource[]> {
    const where: FindOptionsWhere<Resource> = { isActive: true };

    if (filter?.type && filter.type !== 'all') {
      where.type = filter.type as ResourceType;
    }
    if (filter?.pricingType && filter.pricingType !== 'all') {
      where.pricingType = filter.pricingType as PricingType;
    }
    if (filter?.search) {
      where.title = Like(`%${filter.search}%`);
    }

    return this.resourceRepo.find({
      where,
      order: { createdAt: 'DESC' },
    });
  }

  async findResourceById(id: number): Promise<Resource | null> {
    return this.resourceRepo.findOne({ where: { id } });
  }

  async createResource(data: Partial<Resource>): Promise<Resource> {
    const entity = this.resourceRepo.create({
      ...data,
      price: data.pricingType === 'free' ? 0 : Number(data.price) || 0,
      stockQuantity:
        data.type === 'physical_book' ? Number(data.stockQuantity) || 0 : null,
      isActive: true,
    });
    return this.resourceRepo.save(entity);
  }

  async updateResource(
    id: number,
    data: Partial<Resource>,
  ): Promise<Resource | null> {
    const item = await this.findResourceById(id);
    if (!item) return null;

    // If file was replaced and an old file exists, clean up old file from disk
    if (data.filePath && item.filePath && data.filePath !== item.filePath) {
      try {
        const oldFileRel = item.filePath.startsWith('/') ? item.filePath.slice(1) : item.filePath;
        const oldDiskPath = path.resolve(process.cwd(), oldFileRel);
        if (fs.existsSync(oldDiskPath)) {
          fs.unlinkSync(oldDiskPath);
          this.logger.log(`Removed previous file version: ${oldDiskPath}`);
        }
      } catch (err) {
        this.logger.warn(`Could not delete previous file for resource #${id}:`, err);
      }
    }

    Object.assign(item, data);
    if (data.pricingType === 'free') {
      item.price = 0;
    } else if (data.price !== undefined) {
      item.price = Number(data.price) || 0;
    }

    if (data.type === 'physical_book') {
      if (data.stockQuantity !== undefined) {
        item.stockQuantity = Number(data.stockQuantity) || 0;
      }
    } else if (data.type === 'ebook') {
      item.stockQuantity = null;
    }

    return this.resourceRepo.save(item);
  }

  async deleteResource(id: number): Promise<boolean> {
    const item = await this.findResourceById(id);
    if (!item) return false;

    // Delete uploaded file from disk if present
    if (item.filePath) {
      try {
        const fileRel = item.filePath.startsWith('/') ? item.filePath.slice(1) : item.filePath;
        const fullDiskPath = path.resolve(process.cwd(), fileRel);
        if (fs.existsSync(fullDiskPath)) {
          fs.unlinkSync(fullDiskPath);
          this.logger.log(`Successfully deleted file from disk: ${fullDiskPath}`);
        }
      } catch (err) {
        this.logger.warn(`Could not remove file for resource #${id}:`, err);
      }
    }

    // Permanently remove record from PostgreSQL database
    await this.resourceRepo.remove(item);
    this.logger.log(`Permanently removed resource #${id} ("${item.title}") from database.`);
    return true;
  }

  // ==========================================
  // PHYSICAL BOOK ORDERS (Fulfillment Queue)
  // ==========================================

  async findAllPhysicalOrders(filter?: {
    status?: string;
  }): Promise<PhysicalBookOrder[]> {
    const where: FindOptionsWhere<PhysicalBookOrder> = {};
    if (filter?.status && filter.status !== 'all') {
      where.status = filter.status as PhysicalOrderStatus;
    }

    return this.physicalOrderRepo.find({
      where,
      order: { createdAt: 'DESC' },
    });
  }

  async findPhysicalOrderById(id: number): Promise<PhysicalBookOrder | null> {
    return this.physicalOrderRepo.findOne({ where: { id } });
  }

  async createPhysicalOrder(
    data: Partial<PhysicalBookOrder>,
  ): Promise<PhysicalBookOrder> {
    const orderNumber = `PBO-${new Date().getFullYear()}-${Math.floor(
      1000 + Math.random() * 9000,
    )}`;

    const entity = this.physicalOrderRepo.create({
      ...data,
      orderNumber,
      currency: data.currency || 'ETB',
      status: 'pending',
      paymentStatus: 'pending',
    });

    // Deduct stock if book exists
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

  async updatePhysicalOrderStatus(
    id: number,
    status: PhysicalOrderStatus,
    dispatchNotes?: string,
  ): Promise<PhysicalBookOrder | null> {
    const order = await this.findPhysicalOrderById(id);
    if (!order) return null;

    order.status = status;
    if (dispatchNotes !== undefined) {
      order.dispatchNotes = dispatchNotes;
    }
    if (status === 'delivered') {
      order.paymentStatus = 'verified';
    }

    return this.physicalOrderRepo.save(order);
  }

  // ==========================================
  // LEGACY/COMPATIBILITY METHODS FOR BOT
  // ==========================================

  getCatalog(): ResourceItem[] {
    return this.catalog;
  }

  getResource(id: string): ResourceItem | undefined {
    return this.catalog.find((item) => item.id === id);
  }

  async hasAccess(
    telegramId: string | number,
    resourceId: string | number,
  ): Promise<boolean> {
    const strId = String(resourceId);
    const numId = Number(resourceId);

    // 1. Check database resources first
    if (!isNaN(numId)) {
      const dbRes = await this.findResourceById(numId);
      if (dbRes) {
        // Free resources are instantly accessible
        if (dbRes.pricingType === 'free' || Number(dbRes.price) === 0) {
          return true;
        }

        // Paid: check verified orders first
        const verifiedOrder = await this.orderRepo.findOne({
          where: {
            telegramId: String(telegramId),
            resourceId: numId,
            paymentStatus: 'verified',
          },
        });
        if (verifiedOrder) return true;

        // Paid: check completed purchases
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

    // 2. Check legacy / mock catalog items
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

    // Not found in database or catalog -> no access
    return false;
  }

  async grantAccess(
    telegramId: string | number,
    resourceId: string | number,
  ): Promise<ResourcePurchase | null> {
    const strId = String(resourceId);
    let title = 'Resource Document';
    let amount = 0;
    let currency = 'ETB';
    let downloadUrl: string | null = null;

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
      this.logger.log(
        `Access granted to ${resourceId} for client ${telegramId}`,
      );
    }

    return purchase;
  }

  async getMyPurchases(
    telegramId: string | number,
  ): Promise<ResourcePurchase[]> {
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
        } as ResourcePurchase);
      }
    }

    return purchases;
  }

  async getAllPurchases(): Promise<ResourcePurchase[]> {
    return this.purchaseRepo.find({
      order: { createdAt: 'DESC' },
    });
  }

  async countPurchases(): Promise<number> {
    return this.purchaseRepo.count();
  }

  // ==========================================
  // RESOURCE ORDERS & PAYMENT FLOW (Telebirr & CBE)
  // ==========================================

  async createResourceOrder(data: {
    resourceId: number;
    telegramId: string | number;
    clientName?: string;
    username?: string;
    phone?: string;
    paymentMethod?: string;
  }): Promise<ResourceOrder> {
    const resource = await this.findResourceById(data.resourceId);
    if (!resource) {
      throw new Error(`Resource #${data.resourceId} not found.`);
    }

    const orderNumber = `PM-ORD-${new Date().getFullYear()}-${Math.floor(
      1000 + Math.random() * 9000,
    )}`;

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

  async submitOrderPayment(
    orderId: number,
    paymentMethod: string,
    paymentReference?: string,
  ): Promise<ResourceOrder | null> {
    const order = await this.orderRepo.findOne({ where: { id: orderId } });
    if (!order) return null;

    order.paymentMethod = paymentMethod;
    if (paymentReference) {
      order.paymentReference = paymentReference;
    }
    order.paymentStatus = 'payment_submitted';
    order.paymentSubmittedAt = new Date();

    const saved = await this.orderRepo.save(order);
    this.logger.log(
      `Order #${saved.orderNumber} payment submitted via ${paymentMethod} (Ref: ${paymentReference || 'none'}).`,
    );
    return saved;
  }

  async findAllResourceOrders(filter?: {
    paymentStatus?: string;
    search?: string;
  }): Promise<ResourceOrder[]> {
    const where: any = {};
    if (filter?.paymentStatus && filter.paymentStatus !== 'all') {
      where.paymentStatus = filter.paymentStatus;
    }

    const orders = await this.orderRepo.find({
      where,
      order: { createdAt: 'DESC' },
    });

    if (filter?.search) {
      const q = filter.search.toLowerCase().trim();
      return orders.filter(
        (o) =>
          o.orderNumber.toLowerCase().includes(q) ||
          o.resourceTitle.toLowerCase().includes(q) ||
          (o.clientName && o.clientName.toLowerCase().includes(q)) ||
          (o.phone && o.phone.toLowerCase().includes(q)) ||
          (o.paymentReference && o.paymentReference.toLowerCase().includes(q)) ||
          o.telegramId.includes(q),
      );
    }

    return orders;
  }

  async findResourceOrderById(id: number): Promise<ResourceOrder | null> {
    return this.orderRepo.findOne({ where: { id } });
  }

  async findPendingOrderByUserAndResource(
    telegramId: string | number,
    resourceId: number,
  ): Promise<ResourceOrder | null> {
    return this.orderRepo.findOne({
      where: {
        telegramId: String(telegramId),
        resourceId,
        paymentStatus: 'pending',
      },
      order: { createdAt: 'DESC' },
    });
  }

  async findActiveOrderByUserAndResource(
    telegramId: string | number,
    resourceId: number,
  ): Promise<ResourceOrder | null> {
    return this.orderRepo.findOne({
      where: {
        telegramId: String(telegramId),
        resourceId,
        paymentStatus: In(['pending', 'payment_submitted']),
      },
      order: { createdAt: 'DESC' },
    });
  }

  async findOrdersByTelegramId(
    telegramId: string | number,
  ): Promise<ResourceOrder[]> {
    return this.orderRepo.find({
      where: { telegramId: String(telegramId) },
      order: { createdAt: 'DESC' },
    });
  }

  async confirmOrderPayment(
    orderId: number,
    adminNotes?: string,
  ): Promise<{ order: ResourceOrder; resource: Resource | null; alreadyVerified: boolean }> {
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

    // Also grant permanent access in resource_purchase table
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

  async rejectOrderPayment(
    orderId: number,
    reason: string,
  ): Promise<ResourceOrder | null> {
    const order = await this.findResourceOrderById(orderId);
    if (!order) return null;

    order.paymentStatus = 'rejected';
    order.adminNotes = reason || 'Payment could not be verified.';
    const saved = await this.orderRepo.save(order);
    this.logger.log(`Rejected payment for order #${saved.orderNumber}: ${reason}`);
    return saved;
  }

  async markOrderDelivered(orderId: number): Promise<ResourceOrder | null> {
    const order = await this.findResourceOrderById(orderId);
    if (!order) return null;

    order.fulfillmentStatus = 'delivered';
    return this.orderRepo.save(order);
  }

  async markOrderDeliveryFailed(
    orderId: number,
    errorMsg: string,
  ): Promise<ResourceOrder | null> {
    const order = await this.findResourceOrderById(orderId);
    if (!order) return null;

    order.fulfillmentStatus = 'failed_delivery';
    order.adminNotes = `${order.adminNotes ? `${order.adminNotes} | ` : ''}Delivery Error: ${errorMsg}`;
    return this.orderRepo.save(order);
  }

  async deletePhysicalOrder(id: number): Promise<boolean> {
    const order = await this.findPhysicalOrderById(id);
    if (!order) return false;
    await this.physicalOrderRepo.remove(order);
    this.logger.log(`Deleted PhysicalBookOrder #${id} (${order.orderNumber})`);
    return true;
  }

  async deleteResourceOrder(id: number): Promise<boolean> {
    const order = await this.findResourceOrderById(id);
    if (!order) return false;
    await this.orderRepo.remove(order);
    this.logger.log(`Deleted ResourceOrder #${id} (${order.orderNumber})`);
    return true;
  }
}


