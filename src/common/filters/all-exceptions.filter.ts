// src/common/filters/all-exceptions.filter.ts
import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { ErrorCode } from '../enums/error-code.enum';
import { BusinessException } from '../exceptions/base.exception';

@Catch() // 捕获所有异常
export class AllExceptionsFilter implements ExceptionFilter {
  // 保留一个 Logger 只是为了在极端情况下（中间件没抓到）兜底
  private readonly logger = new Logger(AllExceptionsFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    // 默认值
    let code = ErrorCode.INTERNAL_ERROR;
    let message = '服务器内部错误';
    let errors: any = null;
    let httpStatus = HttpStatus.INTERNAL_SERVER_ERROR;

    // 1. 业务异常（我们自己抛的，不记 error 日志）
    if (exception instanceof BusinessException) {
      const res = exception.getResponse() as any;
      code = res.code || ErrorCode.INTERNAL_ERROR;
      message = res.message || '业务异常';
      errors = res.errors || null;
      httpStatus = HttpStatus.OK; // 业务异常强制返回 200
    }
    // 2. 其他 Nest HttpException（如 BadRequestException、ValidationPipe 抛的）
    else if (exception instanceof HttpException) {
      const res = exception.getResponse();
      httpStatus = exception.getStatus();

      if (typeof res === 'string') {
        message = res;
      } else if (res && typeof res === 'object') {
        message = (res as any).message || exception.message;
        if (Array.isArray(message)) {
          message = message[0]; // class-validator 的情况
        }
        code = (res as any).code || httpStatus;
        errors =
          (res as any).errors ||
          (Array.isArray((res as any).message) ? (res as any).message : null);
      }

      // 常见映射
      if (httpStatus === HttpStatus.BAD_REQUEST)
        code = ErrorCode.VALIDATION_FAILED;
      if (httpStatus === HttpStatus.UNAUTHORIZED) code = ErrorCode.UNAUTHORIZED;
      if (httpStatus === HttpStatus.FORBIDDEN) code = ErrorCode.FORBIDDEN;
      if (httpStatus === HttpStatus.NOT_FOUND) code = ErrorCode.NOT_FOUND;
    }
    // 3. 未捕获的原始 Error（致命错误，必须记日志）
    else if (exception instanceof Error) {
      message =
        process.env.NODE_ENV === 'production'
          ? '服务器内部错误'
          : exception.message;
      code = ErrorCode.INTERNAL_ERROR;

      // 关键：把错误信息塞到 res.locals，供日志中间件自动采集
      response.locals.error = {
        name: exception.name,
        message: exception.message,
        stack: exception.stack,
      };

      // 兜底日志（万一中间件没抓到）
      this.logger.error(`未捕获异常: ${exception.message}`, exception.stack);
    }

    // 4. 完全未知的错误（极少）
    else {
      message = '未知错误';
      response.locals.error = { message: String(exception) };
    }

    // 统一响应体
    const payload: UnifiedResponse<null> = {
      code,
      data: null,
      message,
      timestamp: new Date().toISOString(),
      path: request.url,
      traceId: (request as any).traceId || 'unknown',
      ...(errors ? { errors } : {}),
    };

    // 业务异常返回 200，其他根据情况
    response.status(code >= 10000 ? HttpStatus.OK : httpStatus).json(payload);
  }
}
