// auth/auth.guard.ts
import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { AuthService } from './auth.service';
import { Request } from 'express';

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(
    private jwtService: JwtService,
    private authService: AuthService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = context.switchToHttp().getRequest<Request>();
    const token = this.extractToken(req);
    if (!token) throw new UnauthorizedException('请先登录');

    // 1. 黑名单（主动登出）
    if (await this.authService.isBlacklisted(token)) {
      throw new UnauthorizedException('登录已失效');
    }

    // 2. 校验签名与过期时间
    try {
      const payload: JwtPayload = this.jwtService.verify(token);
      req.user = payload;
      return true;
    } catch (err: any) {
      throw new UnauthorizedException('登录已过期，请重新登录');
    }
  }

  private extractToken(req: Request): string | null {
    const auth = req.headers.authorization;
    return auth?.startsWith('Bearer ') ? auth.split(' ')[1] : null;
  }
}
