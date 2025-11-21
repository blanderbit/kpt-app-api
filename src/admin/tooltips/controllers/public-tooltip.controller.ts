import {
  Controller,
  Get,
  Post,
  Param,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiBearerAuth } from '@nestjs/swagger';
import { TooltipService } from '../services/tooltip.service';
import { Tooltip } from '../entities/tooltip.entity';
import { TooltipPage, TooltipType } from '../entities/tooltip.entity';
import { ErrorCode } from '../../../common/error-codes';
import { AppException } from '../../../common/exceptions/app.exception';
import { JwtAuthGuard } from '../../../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../../../common/decorators/current-user.decorator';
import { User } from '../../../users/entities/user.entity';

@ApiTags('Profile Tooltips')
@Controller('tooltips')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class ProfileTooltipController {
  constructor(private readonly tooltipService: TooltipService) {}

  @Get('page/:page')
  @ApiOperation({ summary: 'Get tooltips by page (filters closed tooltips for authenticated users)' })
  @ApiParam({ name: 'page', description: 'Page name to get tooltips for' })
  @ApiResponse({ 
    status: 200, 
    description: 'Tooltips retrieved successfully',
    type: [Tooltip] 
  })
  @ApiResponse({ status: 400, description: 'Invalid page parameter' })
  @ApiResponse({ status: 401, description: 'Unauthorized access' })
  @ApiResponse({ status: 404, description: 'No tooltips found for this page' })
  findByPage(
    @Param('page') page: string,
    @CurrentUser() user: User
  ): Promise<Tooltip[]> {
    // Validate page parameter
    if (!Object.values(TooltipPage).includes(page as TooltipPage)) {
      throw AppException.validation(
        ErrorCode.ADMIN_TOOLTIP_INVALID_PAGE_PARAMETER,
        `Invalid page. Allowed values: ${Object.values(TooltipPage).join(', ')}`
      );
    }
    // Get user's language if available
    const userLanguage = user.language || undefined;
    return this.tooltipService.findByPage(page as TooltipPage, user.id, userLanguage);
  }

  @Get('page/:page/type/:type')
  @ApiOperation({ summary: 'Get tooltips by page and type (filters closed tooltips for authenticated users)' })
  @ApiParam({ name: 'page', description: 'Page name' })
  @ApiParam({ name: 'type', description: 'Tooltip type' })
  @ApiResponse({ 
    status: 200, 
    description: 'Tooltips retrieved successfully',
    type: [Tooltip] 
  })
  @ApiResponse({ status: 400, description: 'Invalid page or type parameter' })
  @ApiResponse({ status: 401, description: 'Unauthorized access' })
  @ApiResponse({ status: 404, description: 'No tooltips found' })
  findByPageAndType(
    @Param('page') page: string,
    @Param('type') type: string,
    @CurrentUser() user: User
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
    
    // Get user's language if available
    const userLanguage = user.language || undefined;
    return this.tooltipService.findByTypeAndPage(type as TooltipType, page as TooltipPage, user.id, userLanguage);
  }

  @Post('close/:tooltipId')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ 
    summary: 'Close tooltip for user',
    description: 'Marks tooltip as closed for the current user so it won\'t be shown again'
  })
  @ApiParam({ name: 'tooltipId', description: 'ID of the tooltip to close' })
  @ApiResponse({ 
    status: 200, 
    description: 'Tooltip closed successfully',
    schema: {
      type: 'object',
      properties: {
        message: {
          type: 'string',
          example: 'Tooltip closed successfully'
        }
      }
    }
  })
  @ApiResponse({ status: 401, description: 'Unauthorized access' })
  @ApiResponse({ status: 404, description: 'Tooltip not found' })
  async closeTooltip(
    @Param('tooltipId') tooltipId: string,
    @CurrentUser() user: User
  ): Promise<{ message: string }> {
    return this.tooltipService.closeTooltipForUser(parseInt(tooltipId), user);
  }
}
