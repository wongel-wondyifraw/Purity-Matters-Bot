import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import configuration from './config/configuration.js';
import { Client } from './database/entities/client.entity.js';
import { CounselingRequest } from './database/entities/counseling-request.entity.js';
import { InnerHealingRequest } from './database/entities/inner-healing-request.entity.js';
import { CourseProgress } from './database/entities/course-progress.entity.js';
import { ResourcePurchase } from './database/entities/resource-purchase.entity.js';
import { ClientsModule } from './clients/clients.module.js';
import { FeaturesModule } from './features/features.module.js';
import { BotModule } from './bot/bot.module.js';
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
        ],
        synchronize: configService.get<boolean>('database.synchronize'),
        logging: configService.get<boolean>('database.logging'),
        ssl: configService.get<any>('database.ssl'),
      }),
    }),
    ClientsModule,
    FeaturesModule,
    BotModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
