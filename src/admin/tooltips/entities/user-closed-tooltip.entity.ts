import {
  Entity,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  ManyToOne,
  Index,
} from 'typeorm';
import { User } from '../../../users/entities/user.entity';
import { Tooltip } from './tooltip.entity';

@Entity('user_closed_tooltips')
@Index(['user', 'tooltip'], { unique: true })
export class UserClosedTooltip {
  @PrimaryGeneratedColumn()
  id: number;

  @CreateDateColumn()
  closedAt: Date;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  user: User;

  @ManyToOne(() => Tooltip, { onDelete: 'CASCADE' })
  tooltip: Tooltip;
}
