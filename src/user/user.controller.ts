import { Controller, Get, Post, Req, UseGuards } from '@nestjs/common';
import { UserService } from './user.service';
// import { CreateUserDto } from './dto/create-user.dto';
import { AuthService } from 'src/auth/auth.service';
import { AuthGuard } from 'src/auth/auth.guard';
import { Request } from 'express';
import { UserDecorator } from 'src/common/decorators/user.decorator.ts';
// import { SkipDateFormat } from 'src/common/decorators/skip-date-format.decorator';
// import { DateFormat } from 'src/common/decorators/skip-date-format.decorator';

@Controller('user')
@UseGuards(AuthGuard)
export class UserController {
  constructor(
    private readonly userService: UserService,
    private readonly authService: AuthService,
  ) {}

  @Get()
  // @DateFormat('YYYY-MM-DD')
  getUserInfo(@UserDecorator('sub') userId: number) {
    return this.userService.getUserInfo(userId);
  }

  @Post('logout')
  async logout(@Req() req: Request) {
    const token = req.headers.authorization?.split(' ')[1];
    await this.authService.logout(token);
    return { message: '退出登录成�? };
  }
}
