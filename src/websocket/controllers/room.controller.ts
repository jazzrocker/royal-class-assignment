import {
  WebSocketGateway,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
  WebSocketServer,
  WsResponse,
} from "@nestjs/websockets";
import { Socket, Server } from "socket.io";
import { Inject, Logger } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { RoomEmitter } from "../emitters/room.emitter";
import { WsHelperService } from "../services/ws-helper.service";
import { BaseGateway } from "../gateways/base.gateway";
import { RESPONSE_CONSTANTS } from "src/common/constants/response.constants";
import { PlaceBidsService } from "../../bids/services/place-bids.service";
import { JoinAuctionService } from "src/auction/services/join-auction.service";

@WebSocketGateway({
  namespace: "royalClassAuctionRoom",
  cors: {
    origin: "*",
    credentials: true,
  },
  pingInterval: 2000,
  pingTimeout: 4000,
})
export class RoomController extends BaseGateway {
  constructor(
    @Inject(RoomEmitter) protected roomEmitter: RoomEmitter,
    private wsHelperService: WsHelperService,
    protected jwtService: JwtService,
    private placeBidsService: PlaceBidsService,
    private joinAuctionService: JoinAuctionService
  ) {
    super(roomEmitter, new Logger(RoomController.name), jwtService);
  }

  protected getNamespace(): string {
    return "royalClassAuctionRoom";
  }

  afterInit(server: Server) {
    super.afterInit(server);
    this.logger.log(
      "🔧 RoomController initialized with direct JWT verification"
    );
  }

  @SubscribeMessage("joinAuction")
  async handleJoinRoom(
    @MessageBody() data: { auctionId: string },
    @ConnectedSocket() client: Socket
  ): Promise<WsResponse<any>> {
    const { auctionId } = data;
    const userId =
      client.data.socketUserData?.userId || client.data.socketUserData?.id;
    const name = client.data.socketUserData.name;

    if (!userId) {
      this.logger.error("❌ No user ID found in client data");
      return {
        event: "room-joined-error",
        data: { message: RESPONSE_CONSTANTS.USER_NOT_AUTHENTICATED },
      };
    }

    const auctionRoom = `auctionRoom:${auctionId}`;
    // Join the auction room
    await client.join(auctionRoom);

    // Log current clients in the room
    if (this.server) {
      this.wsHelperService.logAllConnectedRooms(this.server);
      this.wsHelperService.logCurrentClientConnected(this.server, auctionRoom);
    }

    const roomData = await this.joinAuctionService.joinAuction(auctionId, userId);

    // Use the room emitter to emit the event for all clients in the room
    this.roomEmitter.emitRoomNotification(auctionRoom, `${name} joined the auction.`);

    return {
      event: "room-joined",
      data: roomData,
    };
  }

  // @SubscribeMessage("leave-room")
  // async handleLeaveRoom(
  //   @MessageBody() data: { auctionId: string },
  //   @ConnectedSocket() client: Socket
  // ): Promise<WsResponse<any>> {
  //   const { auctionId } = data;
  //   const userId =
  //     client.data.socketUserData?.userId || client.data.socketUserData?.id;

  //   const auctionRoom = `auctionRoom:${auctionId}`;
  //   // Leave the auction room
  //   await client.leave(auctionRoom);

  //   // Log current clients in the room after leaving
  //   if (this.server) {
  //     this.wsHelperService.logCurrentClientConnected(this.server, auctionRoom);
  //   }

  //   // Use the room emitter to emit the event
  //   this.roomEmitter.emitPlayerLeft(auctionRoom, userId);

  //   return {
  //     event: "room-left",
  //     data: {
  //       message: "Auction room left",
  //       auctionId,
  //       userId,
  //     },
  //   };
  // }

  @SubscribeMessage("placeBid")
  async handlePlaceBid(
    @MessageBody() data: { auctionId: string; bidAmount: number },
    @ConnectedSocket() client: Socket
  ): Promise<WsResponse<any>> {
    const { auctionId, bidAmount } = data;
    const userId =
      client.data.socketUserData?.userId || client.data.socketUserData?.id;
    const name = client.data.socketUserData.name;

    if (!userId) {
      return {
        event: "bid-placed-error",
        data: { message: RESPONSE_CONSTANTS.USER_NOT_AUTHENTICATED },
      };
    }

    try {
      // Use the PlaceBidsService to place the bid
      const placedBid = await this.placeBidsService.placeBid({
        auctionId,
        bidAmount,
        userId,
      });

      const auctionRoom = `auctionRoom:${auctionId}`;

      this.roomEmitter.emitRoomNotification(auctionRoom, `${name} placed a bid of ${bidAmount} on the auction.`);

      // Emit bid placed event to all clients in the auction room
      this.roomEmitter.emitBidPlaced(auctionRoom, placedBid);

      return {
        event: "bid-placed",
        data: {
          message: "Bid placed successfully",
          bid: placedBid,
        },
      };
    } catch (error) {
      this.logger.error(`Error placing bid: ${error.message}`);

      return {
        event: "bid-placed-error",
        data: {
          message: error.message || "Failed to place bid",
          auctionId,
          bidAmount,
        },
      };
    }
  }
}
