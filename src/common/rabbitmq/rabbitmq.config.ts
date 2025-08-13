export const RABBITMQ_CONFIG = {
  // Connection URL - can be overridden by environment variable
  url: process.env.RABBITMQ_URL || 'amqp://localhost:5672',
  
  // Exchange configuration
  exchange: {
    name: 'auction_exchange',
    type: 'topic',
    options: {
      durable: true,
    }
  },
  
  // Queue configurations
  queues: {
    saveActiveAuctions: {
      name: 'auctions.save.queue',
      routingKey: 'auctions.save',
      options: {
        durable: true,
        messageTtl: 300000, // 5 minutes TTL
        maxLength: 1000,
      }
    },
    announceResults: {
      name: 'auctions.announce.results.queue',
      routingKey: 'auctions.announce.results',
      options: {
        durable: true,
        messageTtl: 300000, // 5 minutes TTL
        maxLength: 1000,
      }
    }
  },
  
  // Connection options
  connectionOptions: {
    heartbeat: 60,
    reconnectTimeInSeconds: 30,
  }
};

export const RABBITMQ_TOPICS = {
  AUCTIONS_SAVE: 'auctions.save',
  AUCTIONS_ANNOUNCE_RESULTS: 'auctions.announce.results'
} as const;
