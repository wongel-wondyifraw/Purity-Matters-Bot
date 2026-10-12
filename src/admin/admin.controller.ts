import { Controller, Get, Patch, Param, Body, ParseIntPipe } from '@nestjs/common';
import { ClientsService } from '../clients/clients.service.js';
import { CounselingService } from '../features/counseling.service.js';
import { InnerHealingService } from '../features/inner-healing.service.js';
import { CoursesService } from '../features/courses.service.js';
import { ResourcesService } from '../features/resources.service.js';

@Controller('api/admin')
export class AdminController {
  constructor(
    private readonly clientsService: ClientsService,
    private readonly counselingService: CounselingService,
    private readonly innerHealingService: InnerHealingService,
    private readonly coursesService: CoursesService,
    private readonly resourcesService: ResourcesService,
  ) {}

  @Get('stats')
  async getStats() {
    const [
      totalClients,
      counselingList,
      innerHealingList,
      courseProgressList,
      purchaseList,
    ] = await Promise.all([
      this.clientsService.count(),
      this.counselingService.findAll(),
      this.innerHealingService.findAll(),
      this.coursesService.getAllProgress(),
      this.resourcesService.getAllPurchases(),
    ]);

    const pendingCounseling = counselingList.filter((c) => c.status === 'pending').length;
    const pendingInnerHealing = innerHealingList.filter((i) => i.status === 'pending').length;
    const accountabilityNeeded = courseProgressList.filter((cp) => cp.accountabilityRequested).length;
    const totalSales = purchaseList.reduce((acc, curr) => acc + (Number(curr.amount) || 0), 0);

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
    };
  }

  @Get('clients')
  async getClients() {
    const [clients, counseling, innerHealing, courses, purchases] = await Promise.all([
      this.clientsService.findAll(),
      this.counselingService.findAll(),
      this.innerHealingService.findAll(),
      this.coursesService.getAllProgress(),
      this.resourcesService.getAllPurchases(),
    ]);

    const counselingMap = new Map<string, number>();
    for (const c of counseling) {
      const tid = String(c.telegramId);
      counselingMap.set(tid, (counselingMap.get(tid) || 0) + 1);
    }

    const innerHealingMap = new Map<string, number>();
    for (const ih of innerHealing) {
      const tid = String(ih.telegramId);
      innerHealingMap.set(tid, (innerHealingMap.get(tid) || 0) + 1);
    }

    const coursesMap = new Map<string, number>();
    for (const cp of courses) {
      const tid = String(cp.telegramId);
      coursesMap.set(tid, (coursesMap.get(tid) || 0) + 1);
    }

    const purchasesMap = new Map<string, number>();
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

  @Patch('clients/:id')
  async updateClient(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: { role?: string; phone?: string; fullName?: string },
  ) {
    const client = await this.clientsService.findById(id);
    if (!client) return null;
    if (body.role !== undefined) client.role = body.role;
    if (body.phone !== undefined) client.phone = body.phone;
    if (body.fullName !== undefined) client.fullName = body.fullName;
    return this.clientsService.saveClient(client);
  }

  @Get('counseling')
  async getCounseling() {
    return this.counselingService.findAll();
  }

  @Patch('counseling/:id')
  async updateCounseling(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: { status: string; assignedTo?: string },
  ) {
    return this.counselingService.updateStatus(id, body.status, body.assignedTo);
  }

  @Get('inner-healing')
  async getInnerHealing() {
    return this.innerHealingService.findAll();
  }

  @Patch('inner-healing/:id')
  async updateInnerHealing(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: { status: string },
  ) {
    return this.innerHealingService.updateStatus(id, body.status);
  }

  @Get('courses')
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

  @Get('resources')
  async getResources() {
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
}
