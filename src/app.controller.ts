import { Controller, Get, Query } from '@nestjs/common';
import { AppService } from './app.service.js';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  getStatus() {
    return this.appService.getStatus();
  }

  @Get('health')
  getHealth() {
    return this.appService.getStatus();
  }

  @Get('api/telegram/status')
  getTelegramStatus(@Query('drop_pending') dropPending?: string) {
    const shouldDrop = dropPending === 'true' || dropPending === '1';
    return this.appService.getTelegramStatus(shouldDrop);
  }
}
