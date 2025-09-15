import { Controller, Get, Res } from '@nestjs/common';
import { CurrentUser } from './common/decorators/current-user.decorator';
import type { CurrentUserI } from './@types/custom';
import { AppService } from './app.service';
import { ResponseFormatter } from './common/interceptors/response-formatter.interceptor';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get('health')
  health() {
    return { status: 'ok' };
  }

}
