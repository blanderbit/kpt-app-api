import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty } from 'class-validator';

export class FirebaseAuthDto {
  @ApiProperty({
    description: 'Firebase ID token',
    example: 'eyJhbGciOiJSUzI1NiIsImtpZCI6IjFlOWdkazcifQ...',
  })
  @IsString()
  @IsNotEmpty()
  idToken: string;
}

export class FirebaseAuthResponseDto {
  @ApiProperty({
    description: 'JWT access token',
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
  })
  accessToken: string;

  @ApiProperty({
    description: 'JWT refresh token',
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
  })
  refreshToken: string;

  @ApiProperty({
    description: 'User information',
    type: 'object',
    properties: {
      id: { type: 'number', description: 'User ID' },
      email: { type: 'string', description: 'User email' },
      firstName: { type: 'string', description: 'User first name', nullable: true },
      lastName: { type: 'string', description: 'User last name', nullable: true },
      avatarUrl: { type: 'string', description: 'User avatar URL', nullable: true },
      firebaseUid: { type: 'string', description: 'Firebase user ID' }
    }
  })
  user: {
    id: number;
    email: string;
    firstName?: string;
    lastName?: string;
    avatarUrl?: string;
    firebaseUid: string;
  };
}
