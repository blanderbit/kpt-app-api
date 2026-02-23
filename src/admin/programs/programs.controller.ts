import {
  Controller,
  Get,
  Post,
  Put,
  Body,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiBody,
} from '@nestjs/swagger';
import { ProgramsAdminService } from './programs-admin.service';
import { ProgramsResponseDto, ProgramsStatsDto, UpdateProgramsDto } from '../../core/programs';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';

@ApiTags('admin/programs')
@Controller('admin/programs')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class ProgramsController {
  constructor(private readonly programsAdminService: ProgramsAdminService) {}

  @Get()
  @ApiOperation({
    summary: 'Get all programs',
    description: 'Returns all programs from cache',
  })
  @ApiResponse({
    status: 200,
    description: 'List of all programs',
    type: ProgramsResponseDto,
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized',
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Admin access required',
  })
  async getAllPrograms(): Promise<ProgramsResponseDto> {
    return this.programsAdminService.getAllPrograms();
  }

  @Get('stats')
  @ApiOperation({
    summary: 'Get programs statistics',
    description: 'Returns statistical information about programs',
  })
  @ApiResponse({
    status: 200,
    description: 'Programs statistics',
    type: ProgramsStatsDto,
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized',
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Admin access required',
  })
  async getProgramsStats(): Promise<ProgramsStatsDto> {
    return this.programsAdminService.getProgramsStats();
  }

  @Post('sync-with-drive')
  @ApiOperation({
    summary: 'Sync programs with Google Drive',
    description: 'Re-downloads programs from Google Drive into app cache',
  })
  @ApiResponse({
    status: 200,
    description: 'Programs successfully synchronized with Google Drive',
    schema: {
      type: 'object',
      properties: {
        success: {
          type: 'boolean',
          description: 'Status of the operation',
        },
        message: {
          type: 'string',
          description: 'Message about the result',
        },
      },
    },
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized',
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Admin access required',
  })
  async syncWithDrive(): Promise<{ success: boolean; message: string }> {
    return this.programsAdminService.syncWithDrive();
  }

  @Put()
  @ApiOperation({
    summary: 'Update programs',
    description: 'Updates programs and saves to Google Drive',
  })
  @ApiBody({
    type: UpdateProgramsDto,
    description: 'Programs data to update',
  })
  @ApiResponse({
    status: 200,
    description: 'Programs successfully updated on Google Drive',
    schema: {
      type: 'object',
      properties: {
        success: {
          type: 'boolean',
          description: 'Status of the operation',
        },
        message: {
          type: 'string',
          description: 'Message about the result',
        },
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Bad request - Invalid data',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized',
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Admin access required',
  })
  async updatePrograms(
    @Body() updateDto: UpdateProgramsDto,
  ): Promise<{ success: boolean; message: string }> {
    return this.programsAdminService.updatePrograms(updateDto);
  }
}
