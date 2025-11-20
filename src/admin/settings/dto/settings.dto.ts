import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsNumber, IsString, IsDateString, Min } from 'class-validator';

export class NotificationsCronDto {
  @ApiProperty({ description: 'Cron expression for inactivity reminders', example: '0 9 * * *' })
  @IsOptional()
  @IsString()
  inactivity?: string;

  @ApiProperty({ description: 'Cron expression for mood reminders', example: '0 10 * * *' })
  @IsOptional()
  @IsString()
  mood?: string;

  @ApiProperty({ description: 'Cron expression for survey reminders', example: '0 11 * * *' })
  @IsOptional()
  @IsString()
  surveys?: string;

  @ApiProperty({ description: 'Cron expression for article reminders', example: '0 12 * * *' })
  @IsOptional()
  @IsString()
  articles?: string;

  @ApiProperty({ description: 'Cron expression for global activity reminders', example: '0 13 * * *' })
  @IsOptional()
  @IsString()
  globalActivity?: string;
}

export class GoogleDriveSyncDto {
  @ApiProperty({ description: 'Last sync timestamp for onboarding questions', required: false })
  @IsOptional()
  @IsDateString()
  onboardingQuestions?: string;

  @ApiProperty({ description: 'Last sync timestamp for languages', required: false })
  @IsOptional()
  @IsDateString()
  languages?: string;

  @ApiProperty({ description: 'Last sync timestamp for activity types', required: false })
  @IsOptional()
  @IsDateString()
  activityTypes?: string;

  @ApiProperty({ description: 'Last sync timestamp for social networks', required: false })
  @IsOptional()
  @IsDateString()
  socialNetworks?: string;

  @ApiProperty({ description: 'Last sync timestamp for mood types', required: false })
  @IsOptional()
  @IsDateString()
  moodTypes?: string;
}

export class SuggestedActivitiesCronDto {
  @ApiProperty({ description: 'Cron expression for generateDailySuggestions', example: '0 6 * * *' })
  @IsOptional()
  @IsString()
  generateDailySuggestions?: string;

  @ApiProperty({ description: 'Cron expression for cleanupOldSuggestions', example: '0 3 * * *' })
  @IsOptional()
  @IsString()
  cleanupOldSuggestions?: string;
}

export class SuggestedActivitiesDto {
  @ApiProperty({ description: 'Number of suggested activities to generate', example: 3, default: 3 })
  @IsOptional()
  @IsNumber()
  @Min(1)
  count?: number;

  @ApiProperty({ description: 'Cron configuration', type: SuggestedActivitiesCronDto, required: false })
  @IsOptional()
  cron?: SuggestedActivitiesCronDto;
}

export class ArticlesCronDto {
  @ApiProperty({ description: 'Cron expression for generateArticles', example: '0 8 * * *', required: false })
  @IsOptional()
  @IsString()
  generateArticles?: string | null;

  @ApiProperty({ description: 'Cron expression for cleanupOldArticles', example: '0 2 * * *', required: false })
  @IsOptional()
  @IsString()
  cleanupOldArticles?: string | null;
}

export class ArticlesDto {
  @ApiProperty({ description: 'Number of articles to generate', example: 5 })
  @IsOptional()
  @IsNumber()
  @Min(1)
  count?: number;

  @ApiProperty({ description: 'Cron configuration', type: ArticlesCronDto, required: false })
  @IsOptional()
  cron?: ArticlesCronDto;

  @ApiProperty({ description: 'Number of days before temporary articles expire', example: 7 })
  @IsOptional()
  @IsNumber()
  @Min(1)
  expirationDays?: number;
}

export class SurveysCronDto {
  @ApiProperty({ description: 'Cron expression for generateSurveys', example: '0 9 * * *', required: false })
  @IsOptional()
  @IsString()
  generateSurveys?: string | null;

