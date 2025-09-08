import { PartialType } from '@nestjs/swagger';
import { Validate } from 'class-validator';
import { CreateTooltipDto, IsValidTooltipJson } from './create-tooltip.dto';

export class UpdateTooltipDto extends PartialType(CreateTooltipDto) {
  @Validate(IsValidTooltipJson(), {
    message: 'Invalid JSON structure for the specified tooltip type'
  })
  json?: any;
}
