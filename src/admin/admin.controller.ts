import {
  Controller,
  Get,
  Patch,
  Post,
  Delete,
  Param,
  Body,
  Query,
  ParseIntPipe,
  UseInterceptors,
  UploadedFile,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import * as path from 'path';
import * as fs from 'fs';
import { ClientsService } from '../clients/clients.service.js';
import { CounselingService } from '../features/counseling.service.js';
import { InnerHealingService } from '../features/inner-healing.service.js';
import { CoursesService } from '../features/courses.service.js';
import { ResourcesService } from '../features/resources.service.js';
import { PhysicalOrderStatus } from '../database/entities/physical-book-order.entity.js';
import { Resource } from '../database/entities/resource.entity.js';

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

  @Post('clients')
  async createClient(
    @Body()
    body: {
      fullName: string;
      telegramId?: string | number | null;
      username?: string | null;
      phone?: string | null;
      languageCode?: string | null;
      role?: string;
      isRegistered?: boolean;
    },
  ) {
    return this.clientsService.createClient(body);
  }

  @Patch('clients/:id')
  async updateClient(
    @Param('id', ParseIntPipe) id: number,
    @Body()
    body: {
      role?: string;
      phone?: string;
      fullName?: string;
      username?: string;
      languageCode?: string;
      isRegistered?: boolean;
    },
  ) {
    const client = await this.clientsService.findById(id);
    if (!client) return null;
    if (body.role !== undefined) client.role = body.role;
    if (body.phone !== undefined) client.phone = body.phone;
    if (body.fullName !== undefined) client.fullName = body.fullName;
    if (body.username !== undefined)
      client.username = body.username ? body.username.replace(/^@/, '').trim() : null;
    if (body.languageCode !== undefined) client.languageCode = body.languageCode;
    if (body.isRegistered !== undefined) client.isRegistered = body.isRegistered;
    return this.clientsService.saveClient(client);
  }

  @Delete('clients/:id')
  async deleteClient(@Param('id', ParseIntPipe) id: number) {
    const success = await this.clientsService.deleteClient(id);
    return { success };
  }

  @Get('counseling')
  async getCounseling() {
    return this.counselingService.findAll();
  }

  @Post('counseling')
  async createCounseling(
    @Body()
    body: {
      clientName: string;
      phone?: string | null;
      telegramId?: string | number | null;
      concern: string;
      description?: string | null;
      preferredMethod: string;
      preferredTime: string;
      status?: string;
      assignedTo?: string | null;
      scheduledAt?: Date | string | null;
    },
  ) {
    if (!body || !body.clientName || !body.concern || !body.preferredMethod || !body.preferredTime) {
      throw new BadRequestException(
        'Client name, concern, preferred method, and preferred time are required fields.',
      );
    }
    return this.counselingService.directCreate(body);
  }

  @Patch('counseling/:id')
  async updateCounseling(
    @Param('id', ParseIntPipe) id: number,
    @Body()
    body: {
      status?: string;
      assignedTo?: string | null;
      concern?: string;
      description?: string | null;
      preferredMethod?: string;
      preferredTime?: string;
      scheduledAt?: Date | string | null;
    },
  ) {
    const updated = await this.counselingService.updateRequest(id, body);
    if (!updated) {
      throw new NotFoundException(`Counseling request #${id} not found.`);
    }
    return updated;
  }

  @Delete('counseling/:id')
  async deleteCounseling(@Param('id', ParseIntPipe) id: number) {
    const success = await this.counselingService.deleteRequest(id);
    if (!success) {
      throw new NotFoundException(`Counseling request #${id} not found.`);
    }
    return { success: true, message: `Counseling request #${id} deleted successfully.` };
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

  // ==========================================
  // RESOURCE CATALOG (E-Books & Physical Books)
  // ==========================================

  @Get('resources/catalog')
  async getResourcesCatalog(@Query() query: any) {
    return this.resourcesService.findAllResources(query);
  }

  @Post('resources')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: (req: any, file: any, cb: any) => {
          const dir = path.resolve(process.cwd(), 'uploads/resources/ebooks');
          fs.mkdirSync(dir, { recursive: true });
          cb(null, dir);
        },
        filename: (req: any, file: any, cb: any) => {
          const clean = file.originalname.replace(/[^a-zA-Z0-9.-]/g, '_');
          cb(null, `${Date.now()}-${clean}`);
        },
      }),
      limits: { fileSize: 50 * 1024 * 1024 }, // 50MB
    }),
  )
  async createResource(
    @Body() body: any,
    @UploadedFile() file?: Express.Multer.File,
  ) {
    const data: Partial<Resource> = {
      title: body.title,
      author: body.author || null,
      description: body.description || null,
      type: body.type || 'ebook',
      pricingType:
        body.pricingType || (Number(body.price) > 0 ? 'paid' : 'free'),
      price: Number(body.price) || 0,
      currency: body.currency || 'ETB',
      stockQuantity:
        body.type === 'physical_book' ? Number(body.stockQuantity) || 0 : null,
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

  @Patch('resources/:id')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: (req: any, file: any, cb: any) => {
          const dir = path.resolve(process.cwd(), 'uploads/resources/ebooks');
          fs.mkdirSync(dir, { recursive: true });
          cb(null, dir);
        },
        filename: (req: any, file: any, cb: any) => {
          const clean = file.originalname.replace(/[^a-zA-Z0-9.-]/g, '_');
          cb(null, `${Date.now()}-${clean}`);
        },
      }),
      limits: { fileSize: 50 * 1024 * 1024 }, // 50MB
    }),
  )
  async updateResource(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: any,
    @UploadedFile() file?: Express.Multer.File,
  ) {
    const data: Partial<Resource> = {};
    if (body.title !== undefined) data.title = body.title;
    if (body.author !== undefined) data.author = body.author;
    if (body.description !== undefined) data.description = body.description;
    if (body.type !== undefined) data.type = body.type;
    if (body.pricingType !== undefined) data.pricingType = body.pricingType;
    if (body.price !== undefined) data.price = Number(body.price) || 0;
    if (body.currency !== undefined) data.currency = body.currency;
    if (body.stockQuantity !== undefined) {
      data.stockQuantity =
        body.type === 'ebook'
          ? null
          : Number(body.stockQuantity) || 0;
    }
    if (body.coverImageUrl !== undefined) data.coverImageUrl = body.coverImageUrl;

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

  @Delete('resources/:id')
  async deleteResource(@Param('id', ParseIntPipe) id: number) {
    const success = await this.resourcesService.deleteResource(id);
    if (!success) {
      throw new NotFoundException(`Resource with ID ${id} not found`);
    }
    return { success: true, message: `Resource #${id} permanently deleted` };
  }

  // ==========================================
  // PHYSICAL BOOK ORDERS (Delivery & Courier Queue)
  // ==========================================

  @Get('resources/orders')
  async getPhysicalOrders(@Query() query: any) {
    return this.resourcesService.findAllPhysicalOrders(query);
  }

  @Post('resources/orders')
  async createPhysicalOrder(@Body() body: any) {
    return this.resourcesService.createPhysicalOrder(body);
  }

  @Patch('resources/orders/:id/status')
  async updatePhysicalOrderStatus(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: { status: PhysicalOrderStatus; dispatchNotes?: string },
  ) {
    return this.resourcesService.updatePhysicalOrderStatus(
      id,
      body.status,
      body.dispatchNotes,
    );
  }

  // Legacy/compatibility endpoint for existing calls
  @Get('resources')
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
        clientName:
          client?.fullName || client?.firstName || `User #${item.telegramId}`,
        phone: client?.phone || 'N/A',
      };
    });
  }
}
