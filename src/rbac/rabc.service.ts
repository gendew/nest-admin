import { Injectable, OnModuleDestroy } from '@nestjs/common';

@Injectable()
export class RbacService implements OnModuleDestroy {
  constructor() {}

  onModuleDestroy() {}
}
