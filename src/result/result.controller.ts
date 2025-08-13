import { Controller, Get, Logger } from '@nestjs/common';

@Controller('result')
export class ResultController {
  private readonly logger = new Logger(ResultController.name);

  @Get('health')
  getHealth() {
    return {
      status: 'ok',
      message: 'Result processing module is healthy',
      timestamp: new Date().toISOString()
    };
  }

  @Get('status')
  getStatus() {
    return {
      consumers: {
        'auctions.save': 'active',
        'auctions.announce.results': 'active'
      },
      message: 'RabbitMQ consumers are running',
      timestamp: new Date().toISOString()
    };
  }
}
