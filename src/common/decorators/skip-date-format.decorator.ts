// date-format.decorator.ts
import { applyDecorators, SetMetadata } from '@nestjs/common';
import {
  DATE_FORMAT_KEY,
  DATE_FIELD_WHITELIST,
  SKIP_DATE_FORMAT,
  DATE_TIMEZONE_KEY,
} from '../interceptors/format-date.interceptor';

export const DateFormat = (format = 'YYYY-MM-DD HH:mm:ss', fields?: string[]) =>
  applyDecorators(
    SetMetadata(DATE_FORMAT_KEY, format),
    ...(fields ? [SetMetadata(DATE_FIELD_WHITELIST, fields)] : []),
  );

export const DateTimezone = (timezone: string) =>
  SetMetadata(DATE_TIMEZONE_KEY, timezone);

export const SkipDateFormat = () => SetMetadata(SKIP_DATE_FORMAT, true);
