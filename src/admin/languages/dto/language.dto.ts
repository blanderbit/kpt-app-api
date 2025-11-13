import { IsString, IsNotEmpty, IsOptional, IsBoolean, IsNumber, IsIn, Min, Max } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateLanguageDto {
  @ApiProperty({ description: 'Language code (e.g., en, ru, es)', example: 'en' })
  @IsString()
  @IsNotEmpty()
  code: string;

  @ApiProperty({ description: 'Language name in English', example: 'English' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ description: 'Language name in native language', example: 'English' })
  @IsString()
  @IsNotEmpty()
  nativeName: string;

  @ApiProperty({ description: 'Text direction', enum: ['ltr', 'rtl'], default: 'ltr' })
  @IsString()
  @IsIn(['ltr', 'rtl'])
  @IsOptional()
  direction?: 'ltr' | 'rtl';

  @ApiProperty({ description: 'Whether the language is active', default: true })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;

  @ApiProperty({ description: 'Whether this is the default language', default: false })
  @IsBoolean()
  @IsOptional()
  isDefault?: boolean;

  @ApiProperty({ description: 'Language file version', default: '1.0.0' })
  @IsString()
  @IsOptional()
  version?: string;

  @ApiProperty({ description: 'Language notes', required: false })
  @IsString()
  @IsOptional()
  notes?: string;

  @ApiProperty({ description: 'SVG logo for the language', required: false })
  @IsString()
  @IsOptional()
  svgLogo?: string;

  @ApiProperty({ 
    description: 'Language translations object', 
    example: {
      common: {
        hello: 'Hello',
        goodbye: 'Goodbye',
        save: 'Save',
        cancel: 'Cancel'
      },
      auth: {
        login: 'Login',
        logout: 'Logout',
        email: 'Email',
        password: 'Password'
      },
      profile: {
        profile: 'Profile',
        settings: 'Settings',
        firstName: 'First Name',
        lastName: 'Last Name'
      }
    }
  })
  @IsNotEmpty()
  translations: any; // JSON object with translations only
}

export class UpdateLanguageDto {
  @ApiProperty({ description: 'Language name in English', required: false })
  @IsString()
  @IsOptional()
  name?: string;

  @ApiProperty({ description: 'Language name in native language', required: false })
  @IsString()
  @IsOptional()
  nativeName?: string;

  @ApiProperty({ description: 'Text direction', enum: ['ltr', 'rtl'], required: false })
  @IsString()
  @IsIn(['ltr', 'rtl'])
  @IsOptional()
  direction?: 'ltr' | 'rtl';

  @ApiProperty({ description: 'Whether the language is active', required: false })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;

  @ApiProperty({ description: 'Whether this is the default language', required: false })
  @IsBoolean()
  @IsOptional()
  isDefault?: boolean;

  @ApiProperty({ description: 'Language file version', required: false })
  @IsString()
  @IsOptional()
  version?: string;

  @ApiProperty({ description: 'Language notes', required: false })
  @IsString()
  @IsOptional()
  notes?: string;

  @ApiProperty({ description: 'SVG logo for the language', required: false })
  @IsString()
  @IsOptional()
  svgLogo?: string;

  @ApiProperty({ 
    description: 'Language translations object', 
    required: false,
    example: {
      common: {
        hello: 'Hello',
        goodbye: 'Goodbye',
        save: 'Save',
        cancel: 'Cancel'
      },
      auth: {
        login: 'Login',
        logout: 'Logout',
        email: 'Email',
        password: 'Password'
      }
    }
  })
  @IsOptional()
  translations?: any; // JSON object with translations only
}

export class LanguageResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  code: string;

  @ApiProperty()
  name: string;

  @ApiProperty()
  nativeName: string;

  @ApiProperty()
  direction: 'ltr' | 'rtl';

  @ApiProperty()
  isActive: boolean;

  @ApiProperty()
  isDefault: boolean;

  @ApiProperty()
  version: string;

  @ApiProperty({ required: false })
  googleDriveFileId?: string;

  @ApiProperty({ required: false })
  googleDriveFileUrl?: string;

  @ApiProperty({ required: false })
  googleDriveFolderId?: string;

  @ApiProperty({ required: false })
  googleDriveFolderUrl?: string;

  @ApiProperty()
  totalKeys: number;

  @ApiProperty()
  totalTranslations: number;

  @ApiProperty()
  completionRate: number;

  @ApiProperty({ required: false })
  notes?: string;

  @ApiProperty({ required: false })
  svgLogo?: string;

  @ApiProperty({ required: false })
  createdBy?: string;

  @ApiProperty({ required: false })
  updatedBy?: string;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;

  @ApiProperty({ required: false })
  lastSyncAt?: Date;

  @ApiProperty()
  isArchived: boolean;

  @ApiProperty({ required: false })
  archivedAt?: Date;

  @ApiProperty({ required: false })
  archivedBy?: string;
}

export class ArchiveLanguageDto {
  @ApiProperty({ description: 'Archiving reason', required: false })
  @IsString()
  @IsOptional()
  reason?: string;
}

export class DownloadTemplateDto {
  @ApiProperty({ description: 'Language code for template', example: 'en' })
  @IsString()
  @IsNotEmpty()
  code: string;
}

export class SetActiveLanguageDto {
  @ApiProperty({ description: 'Whether the language should be active', example: true })
  @IsBoolean()
  @IsNotEmpty()
  isActive: boolean;
}
