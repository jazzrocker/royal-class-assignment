import { NestFactory } from "@nestjs/core";
import { AppModule } from "./app.module";
import * as dotenv from "dotenv";
import { Logger, ValidationPipe } from "@nestjs/common";
import morgan from 'morgan';

// Load environment variables from .env file
dotenv.config();

async function bootstrap() {
  const logger = new Logger("Main");
  const HttpLogger = new Logger("Http");
  const morganMiddleware = morgan(':method :url :status -> :response-time ms', {
    stream: {
      write: (message) => {
        // Use the logger's debug level instead of console.log skipping OPTIONS requests
        if (!message.startsWith('OPTIONS')) {
          HttpLogger.debug(message.trim());
        }
      },
    },
  });
  const app = await NestFactory.create(AppModule);
  app.use(morganMiddleware);

  // Enable CORS
  app.enableCors({
    origin: true, // Allow all origins in development, specify domains in production
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Accept'],
    credentials: true,
  });

  // Enable validation
  app.useGlobalPipes(new ValidationPipe({
    whitelist: true,
    forbidNonWhitelisted: true,
    transform: true,
  }));

  const port = process.env.PORT || 3000;
  await app.listen(port);

  logger.verbose(
    `🚀 Application and WebSocket server is running on: http://localhost:${port}`
  );
}
bootstrap();
