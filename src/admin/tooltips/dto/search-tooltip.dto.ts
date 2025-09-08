import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsEnum } from 'class-validator';
import { TooltipType, TooltipPage } from '../entities/tooltip.entity';

export class SearchTooltipDto {
  @ApiProperty({ 
    description: 'Filter by tooltip type',
    required: false,
    enum: TooltipType,
    example: TooltipType.SWIPE
  })
  @IsOptional()
  @IsEnum(TooltipType)
  type?: TooltipType;

  @ApiProperty({ 
    description: 'Filter by page',
    required: false,
    enum: TooltipPage,
    example: TooltipPage.DASHBOARD
  })
  @IsOptional()
  @IsEnum(TooltipPage)
  page?: TooltipPage;
}
