import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional, IsNotEmpty, IsArray, ValidateNested, IsNumber, ValidateIf, registerDecorator, ValidationOptions, ValidationArguments } from 'class-validator';
import { Type, Transform, plainToInstance } from 'class-transformer';
import { SurveyStatus } from '../entities/survey.entity';
import { FileDto } from '../../articles/dto/article.dto';

// Custom validator for string or string array
function IsStringOrStringArray(validationOptions?: ValidationOptions) {
  return function (object: Object, propertyName: string) {
    registerDecorator({
      name: 'isStringOrStringArray',
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      validator: {
        validate(value: any, args: ValidationArguments) {
          if (typeof value === 'string' && value.trim().length > 0) {
            return true;
          }
          if (Array.isArray(value) && value.length > 0 && value.every(item => typeof item === 'string' && item.trim().length > 0)) {
            return true;
          }
          return false;
        },
        defaultMessage(args: ValidationArguments) {
          return `${args.property} must be a non-empty string or a non-empty array of strings`;
        },
      },
    });
  };
}

const transformJsonArray = <T>(value: unknown, ClassCtor?: new () => any): T | undefined => {
  if (value === undefined || value === null || value === '') {
    return undefined;
  }

  let parsedValue = value;

  if (typeof value === 'string') {
    try {
      parsedValue = JSON.parse(value);
    } catch (error) {
      return undefined;
    }
  }

  if (Array.isArray(parsedValue) && ClassCtor) {
    return plainToInstance(ClassCtor, parsedValue) as unknown as T;
  }

  return parsedValue as T;
};

export class SurveyQuestionOptionDto {
  @ApiProperty({
    description: 'Option ID',
    example: 'opt1',
  })
  @IsString()
  @IsNotEmpty()
  id: string;

  @ApiProperty({
    description: 'Option text',
    example: 'Very satisfied',
  })
  @IsString()
  @IsNotEmpty()
  text: string;
}

export class SurveyQuestionDto {
  @ApiProperty({
    description: 'Question ID',
    example: 'q1',
  })
  @IsString()
  @IsNotEmpty()
  id: string;

  @ApiProperty({
    description: 'Question text',
    example: 'How satisfied are you with our service?',
  })
  @IsString()
  @IsNotEmpty()
  text: string;

  @ApiProperty({
    description: 'Question type',
    enum: ['single', 'multiple'],
    example: 'single',
  })
  @IsString()
  @IsNotEmpty()
  type: 'single' | 'multiple';

  @ApiProperty({
    description: 'Answer options',
    type: [SurveyQuestionOptionDto],
    example: [
      { id: 'opt1', text: 'Very satisfied' },
      { id: 'opt2', text: 'Satisfied' },
    ],
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SurveyQuestionOptionDto)
  options: SurveyQuestionOptionDto[];
}

export class CreateSurveyDto {
  @ApiProperty({
    description: 'Survey title',
    example: 'Weekly Health Assessment',
  })
  @IsString()
  @IsNotEmpty()
  title: string;

  @ApiProperty({
    description: 'Survey description',
    required: false,
    example: 'Answer the following questions about your health',
  })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({
    description: 'Survey questions with answer options',
    type: [SurveyQuestionDto],
    required: false,
  })
  @IsArray()
  @IsOptional()
  @ValidateNested({ each: true })
  @Transform(({ value }) => transformJsonArray<SurveyQuestionDto[]>(value, SurveyQuestionDto), {
    toClassOnly: true,
  })
  @Type(() => SurveyQuestionDto)
  questions?: SurveyQuestionDto[];
}

export class UpdateSurveyDto {
  @ApiProperty({
    description: 'Survey title',
    required: false,
    example: 'Updated Weekly Health Assessment',
  })
  @IsOptional()
  @IsString()
  title?: string;

