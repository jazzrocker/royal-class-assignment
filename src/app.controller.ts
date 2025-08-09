import { Controller, Get, UseGuards, Request } from '@nestjs/common';
import { AppService } from './app.service';
import { HttpAuthGuard } from './common/guards';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  getHello(): string {
    return this.appService.getHello();
  }

  @Get('protected')
  @UseGuards(HttpAuthGuard)
  getProtectedData(@Request() req) {
    return {
      message: 'This is protected data',
      user: req.user
    };
  }
}
