import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsString, MinLength } from 'class-validator';

export class AdminLoginDto {
  @ApiProperty({
    description: 'Administrator email',
    example: 'admin@example.com',
  })
  @IsEmail()
  email: string;

  @ApiProperty({
    description: 'Administrator password',
    example: 'adminpassword123',
    minLength: 6,
  })
  @IsString()
  @MinLength(6)
  password: string;
}

export class AdminLoginResponseDto {
  @ApiProperty({
    description: 'JWT access token for admin panel',
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
  })
  accessToken: string;

  @ApiProperty({
    description: 'Administrator information',
    type: 'object',
    properties: {
      id: { type: 'number', description: 'Administrator ID' },
      email: { type: 'string', description: 'Administrator email' },
      firstName: { type: 'string', description: 'Administrator first name' },
      lastName: { type: 'string', description: 'Administrator last name' },
      roles: { type: 'array', items: { type: 'string' }, description: 'Administrator roles' }
    }
  })
  admin: {
    id: number;
    email: string;
    firstName: string;
    roles: string[];
  };
}

export class AdminProfileResponseDto {
  @ApiProperty({
    description: 'Administrator ID',
    example: 1,
  })
  id: number;

  @ApiProperty({
    description: 'Administrator email',
    example: 'admin@example.com',
  })
  email: string;

  @ApiProperty({
    description: 'Administrator first name',
    example: 'John',
    required: false,
    nullable: true,
  })
  firstName?: string | null;

  @ApiProperty({
    description: 'Administrator avatar URL',
    example: 'https://example.com/avatar.png',
    required: false,
    nullable: true,
  })
  avatarUrl?: string | null;

  @ApiProperty({
    description: 'Whether administrator email is verified',
    example: true,
  })
  emailVerified: boolean;

  @ApiProperty({
    description: 'Administrator roles list',
    example: ['admin'],
    type: [String],
  })
  roles: string[];

  @ApiProperty({
    description: 'Account creation date',
    example: '2024-01-01T12:00:00.000Z',
  })
  createdAt: Date;

  @ApiProperty({
    description: 'Account last update date',
    example: '2024-05-01T08:30:00.000Z',
  })
  updatedAt: Date;
}

export class UserListResponseDto {
  @ApiProperty({
    description: 'List of users',
    type: 'array',
  })
  users: Array<{
    id: number;
    email: string;
    firstName: string;
    roles: string[];
    emailVerified: boolean;
    createdAt: string;
  }>;

  @ApiProperty({
    description: 'Total number of users',
    example: 100,
  })
  total: number;

  @ApiProperty({
    description: 'Current page',
    example: 1,
  })
  page: number;

  @ApiProperty({
    description: 'Number of users per page',
    example: 10,
  })
  limit: number;

  @ApiProperty({
    description: 'Total number of pages',
    example: 10,
  })
  totalPages: number;
}

export class AdminUsersStatsResponseDto {
  @ApiProperty({
    description: 'Total number of users',
    example: 100,
  })
  totalUsers: number;

  @ApiProperty({
    description: 'Number of verified users',
    example: 85,
  })
  verifiedUsers: number;

  @ApiProperty({
    description: 'Number of unverified users',
    example: 15,
  })
  unverifiedUsers: number;

  @ApiProperty({
    description: 'Users registered this month',
    example: 25,
  })
  usersThisMonth: number;

  @ApiProperty({
    description: 'Users registered last month',
    example: 20,
  })
  usersLastMonth: number;
}

export class AdminAdminsStatsResponseDto {
  @ApiProperty({
    description: 'Number of administrators',
    example: 5,
  })
  totalAdmins: number;
}
