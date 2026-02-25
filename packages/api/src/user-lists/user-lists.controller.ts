import {
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
  Put,
} from '@nestjs/common';

@Controller()
export class UserListsController {
  @Get('user-books')
  getCurrentUserBooks(): [] {
    return [];
  }

  @Post('user-books')
  createCurrentUserBook(): { created: boolean } {
    return { created: true };
  }

  @Put('user-books/:id')
  updateCurrentUserBook(@Param('id', ParseUUIDPipe) id: string): {
    id: string;
    updated: boolean;
  } {
    return { id, updated: true };
  }

  @Delete('user-books/:id')
  removeCurrentUserBook(@Param('id', ParseUUIDPipe) id: string): {
    id: string;
    deleted: boolean;
  } {
    return { id, deleted: true };
  }

  @Get('user-movies')
  getCurrentUserMovies(): [] {
    return [];
  }

  @Post('user-movies')
  createCurrentUserMovie(): { created: boolean } {
    return { created: true };
  }

  @Put('user-movies/:id')
  updateCurrentUserMovie(@Param('id', ParseUUIDPipe) id: string): {
    id: string;
    updated: boolean;
  } {
    return { id, updated: true };
  }

  @Delete('user-movies/:id')
  removeCurrentUserMovie(@Param('id', ParseUUIDPipe) id: string): {
    id: string;
    deleted: boolean;
  } {
    return { id, deleted: true };
  }

  @Get('user-series')
  getCurrentUserSeries(): [] {
    return [];
  }

  @Post('user-series')
  createCurrentUserSeries(): { created: boolean } {
    return { created: true };
  }

  @Put('user-series/:id')
  updateCurrentUserSeries(@Param('id', ParseUUIDPipe) id: string): {
    id: string;
    updated: boolean;
  } {
    return { id, updated: true };
  }

  @Delete('user-series/:id')
  removeCurrentUserSeries(@Param('id', ParseUUIDPipe) id: string): {
    id: string;
    deleted: boolean;
  } {
    return { id, deleted: true };
  }

  @Get('user-games')
  getCurrentUserGames(): [] {
    return [];
  }

  @Post('user-games')
  createCurrentUserGame(): { created: boolean } {
    return { created: true };
  }

  @Put('user-games/:id')
  updateCurrentUserGame(@Param('id', ParseUUIDPipe) id: string): {
    id: string;
    updated: boolean;
  } {
    return { id, updated: true };
  }

  @Delete('user-games/:id')
  removeCurrentUserGame(@Param('id', ParseUUIDPipe) id: string): {
    id: string;
    deleted: boolean;
  } {
    return { id, deleted: true };
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
  updateCurrentUserAuthor(@Param('id', ParseUUIDPipe) id: string): {
    id: string;
    updated: boolean;
  } {
    return { id, updated: true };
  }

  @Delete('user-authors/:id')
  removeCurrentUserAuthor(@Param('id', ParseUUIDPipe) id: string): {
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
  updateCurrentUserDirector(@Param('id', ParseUUIDPipe) id: string): {
    id: string;
    updated: boolean;
  } {
    return { id, updated: true };
  }

  @Delete('user-directors/:id')
  removeCurrentUserDirector(@Param('id', ParseUUIDPipe) id: string): {
    id: string;
    deleted: boolean;
  } {
    return { id, deleted: true };
  }

  @Get('user/:guid/books')
  getUserBooksByGuid(@Param('guid', ParseUUIDPipe) guid: string): string[] {
    void guid;
    return [];
  }

  @Get('user/:guid/movies')
  getUserMoviesByGuid(@Param('guid', ParseUUIDPipe) guid: string): string[] {
    void guid;
    return [];
  }

  @Get('user/:guid/series')
  getUserSeriesByGuid(@Param('guid', ParseUUIDPipe) guid: string): string[] {
    void guid;
    return [];
  }

  @Get('user/:guid/games')
  getUserGamesByGuid(@Param('guid', ParseUUIDPipe) guid: string): string[] {
    void guid;
    return [];
  }

  @Get('user/:guid/authors')
  getUserAuthorsByGuid(@Param('guid', ParseUUIDPipe) guid: string): string[] {
    void guid;
    return [];
  }

  @Get('user/:guid/directors')
  getUserDirectorsByGuid(@Param('guid', ParseUUIDPipe) guid: string): string[] {
    void guid;
    return [];
  }
}
