import { ApiProperty } from '@nestjs/swagger';
import { IsObject, IsOptional, IsString, MaxLength } from 'class-validator';

export class CustomNotificationDto {
  @ApiProperty({ description: 'Notification title', maxLength: 120 })
  @IsString()
  @MaxLength(120)
  title: string;

  @ApiProperty({ description: 'Notification body', maxLength: 512 })
  @IsString()
  @MaxLength(512)
  body: string;

  @ApiProperty({
    description: 'Optional key-value data payload',
    required: false,
    type: Object,
    additionalProperties: { type: 'string' },
  })
  @IsOptional()
  @IsObject()
  data?: Record<string, string>;

}


