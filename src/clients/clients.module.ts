import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Client } from '../database/entities/client.entity.js';
import { ClientsService } from './clients.service.js';

@Module({
  imports: [TypeOrmModule.forFeature([Client])],
  providers: [ClientsService],
  exports: [ClientsService],
})
export class ClientsModule {}
