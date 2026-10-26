import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Donation, DonationStatus } from '../database/entities/donation.entity.js';

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
    const donation = this.donationRepo.create({
      referenceNumber: this.generateReference(),
      telegramId: String(data.telegramId),
      clientName: data.clientName || 'Anonymous Partner',
      clientUsername: data.clientUsername || null,
      clientPhone: data.clientPhone || null,
      amount: Number(data.amount) || 0,
      currency: data.currency || 'ETB',
      paymentMethod: data.paymentMethod || 'telebirr',
      status: 'pending',
      notes: data.notes || null,
    });
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
