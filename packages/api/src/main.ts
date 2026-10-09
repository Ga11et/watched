import { NestFactory } from '@nestjs/core';
import { ApplicationValidationPipe } from './common/application-validation.pipe';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { requireMigrations } from './database/require-migrations';

import 'dotenv/config';

function validateProductionEnv(): void {
  for (const name of [
    'JWT_SECRET',
    'JWT_ALGORITHM',
    'JWT_EXPIRES_IN',
    'CORS_ORIGIN',
  ]) {
    if (!process.env[name]?.trim()) {
      throw new Error(`${name} is required in production`);
    }
  }
}

async function bootstrap() {
  if (process.env.NODE_ENV === 'production') {
    validateProductionEnv();
    await requireMigrations();
  }

  const app = await NestFactory.create(AppModule);

  // Enable global validation
  app.useGlobalPipes(new ApplicationValidationPipe());

  app.enableCors({
    origin: process.env.CORS_ORIGIN || 'http://localhost:33000',
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
  });

  // Swagger configuration
  const config = new DocumentBuilder()
    .setTitle('Watched API')
    .setDescription('API для управления списками контента')
    .setVersion('1.0')
    .addBearerAuth({
      type: 'http',
      scheme: 'bearer',
      bearerFormat: 'JWT',
    })
    .addTag('books')
    .addTag('movies')
    .addTag('series')
    .addTag('games')
    .addTag('authors')
    .addTag('directors')
    .addTag('publishers')
    .addTag('developers')
    .addTag('user-lists')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document);

  await app.listen(process.env.PORT ?? 33010);
  console.log(`🚀 Application running on: http://localhost:33010`);
  console.log(`📚 API Documentation: http://localhost:33010/api`);
}
bootstrap().catch((err) => {
  console.error('Failed to start application:', err);
  process.exit(1);
});
