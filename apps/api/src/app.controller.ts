import { Controller, Get } from '@nestjs/common';

export interface HealthStatus {
  status: 'ok';
}

@Controller()
export class AppController {
  @Get('health')
  getHealth(): HealthStatus {
    return { status: 'ok' };
  }
}
