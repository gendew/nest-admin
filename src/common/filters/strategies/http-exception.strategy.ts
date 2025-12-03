// src/common/filters/strategies/http-exception.strategy.ts
import { HttpException } from '@nestjs/common';

export class HttpExceptionStrategy {
  static handle(exception: HttpException): {
    code: number;
    message: string;
    errors?: any;
  } {
    const response = exception.getResponse();
    const status = exception.getStatus();

    if (typeof response === 'string') {
      return { code: status, message: response };
    }

    if (typeof response === 'object' && response !== null) {
      const { message, error, ...rest } = response as any;
      const msg = Array.isArray(message) ? message[0] : message || error;
      return {
        code: rest.code || status,
        message: msg,
        errors: rest.errors || (Array.isArray(message) ? message : undefined),
      };
    }

    return { code: status, message: exception.message };
  }
}
