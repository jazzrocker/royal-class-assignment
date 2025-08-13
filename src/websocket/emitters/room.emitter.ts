import { Injectable } from '@nestjs/common';
import { Server } from 'socket.io';

@Injectable()
export class RoomEmitter {
  private server: Server;

  setServer(server: Server) {
    this.server = server;
  }

  emitRoomNotification(roomId: string, notification: string) {
    if (!this.server) {
      console.warn('Server not initialized in RoomEmitter');
      return;
    }
    
    this.server.to(roomId).emit(`${roomId}:notification`, {
      notification,
    });
  }

  emitGlobalNotification(message: string) {
    if (!this.server) {
      console.warn('Server not initialized in RoomEmitter');
      return;
    }
    
    this.server.emit(`global:notification`, {
      notification: message,
    });
  }

  emitGlobalAuctionEnded(message: string) {
    if (!this.server) {
      console.warn('Server not initialized in RoomEmitter');
      return;
    }
    
    this.server.emit(`auctionEnd`, {
      notification: message,
    });
  }

  emitUserNotification(message: string, userId: string) {
    if (!this.server) {
      console.warn('Server not initialized in RoomEmitter');
      return;
    }
    console.log(`Emitting user notification to ${userId}: ${message}`);
    this.server.emit(`user:${userId}`, {
      notification: message,
    });
  }

  emitPlayerLeft(roomId: string, userId: string) {
    if (!this.server) {
      console.warn('Server not initialized in RoomEmitter');
      return;
    }
    
    this.server.to(roomId).emit('member-left', {
      userId,
      roomId,
      timestamp: new Date().toISOString()
    });
  }

  emitGameUpdate(roomId: string, gameData: any) {
    if (!this.server) {
      console.warn('Server not initialized in RoomEmitter');
      return;
    }
    
    this.server.to(roomId).emit('game-update', {
      roomId,
      gameData,
      timestamp: new Date().toISOString()
    });
  }

  emitRoomMessage(roomId: string, message: string, senderId: string) {
    if (!this.server) {
      console.warn('Server not initialized in RoomEmitter');
      return;
    }
    
    this.server.to(roomId).emit('room-message', {
      roomId,
      message,
      senderId,
      timestamp: new Date().toISOString()
    });
  }

  emitBidPlaced(roomId: string, bidData: any) {
    if (!this.server) {
      console.warn('Server not initialized in RoomEmitter');
      return;
    }
    const newBid = {
      newBid: {
        ...bidData,
        timestamp: new Date().toISOString()
      }
    };
    this.server.to(roomId).emit(`${roomId}:newBid`, newBid);
  }

  emitChatMessage(roomId: string, chatData: any) {
    if (!this.server) {
      console.warn('Server not initialized in RoomEmitter');
      return;
    }
    
    this.server.to(roomId).emit('chat-message', {
      roomId,
      ...chatData,
      timestamp: new Date().toISOString()
    });
  }
}
