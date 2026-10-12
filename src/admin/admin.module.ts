import { Module } from '@nestjs/common';
import { ClientsModule } from '../clients/clients.module.js';
import { FeaturesModule } from '../features/features.module.js';
import { AdminController } from './admin.controller.js';

@Module({
  imports: [ClientsModule, FeaturesModule],
  controllers: [AdminController],
})
export class AdminModule {}
