import { Injectable, Logger } from "@nestjs/common";
import { Server, Socket } from "socket.io";

@Injectable()
export class WsHelperService {
  private readonly logger = new Logger(WsHelperService.name);

  /**
   * Logs all userIds currently connected to a specific room
   * @param server - Socket.io server instance
   * @param roomId - The room ID to check
   */
  logCurrentClientConnected(server: Server, roomId: string): void {
    try {
      // Get all sockets in the room using the correct adapter access with type casting
      const adapter = server.adapter as unknown as { rooms: Map<string, any> };
      const allRooms = Array.from(adapter.rooms.keys());
      const prefix = `auctionRoom:`;
      const rooms = allRooms.filter((roomId) =>
        (roomId as string).startsWith(prefix)
      ) as string[];
      const userIds = new Set<string>();

      for (const room of rooms) {
        const roomData = adapter.rooms.get(room);
        if (roomData) {
          // Extract socket data from room
          for (const socketId of roomData) {
            // Try different ways to get socket data due to Azure Web PubSub limitations
            let socket;
            
            // Method 1: Try server.sockets.sockets
            if (server.sockets?.sockets) {
              socket = server.sockets.sockets.get(socketId);
            }
            
            // Method 2: Try direct socket access
            if (!socket) {
              socket = (server as any).sockets?.get?.(socketId);
            }
            
            // Extract operatorId if socket and data exist
            const userData = socket?.data?.socketUserData;
            if (userData) {
              userIds.add(userData.userId);
            }
          }
        }
      }
      const arrayUserIds = Array.from(userIds);
      this.logger.log(`Room ${roomId} - Total clients: ${userIds.size}, User IDs: [${arrayUserIds.join(', ')}]`);
    } catch (error) {
      this.logger.error(`Error logging clients for room ${roomId}:`, error);
    }
  }

  /**
   * Logs all rooms currently connected to a specific room
   * @param server - Socket.io server instance
   */
  logAllConnectedRooms(server: Server): void {
    try {
      const adapter = server.adapter as unknown as { rooms: Map<string, any> };
      const allRooms = Array.from(adapter.rooms.keys());
      const prefix = `auctionRoom:`;
      const filteredRooms = allRooms.filter((roomId) =>
        (roomId as string).startsWith(prefix)
      ) as string[];
      this.logger.debug(`All active rooms: [${filteredRooms.join(', ')}]`);
    } catch (error) {
      this.logger.error(`Error logging all connected rooms:`, error);
    }
  }
  /**
   * Get detailed information about clients in a room
   * @param server - Socket.io server instance
   * @param roomId - The room ID to check
   * @returns Array of client information
   */
  getClientsInRoom(
    server: Server,
    roomId: string
  ): Array<{ id: string; user?: any; connectedAt?: Date }> {
    try {
      const adapter = server.adapter as unknown as { rooms: Map<string, any> };
      const room = adapter.rooms.get(roomId);

      if (!room) {
        return [];
      }

      const clients: Array<{ id: string; user?: any; connectedAt?: Date }> = [];

      room.forEach((socketId) => {
        const socket = server.sockets.sockets.get(socketId);
        if (socket) {
          clients.push({
            id: socket.id,
            user: socket.data.socketUserData || "Unknown user",
            connectedAt: socket.data.connectedAt || new Date(),
          });
        }
      });

      return clients;
    } catch (error) {
      this.logger.error(`Error getting clients for room ${roomId}:`, error);
      return [];
    }
  }

  /**
   * Get count of clients in a room
   * @param server - Socket.io server instance
   * @param roomId - The room ID to check
   * @returns Number of clients in the room
   */
  getClientCountInRoom(server: Server, roomId: string): number {
    try {
      const adapter = server.adapter as unknown as { rooms: Map<string, any> };
      const room = adapter.rooms.get(roomId);
      return room ? room.size : 0;
    } catch (error) {
      this.logger.error(
        `Error getting client count for room ${roomId}:`,
        error
      );
      return 0;
    }
  }

  /**
   * Log all rooms and their client counts
   * @param server - Socket.io server instance
   */
  logAllRooms(server: Server): void {
    try {
      const adapter = server.adapter as unknown as { rooms: Map<string, any> };
      const rooms = adapter.rooms;
      this.logger.log("=== All Active Rooms ===");

      if (rooms.size === 0) {
        this.logger.log("No active rooms");
        return;
      }

      rooms.forEach((clients, roomId) => {
        this.logger.log(`Room: ${roomId} - Clients: ${clients.size}`);
      });

      this.logger.log("=== End All Rooms ===");
    } catch (error) {
      this.logger.error("Error logging all rooms:", error);
    }
  }
}
