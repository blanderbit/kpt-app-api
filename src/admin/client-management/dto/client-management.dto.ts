import { ApiProperty } from '@nestjs/swagger';
import { ActivityResponseDto } from '../../../profile/activity/dto/activity.dto';
import { SuggestedActivityResponseDto } from '../../../suggested-activity/dto/suggested-activity.dto';
import { MoodTrackerResponseDto } from '../../../profile/mood-tracker/dto/mood-tracker.dto';
import { SurveyResponseDto } from '../../survey/dto/survey.dto';
import { ArticleResponseDto } from '../../articles/dto/article.dto';

export class ClientUserResponseDto {
  @ApiProperty({ description: 'User ID', example: 1 })
  id: number;

  @ApiProperty({ description: 'User email', example: 'user@example.com' })
  email: string;

  @ApiProperty({ description: 'User first name', example: 'John', nullable: true })
  firstName: string | null;

  @ApiProperty({ description: 'Avatar URL', nullable: true })
  avatarUrl: string | null;

  @ApiProperty({ description: 'Email verified status', example: true })
  emailVerified: boolean;

  @ApiProperty({ description: 'Theme', example: 'light' })
  theme: string;

  @ApiProperty({ description: 'User roles', example: ['user'] })
  roles: string[];

  @ApiProperty({ description: 'Initial satisfaction level (0-100)', example: 70, nullable: true })
  initSatisfactionLevel: number | null;

  @ApiProperty({ description: 'Initial hardness level (0-100)', example: 30, nullable: true })
  initHardnessLevel: number | null;

  @ApiProperty({ description: 'Created at', example: '2024-01-01T00:00:00.000Z' })
  createdAt: Date;

  @ApiProperty({ description: 'Updated at', example: '2024-01-01T00:00:00.000Z' })
  updatedAt: Date;
}

export class UserActivitiesResponseDto {
  @ApiProperty({ description: 'List of activities', type: [ActivityResponseDto] })
  activities: ActivityResponseDto[];

  @ApiProperty({ description: 'Date filter', example: '2024-01-15' })
  date: string;
}

export class UserSuggestedActivitiesResponseDto {
  @ApiProperty({ description: 'List of suggested activities', type: [SuggestedActivityResponseDto] })
  suggestedActivities: SuggestedActivityResponseDto[];
}

export class UserMoodTrackerMonthlyResponseDto {
  @ApiProperty({ description: 'Year', example: 2024 })
  year: number;

  @ApiProperty({ description: 'Month (1-12)', example: 1 })
  month: number;

  @ApiProperty({ description: 'List of mood trackers for the month', type: [MoodTrackerResponseDto] })
  moodTrackers: MoodTrackerResponseDto[];

  @ApiProperty({ description: 'Total days in month', example: 31 })
  totalDays: number;

  @ApiProperty({ description: 'Tracked days count', example: 15 })
  trackedDays: number;
}

export class UserAnalyticsResponseDto {
  @ApiProperty({ description: 'Total tasks', example: 50 })
  totalTasks: number;

  @ApiProperty({ description: 'Completed tasks', example: 25 })
  completedTasks: number;

  @ApiProperty({ description: 'Task completion rate (%)', example: 50.0 })
  taskCompletionRate: number;

  @ApiProperty({ description: 'Rate activity average satisfaction', example: 75.5, nullable: true })
  averageSatisfaction: number | null;

  @ApiProperty({ description: 'Rate activity average hardness', example: 65.2, nullable: true })
  averageHardness: number | null;

  @ApiProperty({ description: 'Total rate activities', example: 20 })
  totalRateActivities: number;
}

export class UserSurveysResponseDto {
  @ApiProperty({ description: 'List of surveys user answered', type: [SurveyResponseDto] })
  surveys: SurveyResponseDto[];

  @ApiProperty({ description: 'Total count', example: 5 })
  total: number;
}

export class UserArticlesResponseDto {
  @ApiProperty({ description: 'List of articles user hidden', type: [ArticleResponseDto] })
  articles: ArticleResponseDto[];

  @ApiProperty({ description: 'Total count', example: 3 })
  total: number;
}


