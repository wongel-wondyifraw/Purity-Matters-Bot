import { Test, TestingModule } from '@nestjs/testing';
import { AppController } from './app.controller.js';
import { AppService } from './app.service.js';

import { ConfigService } from '@nestjs/config';

describe('AppController', () => {
  let appController: AppController;

  beforeEach(async () => {
    const app: TestingModule = await Test.createTestingModule({
      controllers: [AppController],
      providers: [
        AppService,
        {
          provide: ConfigService,
          useValue: {
            get: (_key: string, defaultValue?: any) => defaultValue ?? '',
          },
        },
      ],
    }).compile();

    appController = app.get<AppController>(AppController);
  });

  describe('root', () => {
    it('should return server status', () => {
      const status = appController.getStatus();
      expect(status).toHaveProperty('status', 'ok');
      expect(status).toHaveProperty('service', 'Purity Matters Bot Backend');
    });
  });
});
