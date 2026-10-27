import { Module } from '@nestjs/common';
import { ClientsModule } from '../clients/clients.module.js';
import { FeaturesModule } from '../features/features.module.js';
import { BotModule } from '../bot/bot.module.js';
import { AuthModule } from '../auth/auth.module.js';
import { AdminController } from './admin.controller.js';

@Module({
  imports: [ClientsModule, FeaturesModule, BotModule, AuthModule],
  controllers: [AdminController],
})
export class AdminModule {}

