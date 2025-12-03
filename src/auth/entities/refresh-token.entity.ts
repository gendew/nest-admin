// entities/refresh-token.entity.ts
import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  ManyToOne,
  Index,
} from 'typeorm';
import { User } from '../../entities/user.entity';

@Entity()
@Index(['token']) // 方便挤号时快速查找
export class RefreshToken {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'text' })
  @Column()
  token: string; // 存 refresh_token 的哈希（安全）

  @Column()
  userId: number;

  @Column({ type: 'timestamp' })
  expiresAt: Date;

  @Column({ type: 'timestamp', nullable: true })
  revokedAt: Date | null; // 被挤号时标记

  @ManyToOne(() => User, (user) => user.refreshTokens)
  user: User;
}
