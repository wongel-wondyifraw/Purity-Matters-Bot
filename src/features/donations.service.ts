import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Donation, DonationStatus } from '../database/entities/donation.entity.js';
import type { PageRequest } from '../common/pagination.js';

export interface CreateDonationDto {
  telegramId: string | number;
  clientName: string;
  clientUsername?: string | null;
  clientPhone?: string | null;
  amount: number;
  currency?: string;
  paymentMethod?: string;
  notes?: string;
}

@Injectable()
export class DonationsService {
  private readonly logger = new Logger(DonationsService.name);

  constructor(
    @InjectRepository(Donation)
    private readonly donationRepo: Repository<Donation>,
  ) {}

  generateReference(): string {
    const timestamp = Date.now().toString().slice(-6);
    const random = Math.floor(1000 + Math.random() * 9000);
    return `DON-${timestamp}-${random}`;
  }

  async create(data: CreateDonationDto): Promise<Donation> {
    const donation = new Donation();
    donation.referenceNumber = this.generateReference();
    donation.telegramId = String(data.telegramId);
    donation.clientName = data.clientName || 'Anonymous Partner';
    donation.clientUsername = data.clientUsername || null;
    donation.clientPhone = data.clientPhone || null;
    donation.amount = Number(data.amount) || 0;
    donation.currency = data.currency || 'ETB';
    donation.paymentMethod = data.paymentMethod || 'telebirr';
    donation.status = 'pending';
    donation.notes = data.notes || null;
    return this.donationRepo.save(donation);
  }

  async findAll(filter?: { status?: string; search?: string }): Promise<Donation[]> {
    const qb = this.donationRepo.createQueryBuilder('donation');

    if (filter?.status && filter.status !== 'all') {
      qb.andWhere('donation.status = :status', { status: filter.status });
    }

    if (filter?.search) {
      const s = `%${filter.search.toLowerCase()}%`;
      qb.andWhere(
        '(LOWER(donation.referenceNumber) LIKE :s OR LOWER(donation.clientName) LIKE :s OR LOWER(donation.telegramId) LIKE :s OR LOWER(donation.paymentMethod) LIKE :s)',
        { s },
      );
    }

    qb.orderBy('donation.createdAt', 'DESC');
    return qb.getMany();
  }

  async findAdminPage(
    pageRequest: PageRequest,
    filter: { status?: string; search?: string; paymentMethod?: string },
  ) {
    // Keep filtering and page limits in SQL; dashboard totals use a separate aggregate query.
    const query = this.donationRepo.createQueryBuilder('donation');
    if (filter.status && filter.status !== 'all') {
      query.andWhere('donation.status = :status', { status: filter.status });
    }
    if (filter.paymentMethod && filter.paymentMethod !== 'all') {
      query.andWhere('donation.paymentMethod = :paymentMethod', {
        paymentMethod: filter.paymentMethod,
      });
    }
    if (filter.search?.trim()) {
      const search = `%${filter.search.trim()}%`;
      query.andWhere(
        '(donation.referenceNumber ILIKE :search OR donation.clientName ILIKE :search OR donation.clientUsername ILIKE :search OR donation.clientPhone ILIKE :search OR donation.telegramId ILIKE :search)',
        { search },
      );
    }

    query
      .orderBy('donation.createdAt', 'DESC')
      .addOrderBy('donation.id', 'DESC')
      .skip((pageRequest.page - 1) * pageRequest.limit)
      .take(pageRequest.limit);
    let [items, total] = await query.getManyAndCount();
    const totalPages = Math.max(1, Math.ceil(total / pageRequest.limit));
    const page = Math.min(pageRequest.page, totalPages);
    if (page !== pageRequest.page) {
      query.skip((page - 1) * pageRequest.limit).take(pageRequest.limit);
      items = await query.getMany();
    }
    return { items, total, page };
  }

  async getAdminSummary() {
    const result = await this.donationRepo
      .createQueryBuilder('donation')
      .select('COUNT(donation.id)', 'total')
      .addSelect(
        'COALESCE(SUM(CASE WHEN donation.status = :verified THEN donation.amount ELSE 0 END), 0)',
        'verifiedAmount',
      )
      .addSelect(
        'SUM(CASE WHEN donation.status = :verified THEN 1 ELSE 0 END)',
        'verifiedCount',
      )
      .addSelect(
        'SUM(CASE WHEN donation.status IN (:...pendingStatuses) THEN 1 ELSE 0 END)',
        'pendingCount',
      )
      .setParameters({ verified: 'verified', pendingStatuses: ['pending', 'payment_submitted'] })
      .getRawOne();

    return {
      total: Number(result?.total) || 0,
      verifiedAmount: Number(result?.verifiedAmount) || 0,
      verifiedCount: Number(result?.verifiedCount) || 0,
      pendingCount: Number(result?.pendingCount) || 0,
    };
  }

  async findById(id: number): Promise<Donation> {
    const donation = await this.donationRepo.findOneBy({ id });
    if (!donation) {
      throw new NotFoundException(`Donation #${id} not found.`);
    }
    return donation;
  }

  async markAsDonated(id: number, method?: string): Promise<Donation> {
    const donation = await this.findById(id);
    donation.status = 'payment_submitted';
    if (method) {
      donation.paymentMethod = method;
    }
    return this.donationRepo.save(donation);
  }

  async updateStatus(
    id: number,
    status: DonationStatus,
    adminNotes?: string,
  ): Promise<Donation> {
    const donation = await this.findById(id);
    donation.status = status;
    if (adminNotes !== undefined) {
      donation.adminNotes = adminNotes;
    }
    if (status === 'verified') {
      donation.verifiedAt = new Date();
    }
    return this.donationRepo.save(donation);
  }

  async delete(id: number): Promise<boolean> {
    const result = await this.donationRepo.delete(id);
    return (result.affected ?? 0) > 0;
  }
}
