import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiQuery, ApiBearerAuth } from '@nestjs/swagger';
import { TooltipService } from '../services/tooltip.service';
import { CreateTooltipDto } from '../dto/create-tooltip.dto';
import { UpdateTooltipDto } from '../dto/update-tooltip.dto';
import { SearchTooltipDto } from '../dto/search-tooltip.dto';
import { Tooltip, TooltipType, TooltipPage } from '../entities/tooltip.entity';
import { JwtAuthGuard } from '../../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../../common/guards/roles.guard';
import { Roles } from '../../../common/decorators/roles.decorator';

@ApiTags('Admin Tooltips')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('admin')
@Controller('admin/tooltips')
export class TooltipController {
  constructor(private readonly tooltipService: TooltipService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new tooltip' })
  @ApiResponse({ 
    status: 201, 
    description: 'Tooltip created successfully',
    type: Tooltip 
  })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - Admin access required' })
  create(@Body() createTooltipDto: CreateTooltipDto): Promise<Tooltip> {
    return this.tooltipService.create(createTooltipDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all tooltips with optional filtering' })
  @ApiQuery({ name: 'type', required: false, description: 'Filter by tooltip type', enum: TooltipType })
  @ApiQuery({ name: 'page', required: false, description: 'Filter by page', enum: TooltipPage })
  @ApiQuery({ name: 'language', required: false, description: 'Filter by language code', type: String })
  @ApiResponse({ 
    status: 200, 
    description: 'Tooltips retrieved successfully',
    type: [Tooltip] 
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - Admin access required' })
  findAll(@Query() searchDto?: SearchTooltipDto): Promise<Tooltip[]> {
    return this.tooltipService.findAll(searchDto);
  }

  @Get('types')
  @ApiOperation({ summary: 'Get all available tooltip types' })
  @ApiResponse({ 
    status: 200, 
    description: 'Tooltip types retrieved successfully',
    type: [String]
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - Admin access required' })
  getTooltipTypes(): Promise<TooltipType[]> {
    return this.tooltipService.getTooltipTypes();
  }

  @Get('pages')
  @ApiOperation({ summary: 'Get all available pages' })
  @ApiResponse({ 
    status: 200, 
    description: 'Pages retrieved successfully',
    type: [String]
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - Admin access required' })
  getPages(): Promise<TooltipPage[]> {
    return this.tooltipService.getPages();
  }

  @Get('user/:userId/closed')
  @ApiOperation({ summary: 'Get closed tooltips for a specific user' })
  @ApiParam({ name: 'userId', description: 'User ID', type: Number })
  @ApiResponse({ 
    status: 200, 
    description: 'Closed tooltips retrieved successfully',
    type: [Tooltip] 
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - Admin access required' })
  @ApiResponse({ status: 404, description: 'User not found' })
  getClosedTooltipsByUserId(
    @Param('userId') userId: string,
  ): Promise<Tooltip[]> {
    return this.tooltipService.getClosedTooltipsByUserId(parseInt(userId, 10));
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a tooltip by ID' })
  @ApiParam({ name: 'id', description: 'Tooltip ID' })
  @ApiResponse({ 
    status: 200, 
    description: 'Tooltip retrieved successfully',
    type: Tooltip 
  })
  @ApiResponse({ status: 404, description: 'Tooltip not found' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - Admin access required' })
  findOne(@Param('id') id: string): Promise<Tooltip> {
    return this.tooltipService.findOne(+id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a tooltip' })
  @ApiParam({ name: 'id', description: 'Tooltip ID' })
  @ApiResponse({ 
    status: 200, 
    description: 'Tooltip updated successfully',
    type: Tooltip 
  })
  @ApiResponse({ status: 404, description: 'Tooltip not found' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - Admin access required' })
  update(
    @Param('id') id: string,
    @Body() updateTooltipDto: UpdateTooltipDto,
  ): Promise<Tooltip> {
    return this.tooltipService.update(+id, updateTooltipDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a tooltip' })
  @ApiParam({ name: 'id', description: 'Tooltip ID' })
  @ApiResponse({ status: 200, description: 'Tooltip deleted successfully' })
  @ApiResponse({ status: 404, description: 'Tooltip not found' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - Admin access required' })
  remove(@Param('id') id: string): Promise<void> {
    return this.tooltipService.remove(+id);
  }

  @Get('search/type/:type/page/:page')
  @ApiOperation({ summary: 'Search tooltips by type and page' })
  @ApiParam({ name: 'type', description: 'Tooltip type', enum: TooltipType })
  @ApiParam({ name: 'page', description: 'Page name', enum: TooltipPage })
  @ApiResponse({ 
    status: 200, 
    description: 'Tooltips found successfully',
    type: [Tooltip] 
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - Admin access required' })
  findByTypeAndPage(
    @Param('type') type: TooltipType,
    @Param('page') page: TooltipPage,
  ): Promise<Tooltip[]> {
    return this.tooltipService.findByTypeAndPage(type, page);
  }
}
