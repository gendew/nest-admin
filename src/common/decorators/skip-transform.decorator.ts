import { SetMetadata } from '@nestjs/common';

export const SKIP_TRANSFORM_KEY = 'skipTransform';

/**
 * 使用该装饰器的接口会跳过 TransformInterceptor 的统一包装
 */
export const SkipTransform = () => SetMetadata(SKIP_TRANSFORM_KEY, true);
