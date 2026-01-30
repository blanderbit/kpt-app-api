import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsOptional, IsString, MinLength } from 'class-validator';

export class LoginDto {
  @ApiProperty({
    description: 'User email',
    example: 'user@example.com',
  })
  @IsEmail()
  email: string;

  @ApiProperty({
    description: 'User password',
    example: 'password123',
    minLength: 6,
  })
  @IsString()
  @MinLength(6)
  password: string;

  @ApiProperty({
    description: 'RevenueCat app user ID (e.g. $RCAnonymousID:xxx) to link existing subscriptions to this user after login',
    example: '$RCAnonymousID:abc123',
    required: false,
  })
  @IsOptional()
  @IsString()
  appUserId?: string;
}
