import { Injectable, Logger, Inject, forwardRef, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { GoogleDriveFilesService } from '../../common/services/google-drive-files.service';
import { ErrorCode } from '../../common/error-codes';
import { AppException } from '../../common/exceptions/app.exception';
import { ProgramDto, ProgramsResponseDto, ProgramsStatsDto } from './program.dto';
import { SettingsService } from '../../admin/settings/settings.service';

export interface Program {
  id: number | string;
  name: string;
  isDefault?: boolean;
}

/** Stored in DB (e.g. User.selectedProgram) as JSON */
export type ProgramRef = { id: number | string; name: string };

export interface ProgramsData {
  programs: Program[];
}

@Injectable()
export class ProgramsService implements OnModuleInit {
  private readonly logger = new Logger(ProgramsService.name);
  private programsData: ProgramsData;
  private readonly fileId: string;
  private lastSyncDate: Date | null = null;

  constructor(
    private readonly configService: ConfigService,
    private readonly googleDriveFilesService: GoogleDriveFilesService,
    @Inject(forwardRef(() => SettingsService))
    private readonly settingsService?: SettingsService,
  ) {
    this.programsData = { programs: [] };
    this.fileId = this.configService.get<string>('PROGRAMS_FILE_ID') || '';
  }

  async onModuleInit(): Promise<void> {
    await this.loadPrograms();
  }

  /**
   * Loads programs from Google Drive
   */
  async loadPrograms(): Promise<void> {
    try {
      // Load from Google Drive
      if (this.fileId && this.googleDriveFilesService.isAvailable()) {
        this.logger.log('Loading programs from Google Drive');
        const raw = await this.googleDriveFilesService.getFileContent(this.fileId);
        const seenKeys = new Set<string>();
        const nextNumericId = () => {
          const nums = Array.from(seenKeys).filter((k) => /^\d+$/.test(k)).map(Number);
          let n = nums.length ? Math.max(...nums, 0) + 1 : 1;
          while (seenKeys.has(String(n))) n += 1;
          return n;
        };
        this.programsData = {
          programs: (raw.programs ?? []).map((p: Partial<Program>, index: number) => {
            let id: number | string =
              p.id !== undefined && p.id !== null && (typeof p.id === 'number' || typeof p.id === 'string')
                ? p.id
                : index + 1;
            const key = String(id);
            if (seenKeys.has(key)) {
              id = nextNumericId();
              seenKeys.add(String(id));
            } else {
              seenKeys.add(key);
            }
            return {
              id,
              name: p.name ?? '',
              isDefault: p.isDefault,
            };
          }),
        };
        this.lastSyncDate = new Date();
        this.settingsService?.updateLastSync('programs');
        return;
      }

      // If Google Drive is unavailable, use empty array
      this.logger.warn('Google Drive not available, using empty programs');
      this.programsData = {
        programs: []
      };
    } catch (error) {
      this.logger.error('Error loading programs:', error);
      // Fallback to empty array
      this.programsData = {
        programs: []
      };
    }
  }

  /**
   * Push programs content to Google Drive (overwrites the file identified by PROGRAMS_FILE_ID).
   * Call loadPrograms() after this to refresh in-memory cache.
   */
  async pushContentToDrive(content: ProgramsData): Promise<void> {
    if (!this.fileId) {
      this.logger.warn('PROGRAMS_FILE_ID not set, cannot push to Drive');
      throw AppException.validation(ErrorCode.ADMIN_CONFIGURATION_ERROR, 'PROGRAMS_FILE_ID is not configured');
    }
    if (!this.googleDriveFilesService.isAvailable()) {
      throw AppException.validation(ErrorCode.ADMIN_GOOGLE_DRIVE_CONNECTION_FAILED, 'Google Drive is not available');
    }
    await this.googleDriveFilesService.updateFileContent(this.fileId, content);
    this.logger.log('Programs content pushed to Google Drive');
  }

  /**
   * Get all programs
   */
  getAllPrograms(): ProgramsResponseDto {
    return {
      programs: this.programsData.programs,
      totalCount: this.programsData.programs.length,
      lastSyncDate: this.lastSyncDate?.toISOString() || null,
    };
  }

  /**
   * Get programs statistics
   */
  getProgramsStats(): ProgramsStatsDto {
    return {
      totalCount: this.programsData.programs.length,
    };
  }

  /**
   * Get programs data (internal use)
   */
  getProgramsData(): ProgramsData {
    return this.programsData;
  }

  /**
   * Get last sync date
   */
  getLastSyncDate(): Date | null {
    return this.lastSyncDate;
  }

  /**
   * Get the default program (isDefault: true). If none, returns first program or null.
   */
  getDefaultProgram(): Program | null {
    const list = this.programsData.programs;
    if (!list.length) return null;
    const defaultProgram = list.find((p) => p.isDefault === true);
    return defaultProgram ?? list[0] ?? null;
  }
}