  @ApiProperty({ description: 'Cron expression for cleanupOldSurveys', example: '0 2 * * *', required: false })
  @IsOptional()
  @IsString()
  cleanupOldSurveys?: string | null;
}

export class SurveysDto {
  @ApiProperty({ description: 'Number of surveys to generate', example: 3 })
  @IsOptional()
  @IsNumber()
  @Min(1)
  count?: number;

  @ApiProperty({ description: 'Cron configuration', type: SurveysCronDto, required: false })
  @IsOptional()
  cron?: SurveysCronDto;

  @ApiProperty({ description: 'Number of days before temporary surveys expire', example: 7 })
  @IsOptional()
  @IsNumber()
  @Min(1)
  expirationDays?: number;
}

export class TrialModeDto {
  @ApiProperty({ description: 'Number of days for trial period', example: 7, default: 7 })
  @IsOptional()
  @IsNumber()
  @Min(1)
  periodDays?: number;

  @ApiProperty({ description: 'Number of activities per day in trial mode', example: 3, default: 3 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  activitiesPerDay?: number;

  @ApiProperty({ description: 'Whether articles are available in trial mode', example: false, default: false })
  @IsOptional()
  articlesAvailable?: boolean;

  @ApiProperty({ description: 'Whether surveys are available in trial mode', example: false, default: false })
  @IsOptional()
  surveysAvailable?: boolean;
}

export class UpdateSettingsDto {
  @ApiProperty({ description: 'Google Drive sync timestamps', type: GoogleDriveSyncDto, required: false })
  @IsOptional()
  googleDriveSync?: GoogleDriveSyncDto;

  @ApiProperty({ description: 'Suggested activities configuration', type: SuggestedActivitiesDto, required: false })
  @IsOptional()
  suggestedActivities?: SuggestedActivitiesDto;

  @ApiProperty({ description: 'Articles configuration', type: ArticlesDto, required: false })
  @IsOptional()
  articles?: ArticlesDto;

  @ApiProperty({ description: 'Surveys configuration', type: SurveysDto, required: false })
  @IsOptional()
  surveys?: SurveysDto;

  @ApiProperty({ description: 'Notifications cron configuration', type: NotificationsCronDto, required: false })
  @IsOptional()
  notifications?: NotificationsCronDto;

  @ApiProperty({ description: 'Trial mode configuration', type: TrialModeDto, required: false })
  @IsOptional()
  trialMode?: TrialModeDto;
}

export class SettingsResponseDto {
  @ApiProperty({ description: 'Google Drive sync timestamps' })
  googleDriveSync: {
    onboardingQuestions: string | null;
    languages: string | null;
    activityTypes: string | null;
    socialNetworks: string | null;
    moodTypes: string | null;
  };

  @ApiProperty({ description: 'Suggested activities configuration' })
  suggestedActivities: {
    count: number;
    cron: {
      generateDailySuggestions: string;
      cleanupOldSuggestions: string;
    };
  };

  @ApiProperty({ description: 'Articles configuration' })
  articles: {
    count: number;
    cron: {
      generateArticles: string | null;
      cleanupOldArticles: string | null;
    };
    expirationDays: number;
  };

  @ApiProperty({ description: 'Surveys configuration' })
  surveys: {
    count: number;
    cron: {
      generateSurveys: string | null;
      cleanupOldSurveys: string | null;
    };
    expirationDays: number;
  };

  @ApiProperty({ description: 'Notifications cron configuration' })
  notifications: {
    cron: {
      inactivity: string;
      mood: string;
      surveys: string;
      articles: string;
      globalActivity: string;
    };
  };

  @ApiProperty({ description: 'Trial mode configuration' })
  trialMode: {
    periodDays: number;
    activitiesPerDay: number;
    articlesAvailable: boolean;
    surveysAvailable: boolean;
  };

  @ApiProperty({ description: 'Available cron expression presets', type: [String] })
  cronExpressions: string[];
}

export class UpdateNotificationCronDto extends NotificationsCronDto {}

