import { Module, OnModuleDestroy, Logger } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';

@Module({
  imports: [
    MongooseModule.forRootAsync({
      useFactory: async () => {
        const logger = new Logger('DatabaseModule');
        const nodeEnv = process.env.NODE_ENV || 'development';
        
        if (nodeEnv === 'local') {
          logger.log('Using MongoDB Memory Server for local development');
          const mongoMemoryServer = await MongoMemoryServer.create();
          const uri = mongoMemoryServer.getUri();
          logger.log(`MongoDB Memory Server started at: ${uri}`);
          
          // Store the memory server instance for cleanup
          (global as any).mongoMemoryServer = mongoMemoryServer;
          
          return { uri };
        } else {
          const mongoUri = process.env.MONGODB_URI;
          if (!mongoUri) {
            throw new Error('MONGODB_URI environment variable is required for production');
          }
          
          logger.log('Using production MongoDB connection');
          return { uri: mongoUri };
        }
      },
    }),
  ],
  exports: [MongooseModule],
})
export class DatabaseModule implements OnModuleDestroy {
  async onModuleDestroy() {
    const mongoMemoryServer = (global as any).mongoMemoryServer;
    if (mongoMemoryServer) {
      const logger = new Logger('DatabaseModule');
      logger.log('Stopping MongoDB Memory Server');
      await mongoMemoryServer.stop();
    }
  }
}
