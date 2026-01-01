import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { GamesModule } from './games/games.module';

@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: process.env.DB_HOST || '127.0.0.1',
      port: +(process.env.DB_PORT || 5433),
      username: process.env.DB_USER || 'watched',
      password: process.env.DB_PASSWORD || 'watched',
      database: process.env.DB_NAME || 'watched',
      entities: [__dirname + '/**/*.entity{.ts,.js}'],
      synchronize: true, // In development only
    }),
    GamesModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
