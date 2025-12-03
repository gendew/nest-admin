// auth/dto/refresh-token.dto.ts
import { IsString, IsNotEmpty } from 'class-validator';

export class RefreshTokenDto {
  @IsString()
  @IsNotEmpty({ message: 'refresh_token 不能为空' })
  refresh_token: string;
}
