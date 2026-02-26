import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { Response } from 'express';

interface Violation {
  property: string;
  error: string;
}

@Catch()
export class ApiExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();

    if (exception instanceof HttpException) {
      const status = exception.getStatus();
      const payload = exception.getResponse();

      const message = this.resolveMessage(payload);
      const violations = this.resolveViolations(payload, message);

      response.status(status).json({
        status,
        message,
        violations,
      });
      return;
    }

    const internalErrorMessage =
      exception instanceof Error && exception.message
        ? exception.message
        : 'Internal server error';

    response.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
      status: HttpStatus.INTERNAL_SERVER_ERROR,
      message: 'Internal server error',
      violations: [
        {
          property: 'request',
          error: internalErrorMessage,
        } satisfies Violation,
      ],
    });
  }

  private resolveMessage(payload: string | object): string {
    if (typeof payload === 'string') {
      return payload;
    }

    const message = (payload as { message?: unknown }).message;

    if (Array.isArray(message)) {
      return message.length > 0 ? String(message[0]) : 'Validation failed';
    }

    if (typeof message === 'string') {
      return message;
    }

    return 'Request failed';
  }

  private resolveViolations(
    payload: string | object,
    fallbackMessage: string,
  ): Violation[] {
    if (typeof payload !== 'string') {
      const directViolations = (payload as { violations?: unknown }).violations;

      if (Array.isArray(directViolations)) {
        return directViolations as Violation[];
      }

      const message = (payload as { message?: unknown }).message;
      if (Array.isArray(message)) {
        return message.map((entry) => ({
          property: 'request',
          error: String(entry),
        }));
      }
    }

    return [{ property: 'request', error: fallbackMessage }];
  }
}
