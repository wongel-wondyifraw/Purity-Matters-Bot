import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CounselingRequest } from '../database/entities/counseling-request.entity.js';
import { InnerHealingRequest } from '../database/entities/inner-healing-request.entity.js';
import { CourseProgress } from '../database/entities/course-progress.entity.js';
import { ResourcePurchase } from '../database/entities/resource-purchase.entity.js';
import { Resource } from '../database/entities/resource.entity.js';
import { PhysicalBookOrder } from '../database/entities/physical-book-order.entity.js';
import { AnonymousQuestion } from '../database/entities/anonymous-question.entity.js';
import { PaymentSetting } from '../database/entities/payment-setting.entity.js';
import { ResourceOrder } from '../database/entities/resource-order.entity.js';
import { Donation } from '../database/entities/donation.entity.js';
import { ClientsModule } from '../clients/clients.module.js';
import { CounselingService } from './counseling.service.js';
import { InnerHealingService } from './inner-healing.service.js';
import { CoursesService } from './courses.service.js';
import { ResourcesService } from './resources.service.js';
import { AnonymousQuestionsService } from './anonymous-questions.service.js';
import { PaymentSettingsService } from './payment-settings.service.js';
import { DonationsService } from './donations.service.js';
import { QuestionsController } from './questions.controller.js';

@Module({
  imports: [
    ClientsModule,
    TypeOrmModule.forFeature([
      CounselingRequest,
      InnerHealingRequest,
      CourseProgress,
      ResourcePurchase,
      Resource,
      PhysicalBookOrder,
      AnonymousQuestion,
      PaymentSetting,
      ResourceOrder,
      Donation,
    ]),
  ],
  controllers: [QuestionsController],
  providers: [
    CounselingService,
    InnerHealingService,
    CoursesService,
    ResourcesService,
    AnonymousQuestionsService,
    PaymentSettingsService,
    DonationsService,
  ],
  exports: [
    CounselingService,
    InnerHealingService,
    CoursesService,
    ResourcesService,
    AnonymousQuestionsService,
    PaymentSettingsService,
    DonationsService,
  ],
})
export class FeaturesModule {}
