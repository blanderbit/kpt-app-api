import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsObject, ValidateNested, IsOptional, Validate, IsEnum } from 'class-validator';
import { Type } from 'class-transformer';
import { SwipeModel, TextModel } from '../models';
import { TooltipType, TooltipPage } from '../entities/tooltip.entity';

// Custom validator for tooltip JSON structure
export function IsValidTooltipJson(validationOptions?: any) {
  return function (object: any, propertyName: string) {
    return {
      validate: (value: any) => {
        if (!value || typeof value !== 'object') {
          return false;
        }

        const tooltipType = object.type;
        
        switch (tooltipType) {
          case TooltipType.SWIPE:
            return 'title' in value && 'steps' in value && Array.isArray(value.steps);
          case TooltipType.TEXT:
            return 'title' in value && 'description' in value;
          default:
            return false;
        }
      },
      defaultMessage: () => `Invalid JSON structure for tooltip type: ${object.type}. Expected structure depends on type.`
    };
  };
}

export class CreateTooltipDto {
  @ApiProperty({ 
    description: 'Type of the tooltip',
    enum: TooltipType,
    example: TooltipType.SWIPE
  })
  @IsEnum(TooltipType)
  @IsNotEmpty()
  type: TooltipType;

  @ApiProperty({ 
    description: 'Page where the tooltip is displayed',
    enum: TooltipPage,
    example: TooltipPage.DASHBOARD
  })
  @IsEnum(TooltipPage)
  @IsNotEmpty()
  page: TooltipPage;

  @ApiProperty({ 
    description: 'Tooltip content based on type',
    oneOf: [
      { $ref: '#/components/schemas/SwipeModel' },
      { $ref: '#/components/schemas/TextModel' }
    ]
  })
  @IsObject()
  @ValidateNested()
  @Validate(IsValidTooltipJson(), {
    message: 'Invalid JSON structure for the specified tooltip type'
  })
  @Type((options) => {
    if (!options?.object) return Object;
    const obj = options.object as CreateTooltipDto;
    if (obj.type === TooltipType.SWIPE) return SwipeModel;
    if (obj.type === TooltipType.TEXT) return TextModel;
    return Object;
  })
  json: SwipeModel | TextModel;
}
