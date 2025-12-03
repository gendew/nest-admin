// auth/auth.controller.ts
import { Controller, Post, Body, UseGuards, Req } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthGuard } from './auth.guard';
import { LoginDto } from './dto/login.dto';
import { CreateUserDto } from './dto/create-user.dto';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('login')
  async login(@Body() body: LoginDto) {
    const user = await this.authService.validateUser(
      body.username,
      body.password,
    );
    return this.authService.login(user);
  }

  @Post('register')
  async register(@Body() body: CreateUserDto) {
    return this.authService.register(body);
  }

  @Post('refresh')
  async refresh(@Body('refresh_token') refreshToken: string) {
    return this.authService.refresh(refreshToken);
  }

  @Post('logout')
  @UseGuards(AuthGuard)
  async logout(@Req() req: any) {
    const token = req.headers.authorization.split(' ')[1];
    await this.authService.logout(token);
    return { message: '退出成�? };
  }
}
