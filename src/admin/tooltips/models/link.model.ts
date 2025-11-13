import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, IsUrl } from 'class-validator';

export class TooltipLinkModel {
  @ApiProperty({ description: 'Link text to display' })
  @IsString()
  @IsNotEmpty()
  label: string;

  @ApiProperty({ description: 'Link URL', example: 'https://example.com' })
  @IsString()
  @IsNotEmpty()
  @IsUrl({ require_tld: false })
  url: string;
}


