import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional, IsUrl } from 'class-validator';

export class TextModel {
  @ApiProperty({ description: 'Main title for the text tooltip' })
  @IsString()
  title: string;

  @ApiProperty({ description: 'Detailed description or content' })
  @IsString()
  description: string;

  @ApiProperty({ description: 'Subtitle (optional)', required: false })
  @IsOptional()
  @IsString()
  subtitle?: string;

  @ApiProperty({ description: 'Icon URL (optional)', required: false })
  @IsOptional()
  @IsUrl()
  iconUrl?: string;

  @ApiProperty({ description: 'Background color in hex format (optional)', required: false })
  @IsOptional()
  @IsString()
  backgroundColor?: string;

  @ApiProperty({ description: 'Text color in hex format (optional)', required: false })
  @IsOptional()
  @IsString()
  textColor?: string;

  @ApiProperty({ description: 'Maximum width in pixels (optional)', required: false })
  @IsOptional()
  maxWidth?: number;
}
