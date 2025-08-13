import { Injectable, Logger, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { RABBITMQ_CONFIG, RABBITMQ_TOPICS } from './rabbitmq.config';

// Using dynamic import to handle amqplib properly
let amqp: any;

@Injectable()
export class RabbitMQService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(RabbitMQService.name);
  private connection: any = null;
  private channel: any = null;
  private isConnected = false;

  async onModuleInit() {
    try {
      await this.connect();
    } catch (error) {
      this.logger.warn('RabbitMQ connection failed during startup. Application will continue without RabbitMQ.');
      this.logger.warn('To enable RabbitMQ: Start RabbitMQ server and restart the application.');
    }
  }

  async onModuleDestroy() {
    await this.disconnect();
  }

  private async connect(): Promise<void> {
    try {
      // Dynamic import to avoid TypeScript issues
      amqp = await import('amqplib');
      
      this.logger.log(`Connecting to RabbitMQ at ${RABBITMQ_CONFIG.url}`);
      
      // Create connection
      this.connection = await amqp.connect(RABBITMQ_CONFIG.url);
      
      if (!this.connection) {
        throw new Error('Failed to create RabbitMQ connection');
      }
      
      // Handle connection events
      this.connection.on('error', (error: any) => {
        this.logger.error('RabbitMQ connection error:', error);
        this.isConnected = false;
      });

      this.connection.on('close', () => {
        this.logger.warn('RabbitMQ connection closed');
        this.isConnected = false;
      });

      // Create channel
      this.channel = await this.connection.createChannel();
      
      // Setup exchange and queues
      await this.setupInfrastructure();
      
      this.isConnected = true;
      this.logger.log('Successfully connected to RabbitMQ and setup infrastructure');
      
    } catch (error) {
      this.logger.error('Failed to connect to RabbitMQ:', error.message);
      this.isConnected = false;
      throw error;
    }
  }

  private async setupInfrastructure(): Promise<void> {
    if (!this.channel) {
      throw new Error('Channel not available');
    }

    // Create exchange
    await this.channel.assertExchange(
      RABBITMQ_CONFIG.exchange.name,
      RABBITMQ_CONFIG.exchange.type,
      RABBITMQ_CONFIG.exchange.options
    );

    // Create queues and bind to exchange
    for (const [queueKey, queueConfig] of Object.entries(RABBITMQ_CONFIG.queues)) {
      await this.channel.assertQueue(queueConfig.name, queueConfig.options);
      await this.channel.bindQueue(
        queueConfig.name,
        RABBITMQ_CONFIG.exchange.name,
        queueConfig.routingKey
      );
      this.logger.log(`Queue ${queueConfig.name} created and bound to exchange with routing key: ${queueConfig.routingKey}`);
    }
  }

  async publish(topic: string, message: any): Promise<boolean> {
    if (!this.isConnected || !this.channel) {
      this.logger.error('RabbitMQ not connected. Cannot publish message.');
      return false;
    }

    try {
      const messageBuffer = Buffer.from(JSON.stringify(message));
      
      const published = this.channel.publish(
        RABBITMQ_CONFIG.exchange.name,
        topic,
        messageBuffer,
        {
          persistent: true,
          timestamp: Date.now(),
          messageId: `${topic}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
        }
      );

      if (published) {
        this.logger.log(`Message published to topic: ${topic}`);
        return true;
      } else {
        this.logger.warn(`Failed to publish message to topic: ${topic}`);
        return false;
      }
    } catch (error) {
      this.logger.error(`Error publishing message to topic ${topic}:`, error);
      return false;
    }
  }

  async publishAuctionSave(message: object): Promise<boolean> {
    return this.publish(RABBITMQ_TOPICS.AUCTIONS_SAVE, {
      type: 'AUCTION_SAVE',
      timestamp: new Date().toISOString(),
      ...message
    });
  }

  async publishAuctionAnnounceResults(message: object): Promise<boolean> {
    return this.publish(RABBITMQ_TOPICS.AUCTIONS_ANNOUNCE_RESULTS, {
      type: 'AUCTION_ANNOUNCE_RESULTS',
      timestamp: new Date().toISOString(),
      ...message
    });
  }

  async subscribe(
    queueName: string, 
    callback: (message: any) => Promise<void>
  ): Promise<void> {
    if (!this.isConnected || !this.channel) {
      throw new Error('RabbitMQ not connected. Cannot subscribe to queue.');
    }

    try {
      await this.channel.consume(queueName, async (msg: any) => {
        if (msg) {
          try {
            const content = JSON.parse(msg.content.toString());
            this.logger.log(`Received message from queue ${queueName}:`, content.type);
            
            await callback(content);
            
            // Acknowledge the message
            this.channel?.ack(msg);
          } catch (error) {
            this.logger.error(`Error processing message from queue ${queueName}:`, error);
            // Reject the message and don't requeue
            this.channel?.nack(msg, false, false);
          }
        }
      });

      this.logger.log(`Subscribed to queue: ${queueName}`);
    } catch (error) {
      this.logger.error(`Error subscribing to queue ${queueName}:`, error);
      throw error;
    }
  }

  private async disconnect(): Promise<void> {
    try {
      if (this.channel) {
        await this.channel.close();
        this.channel = null;
      }
      
      if (this.connection) {
        await this.connection.close();
        this.connection = null;
      }
      
      this.isConnected = false;
      this.logger.log('Disconnected from RabbitMQ');
    } catch (error) {
      this.logger.error('Error disconnecting from RabbitMQ:', error);
    }
  }

  getConnectionStatus(): boolean {
    return this.isConnected;
  }
}