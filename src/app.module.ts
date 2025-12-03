import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserModule } from './user/user.module';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { UnifiedResponseInterceptor } from './common/interceptors/transform.interceptor';
import { WinstonModule } from 'nest-winston';
import { winstonConfig } from './common/logger/winston.config';
import { AuthModule } from './auth/auth.module';
import { ConfigModule } from '@nestjs/config';
import { RedisModule } from './redis/redis.module';
import { RbacModule } from './rbac/rbac.module';

@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: 'localhost',
      port: 5432,
      username: 'postgres',
      password: 'gendew',
      database: 'mini_shop', // 你刚创建的数据库

      autoLoadEntities: true, // 自动加载所有实�?
      synchronize: true, // 自动创建/更新�?(仅开发环境使�?!)
      logging: true, // 打印执行 SQL
    }),
    ConfigModule.forRoot({
      isGlobal: true,
    }),

    WinstonModule.forRoot(winstonConfig),

    RedisModule,
    AuthModule,
    UserModule,
    RbacModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_INTERCEPTOR,
      useClass: UnifiedResponseInterceptor,
    },
  ],
})
export class AppModule {}
