import { Injectable, NotFoundException } from '@nestjs/common';
import { RedisService } from 'src/redis/redis.service';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from 'src/entities/user.entity';
import { Repository } from 'typeorm';

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(User)
    private userRepo: Repository<User>,
    private readonly redisService: RedisService,
  ) {}

  async getUserInfo(userId: number): Promise<User> {
    const cacheKey = `user_info:${userId}`;

    const cached = await this.redisService.get(cacheKey);

    if (cached) {
      return JSON.parse(cached);
    }

    if (!userId) new NotFoundException('Invalid user ID');

    const user = await this.userRepo.findOne({
      where: { id: userId },
      select: [
        'id',
        'username',
        'email',
        'avatar',
        'phone',
        'created_at',
        'updated_at',
      ],
    });

    if (!user) {
      throw new NotFoundException('用户不存�?);
    }

    // 缓存 5 分钟（头像改了也能很快生效）
    await this.redisService.set(cacheKey, JSON.stringify(user), 300);

    return user;
  }
}
