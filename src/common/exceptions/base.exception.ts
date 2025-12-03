// src/common/exceptions/base.exception.ts
import { HttpException, HttpStatus } from '@nestjs/common';
import { ErrorCode } from '../enums/error-code.enum';

export class BaseException extends HttpException {
  public readonly errorCode: ErrorCode;
  public readonly errors?: any;

  constructor(
    errorCode: ErrorCode,
    message?: string,
    errors?: any,
    status: HttpStatus = HttpStatus.OK, // 业务异常建议返回 200
  ) {
    super(
      {
        code: errorCode,
        message: message || ErrorCode[errorCode],
        errors,
      },
      status,
    );
    this.errorCode = errorCode;
    this.errors = errors;
  }
}

// 业务异常（不记日志）
export class BusinessException extends BaseException {
  constructor(code: ErrorCode, message?: string, errors?: any) {
    super(code, message, errors, HttpStatus.OK);
  }
}

// 系统异常（要报警）
export class SystemException extends BaseException {
  constructor(code = ErrorCode.INTERNAL_ERROR, message?: string, errors?: any) {
    super(code, message, errors, HttpStatus.INTERNAL_SERVER_ERROR);
  }
}
