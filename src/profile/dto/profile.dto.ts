import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional, IsEmail, IsEnum, IsBoolean } from 'class-validator';

export enum Theme {
  LIGHT = 'light',
  DARK = 'dark',
  SYSTEM = 'system',
}

export class UpdateProfileDto {
  @ApiProperty({
    description: 'User first name',
    example: 'John',
    required: false,
  })
  @IsOptional()
  @IsString()
  firstName?: string;

  @ApiProperty({
    description: 'User last name',
    example: 'Doe',
    required: false,
  })
  @IsOptional()
  @IsString()
  lastName?: string;

  @ApiProperty({
    description: 'Avatar URL',
    example: 'https://example.com/avatar.jpg',
    required: false,
  })
  @IsOptional()
  @IsString()
  avatarUrl?: string;

  @ApiProperty({
    description: 'Application theme',
    enum: Theme,
    example: Theme.DARK,
    required: false,
  })
  @IsOptional()
  @IsEnum(Theme)
  theme?: Theme;

  @ApiProperty({
    description: 'User language code',
    example: 'en',
    required: false,
  })
  @IsOptional()
  @IsString()
  language?: string;
}

export class ChangeEmailDto {
  @ApiProperty({
    description: 'New email',
    example: 'newemail@example.com',
  })
  @IsEmail()
  newEmail: string;

  @ApiProperty({
    description: 'Password for confirmation',
    example: 'password123',
  })
  @IsString()
  password: string;
}

export class ChangePasswordDto {
  @ApiProperty({
    description: 'Current password',
    example: 'oldpassword123',
  })
  @IsString()
  currentPassword: string;

  @ApiProperty({
    description: 'New password',
    example: 'newpassword123',
    minLength: 6,
  })
  @IsString()
  newPassword: string;
}

export class DeleteAccountDto {
  @ApiProperty({
    description: 'Confirmation of account deletion',
    example: true,
  })
  @IsBoolean()
  confirm: boolean;
}

export class ProfileResponseDto {
  @ApiProperty({
    description: 'User ID',
    example: 1,
  })
  id: number;

  @ApiProperty({
    description: 'User email',
    example: 'user@example.com',
  })
  email: string;

  @ApiProperty({
    description: 'User first name',
    example: 'John',
  })
  firstName: string;

  @ApiProperty({
    description: 'Avatar URL',
    example: 'https://example.com/avatar.jpg',
  })
  avatarUrl: string;

  @ApiProperty({
    description: 'Application theme',
    enum: Theme,
    example: Theme.DARK,
  })
  theme: Theme;

  @ApiProperty({
    description: 'User language code',
    example: 'en',
    required: false,
  })
  language: string | null;

  @ApiProperty({
    description: 'Creation date',
    example: '2024-01-01T00:00:00.000Z',
  })
  createdAt: Date;

  @ApiProperty({
    description: 'Update date',
    example: '2024-01-01T00:00:00.000Z',
  })
  updatedAt: Date;
}
