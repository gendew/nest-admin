import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { AllExceptionsFilter } from './common/filters/all-exceptions.filter';
import { WINSTON_MODULE_NEST_PROVIDER } from 'nest-winston';
import { TraceIdMiddleware } from './common/middlewares/trace-id.middleware';
import { FormatDateInterceptor } from './common/interceptors/format-date.interceptor';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    bufferLogs: true,
  });

  //日志
  app.use(new TraceIdMiddleware().use.bind(new TraceIdMiddleware()));
  const logger = app.get(WINSTON_MODULE_NEST_PROVIDER);
  app.useLogger(logger);
  console.error = (...args: any[]) =>
    logger.error.call(logger, args[0], args.slice(1));

  // 参数验证
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));

  // 全局异常过滤器
  app.useGlobalFilters(new AllExceptionsFilter());

  // 全局时间格式化过滤
  app.useGlobalInterceptors(new FormatDateInterceptor());

  await app.listen(3000);
}
bootstrap();
