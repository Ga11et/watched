import {
  Body,
  Controller,
  Delete,
  ForbiddenException,
  Get,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Post,
  Put,
  Req,
  UnauthorizedException,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiBody,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { UserRole } from '../users/entities/user.entity';
import { RolesGuard } from '../auth/roles.guard';
import { UserBook } from './entities/user-book.entity';
import { UserMovie } from './entities/user-movie.entity';
import { UserSeries } from './entities/user-series.entity';
import { UserGame } from './entities/user-game.entity';
import {
  CreateUserBookDto,
  CreateUserGameDto,
  CreateUserMovieDto,
  CreateUserSeriesDto,
  UpdateUserBookDto,
  UpdateUserGameDto,
  UpdateUserMovieDto,
  UpdateUserSeriesDto,
} from './dto/user-list.dto';
import { UserListsService } from './user-lists.service';
import { FileInterceptor } from '@nestjs/platform-express';

const resourceIdPipe = new ParseUUIDPipe({
  errorHttpStatusCode: HttpStatus.NOT_FOUND,
});

interface AuthenticatedRequest {
  user?: {
    id: string;
    role: UserRole;
  };
}

@ApiTags('user-lists')
@Controller()
export class UserListsController {
  constructor(private readonly userListsService: UserListsService) {}

  @Get('user-books')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Получить книги текущего пользователя' })
  @ApiResponse({ status: 200, type: [UserBook] })
  getCurrentUserBooks(@Req() request: AuthenticatedRequest) {
    const user = this.getAuthenticatedUser(request);

    if (user.role === UserRole.GUEST) {
      throw new ForbiddenException('Access denied');
    }

    return this.userListsService.getCurrentUserBooks(user.id);
  }

  @Get('user-books/stats')
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Получить статистику книг текущего пользователя',
    description: 'Возвращает total, thisMonth (по readAt), avgRating',
  })
  @ApiResponse({
    status: 200,
    description: 'Статистика книг пользователя',
    schema: {
      type: 'object',
      properties: {
        total: { type: 'number', description: 'Общее количество книг' },
        thisMonth: {
          type: 'number',
          description: 'Прочитано за текущий месяц',
        },
        avgRating: {
          type: 'number',
          nullable: true,
          description: 'Средний рейтинг',
        },
      },
    },
  })
  getUserBookStats(@Req() request: AuthenticatedRequest) {
    const user = this.getAuthenticatedUser(request);

    if (user.role === UserRole.GUEST) {
      throw new ForbiddenException('Access denied');
    }

    return this.userListsService.getUserBookStats(user.id);
  }

  @Get('user-books/:id')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Получить книгу текущего пользователя по GUID' })
  @ApiParam({ name: 'id', format: 'uuid' })
  @ApiResponse({ status: 200, type: UserBook })
  getCurrentUserBook(
    @Param('id', resourceIdPipe) id: string,
    @Req() request: AuthenticatedRequest,
  ) {
    const user = this.getAuthenticatedUser(request);

    if (user.role === UserRole.GUEST) {
      throw new ForbiddenException('Access denied');
    }

    return this.userListsService.getCurrentUserBook(user.id, id);
  }

  @Post('user-books')
  @UseInterceptors(FileInterceptor('cover'))
  @UseGuards(RolesGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Добавить книгу в список текущего пользователя' })
  @ApiBody({ type: CreateUserBookDto })
  @ApiResponse({ status: 201, type: UserBook })
  createCurrentUserBook(
    @Req() request: AuthenticatedRequest,
    @Body() dto: CreateUserBookDto,
    @UploadedFile() cover?: Express.Multer.File,
  ) {
    return this.userListsService.createCurrentUserBook(
      this.getAuthenticatedUser(request),
      dto,
      cover,
    );
  }

  @Put('user-books/:id')
  @UseGuards(RolesGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Обновить запись книги в списке пользователя' })
  @ApiParam({ name: 'id', format: 'uuid' })
  @ApiBody({ type: UpdateUserBookDto })
  @ApiResponse({ status: 200, type: UserBook })
  updateCurrentUserBook(
    @Param('id', resourceIdPipe) id: string,
    @Req() request: AuthenticatedRequest,
    @Body() dto: UpdateUserBookDto,
  ) {
    return this.userListsService.updateCurrentUserBook(
      id,
      this.getAuthenticatedUser(request),
      dto,
    );
  }

  @Delete('user-books/:id')
  @UseGuards(RolesGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Удалить запись книги из списка пользователя' })
  @ApiParam({ name: 'id', format: 'uuid' })
  @ApiResponse({
    status: 200,
    schema: { type: 'object', properties: { id: { type: 'string' } } },
  })
  removeCurrentUserBook(
    @Param('id', resourceIdPipe) id: string,
    @Req() request: AuthenticatedRequest,
  ) {
    return this.userListsService.removeCurrentUserBook(
      id,
      this.getAuthenticatedUser(request),
    );
  }

  @Get('user-movies')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Получить фильмы текущего пользователя' })
  @ApiResponse({ status: 200, type: [UserMovie] })
  getCurrentUserMovies(@Req() request: AuthenticatedRequest) {
    const user = this.getAuthenticatedUser(request);
    return this.userListsService.getCurrentUserMovies(user.id);
  }

  @Get('user-movies/stats')
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Получить статистику фильмов текущего пользователя',
    description: 'Возвращает total, thisMonth (по watchedAt), avgRating',
  })
  @ApiResponse({
    status: 200,
    description: 'Статистика фильмов пользователя',
    schema: {
      type: 'object',
      properties: {
        total: { type: 'number', description: 'Общее количество фильмов' },
        thisMonth: {
          type: 'number',
          description: 'Просмотрено за текущий месяц',
        },
        avgRating: {
          type: 'number',
          nullable: true,
          description: 'Средний рейтинг',
        },
      },
    },
  })
  getUserMovieStats(@Req() request: AuthenticatedRequest) {
    const user = this.getAuthenticatedUser(request);

    if (user.role === UserRole.GUEST) {
      throw new ForbiddenException('Access denied');
    }

    return this.userListsService.getUserMovieStats(user.id);
  }

  @Get('user-movies/:id')
  @ApiOperation({ summary: 'Получить запись фильма пользователя по GUID' })
  @ApiParam({ name: 'id', format: 'uuid' })
  @ApiResponse({ status: 200, type: UserMovie })
  getUserMovieById(@Param('id', resourceIdPipe) id: string) {
    return this.userListsService.getUserMovieById(id);
  }

  @Post('user-movies')
  @UseGuards(RolesGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Добавить существующий фильм по точному названию',
    description:
      'Название сравнивается с учётом регистра и всех пробелов, без нормализации. ' +
      'Допустимы только title, rating, watchedAt и comment; movieId и каталожные поля запрещены. ' +
      'Фильм не создаётся и не редактируется.',
  })
  @ApiBody({ type: CreateUserMovieDto })
  @ApiResponse({ status: 201, type: UserMovie })
  @ApiResponse({
    status: 404,
    description: 'Фильм с точным названием не найден',
  })
  @ApiResponse({
    status: 409,
    description:
      'Несколько точных совпадений или фильм уже добавлен пользователем',
  })
  @ApiResponse({
    status: 422,
    description: 'Невалидное тело запроса или лишние поля',
  })
  createCurrentUserMovie(
    @Req() request: AuthenticatedRequest,
    @Body() dto: CreateUserMovieDto,
  ) {
    return this.userListsService.createCurrentUserMovie(
      this.getAuthenticatedUser(request),
      dto,
    );
  }

  @Put('user-movies/:id')
  @UseGuards(RolesGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Обновить запись фильма в списке пользователя' })
  @ApiParam({ name: 'id', format: 'uuid' })
  @ApiBody({ type: UpdateUserMovieDto })
  @ApiResponse({ status: 200, type: UserMovie })
  updateCurrentUserMovie(
    @Param('id', resourceIdPipe) id: string,
    @Req() request: AuthenticatedRequest,
    @Body() dto: UpdateUserMovieDto,
  ) {
    return this.userListsService.updateCurrentUserMovie(
      id,
      this.getAuthenticatedUser(request),
      dto,
    );
  }

  @Delete('user-movies/:id')
  @UseGuards(RolesGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Удалить запись фильма из списка пользователя' })
  @ApiParam({ name: 'id', format: 'uuid' })
  @ApiResponse({
    status: 200,
    schema: { type: 'object', properties: { id: { type: 'string' } } },
  })
  removeCurrentUserMovie(
    @Param('id', resourceIdPipe) id: string,
    @Req() request: AuthenticatedRequest,
  ) {
    return this.userListsService.removeCurrentUserMovie(
      id,
      this.getAuthenticatedUser(request),
    );
  }

  @Get('user-series')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Получить сериалы текущего пользователя' })
  @ApiResponse({ status: 200, type: [UserSeries] })
  getCurrentUserSeries(@Req() request: AuthenticatedRequest) {
    const user = this.getAuthenticatedUser(request);
    return this.userListsService.getCurrentUserSeries(user.id);
  }

  @Post('user-series')
  @UseGuards(RolesGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Добавить сериал в список текущего пользователя' })
  @ApiBody({ type: CreateUserSeriesDto })
  @ApiResponse({ status: 201, type: UserSeries })
  createCurrentUserSeries(
    @Req() request: AuthenticatedRequest,
    @Body() dto: CreateUserSeriesDto,
  ) {
    return this.userListsService.createCurrentUserSeries(
      this.getAuthenticatedUser(request),
      dto,
    );
  }

  @Put('user-series/:id')
  @UseGuards(RolesGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Обновить запись сериала в списке пользователя' })
  @ApiParam({ name: 'id', format: 'uuid' })
  @ApiBody({ type: UpdateUserSeriesDto })
  @ApiResponse({ status: 200, type: UserSeries })
  updateCurrentUserSeries(
    @Param('id', resourceIdPipe) id: string,
    @Req() request: AuthenticatedRequest,
    @Body() dto: UpdateUserSeriesDto,
  ) {
    return this.userListsService.updateCurrentUserSeries(
      id,
      this.getAuthenticatedUser(request),
      dto,
    );
  }

  @Delete('user-series/:id')
  @UseGuards(RolesGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Удалить запись сериала из списка пользователя' })
  @ApiParam({ name: 'id', format: 'uuid' })
  @ApiResponse({
    status: 200,
    schema: { type: 'object', properties: { id: { type: 'string' } } },
  })
  removeCurrentUserSeries(
    @Param('id', resourceIdPipe) id: string,
    @Req() request: AuthenticatedRequest,
  ) {
    return this.userListsService.removeCurrentUserSeries(
      id,
      this.getAuthenticatedUser(request),
    );
  }

  @Get('user-games')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Получить игры текущего пользователя' })
  @ApiResponse({ status: 200, type: [UserGame] })
  getCurrentUserGames(@Req() request: AuthenticatedRequest) {
    const user = this.getAuthenticatedUser(request);
    return this.userListsService.getCurrentUserGames(user.id);
  }

  @Post('user-games')
  @UseGuards(RolesGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Добавить игру в список текущего пользователя' })
  @ApiBody({ type: CreateUserGameDto })
  @ApiResponse({ status: 201, type: UserGame })
  createCurrentUserGame(
    @Req() request: AuthenticatedRequest,
    @Body() dto: CreateUserGameDto,
  ) {
    return this.userListsService.createCurrentUserGame(
      this.getAuthenticatedUser(request),
      dto,
    );
  }

  @Put('user-games/:id')
  @UseGuards(RolesGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Обновить запись игры в списке пользователя' })
  @ApiParam({ name: 'id', format: 'uuid' })
  @ApiBody({ type: UpdateUserGameDto })
  @ApiResponse({ status: 200, type: UserGame })
  updateCurrentUserGame(
    @Param('id', resourceIdPipe) id: string,
    @Req() request: AuthenticatedRequest,
    @Body() dto: UpdateUserGameDto,
  ) {
    return this.userListsService.updateCurrentUserGame(
      id,
      this.getAuthenticatedUser(request),
      dto,
    );
  }

  @Delete('user-games/:id')
  @UseGuards(RolesGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Удалить запись игры из списка пользователя' })
  @ApiParam({ name: 'id', format: 'uuid' })
  @ApiResponse({
    status: 200,
    schema: { type: 'object', properties: { id: { type: 'string' } } },
  })
  removeCurrentUserGame(
    @Param('id', resourceIdPipe) id: string,
    @Req() request: AuthenticatedRequest,
  ) {
    return this.userListsService.removeCurrentUserGame(
      id,
      this.getAuthenticatedUser(request),
    );
  }

  @Get('user-authors')
  getCurrentUserAuthors(): [] {
    return [];
  }

  @Post('user-authors')
  createCurrentUserAuthor(): { created: boolean } {
    return { created: true };
  }

  @Put('user-authors/:id')
  updateCurrentUserAuthor(@Param('id', resourceIdPipe) id: string): {
    id: string;
    updated: boolean;
  } {
    return { id, updated: true };
  }

  @Delete('user-authors/:id')
  removeCurrentUserAuthor(@Param('id', resourceIdPipe) id: string): {
    id: string;
    deleted: boolean;
  } {
    return { id, deleted: true };
  }

  @Get('user-directors')
  getCurrentUserDirectors(): [] {
    return [];
  }

  @Post('user-directors')
  createCurrentUserDirector(): { created: boolean } {
    return { created: true };
  }

  @Put('user-directors/:id')
  updateCurrentUserDirector(@Param('id', resourceIdPipe) id: string): {
    id: string;
    updated: boolean;
  } {
    return { id, updated: true };
  }

  @Delete('user-directors/:id')
  removeCurrentUserDirector(@Param('id', resourceIdPipe) id: string): {
    id: string;
    deleted: boolean;
  } {
    return { id, deleted: true };
  }

  @Get('user/:guid/books')
  @ApiOperation({ summary: 'Получить книги пользователя по GUID' })
  @ApiParam({ name: 'guid', format: 'uuid' })
  @ApiResponse({ status: 200, type: [UserBook] })
  getUserBooksByGuid(@Param('guid', resourceIdPipe) guid: string) {
    return this.userListsService.getUserBooksByGuid(guid);
  }

  @Get('user/:guid/movies')
  @ApiOperation({ summary: 'Получить фильмы пользователя по GUID' })
  @ApiParam({ name: 'guid', format: 'uuid' })
  @ApiResponse({ status: 200, type: [UserMovie] })
  getUserMoviesByGuid(@Param('guid', resourceIdPipe) guid: string) {
    return this.userListsService.getUserMoviesByGuid(guid);
  }

  @Get('user/:guid/series')
  @ApiOperation({ summary: 'Получить сериалы пользователя по GUID' })
  @ApiParam({ name: 'guid', format: 'uuid' })
  @ApiResponse({ status: 200, type: [UserSeries] })
  getUserSeriesByGuid(@Param('guid', resourceIdPipe) guid: string) {
    return this.userListsService.getUserSeriesByGuid(guid);
  }

  @Get('user/:guid/games')
  @ApiOperation({ summary: 'Получить игры пользователя по GUID' })
  @ApiParam({ name: 'guid', format: 'uuid' })
  @ApiResponse({ status: 200, type: [UserGame] })
  getUserGamesByGuid(@Param('guid', resourceIdPipe) guid: string) {
    return this.userListsService.getUserGamesByGuid(guid);
  }

  @Get('user/:guid/authors')
  @ApiOperation({ summary: 'Получить авторов пользователя по GUID' })
  @ApiParam({ name: 'guid', format: 'uuid' })
  @ApiResponse({
    status: 200,
    schema: { type: 'array', items: { type: 'string' } },
  })
  getUserAuthorsByGuid(@Param('guid', resourceIdPipe) guid: string): string[] {
    void guid;
    return [];
  }

  @Get('user/:guid/directors')
  @ApiOperation({ summary: 'Получить режиссеров пользователя по GUID' })
  @ApiParam({ name: 'guid', format: 'uuid' })
  @ApiResponse({
    status: 200,
    schema: { type: 'array', items: { type: 'string' } },
  })
  getUserDirectorsByGuid(
    @Param('guid', resourceIdPipe) guid: string,
  ): string[] {
    void guid;
    return [];
  }

  private getAuthenticatedUser(request: AuthenticatedRequest): {
    id: string;
    role: UserRole;
  } {
    if (!request.user) {
      throw new UnauthorizedException('Authorization token required');
    }

    return request.user;
  }
}
