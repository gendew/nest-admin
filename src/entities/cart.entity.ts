import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  Unique,
  JoinColumn,
} from 'typeorm';
import { ProductSku } from './productSku.entity';
import { User } from './user.entity';

@Entity('cart_items')
@Unique(['user', 'sku'])
export class CartItem {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'user_id' })
  user: User;

  @ManyToOne(() => ProductSku)
  @JoinColumn({ name: 'sku_id' })
  sku: ProductSku;

  @Column({ default: 1 })
  quantity: number;

  @Column({ type: 'timestamp', default: () => 'NOW()' })
  created_at: Date;

  @Column({ type: 'timestamp', default: () => 'NOW()' })
  updated_at: Date;
}
