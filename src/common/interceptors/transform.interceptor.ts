// unified-response.interceptor.ts
import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  StreamableFile,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Observable, of } from 'rxjs';
import { mergeMap, map } from 'rxjs/operators';
import { SKIP_TRANSFORM_KEY } from '../decorators/skip-transform.decorator';

@Injectable()
export class UnifiedResponseInterceptor implements NestInterceptor {
  constructor(private readonly reflector: Reflector) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const handler = context.getHandler();
    const classRef = context.getClass();

    const skipTransform =
      this.reflector.getAllAndOverride<boolean>(SKIP_TRANSFORM_KEY, [
        handler,
        classRef,
      ]) ?? false;

    if (skipTransform) {
      return next.handle();
    }

    return next.handle().pipe(
      mergeMap((data) => {
        // 1. 文件流、Buffer、原始响应等特殊类型 �?直接短路返回
        if (this.isSpecialResponse(data)) {
          return of(data);
        }

        // 2. 普通数�?�?进入统一包装流水线（泛型完美推导！）
        return of(data).pipe(
          map((raw) => this.wrapSuccess(raw, context)),
          map((res) => this.normalizePagination(res)),
          map((res) => this.maskSensitiveData(res)),
        );
      }),
    );
  }

  // 关键判断函数：安全地检测是否是“特殊响应类型�?
  private isSpecialResponse(data: any): boolean {
    if (data === null || data === undefined) return true;

    // 1. StreamableFile（文件下载）
    if (data instanceof StreamableFile) return true;

    // 2. Buffer
    if (data instanceof Buffer) return true;

    // 3. 可读流（ReadStream�?
    if (typeof data?.pipe === 'function') return true;

    // 4. 原生 Express 响应对象（极少用，但要防�?
    // 必须先判断是对象，再判断属性是否存�?
    if (typeof data === 'object' && data !== null) {
      // 安全判断 headers 是否存在
      if ('headers' in data && 'body' in data) return true;
      // 或者更严格：如果是 Express Response
      if (data.setHeader && typeof data.setHeader === 'function') return true;
    }

    return false;
  }

  // �?泛型基础包装
  private wrapSuccess<T>(
    data: T,
    context: ExecutionContext,
  ): UnifiedResponse<T> {
    const req = context.switchToHttp().getRequest<Request>();
    return {
      code: 0,
      data,
      message: 'success',
      timestamp: new Date().toISOString(),
      path: req.url,
    };
  }

  // �?分页标准化（泛型 + 类型守卫�?
  private normalizePagination<T>(
    response: UnifiedResponse<T>,
  ): UnifiedResponse<any> {
    const data = response.data;

    if (!data || typeof data !== 'object' || Array.isArray(data)) {
      return response;
    }

    const patterns = [
      { items: 'items' as const, total: 'total' as const },
      { items: 'list' as const, total: 'total' as const },
      { items: 'rows' as const, total: 'count' as const },
      { items: 'records' as const, total: 'total' as const },
    ] as const;

    for (const p of patterns) {
      if (p.items in data && p.total in data) {
        const items = (data as any)[p.items];
        const total = (data as any)[p.total];
        return {
          ...response,
          data: items,
          meta: {
            total,
            page: (data as any).page ?? (data as any).current ?? 1,
            pageSize: (data as any).pageSize ?? (data as any).size ?? 10,
            totalPages:
              (data as any).pages ??
              Math.ceil(
                total / ((data as any).pageSize ?? (data as any).size ?? 10),
              ),
          },
        };
      }
    }

    return response;
  }

  // �?敏感数据脱敏（深度遍�?+ 泛型保留�?
  private maskSensitiveData<T>(
    response: UnifiedResponse<T>,
  ): UnifiedResponse<T> {
    if (response.data === null || response.data === undefined) {
      return response;
    }

    const deepMask = <U>(obj: U): U => {
      if (!obj || typeof obj !== 'object') return obj;
      if (Array.isArray(obj)) return obj.map(deepMask) as any;

      const result = {} as any;
      for (const [key, value] of Object.entries(obj as any)) {
        const str = String(value ?? '');

        if (/phone|mobile/i.test(key) || /^\d{11}$/.test(str)) {
          result[key] = str.replace(/^(\d{3})\d{4}(\d{4})$/, '$1****$2');
        } else if (
          /idcard|idCard|citizenId/i.test(key) ||
          /^\d{15,18}$/.test(str.replace(/x/gi, '0'))
        ) {
          result[key] = str.replace(/^(\d{6})\d+(\d{4})$/, '$1***********$2');
        } else if (/bankcard|bankCard/i.test(key) || /^\d{15,19}$/.test(str)) {
          result[key] = str
            .replace(/\s/g, '')
            .replace(/\d{4}(?=\d{4})/g, '****');
        } else if (/email/i.test(key) || /.@./.test(str)) {
          result[key] = str.replace(/(.{2}).+(@)/, '$1****$2');
        } else if (typeof value === 'object' && value !== null) {
          result[key] = deepMask(value);
        } else {
          result[key] = value;
        }
      }
      return result as U;
    };

    return {
      ...response,
      data: deepMask(response.data),
    };
  }
}
