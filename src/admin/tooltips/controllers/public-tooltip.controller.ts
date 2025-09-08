import {
  Controller,
  Get,
  Param,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam } from '@nestjs/swagger';
import { TooltipService } from '../services/tooltip.service';
import { Tooltip } from '../entities/tooltip.entity';
import { TooltipPage, TooltipType } from '../entities/tooltip.entity';
import { ErrorCode } from '../../../common/error-codes';
import { AppException } from '../../../common/exceptions/app.exception';

@ApiTags('Public Tooltips')
@Controller('tooltips')
export class PublicTooltipController {
  constructor(private readonly tooltipService: TooltipService) {}

  @Get('page/:page')
  @ApiOperation({ summary: 'Get tooltips by page (public endpoint)' })
  @ApiParam({ name: 'page', description: 'Page name to get tooltips for' })
  @ApiResponse({ 
    status: 200, 
    description: 'Tooltips retrieved successfully',
    type: [Tooltip] 
  })
  @ApiResponse({ status: 400, description: 'Invalid page parameter' })
  @ApiResponse({ status: 404, description: 'No tooltips found for this page' })
  findByPage(@Param('page') page: string): Promise<Tooltip[]> {
    // Validate page parameter
    if (!Object.values(TooltipPage).includes(page as TooltipPage)) {
      throw AppException.validation(
        ErrorCode.ADMIN_TOOLTIP_INVALID_PAGE_PARAMETER,
        `Invalid page. Allowed values: ${Object.values(TooltipPage).join(', ')}`
      );
    }
    return this.tooltipService.findByPage(page as TooltipPage);
  }

  @Get('page/:page/type/:type')
  @ApiOperation({ summary: 'Get tooltips by page and type (public endpoint)' })
  @ApiParam({ name: 'page', description: 'Page name' })
  @ApiParam({ name: 'type', description: 'Tooltip type' })
  @ApiResponse({ 
    status: 200, 
    description: 'Tooltips retrieved successfully',
    type: [Tooltip] 
  })
  @ApiResponse({ status: 400, description: 'Invalid page or type parameter' })
  @ApiResponse({ status: 404, description: 'No tooltips found' })
  findByPageAndType(
    @Param('page') page: string,
    @Param('type') type: string,
  ): Promise<Tooltip[]> {
    // Validate page parameter
    if (!Object.values(TooltipPage).includes(page as TooltipPage)) {
      throw AppException.validation(
        ErrorCode.ADMIN_TOOLTIP_INVALID_PAGE_PARAMETER,
        `Invalid page. Allowed values: ${Object.values(TooltipPage).join(', ')}`
      );
    }
    
    // Validate type parameter
    if (!Object.values(TooltipType).includes(type as TooltipType)) {
      throw AppException.validation(
        ErrorCode.ADMIN_TOOLTIP_INVALID_TYPE_PARAMETER,
        `Invalid type. Allowed values: ${Object.values(TooltipType).join(', ')}`
      );
    }
    
    return this.tooltipService.findByTypeAndPage(type as TooltipType, page as TooltipPage);
  }
}
