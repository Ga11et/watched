import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { Request, Response } from 'express';

@Catch()
export class ApiExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const request = ctx.getRequest<Request>();
    const response = ctx.getResponse<Response>();

    if (exception instanceof HttpException) {
      const status = exception.getStatus();
      const payload = exception.getResponse();

      const message = this.resolveMessage(payload);
      const violations = this.resolveViolations(payload, request);

      response.status(status).json({
        status,
        message,
        violations,
      });
      return;
    }

    response.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
      status: HttpStatus.INTERNAL_SERVER_ERROR,
      message: 'Internal server error',
      violations: {},
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
    request: Request,
  ): Record<string, string> {
    if (typeof payload !== 'string') {
      const directViolations = (payload as { violations?: unknown }).violations;

      if (
        directViolations !== null &&
        typeof directViolations === 'object' &&
        !Array.isArray(directViolations)
      ) {
        return Object.fromEntries(
          Object.entries(directViolations).filter(
            (entry): entry is [string, string] => typeof entry[1] === 'string',
          ),
        );
      }

      const message = (payload as { message?: unknown }).message;
      if (Array.isArray(message)) {
        const violations = new Map<string, string>();
        for (const entry of message) {
          const text = String(entry);
          const field = this.resolveMessageField(text);
          if (!violations.has(field)) {
            violations.set(field, text);
          }
        }
        return Object.fromEntries(violations);
      }

      if (this.isUuidValidationMessage(message)) {
        return { [this.resolveUuidField(request)]: String(message) };
      }
    }

    return {};
  }

  private resolveMessageField(message: string): string {
    const parts = message.trim().split(/\s+/);
    const candidateField = parts[0] || 'request';

    return /^[a-zA-Z][a-zA-Z0-9_]*$/.test(candidateField)
      ? candidateField
      : 'request';
  }

  private isUuidValidationMessage(message: unknown): boolean {
    return typeof message === 'string' && message.includes('uuid is expected');
  }

  private resolveUuidField(request: Request): string {
    if (request?.params && typeof request.params.id === 'string') {
      return 'id';
    }

    return 'request';
  }
}
