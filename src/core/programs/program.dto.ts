import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsString, IsNotEmpty, IsOptional, IsBoolean, IsNumber, ValidateNested, ValidateIf } from 'class-validator';
import { Type } from 'class-transformer';

export class ProgramDto {
  @ApiProperty({
    description: 'Unique program identifier (number or string)',
    example: 1,
  })
  @ValidateIf((o) => typeof o.id !== 'string')
  @IsNumber()
  @ValidateIf((o) => typeof o.id === 'string')
  @IsString()
  id: number | string;

  @ApiProperty({
    description: 'Program name',
    example: 'Stress and Anxiety Management',
  })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({
    description: 'If true, this program is used as fallback when selection cannot be determined',
    example: false,
    required: false,
    default: false,
  })
  @IsOptional()
  @IsBoolean()
  isDefault?: boolean;
}

export class ProgramsDto {
  @ApiProperty({
    description: 'List of programs',
    type: [ProgramDto],
  })
  programs: ProgramDto[];
}

export class ProgramsResponseDto {
  @ApiProperty({
    description: 'List of programs',
    type: [ProgramDto],
  })
  programs: ProgramDto[];

  @ApiProperty({
    description: 'Total count of programs',
    example: 10,
  })
  totalCount: number;

  @ApiProperty({
    description: 'Last sync date with Google Drive',
    example: '2026-02-19T19:19:00.000Z',
    nullable: true,
  })
  lastSyncDate?: string | null;
}

export class ProgramsStatsDto {
  @ApiProperty({
    description: 'Total number of programs',
    example: 10,
  })
  totalCount: number;
}

export class UpdateProgramsDto {
  @ApiProperty({
    description: 'List of programs to update',
    type: [ProgramDto],
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ProgramDto)
  programs: ProgramDto[];
}
