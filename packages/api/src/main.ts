import { NestFactory } from '@nestjs/core';
import { ApplicationValidationPipe } from './common/application-validation.pipe';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';

import 'dotenv/config';

async function bootstrap() {
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
