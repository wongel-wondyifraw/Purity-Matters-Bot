import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ResourcePurchase } from '../database/entities/resource-purchase.entity.js';

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
export class ResourcesService {
  private readonly logger = new Logger(ResourcesService.name);

  private readonly catalog: ResourceItem[] = [
    {
      id: 'res_free_guide',
      title: '🛡️ Daily Purity Battle Guide (PDF)',
      category: 'guide',
      isPaid: false,
      price: 0,
      currency: 'USD',
      description: 'Essential practical disciplines, morning declarations, and mind renewal tools for daily victory.',
      downloadUrl: 'https://puritymatters.org/resources/daily-purity-battle-guide.pdf',
    },
    {
      id: 'res_ebook_wholeness',
      title: '📖 Breaking Chains: The Wholeness Journey (E-Book)',
      category: 'ebook',
      isPaid: true,
      price: 4.99,
      currency: 'USD',
      description: 'A deep-dive handbook tackling neurological patterns, generational cycles, and sustained freedom.',
      downloadUrl: 'https://puritymatters.org/downloads/breaking-chains-ebook.pdf',
    },
    {
      id: 'res_ebook_wounds',
      title: '🕊️ Healing Father & Mother Wounds (E-Book)',
      category: 'ebook',
      isPaid: true,
      price: 6.99,
      currency: 'USD',
      description: 'Overcoming deep rejection and restoring God-given identity through biblical inner healing.',
      downloadUrl: 'https://puritymatters.org/downloads/healing-family-wounds.pdf',
    },
  ];

  constructor(
    @InjectRepository(ResourcePurchase)
    private readonly purchaseRepo: Repository<ResourcePurchase>,
  ) {}

  getCatalog(): ResourceItem[] {
    return this.catalog;
  }

  getResource(id: string): ResourceItem | undefined {
    return this.catalog.find((item) => item.id === id);
  }

  async hasAccess(telegramId: string | number, resourceId: string): Promise<boolean> {
    const res = this.getResource(resourceId);
    if (!res || !res.isPaid) return true;

    const purchase = await this.purchaseRepo.findOne({
      where: { telegramId: String(telegramId), resourceId, status: 'completed' },
    });
    return !!purchase;
  }

  async grantAccess(telegramId: string | number, resourceId: string): Promise<ResourcePurchase | null> {
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
      this.logger.log(`Access granted to ${resourceId} for client ${telegramId}`);
    }

    return purchase;
  }

  async getMyPurchases(telegramId: string | number): Promise<ResourcePurchase[]> {
    return this.purchaseRepo.find({
      where: { telegramId: String(telegramId), status: 'completed' },
      order: { createdAt: 'DESC' },
    });
  }
}
