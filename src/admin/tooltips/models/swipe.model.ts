import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsArray, ValidateNested, IsOptional } from 'class-validator';
import { Type } from 'class-transformer';
import { TooltipLinkModel } from './link.model';

export class SwipeStep {
  @ApiProperty({ description: 'Step title or heading' })
  @IsString()
  title: string;

  @ApiProperty({ description: 'Step description or content' })
  @IsString()
  description: string;

  @ApiProperty({ description: 'Step image URL (optional)', required: false })
  @IsOptional()
  @IsString()
  imageUrl?: string;

  @ApiProperty({ description: 'Step order number', required: false })
  @IsOptional()
  order?: number;

  @ApiProperty({ description: 'Optional link for the step', required: false, type: () => TooltipLinkModel })
  @IsOptional()
  @ValidateNested()
  @Type(() => TooltipLinkModel)
  link?: TooltipLinkModel;
}

export class SwipeModel {
  @ApiProperty({ description: 'Main title for the swipe tooltip' })
  @IsString()
  title: string;

  @ApiProperty({ description: 'Short description for the swiper', required: false })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ description: 'Array of swipe steps', type: [SwipeStep] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SwipeStep)
  steps: SwipeStep[];

  @ApiProperty({ description: 'Whether to show pagination dots', required: false })
  @IsOptional()
  showPagination?: boolean;

  @ApiProperty({ description: 'Auto-advance interval in milliseconds', required: false })
  @IsOptional()
  autoAdvance?: number;
}
