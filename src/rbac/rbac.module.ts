import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Role } from './entities/role.entity';
import { Permission } from './entities/permission.entity';
import { RbacService } from './rabc.service';

@Module({
  imports: [TypeOrmModule.forFeature([Role, Permission])],
  providers: [RbacService],
  exports: [RbacService],
})
export class RbacModule {}
