import { ApiProperty } from '@nestjs/swagger';
import { AuthUserDto } from './auth-user.dto';

export class AuthResponseDto {
  @ApiProperty({
    description: 'Токен авторизации',
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
  })
  token: string;

  @ApiProperty({
    description: 'Данные пользователя',
    type: () => AuthUserDto,
  })
  user: AuthUserDto;
}
