import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { WsException } from '@nestjs/websockets';
import { Socket } from 'socket.io';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class WsAuthGuard implements CanActivate {
  constructor(private jwtService: JwtService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    try {
      const client: Socket = context.switchToWs().getClient();
      const token = client.handshake.auth.token;
      
      console.log("=== WebSocket Auth Guard ===");
      console.log("Client ID:", client.id);
      console.log("Token provided:", token ? "YES" : "NO");
      
      if (!token) {
        console.log("❌ Token not provided in auth object");
        client.disconnect(true);
        throw new WsException('Token not provided in auth object');
      }

      console.log("Token:", token.substring(0, 20) + "...");
      
      const payload = this.jwtService.verify(token);
      console.log("✅ Token verified successfully");
      console.log("User payload:", payload);
      
      client.data.user = payload;
      
      return true;
    } catch (err) {
      console.log("❌ Token verification failed:", err.message);
      const client: Socket = context.switchToWs().getClient();
      client.disconnect(true);
      throw new WsException('Invalid token');
    }
  }
}
