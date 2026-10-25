import { ApiProperty } from '@nestjs/swagger';

export class UserDeletionSummaryDto {
  @ApiProperty({
    description: 'Количество книг в списке пользователя, которые будут удалены',
    type: Number,
    minimum: 0,
    example: 2,
  })
  books: number;

  @ApiProperty({
    description:
      'Количество фильмов в списке пользователя, которые будут удалены',
    type: Number,
    minimum: 0,
    example: 1,
  })
  movies: number;

  @ApiProperty({
    description:
      'Количество сериалов в списке пользователя, которые будут удалены',
    type: Number,
    minimum: 0,
    example: 0,
  })
  series: number;

  @ApiProperty({
    description: 'Количество игр в списке пользователя, которые будут удалены',
    type: Number,
    minimum: 0,
    example: 5,
  })
  games: number;
}
