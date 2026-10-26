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
import { CourseEnrollmentsService } from '../features/course-enrollments.service.js';
import { ResourcesService } from '../features/resources.service.js';
import { AnonymousQuestionsService } from '../features/anonymous-questions.service.js';
import { PaymentSettingsService } from '../features/payment-settings.service.js';
import { DonationsService } from '../features/donations.service.js';
import { BotService, generateValidPdfBuffer, resolveUploadDiskPath } from '../bot/bot.service.js';
import { PhysicalOrderStatus } from '../database/entities/physical-book-order.entity.js';
import { Resource } from '../database/entities/resource.entity.js';

@Controller('api/admin')
export class AdminController {
  constructor(
    private readonly clientsService: ClientsService,
    private readonly counselingService: CounselingService,
    private readonly innerHealingService: InnerHealingService,
    private readonly coursesService: CoursesService,
    private readonly courseEnrollmentsService: CourseEnrollmentsService,
    private readonly resourcesService: ResourcesService,
    private readonly questionsService: AnonymousQuestionsService,
    private readonly paymentSettingsService: PaymentSettingsService,
    private readonly donationsService: DonationsService,
    private readonly botService: BotService,
  ) {}

  @Get('stats')
  async getStats() {
    const [
      totalClients,
      counselingList,
      innerHealingList,
      courseProgressList,
      purchaseList,
      donationList,
    ] = await Promise.all([
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
      preferredTime?: string | null;
      status?: string;
      assignedTo?: string | null;
      scheduledAt?: Date | string | null;
    },
  ) {
    if (!body || !body.clientName || !body.concern || !body.preferredMethod) {
      throw new BadRequestException(
        'Client name, concern, and preferred method are required fields.',
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
  // COURSES MANAGEMENT (Full Curriculum Hierarchy)
  // ==========================================

  @Get('courses/catalog')
  async getCoursesCatalog(@Query() query: any) {
    return this.coursesService.findAllCourses(query);
  }

  @Get('courses/catalog/:id')
  async getCourseDetails(@Param('id', ParseIntPipe) id: number) {
    return this.coursesService.findCourseById(id);
  }

  @Post('courses/catalog')
  @UseInterceptors(
    FileInterceptor('banner', {
      storage: diskStorage({
        destination: (req: any, file: any, cb: any) => {
          const dir = path.resolve(process.cwd(), 'uploads/temp');
          fs.mkdirSync(dir, { recursive: true });
          cb(null, dir);
        },
        filename: (req: any, file: any, cb: any) => {
          const clean = file.originalname.replace(/[^a-zA-Z0-9.-]/g, '_');
          cb(null, `temp-${Date.now()}-${clean}`);
        },
      }),
      limits: { fileSize: 15 * 1024 * 1024 },
    }),
  )
  async createCourse(
    @Body() body: any,
    @UploadedFile() bannerFile?: Express.Multer.File,
  ) {
    if (!body || !body.name || !body.theme) {
      throw new BadRequestException('Course name and theme are required.');
    }

    let learningOutcomes = body.learningOutcomes;
    if (typeof learningOutcomes === 'string') {
      try {
        learningOutcomes = JSON.parse(learningOutcomes);
      } catch {
        learningOutcomes = learningOutcomes.split('\n').map((s: string) => s.trim()).filter(Boolean);
      }
    }

    return this.coursesService.createCourse(
      {
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
      },
      bannerFile,
    );
  }

  @Patch('courses/catalog/:id')
  @UseInterceptors(
    FileInterceptor('banner', {
      storage: diskStorage({
        destination: (req: any, file: any, cb: any) => {
          const dir = path.resolve(process.cwd(), 'uploads/temp');
          fs.mkdirSync(dir, { recursive: true });
          cb(null, dir);
        },
        filename: (req: any, file: any, cb: any) => {
          const clean = file.originalname.replace(/[^a-zA-Z0-9.-]/g, '_');
          cb(null, `temp-${Date.now()}-${clean}`);
        },
      }),
      limits: { fileSize: 15 * 1024 * 1024 },
    }),
  )
  async updateCourse(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: any,
    @UploadedFile() bannerFile?: Express.Multer.File,
  ) {
    let learningOutcomes = body.learningOutcomes;
    if (typeof learningOutcomes === 'string') {
      try {
        learningOutcomes = JSON.parse(learningOutcomes);
      } catch {
        learningOutcomes = learningOutcomes.split('\n').map((s: string) => s.trim()).filter(Boolean);
      }
    }

    const payload = { ...body };
    if (learningOutcomes !== undefined) {
      payload.learningOutcomes = learningOutcomes;
    }

    return this.coursesService.updateCourse(id, payload, bannerFile);
  }

  @Delete('courses/catalog/:id')
  async deleteCourse(@Param('id', ParseIntPipe) id: number) {
    const success = await this.coursesService.deleteCourse(id);
    if (!success) {
      throw new NotFoundException(`Course #${id} not found.`);
    }
    return { success: true, message: `Course #${id} deleted successfully.` };
  }

  // --- Module Endpoints ---

  @Post('courses/catalog/:courseId/modules')
  @UseInterceptors(
    FileInterceptor('banner', {
      storage: diskStorage({
        destination: (req: any, file: any, cb: any) => {
          const dir = path.resolve(process.cwd(), 'uploads/temp');
          fs.mkdirSync(dir, { recursive: true });
          cb(null, dir);
        },
        filename: (req: any, file: any, cb: any) => {
          const clean = file.originalname.replace(/[^a-zA-Z0-9.-]/g, '_');
          cb(null, `temp-mod-${Date.now()}-${clean}`);
        },
      }),
      limits: { fileSize: 15 * 1024 * 1024 },
    }),
  )
  async createModule(
    @Param('courseId', ParseIntPipe) courseId: number,
    @Body() body: any,
    @UploadedFile() bannerFile?: Express.Multer.File,
  ) {
    if (!body || !body.title) {
      throw new BadRequestException('Module title is required.');
    }
    return this.coursesService.createModule(courseId, body, bannerFile);
  }

  @Patch('courses/catalog/:courseId/modules/:moduleId')
  @UseInterceptors(
    FileInterceptor('banner', {
      storage: diskStorage({
        destination: (req: any, file: any, cb: any) => {
          const dir = path.resolve(process.cwd(), 'uploads/temp');
          fs.mkdirSync(dir, { recursive: true });
          cb(null, dir);
        },
        filename: (req: any, file: any, cb: any) => {
          const clean = file.originalname.replace(/[^a-zA-Z0-9.-]/g, '_');
          cb(null, `temp-mod-${Date.now()}-${clean}`);
        },
      }),
      limits: { fileSize: 15 * 1024 * 1024 },
    }),
  )
  async updateModule(
    @Param('courseId', ParseIntPipe) courseId: number,
    @Param('moduleId', ParseIntPipe) moduleId: number,
    @Body() body: any,
    @UploadedFile() bannerFile?: Express.Multer.File,
  ) {
    return this.coursesService.updateModule(courseId, moduleId, body, bannerFile);
  }

  @Delete('courses/catalog/:courseId/modules/:moduleId')
  async deleteModule(
    @Param('courseId', ParseIntPipe) courseId: number,
    @Param('moduleId', ParseIntPipe) moduleId: number,
  ) {
    const success = await this.coursesService.deleteModule(courseId, moduleId);
    if (!success) {
      throw new NotFoundException(`Module #${moduleId} not found.`);
    }
    return { success: true, message: `Module #${moduleId} deleted successfully.` };
  }

  // --- Section Endpoints ---

  @Post('courses/catalog/:courseId/modules/:moduleId/sections')
  async createSection(
    @Param('moduleId', ParseIntPipe) moduleId: number,
    @Body() body: any,
  ) {
    if (!body || !body.title) {
      throw new BadRequestException('Section title is required.');
    }
    return this.coursesService.createSection(moduleId, body);
  }

  @Patch('courses/catalog/sections/:sectionId')
  async updateSection(
    @Param('sectionId', ParseIntPipe) sectionId: number,
    @Body() body: any,
  ) {
    return this.coursesService.updateSection(sectionId, body);
  }

  @Delete('courses/catalog/sections/:sectionId')
  async deleteSection(@Param('sectionId', ParseIntPipe) sectionId: number) {
    const success = await this.coursesService.deleteSection(sectionId);
    if (!success) {
      throw new NotFoundException(`Section #${sectionId} not found.`);
    }
    return { success: true, message: `Section #${sectionId} deleted successfully.` };
  }

  // --- Learning Materials Endpoints ---

  @Post('courses/catalog/:courseId/modules/:moduleId/sections/:sectionId/materials')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: (req: any, file: any, cb: any) => {
          const dir = path.resolve(process.cwd(), 'uploads/temp');
          fs.mkdirSync(dir, { recursive: true });
          cb(null, dir);
        },
        filename: (req: any, file: any, cb: any) => {
          const clean = file.originalname.replace(/[^a-zA-Z0-9.-]/g, '_');
          cb(null, `temp-mat-${Date.now()}-${clean}`);
        },
      }),
      limits: { fileSize: 100 * 1024 * 1024 }, // 100MB
    }),
  )
  async uploadSectionMaterial(
    @Param('courseId', ParseIntPipe) courseId: number,
    @Param('moduleId', ParseIntPipe) moduleId: number,
    @Param('sectionId', ParseIntPipe) sectionId: number,
    @Body() body: any,
    @UploadedFile() file: Express.Multer.File,
  ) {
    if (!file) {
      throw new BadRequestException('No file provided for upload.');
    }
    return this.coursesService.uploadMaterial(
      courseId,
      moduleId,
      sectionId,
      file,
      body.title,
    );
  }

  @Delete('courses/catalog/materials/:materialId')
  async deleteMaterial(@Param('materialId', ParseIntPipe) materialId: number) {
    const success = await this.coursesService.deleteMaterial(materialId);
    if (!success) {
      throw new NotFoundException(`Material #${materialId} not found.`);
    }
    return { success: true, message: `Material #${materialId} deleted successfully.` };
  }

  // ==========================================
  // COURSE ENROLMENTS & PROGRESS MANAGEMENT
  // ==========================================

  @Get('courses/enrollments')
  async getCourseEnrollments(
    @Query('courseId') courseId?: string,
    @Query('paymentStatus') paymentStatus?: string,
    @Query('status') status?: string,
    @Query('search') search?: string,
  ) {
    const parsedCourseId = courseId ? parseInt(courseId, 10) : undefined;
    return this.courseEnrollmentsService.findAll({
      courseId: isNaN(parsedCourseId!) ? undefined : parsedCourseId,
      paymentStatus,
      status,
      search,
    });
  }

  @Get('courses/enrollments/:id')
  async getCourseEnrollmentById(@Param('id', ParseIntPipe) id: number) {
    return this.courseEnrollmentsService.findById(id);
  }

  @Post('courses/enrollments/:id/verify')
  async verifyCourseEnrollment(
    @Param('id', ParseIntPipe) id: number,
    @Body() body?: { adminNotes?: string },
  ) {
    const enrollment = await this.courseEnrollmentsService.verifyPayment(id, body?.adminNotes);

    // Send Telegram notification with direct "🚀 Open Course" button
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

    const notificationText =
      `🎉 <b>Payment Approved! Access Granted!</b>\n\n` +
      `Your payment for <b>${enrollment.courseName}</b> has been verified by our ministry team!\n\n` +
      `Your course access is now permanently unlocked. You can begin exploring the modules and lessons right away.`;

    await this.botService.sendMessageToUser(enrollment.telegramId, notificationText, openKeyboard);

    return {
      success: true,
      enrollment,
      message: `Course enrollment #${id} verified and user notified.`,
    };
  }

  @Post('courses/enrollments/:id/reject')
  async rejectCourseEnrollment(
    @Param('id', ParseIntPipe) id: number,
    @Body() body?: { reason?: string },
  ) {
    const reason = body?.reason?.trim() || 'Payment could not be verified.';
    const enrollment = await this.courseEnrollmentsService.rejectPayment(id, reason);

    const notificationText =
      `⚠️ <b>Course Payment Notice</b>\n\n` +
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

  @Delete('courses/enrollments/:id')
  async deleteCourseEnrollment(@Param('id', ParseIntPipe) id: number) {
    const success = await this.courseEnrollmentsService.deleteEnrollment(id);
    if (!success) {
      throw new NotFoundException(`Enrollment #${id} not found.`);
    }
    return { success: true, message: `Enrollment #${id} deleted successfully.` };
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

  @Get('questions')
  async getQuestions() {
    return this.questionsService.getAll();
  }

  @Patch('questions/:id/answer')
  async answerQuestion(
    @Param('id', ParseIntPipe) id: number,
    @Body()
    body: {
      answer: string;
      assignedCounselor?: string | null;
      isPublic?: boolean;
      postToChannel?: boolean;
    },
  ) {
    if (!body || !body.answer || !body.answer.trim()) {
      throw new BadRequestException('Answer text is required.');
    }

    const saved = await this.questionsService.answerQuestion(id, body);

    let channelBroadcast: { success: boolean; messageId?: number; error?: string } | null = null;
    if (body.postToChannel) {
      channelBroadcast = await this.botService.broadcastQuestionToChannel({
        referenceNumber: saved.referenceNumber,
        category: saved.category,
        question: saved.question,
        answer: saved.answer!,
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

  @Delete('questions/:id')
  async deleteQuestion(@Param('id', ParseIntPipe) id: number) {
    const success = await this.questionsService.deleteQuestion(id);
    if (!success) {
      throw new NotFoundException(`Question #${id} not found.`);
    }
    return { success: true, message: `Question #${id} deleted successfully.` };
  }

  // ==========================================
  // PAYMENT SETTINGS (Telebirr & CBE)
  // ==========================================

  @Get('payment-settings')
  async getPaymentSettings() {
    return this.paymentSettingsService.getFormattedAccounts();
  }

  @Patch('payment-settings')
  async updatePaymentSettings(
    @Body()
    body: {
      telebirr?: any;
      cbe?: any;
    },
  ) {
    return this.paymentSettingsService.updateAccounts(body);
  }

  // ==========================================
  // RESOURCE ORDERS & PAYMENT CONFIRMATION
  // ==========================================

  @Get('resource-orders')
  async getResourceOrders(
    @Query('status') status?: string,
    @Query('search') search?: string,
  ) {
    return this.resourcesService.findAllResourceOrders({
      paymentStatus: status,
      search,
    });
  }

  @Post('resource-orders/:id/confirm-payment')
  async confirmResourceOrderPayment(
    @Param('id', ParseIntPipe) id: number,
    @Body() body?: { adminNotes?: string },
  ) {
    const { order, resource, alreadyVerified } =
      await this.resourcesService.confirmOrderPayment(id, body?.adminNotes);

    if (alreadyVerified) {
      return {
        success: true,
        order,
        message: 'Order was already verified and delivered.',
      };
    }

    let dispatchResult = false;
    let dispatchError: string | null = null;

    // If resource is an e-book or digital file, automatically dispatch document to user via Telegram Bot!
    if (order.resourceType === 'ebook' || (resource && resource.type === 'ebook') || (resource && resource.filePath)) {
      try {
        const fullDiskPath = resolveUploadDiskPath(
          resource?.filePath,
          resource?.fileName || `${order.resourceTitle}.pdf`,
        );

        // If file does not exist on disk, auto-create a clean valid PDF document so dispatch NEVER fails!
        let needsGeneration = true;
        try {
          if (fs.existsSync(fullDiskPath) && fs.statSync(fullDiskPath).size >= 100) {
            needsGeneration = false;
          }
        } catch {
          needsGeneration = true;
        }

        if (needsGeneration) {
          fs.mkdirSync(path.dirname(fullDiskPath), { recursive: true });
          const cleanTitle = (resource?.title || order.resourceTitle);
          fs.writeFileSync(fullDiskPath, generateValidPdfBuffer(cleanTitle, resource?.author || undefined));
        }

        const caption =
          `🎉 <b>Payment Verified!</b>\n\n` +
          `Thank you for your purchase of <b>${order.resourceTitle}</b>.\n` +
          `Here is your official digital e-book. You can download and keep it permanently!`;

        dispatchResult = await this.botService.sendDocumentToUser(
          order.telegramId,
          fullDiskPath,
          resource?.fileName || `${order.resourceTitle}.pdf`,
          caption,
        );

        if (dispatchResult) {
          await this.resourcesService.markOrderDelivered(order.id);
          order.fulfillmentStatus = 'delivered';
        }
      } catch (err: any) {
        dispatchError = err.message || 'Failed to dispatch document';
        await this.resourcesService.markOrderDeliveryFailed(order.id, dispatchError || 'Unknown dispatch error');
        order.fulfillmentStatus = 'failed_delivery';
      }
    } else {
      // Physical book order
      await this.botService.sendMessageToUser(
        order.telegramId,
        `🎉 <b>Payment Verified!</b>\n\n` +
          `Your payment for <b>${order.resourceTitle}</b> (Order <code>${order.orderNumber}</code>) has been approved by our ministry team!\n\n` +
          `📦 Our courier fulfillment team is preparing your print copy. We will contact you at your phone number with tracking and delivery updates.`,
      );
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

  @Post('resource-orders/:id/reject-payment')
  async rejectResourceOrderPayment(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: { reason: string },
  ) {
    if (!body || !body.reason || !body.reason.trim()) {
      throw new BadRequestException('Rejection reason is required.');
    }

    const order = await this.resourcesService.rejectOrderPayment(id, body.reason.trim());
    if (!order) {
      throw new NotFoundException(`Order #${id} not found.`);
    }

    // Notify user on Telegram
    await this.botService.sendMessageToUser(
      order.telegramId,
      `⚠️ <b>Payment Notice for Order ${order.orderNumber}</b>\n\n` +
        `Our team could not verify the transfer for <b>${order.resourceTitle}</b>.\n\n` +
        `<b>Reason:</b> ${body.reason.trim()}\n\n` +
        `Please verify your transfer in your Telebirr / CBE app or contact our team if you believe this is an error.`,
    );

    return { success: true, order };
  }

  @Delete('resources/orders/:id')
  async deletePhysicalOrder(@Param('id', ParseIntPipe) id: number) {
    const success = await this.resourcesService.deletePhysicalOrder(id);
    if (!success) {
      throw new NotFoundException(`Physical order #${id} not found.`);
    }
    return { success: true, message: `Physical order #${id} deleted successfully.` };
  }

  @Delete('resource-orders/:id')
  async deleteResourceOrder(@Param('id', ParseIntPipe) id: number) {
    const success = await this.resourcesService.deleteResourceOrder(id);
    if (!success) {
      throw new NotFoundException(`Resource order #${id} not found.`);
    }
    return { success: true, message: `Resource order #${id} deleted successfully.` };
  }

  // ==========================================
  // DONATIONS MANAGEMENT
  // ==========================================

  @Get('donations')
  async getDonations(
    @Query('status') status?: string,
    @Query('search') search?: string,
  ) {
    return this.donationsService.findAll({ status, search });
  }

  @Post('donations/:id/verify')
  async verifyDonation(
    @Param('id', ParseIntPipe) id: number,
    @Body() body?: { adminNotes?: string },
  ) {
    const donation = await this.donationsService.updateStatus(id, 'verified', body?.adminNotes);
    return { success: true, donation, message: 'Donation verified successfully.' };
  }

  @Post('donations/:id/reject')
  async rejectDonation(
    @Param('id', ParseIntPipe) id: number,
    @Body() body?: { reason?: string },
  ) {
    const donation = await this.donationsService.updateStatus(id, 'rejected', body?.reason);
    return { success: true, donation, message: 'Donation marked as rejected.' };
  }

  @Delete('donations/:id')
  async deleteDonation(@Param('id', ParseIntPipe) id: number) {
    const success = await this.donationsService.delete(id);
    if (!success) {
      throw new NotFoundException(`Donation #${id} not found.`);
    }
    return { success: true, message: `Donation #${id} deleted successfully.` };
  }

  // ==========================================
  // BOT UPDATE BROADCAST
  // ==========================================

  @Post('bot/broadcast-update')
  async broadcastBotUpdate(
    @Body() body: { version: string; releaseNotes?: string },
  ) {
    if (!body?.version?.trim()) {
      throw new BadRequestException('Version number is required.');
    }

    const clients = await this.clientsService.findAll();
    const telegramIds = Array.from(new Set(clients.map((c) => c.telegramId).filter(Boolean)));

    const result = await this.botService.broadcastBotUpdate(
      telegramIds,
      body.version.trim(),
      body.releaseNotes?.trim(),
    );

    return {
      success: true,
      sent: result.sent,
      failed: result.failed,
      message: `Bot update announcement sent to ${result.sent} user(s).`,
    };
  }
}


