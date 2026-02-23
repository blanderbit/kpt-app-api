import { Controller, Get } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { ProgramsResponseDto } from '../../core/programs';
import { ProgramsAdminService } from './programs-admin.service';

@ApiTags('public/programs')
@Controller('public/programs')
export class ProgramsPublicController {
  constructor(private readonly programsAdminService: ProgramsAdminService) {}

  @Get()
  @ApiOperation({
    summary: 'Get all programs',
    description: 'Public endpoint returning all programs',
  })
  @ApiResponse({
    status: 200,
    description: 'List of all programs',
    type: ProgramsResponseDto,
  })
  async getPrograms(): Promise<ProgramsResponseDto> {
    return this.programsAdminService.getAllPrograms();
  }
}
