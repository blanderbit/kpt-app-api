import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  UseGuards,
  ParseIntPipe,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
  ApiQuery,
  ApiBody,
} from '@nestjs/swagger';
import { SuggestedActivityService } from '../services/suggested-activity.service';
import { AddSuggestedActivityToActivitiesDto, RefreshSuggestedActivitiesDto, GenerateFromQuizDto } from '../dto/suggested-activity.dto';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { User } from 'src/users/entities/user.entity';

@ApiTags('suggested-activities')
@Controller('profile/suggested-activities')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class SuggestedActivityController {
  constructor(private readonly suggestedActivityService: SuggestedActivityService) {}

  @Get()
  @ApiOperation({
    summary: 'Get suggested activities',
    description: 'Returns a list of suggested activities for the user',
  })
  @ApiResponse({
    status: 200,
    description: 'List of suggested activities',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized access',
  })
  async getUserSuggestedActivities(
    @CurrentUser() user: User,
  ) {
    return this.suggestedActivityService.getUserSuggestedActivities(user);
  }

  @Post('add-to-activities')
  @ApiOperation({
    summary: 'Add suggested activity to regular activities',
    description: 'Creates a new activity based on the suggested one and marks it as used',
  })
  @ApiBody({ type: AddSuggestedActivityToActivitiesDto })
  @ApiResponse({
    status: 201,
    description: 'Activity successfully added',
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid data',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized access',
  })
  @ApiResponse({
    status: 404,
    description: 'Suggested activity not found',
  })
  @ApiResponse({
    status: 403,
    description: 'Activity has already been used',
  })
  async addSuggestedActivityToActivities(
    @CurrentUser() user: User,
    @Body() addDto: AddSuggestedActivityToActivitiesDto,
  ) {
    return this.suggestedActivityService.addSuggestedActivityToActivities(
      user,
      addDto.id,
      addDto.notes,
    );
  }

  @Post('add-all-to-activities')
  @ApiOperation({
    summary: 'Transfer all suggested activities to regular activities',
    description: 'Creates a regular activity for each suggested activity linked to the current user, then removes the suggestions. User is determined by JWT.',
  })
  @ApiResponse({
    status: 201,
    description: 'All suggested activities transferred',
    schema: { type: 'object', properties: { message: { type: 'string' }, activities: { type: 'array', items: { type: 'object' } } } },
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized access',
  })
  async addAllSuggestedToActivities(@CurrentUser() user: User) {
    return this.suggestedActivityService.addAllSuggestedToActivities(user);
  }

  @Delete(':id')
  @ApiOperation({
    summary: 'Delete suggested activity',
    description: 'Removes a suggested activity from the user\'s list',
  })
  @ApiParam({
    name: 'id',
    description: 'Suggested activity ID',
    type: 'number',
    example: 1,
  })
  @ApiResponse({
    status: 200,
    description: 'Suggested activity successfully deleted',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized access',
  })
  @ApiResponse({
    status: 404,
    description: 'Suggested activity not found',
  })
  async deleteSuggestedActivity(
    @CurrentUser('id') userId: number,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.suggestedActivityService.deleteSuggestedActivity(userId, id);
  }

  @Post('refresh')
  @ApiOperation({
    summary: 'Refresh suggested activities',
    description: 'Generates new suggested activities for the user',
  })
  @ApiBody({ type: RefreshSuggestedActivitiesDto })
  @ApiResponse({
    status: 200,
    description: 'Suggested activities successfully refreshed',
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid data',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized access',
  })
  async refreshSuggestedActivities(
    @CurrentUser('id') userId: number,
    @Body() refreshDto: RefreshSuggestedActivitiesDto,
  ) {
    const date = refreshDto.date ? new Date(refreshDto.date) : undefined;
    return this.suggestedActivityService.refreshSuggestedActivities(
      userId,
      date,
    );
  }

  @Post('generate-from-quiz')
  @ApiOperation({
    summary: 'Generate suggested activities from quiz and program',
    description: 'Generates suggested activities using user quizSnapshot, selected program, optional summary, and provided hardness/satisfaction. Requires quiz data and program; summary is optional.',
  })
  @ApiBody({ type: GenerateFromQuizDto })
  @ApiResponse({
    status: 201,
    description: 'Suggested activities generated and saved',
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid hardness/satisfaction/count or missing quiz/program data',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized access',
  })
  async generateFromQuiz(
    @CurrentUser() user: User,
    @Body() dto: GenerateFromQuizDto,
  ) {
    return this.suggestedActivityService.generateFromQuiz(user, dto);
  }
}
