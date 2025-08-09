import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class HttpAuthGuard implements CanActivate {
  constructor(private jwtService: JwtService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    try {
      const request = context.switchToHttp().getRequest();
      const authHeader = request.headers.authorization;
      
      if (!authHeader) {
        throw new UnauthorizedException('Authorization header not provided');
      }

      const token = authHeader.replace('Bearer ', '');
      
      if (!token) {
        throw new UnauthorizedException('Token not provided');
      }

      const payload = this.jwtService.verify(token);
      request.user = payload;
      
      return true;
    } catch (err) {
      throw new UnauthorizedException('Invalid token');
    }
  }
}
