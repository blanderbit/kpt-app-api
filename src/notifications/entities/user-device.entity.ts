import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';

export enum DevicePlatform {
  IOS = 'ios',
  ANDROID = 'android',
  WEB = 'web',
  UNKNOWN = 'unknown',
}

@Entity('user_devices')
@Index(['userId', 'token'], { unique: true })
export class UserDevice {
  @PrimaryGeneratedColumn()
  @ApiProperty({ description: 'Primary identifier' })
  id: number;

  @Column({ name: 'user_id' })
  @ApiProperty({ description: 'User identifier' })
  userId: number;

  @Column({ type: 'varchar', length: 512 })
  @ApiProperty({ description: 'Firebase device token' })
  token: string;

  @Column({
    type: 'enum',
    enum: DevicePlatform,
    default: DevicePlatform.UNKNOWN,
  })
  @ApiProperty({
    description: 'Platform of the device',
    enum: DevicePlatform,
    default: DevicePlatform.UNKNOWN,
  })
  platform: DevicePlatform;

  @Column({ type: 'boolean', default: true })
  @ApiProperty({ description: 'Whether the token is active', default: true })
  isActive: boolean;

  @Column({ type: 'datetime', nullable: true })
  @ApiProperty({ description: 'Last time token was used', required: false })
  lastUsedAt?: Date;

  @CreateDateColumn()
  @ApiProperty({ description: 'Creation timestamp' })
  createdAt: Date;

  @UpdateDateColumn()
  @ApiProperty({ description: 'Last update timestamp' })
  updatedAt: Date;
}


