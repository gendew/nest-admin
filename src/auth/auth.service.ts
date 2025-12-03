// auth/auth.service.ts
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { RefreshToken } from './entities/refresh-token.entity';
import { RedisService } from '../redis/redis.service';
import * as bcrypt from 'bcrypt';
import { createHash } from 'crypto';
import { User } from 'src/entities/user.entity';
import { CreateUserDto } from './dto/create-user.dto';
import { BusinessException } from 'src/common/exceptions/base.exception';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User) private userRepo: Repository<User>,
    @InjectRepository(RefreshToken) private rtRepo: Repository<RefreshToken>,
    private jwtService: JwtService,
    private redisService: RedisService,
  ) {}

  async validateUser(username: string, password: string): Promise<User> {
    const user = await this.userRepo.findOne({ where: { username } });
    if (user && (await bcrypt.compare(password, user.password))) {
      return user;
    }
    throw new UnauthorizedException('用户名或密码错误');
  }

  // auth.service.ts
  async register(body: CreateUserDto) {
    const { password, username, ...data } = body;

    try {
      const user = await this.userRepo.save({
        username,
        password: await bcrypt.hash(password, 10),
        ...data,
      });

      return this.login(user); // 注册成功后直接登�?
    } catch (error: any) {
      // PostgreSQL 唯一约束违反的错误码�?23505
      if (error.code === '23505') {
        // 判断是哪个字段重�?
        if (error.detail.includes('username')) {
          throw new BusinessException(20004, '用户名已存在');
        }
        if (error.detail.includes('email')) {
          throw new BusinessException(20004, '邮箱已被注册');
        }
      }
      throw error; // 其他错误原样抛出
    }
  }

  async login(user: User) {
    const payload: JwtPayload = { sub: user.id, username: user.username };

    const accessToken = this.jwtService.sign(payload, { expiresIn: '15m' }); // 15 分钟�?
    const refreshToken = this.jwtService.sign(
      { sub: user.id },
      {
        expiresIn: '30d',
        secret: process.env.JWT_REFRESH_SECRET,
      },
    );

    // 全局单点登录：先删所有旧�?refresh_token
    await this.rtRepo.delete({ userId: user.id });

    // 保存新的
    await this.rtRepo.save({
      userId: user.id,
      token: this.hash(refreshToken),
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      revokedAt: null,
    });

    return {
      access_token: accessToken,
      refresh_token: refreshToken,
      expires_in: 900, // 15 分钟
      token_type: 'Bearer',
    };
  }

  async refresh(refreshToken: string) {
    const hashed = this.hash(refreshToken);
    const rt = await this.rtRepo.findOne({
      where: { token: hashed, revokedAt: null },
      relations: ['user'],
    });

    if (!rt || rt.expiresAt < new Date()) {
      throw new UnauthorizedException('refresh_token 无效');
    }

    // 重新走登录逻辑，实现挤�?
    return this.login(rt.user);
  }

  async logout(accessToken: string) {
    try {
      const decoded: any = this.jwtService.decode(accessToken);
      if (decoded?.exp) {
        const ttl = decoded.exp - Math.floor(Date.now() / 1000);
        if (ttl > 0) {
          await this.redisService.set(`blacklist:${accessToken}`, '1', ttl);
        }
      }
    } catch {}
  }

  async isBlacklisted(token: string): Promise<boolean> {
    return !!(await this.redisService.get(`blacklist:${token}`));
  }

  private hash(token: string): string {
    return createHash('sha256').update(token).digest('hex');
  }
}
