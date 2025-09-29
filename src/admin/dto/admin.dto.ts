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

export class AdminStatsResponseDto {
  @ApiProperty({
    description: 'Total number of users',
    example: 100,
  })
  totalUsers: number;

  @ApiProperty({
    description: 'Number of administrators',
    example: 5,
  })
  totalAdmins: number;

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
