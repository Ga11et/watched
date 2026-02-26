import { ApiProperty } from '@nestjs/swagger';
import { AuthUserDto } from './auth-user.dto';

export class UsersResponseDto {
  @ApiProperty({
    description: 'Список активных пользователей',
    type: () => [AuthUserDto],
  })
  users: AuthUserDto[];
}
