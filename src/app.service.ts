import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {
  getStatus() {
    return {
      status: 'ok',
      service: 'Purity Matters Bot Backend',
      timestamp: new Date().toISOString(),
    };
  }
}
