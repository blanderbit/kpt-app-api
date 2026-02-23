import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { ProgramsService, ProgramsData, ProgramsResponseDto, ProgramsStatsDto, UpdateProgramsDto } from '../../core/programs';

@Injectable()
export class ProgramsAdminService {
  private readonly logger = new Logger(ProgramsAdminService.name);

  constructor(
    private readonly programsService: ProgramsService,
  ) {}

  /**
   * Sync programs with Google Drive
   * Reloads data from Google Drive
   */
  async syncWithDrive(): Promise<{ success: boolean; message: string }> {
    try {
      this.logger.log('Starting programs sync with Google Drive...');
      
      // Reload programs from Google Drive
      await this.programsService.loadPrograms();
      
      this.logger.log('Programs synced successfully with Google Drive');
      
      return {
        success: true,
        message: 'Programs successfully synced with Google Drive'
      };
    } catch (error) {
      this.logger.error('Failed to sync programs with Google Drive', error);
      
      return {
        success: false,
        message: `Sync error: ${error.message}`
      };
    }
  }

  /**
   * Get all programs
   */
  async getAllPrograms(): Promise<ProgramsResponseDto> {
    return this.programsService.getAllPrograms();
  }

  /**
   * Get programs statistics
   */
  async getProgramsStats(): Promise<ProgramsStatsDto> {
    return this.programsService.getProgramsStats();
  }

  /**
   * Update programs (save to Google Drive)
   */
  async updatePrograms(updateDto: UpdateProgramsDto): Promise<{ success: boolean; message: string }> {
    try {
      this.logger.log('Updating programs on Google Drive...');

      // Validate programs array
      if (!updateDto.programs || !Array.isArray(updateDto.programs)) {
        throw new BadRequestException('Invalid data: programs must be an array');
      }

      const ids = new Set<string>();
      for (const program of updateDto.programs) {
        if (!program.name || typeof program.name !== 'string' || program.name.trim() === '') {
          throw new BadRequestException('Invalid data: each program must have a non-empty name');
        }
        if (program.id !== undefined && program.id !== null && typeof program.id !== 'number' && typeof program.id !== 'string') {
          throw new BadRequestException('Invalid data: each program id must be a number or a string');
        }
        const key = String(program.id);
        if (ids.has(key)) {
          throw new BadRequestException(
            `Duplicate program id: ${key}. Each program must have a unique id. Please change the duplicate id.`,
          );
        }
        ids.add(key);
      }

      const programsData: ProgramsData = {
        programs: updateDto.programs,
      };

      // Push to Google Drive
      await this.programsService.pushContentToDrive(programsData);
      
      // Reload from Drive to update cache
      await this.programsService.loadPrograms();

      this.logger.log('Programs updated successfully on Google Drive');
      
      return {
        success: true,
        message: 'Programs successfully updated on Google Drive'
      };
    } catch (error) {
      this.logger.error('Failed to update programs on Google Drive', error);
      
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }
}
