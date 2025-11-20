import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString, MaxLength } from 'class-validator';
import { DevicePlatform } from '../entities/user-device.entity';

export class RegisterDeviceTokenDto {
  @ApiProperty({
    description: 'Firebase device token',
    minLength: 10,
    maxLength: 512,
  })
  @IsString()
  @MaxLength(512)
  token: string;

  @ApiProperty({
    description: 'Device platform',
    enum: DevicePlatform,
    required: false,
    default: DevicePlatform.UNKNOWN,
  })
  @IsOptional()
  @IsEnum(DevicePlatform)
  platform?: DevicePlatform;
}


