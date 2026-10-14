import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like, FindOptionsWhere } from 'typeorm';
import * as path from 'path';
import * as fs from 'fs';
import { ResourcePurchase } from '../database/entities/resource-purchase.entity.js';
import { Resource, ResourceType, PricingType } from '../database/entities/resource.entity.js';
import {
  PhysicalBookOrder,
  PhysicalOrderStatus,
} from '../database/entities/physical-book-order.entity.js';

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
    resourceId: string,
  ): Promise<boolean> {
    const res = this.getResource(resourceId);
    if (!res || !res.isPaid) return true;

    const purchase = await this.purchaseRepo.findOne({
      where: {
        telegramId: String(telegramId),
        resourceId,
        status: 'completed',
      },
    });
    return !!purchase;
  }

  async grantAccess(
    telegramId: string | number,
    resourceId: string,
  ): Promise<ResourcePurchase | null> {
    const res = this.getResource(resourceId);
    if (!res) return null;

    let purchase = await this.purchaseRepo.findOne({
      where: { telegramId: String(telegramId), resourceId },
    });

    if (!purchase) {
      purchase = this.purchaseRepo.create({
        telegramId: String(telegramId),
        resourceId,
        resourceTitle: res.title,
        amount: res.price,
        currency: res.currency,
        status: 'completed',
        downloadUrl: res.downloadUrl,
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
    return this.purchaseRepo.find({
      where: { telegramId: String(telegramId), status: 'completed' },
      order: { createdAt: 'DESC' },
    });
  }

  async getAllPurchases(): Promise<ResourcePurchase[]> {
    return this.purchaseRepo.find({
      order: { createdAt: 'DESC' },
    });
  }

  async countPurchases(): Promise<number> {
    return this.purchaseRepo.count();
  }
}
