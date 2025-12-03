// format-date.interceptor.ts
import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import * as dayjs from 'dayjs';
import * as utc from 'dayjs/plugin/utc';
import * as timezone from 'dayjs/plugin/timezone';
import 'reflect-metadata';

dayjs.extend(utc);
dayjs.extend(timezone);

export const SKIP_DATE_FORMAT = 'skip_date_format';
export const DATE_FORMAT_KEY = 'custom_date_format';
export const DATE_FIELD_WHITELIST = 'date_field_whitelist';
export const DATE_TIMEZONE_KEY = 'custom_timezone';

export const DEFAULT_TZ = 'Asia/Shanghai';
export const HEADER_TIMEZONE = 'x-timezone';

@Injectable()
export class FormatDateInterceptor implements NestInterceptor {
  private readonly MAX_DEPTH = 10;

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const handler = context.getHandler();
    const request = context.switchToHttp().getRequest();

    /** 是否跳过 */
    const isSkip =
      Reflect.getMetadata(SKIP_DATE_FORMAT, handler) ||
      request?.headers?.['x-skip-date-format'] === 'true';

    if (isSkip) return next.handle();

    /** 格式 */
    const format =
      Reflect.getMetadata(DATE_FORMAT_KEY, handler) || 'YYYY-MM-DD HH:mm:ss';

    /** 字段白名单 */
    const whitelist: string[] | undefined = Reflect.getMetadata(
      DATE_FIELD_WHITELIST,
      handler,
    );

    /** 读取时区（优先顺序） */
    const timezone =
      Reflect.getMetadata(DATE_TIMEZONE_KEY, handler) ||
      request?.headers?.[HEADER_TIMEZONE] ||
      request?.user?.timezone ||
      DEFAULT_TZ;

    return next
      .handle()
      .pipe(
        map((data) => this.deepFormat(data, format, timezone, whitelist, 0)),
      );
  }

  private deepFormat(
    value: any,
    format: string,
    timezone: string,
    whitelist?: string[],
    depth = 0,
  ): any {
    if (value === null || value === undefined) return value;
    if (depth > this.MAX_DEPTH) return value;

    if (this.isDateLike(value)) {
      return dayjs(value).tz(timezone).format(format);
    }

    if (Array.isArray(value)) {
      return value.map((item) =>
        this.deepFormat(item, format, timezone, whitelist, depth + 1),
      );
    }

    if (typeof value === 'object') {
      const result: any = {};

      for (const key in value) {
        if (!Object.prototype.hasOwnProperty.call(value, key)) continue;

        if (whitelist && !whitelist.includes(key)) {
          result[key] = value[key];
          continue;
        }

        result[key] = this.deepFormat(
          value[key],
          format,
          timezone,
          whitelist,
          depth + 1,
        );
      }

      return result;
    }

    return value;
  }

  private isDateLike(val: any): boolean {
    if (!val) return false;

    if (val instanceof Date && !isNaN(val.getTime())) return true;

    if (
      typeof val === 'string' &&
      /^\d{4}-\d{2}-\d{2}[T\s]\d{2}:\d{2}:\d{2}/.test(val)
    ) {
      return true;
    }

    if (
      typeof val === 'number' &&
      (val.toString().length === 10 || val.toString().length === 13)
    ) {
      return true;
    }

    return false;
  }
}
