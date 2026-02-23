import { ApiProperty } from '@nestjs/swagger';

export class SignupResultResponseDto {
  @ApiProperty({ description: 'URL to open the app (user gets token and is already logged in)' })
  registrationLink: string;

  @ApiProperty({ description: 'JWT access token' })
  accessToken: string;

  @ApiProperty({ description: 'JWT refresh token' })
  refreshToken: string;
}
