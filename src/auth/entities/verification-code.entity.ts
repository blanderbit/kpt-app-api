import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { User } from '../../users/entities/user.entity';

@Entity('verification_codes')
export class VerificationCode {
  @ApiProperty({ description: 'Unique verification code identifier' })
  @PrimaryGeneratedColumn()
  id: number;

  @ApiProperty({ description: 'Verification code' })
  @Column({ type: 'varchar', length: 6, unique: true })
  code: string;

  @ApiProperty({ description: 'Code type' })
  @Column({ 
    type: 'enum', 
    enum: ['email_verification', 'password_reset', 'email_change'], 
    default: 'email_verification' 
  })
  type: 'email_verification' | 'password_reset' | 'email_change';

  @ApiProperty({ description: 'User ID' })
  @Column()
  userId: number;

  @ApiProperty({ description: 'Email address' })
  @Column()
  email: string;

  @ApiProperty({ description: 'Temporary email for email change', required: false })
  @Column({ nullable: true })
  tempEmail?: string;

  @ApiProperty({ description: 'Code expiration date' })
  @Column({ type: 'timestamp' })
  expiresAt: Date;

  @ApiProperty({ description: 'Whether code is used' })
  @Column({ default: false })
  isUsed: boolean;

  @ApiProperty({ description: 'Creation date' })
  @CreateDateColumn()
  createdAt: Date;

  // Relations
  @ManyToOne(() => User, (user) => user.id, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user: User;
}
