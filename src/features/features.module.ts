import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CounselingRequest } from '../database/entities/counseling-request.entity.js';
import { InnerHealingRequest } from '../database/entities/inner-healing-request.entity.js';
import { CourseProgress } from '../database/entities/course-progress.entity.js';
import { ResourcePurchase } from '../database/entities/resource-purchase.entity.js';
import { ClientsModule } from '../clients/clients.module.js';
import { CounselingService } from './counseling.service.js';
import { InnerHealingService } from './inner-healing.service.js';
import { CoursesService } from './courses.service.js';
import { ResourcesService } from './resources.service.js';

@Module({
  imports: [
    ClientsModule,
    TypeOrmModule.forFeature([
      CounselingRequest,
      InnerHealingRequest,
      CourseProgress,
      ResourcePurchase,
    ]),
  ],
  providers: [
    CounselingService,
    InnerHealingService,
    CoursesService,
    ResourcesService,
  ],
  exports: [
    CounselingService,
    InnerHealingService,
    CoursesService,
    ResourcesService,
  ],
})
export class FeaturesModule {}
