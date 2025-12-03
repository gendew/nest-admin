// auth/auth.module.ts
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule } from '@nestjs/jwt';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { AuthGuard } from './auth.guard';
import { JwtStrategy } from './jwt.strategy';
import { RefreshToken } from './entities/refresh-token.entity';
import { User } from 'src/entities/user.entity';
import { ConfigModule, ConfigService } from '@nestjs/config';

@Module({
  imports: [
    TypeOrmModule.forFeature([User, RefreshToken]), // 只注册这里！
    JwtModule.registerAsync({
      imports: [ConfigModule], // ← 必须加这行！
      useFactory: async (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_SECRET'),
        signOptions: { expiresIn: '15m' },
      }),
      inject: [ConfigService], // ← 必须加这行！
    }),
  ],
  providers: [AuthService, AuthGuard, JwtStrategy],
  controllers: [AuthController],
  exports: [AuthService, AuthGuard, TypeOrmModule, JwtModule],
})
export class AuthModule {}