  @ApiProperty({
    description: 'Survey description',
    required: false,
    example: 'Updated survey description',
  })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({
    description: 'Survey questions with answer options',
    type: [SurveyQuestionDto],
    required: false,
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Transform(({ value }) => transformJsonArray<SurveyQuestionDto[]>(value, SurveyQuestionDto), {
    toClassOnly: true,
  })
  @Type(() => SurveyQuestionDto)
  questions?: SurveyQuestionDto[];

  @ApiProperty({
    description: 'Identifier of an attached file to remove',
    required: false,
    type: Number,
  })
  @IsOptional()
  @Transform(({ value }) => {
    if (value === null || value === undefined || value === '') {
      return undefined;
    }
    const parsed = Number(value);
    return Number.isNaN(parsed) ? undefined : parsed;
  })
  @IsNumber()
  removeFileId?: number;
}

export class SurveyResponseDto {
  @ApiProperty({
    description: 'Unique identifier for the survey',
    example: 1,
  })
  id: number;

  @ApiProperty({
    description: 'Survey title',
    example: 'Weekly Health Assessment',
  })
  title: string;

  @ApiProperty({
    description: 'Survey description',
    example: 'Answer the following questions about your health',
    nullable: true,
  })
  description: string | null;

  @ApiProperty({
    description: 'Survey questions with answer options',
    isArray: true,
    required: false,
  })
  questions: SurveyQuestionDto[] | null;

  @ApiProperty({
    description: 'Survey status',
    enum: SurveyStatus,
    example: SurveyStatus.AVAILABLE,
  })
  status: SurveyStatus;

  @ApiProperty({
    description: 'User who created the survey',
    example: 'admin@example.com',
    nullable: true,
  })
  createdBy: string;

  @ApiProperty({
    description: 'User who last updated the survey',
    example: 'admin@example.com',
    nullable: true,
  })
  updatedBy: string;

  @ApiProperty({
    description: 'Survey creation timestamp',
    example: '2023-12-01T10:00:00.000Z',
  })
  createdAt: Date;

  @ApiProperty({
    description: 'Survey last update timestamp',
    example: '2023-12-01T10:00:00.000Z',
  })
  updatedAt: Date;

  @ApiProperty({
    description: 'Survey archival timestamp',
    example: '2023-12-01T10:00:00.000Z',
    nullable: true,
  })
  archivedAt: Date | null;

  @ApiProperty({
    description: 'User who archived the survey',
    example: 'admin@example.com',
    nullable: true,
  })
  archivedBy: string | null;

  @ApiProperty({
    description: 'Whether the current user has completed this survey',
    example: false,
    required: false,
  })
  isCompleted?: boolean;

  @ApiProperty({
    description: 'Attached file (if any)',
    type: () => FileDto,
    required: false,
    nullable: true,
  })
  file: FileDto | null;
}

export class SurveyAnswerDto {
  @ApiProperty({
    description: 'Question ID',
    example: 'q1',
  })
  @IsString()
  @IsNotEmpty()
  questionId: string;

  @ApiProperty({
    description: 'Selected option IDs or text answer',
    example: ['opt1', 'opt2'],
  })
  @IsStringOrStringArray()
  answer: string | string[];
}

export class SubmitSurveyAnswerDto {
  @ApiProperty({
    description: 'User answers to the survey',
    type: [SurveyAnswerDto],
    example: [
      { questionId: 'q1', answer: 'opt1' },
      { questionId: 'q2', answer: ['opt1', 'opt2'] },
      { questionId: 'q3', answer: 'Custom text answer' },
    ],
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SurveyAnswerDto)
  answers: SurveyAnswerDto[];
}

export class SurveyAnswerStatisticDto {
  @ApiProperty({
    description: 'Identifier of the answer option or free-text value',
    example: 'opt1',
  })
  value: string;

  @ApiProperty({
    description: 'Human-readable label for the answer option or free-text value',
    example: 'Very satisfied',
  })
  label: string;

  @ApiProperty({
    description: 'Number of times this answer was selected',
    example: 42,
  })
  count: number;

  @ApiProperty({
    description: 'Share of responses in percent (0-100)',
    example: 57.5,
  })
  percentage: number;
}

export class SurveyQuestionStatisticDto {
  @ApiProperty({
    description: 'Question identifier',
    example: 'q1',
  })
  questionId: string;

  @ApiProperty({
    description: 'Question text',
    example: 'How satisfied are you with our service?',
  })
  questionText: string;

  @ApiProperty({
    description: 'Question type',
    enum: ['single', 'multiple'],
  })
  type: 'single' | 'multiple';

  @ApiProperty({
    description: 'Statistics for the most popular answers',
    type: [SurveyAnswerStatisticDto],
  })
  answers: SurveyAnswerStatisticDto[];
}

export class SurveyStatisticsDto {
  @ApiProperty({
    description: 'Survey identifier',
    example: 1,
  })
  surveyId: number;

  @ApiProperty({
    description: 'Survey title',
    example: 'Weekly Health Assessment',
  })
  title: string;

  @ApiProperty({
    description: 'Total number of submitted responses',
    example: 120,
  })
  totalResponses: number;

  @ApiProperty({
    description: 'Number of unique users that submitted responses',
    example: 118,
  })
  respondedUsers: number;

  @ApiProperty({
    description: 'Number of users with an active assignment for this survey',
    example: 55,
  })
  activeAssignments: number;

  @ApiProperty({
    description: 'Aggregated statistics for each question',
    type: [SurveyQuestionStatisticDto],
  })
  questionStats: SurveyQuestionStatisticDto[];
}


