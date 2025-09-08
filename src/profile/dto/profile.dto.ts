import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional, IsEmail, IsEnum, IsBoolean } from 'class-validator';

export enum Theme {
  LIGHT = 'light',
  DARK = 'dark',
  SYSTEM = 'system',
}

export class UpdateProfileDto {
  @ApiProperty({
    description: 'Имя пользователя',
    example: 'Иван',
    required: false,
  })
  @IsOptional()
  @IsString()
  firstName?: string;

  @ApiProperty({
    description: 'Фамилия пользователя',
    example: 'Иванов',
    required: false,
  })
  @IsOptional()
  @IsString()
  lastName?: string;

  @ApiProperty({
    description: 'URL аватара',
    example: 'https://example.com/avatar.jpg',
    required: false,
  })
  @IsOptional()
  @IsString()
  avatarUrl?: string;

  @ApiProperty({
    description: 'Тема приложения',
    enum: Theme,
    example: Theme.DARK,
    required: false,
  })
  @IsOptional()
  @IsEnum(Theme)
  theme?: Theme;
}

export class ChangeEmailDto {
  @ApiProperty({
    description: 'Новый email',
    example: 'newemail@example.com',
  })
  @IsEmail()
  newEmail: string;

  @ApiProperty({
    description: 'Пароль для подтверждения',
    example: 'password123',
  })
  @IsString()
  password: string;
}

export class ChangePasswordDto {
  @ApiProperty({
    description: 'Текущий пароль',
    example: 'oldpassword123',
  })
  @IsString()
  currentPassword: string;

  @ApiProperty({
    description: 'Новый пароль',
    example: 'newpassword123',
    minLength: 6,
  })
  @IsString()
  newPassword: string;
}

export class DeleteAccountDto {
  @ApiProperty({
    description: 'Пароль для подтверждения удаления',
    example: 'password123',
  })
  @IsString()
  password: string;

  @ApiProperty({
    description: 'Подтверждение удаления',
    example: true,
  })
  @IsBoolean()
  confirm: boolean;
}

export class ProfileResponseDto {
  @ApiProperty({
    description: 'ID пользователя',
    example: 1,
  })
  id: number;

  @ApiProperty({
    description: 'Email пользователя',
    example: 'user@example.com',
  })
  email: string;

  @ApiProperty({
    description: 'Имя пользователя',
    example: 'Иван',
  })
  firstName: string;

  @ApiProperty({
    description: 'Фамилия пользователя',
    example: 'Иванов',
  })
  lastName: string;

  @ApiProperty({
    description: 'URL аватара',
    example: 'https://example.com/avatar.jpg',
  })
  avatarUrl: string;

  @ApiProperty({
    description: 'Тема приложения',
    enum: Theme,
    example: Theme.DARK,
  })
  theme: Theme;

  @ApiProperty({
    description: 'Дата создания',
    example: '2024-01-01T00:00:00.000Z',
  })
  createdAt: Date;

  @ApiProperty({
    description: 'Дата обновления',
    example: '2024-01-01T00:00:00.000Z',
  })
  updatedAt: Date;
}
