import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import configuration from './config/configuration.js';
import { Client } from './database/entities/client.entity.js';
import { CounselingRequest } from './database/entities/counseling-request.entity.js';
import { InnerHealingRequest } from './database/entities/inner-healing-request.entity.js';
import { CourseProgress } from './database/entities/course-progress.entity.js';
import { ResourcePurchase } from './database/entities/resource-purchase.entity.js';
import { Resource } from './database/entities/resource.entity.js';
import { PhysicalBookOrder } from './database/entities/physical-book-order.entity.js';
import { User } from './database/entities/user.entity.js';
import { AnonymousQuestion } from './database/entities/anonymous-question.entity.js';
import { PaymentSetting } from './database/entities/payment-setting.entity.js';
import { ResourceOrder } from './database/entities/resource-order.entity.js';
import { Donation } from './database/entities/donation.entity.js';
import { Course } from './database/entities/course.entity.js';
import { CourseModule } from './database/entities/course-module.entity.js';
import { CourseSection } from './database/entities/course-section.entity.js';
import { CourseMaterial } from './database/entities/course-material.entity.js';
import { CourseEnrollment } from './database/entities/course-enrollment.entity.js';
import { ClientsModule } from './clients/clients.module.js';
import { FeaturesModule } from './features/features.module.js';
import { BotModule } from './bot/bot.module.js';
import { AdminModule } from './admin/admin.module.js';
import { AuthModule } from './auth/auth.module.js';
import { AppController } from './app.controller.js';
import { AppService } from './app.service.js';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [configuration],
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        type: 'postgres',
        host: configService.get<string>('database.host'),
        port: configService.get<number>('database.port'),
        username: configService.get<string>('database.username'),
        password: configService.get<string>('database.password'),
        database: configService.get<string>('database.database'),
        entities: [
          Client,
          CounselingRequest,
          InnerHealingRequest,
          CourseProgress,
          ResourcePurchase,
          Resource,
          PhysicalBookOrder,
          User,
          AnonymousQuestion,
          PaymentSetting,
          ResourceOrder,
          Donation,
          Course,
          CourseModule,
          CourseSection,
          CourseMaterial,
          CourseEnrollment,
        ],
        synchronize: configService.get<boolean>('database.synchronize'),
        logging: configService.get<boolean>('database.logging'),
        ssl: configService.get<any>('database.ssl'),
      }),
    }),
    ClientsModule,
    FeaturesModule,
    BotModule,
    AdminModule,
    AuthModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
