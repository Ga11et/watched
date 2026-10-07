import { HttpStatus, ValidationPipe } from '@nestjs/common';

export class ApplicationValidationPipe extends ValidationPipe {
  constructor() {
    super({
      transform: true,
      whitelist: true,
      forbidNonWhitelisted: true,
      errorHttpStatusCode: HttpStatus.UNPROCESSABLE_ENTITY,
    });
  }
}
