import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
  OnGatewayInit,
} from "@nestjs/websockets";
import { Server, Socket } from "socket.io";
import { Inject, Logger } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { RoomEmitter } from "../emitters/room.emitter";

export interface SocketData {
  userId?: string;
  gameId?: string;
  userCode?: string;
  operatorId?: string;
  currencyCode?: string;
  currencyId?: string;
  operatorUserToken?: string;
}

@WebSocketGateway({
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
  },
})
export abstract class BaseGateway
  implements OnGatewayConnection, OnGatewayDisconnect, OnGatewayInit
{
  @WebSocketServer()
  public server: Server;

  constructor(
    @Inject(RoomEmitter) protected roomEmitter: RoomEmitter, 
    protected readonly logger: Logger,
    protected readonly jwtService: JwtService
  ) {}

  afterInit(server: Server) {
    this.roomEmitter.setServer(server);
    this.logger.log(`BaseGateway initialized for namespace: ${this.getNamespace()}`);
  }

  async handleConnection(client: Socket) {
    
    try {
      const token = client.handshake.auth?.token;
      
      if (!token) {
        this.logger.debug(`No token provided for client: ${client.id}, not connecting to socket.`);
        client.disconnect(true);
        return;
      }
      const decoded = this.jwtService.verify(token);
      // Store user data in client
      client.data.socketUserData = decoded;
      
      this.logger.log(`✅ Client connected: ${client.id} - UserID: ${decoded.userId || decoded.id}`);
      await client.join(`user:${decoded.userId || decoded.id}`);
    } catch (error) {
      this.logger.error(`❌ Token verification failed for client: ${client.id} - ${error.message}`);
      client.disconnect(true);
      return;
    }
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`Client disconnected: ${client.id} from namespace: ${this.getNamespace()}`);
  }

  // Abstract method to be implemented by child classes
  protected abstract getNamespace(): string;
}
