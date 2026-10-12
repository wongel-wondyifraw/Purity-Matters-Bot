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
    return this.clientsService.findAll();
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
