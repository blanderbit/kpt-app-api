import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  ParseIntPipe,
  UseInterceptors,
  UploadedFile,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
  ApiQuery,
  ApiConsumes,
} from '@nestjs/swagger';
import { Paginate, PaginateQuery, Paginated, PaginatedSwaggerDocs } from 'nestjs-paginate';
import { SurveyAdminService } from './survey-admin.service';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { User } from '../../users/entities/user.entity';
import {
  CreateSurveyDto,
  UpdateSurveyDto,
  SurveyResponseDto,
  SurveyStatisticsDto,
} from './dto/survey.dto';
import { Survey } from './entities/survey.entity';
import { SurveyStatus } from './entities/survey.entity';
import { surveyConfig } from './survey.config';
import { FileInterceptor } from '@nestjs/platform-express';
import { FileUploadService } from '../../core/file-upload';

@ApiTags('admin/surveys')
@Controller('admin/surveys')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
@Roles('admin')
export class SurveyAdminController {
  constructor(
    private readonly surveyAdminService: SurveyAdminService,
    private readonly fileUploadService: FileUploadService,
  ) {}

  @Post()
  @UseInterceptors(FileInterceptor('file'))
  @ApiConsumes('multipart/form-data')
  @ApiOperation({
    summary: 'Create new survey',
    description: 'Creates a new survey with title and description',
  })
  @ApiResponse({
    status: 201,
    description: 'Survey created successfully',
    type: SurveyResponseDto,
  })
  @ApiResponse({ status: 401, description: 'Unauthorized access' })
  @ApiResponse({ status: 403, description: 'Insufficient permissions (admin required)' })
  async createSurvey(
    @Body() createSurveyDto: CreateSurveyDto,
    @CurrentUser() user: User,
    @UploadedFile() file?: Express.Multer.File,
  ): Promise<SurveyResponseDto> {
    const survey = await this.surveyAdminService.createSurvey(createSurveyDto, user.email, file);

    if (file && survey.file) {
      const uploadInfo = await this.fileUploadService.uploadFile(file, 'surveys');
      await this.surveyAdminService.updateFileUrls(
        { id: survey.file.id },
        uploadInfo.url,
        uploadInfo.key,
      );
      survey.file.fileUrl = uploadInfo.url;
      survey.file.fileKey = uploadInfo.key;
    }

    return survey;
  }

  @Get()
  @ApiOperation({
    summary: 'Get all surveys with pagination',
    description: 'Returns a paginated list of all surveys',
  })
  @ApiQuery({
    name: 'page',
    description: 'Page number',
    type: 'number',
    required: false,
    example: 1,
  })
  @ApiQuery({
    name: 'limit',
    description: 'Items per page',
    type: 'number',
    required: false,
    example: 20,
  })
  @ApiQuery({
    name: 'sortBy',
    description: 'Sort by field',
    type: 'string',
    required: false,
    example: 'createdAt:DESC',
  })
  @ApiQuery({
    name: 'filter.status',
    description: 'Filter by survey status',
    type: 'string',
    required: false,
    example: 'active',
  })
  @ApiResponse({
    status: 200,
    description: 'Paginated list of surveys',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized access' })
  @ApiResponse({ status: 403, description: 'Insufficient permissions (admin required)' })
  @PaginatedSwaggerDocs(Survey, surveyConfig)
  async getAllSurveysPaginated(
    @Paginate() query: PaginateQuery,
  ): Promise<Paginated<Survey>> {
    return this.surveyAdminService.getSurveysPaginated(query);
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Get survey by ID',
    description: 'Returns survey details by ID',
  })
  @ApiParam({
    name: 'id',
    description: 'Survey ID',
    type: Number,
  })
  @ApiResponse({
    status: 200,
    description: 'Survey details',
    type: SurveyResponseDto,
  })
  @ApiResponse({ status: 401, description: 'Unauthorized access' })
  @ApiResponse({ status: 403, description: 'Insufficient permissions (admin required)' })
  @ApiResponse({ status: 404, description: 'Survey not found' })
  async getSurveyById(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<SurveyResponseDto> {
    return this.surveyAdminService.getSurveyById(id);
  }

  @Put(':id')
  @UseInterceptors(FileInterceptor('file'))
  @ApiConsumes('multipart/form-data')
  @ApiOperation({
    summary: 'Update survey',
    description: 'Updates an existing survey',
  })
  @ApiParam({
    name: 'id',
    description: 'Survey ID',
    type: Number,
  })
  @ApiResponse({
    status: 200,
    description: 'Survey updated successfully',
    type: SurveyResponseDto,
  })
  @ApiResponse({ status: 401, description: 'Unauthorized access' })
  @ApiResponse({ status: 403, description: 'Insufficient permissions (admin required)' })
  @ApiResponse({ status: 404, description: 'Survey not found' })
  async updateSurvey(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateSurveyDto: UpdateSurveyDto,
    @CurrentUser() user: User,
    @UploadedFile() file?: Express.Multer.File,
  ): Promise<SurveyResponseDto> {
    const survey = await this.surveyAdminService.updateSurvey(id, updateSurveyDto, user.email, file);

    if (file && survey.file && (!survey.file.fileKey || !survey.file.fileUrl)) {
      const uploadInfo = await this.fileUploadService.uploadFile(file, 'surveys');
      await this.surveyAdminService.updateFileUrls(
        { id: survey.file.id },
        uploadInfo.url,
        uploadInfo.key,
      );
      survey.file.fileUrl = uploadInfo.url;
      survey.file.fileKey = uploadInfo.key;
    }

    return survey;
  }

  @Delete(':id')
  @ApiOperation({
    summary: 'Delete survey',
    description: 'Deletes a survey permanently',
  })
  @ApiParam({
    name: 'id',
    description: 'Survey ID',
    type: Number,
  })
  @ApiResponse({
    status: 200,
    description: 'Survey deleted successfully',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean' },
        message: { type: 'string' },
      },
    },
  })
  @ApiResponse({ status: 401, description: 'Unauthorized access' })
  @ApiResponse({ status: 403, description: 'Insufficient permissions (admin required)' })
  @ApiResponse({ status: 404, description: 'Survey not found' })
  async deleteSurvey(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: User,
  ): Promise<{ success: boolean; message: string }> {
    return this.surveyAdminService.deleteSurvey(id, user.email);
  }

  @Get(':id/statistics')
  @ApiOperation({
    summary: 'Get survey statistics',
    description: 'Returns aggregated statistics for survey answers',
  })
  @ApiParam({
    name: 'id',
    description: 'Survey ID',
    type: Number,
  })
  @ApiResponse({
    status: 200,
    description: 'Survey statistics',
    type: SurveyStatisticsDto,
  })
  async getSurveyStatistics(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<SurveyStatisticsDto> {
    return this.surveyAdminService.getSurveyStatistics(id);
  }

  @Post(':id/close')
  @ApiOperation({
    summary: 'Archive (close) survey',
    description: 'Marks survey as archived and prevents further submissions',
  })
  @ApiParam({
    name: 'id',
    description: 'Survey ID',
    type: Number,
  })
  @ApiResponse({
    status: 200,
    description: 'Survey archived successfully',
    type: SurveyResponseDto,
  })
  async closeSurvey(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: User,
  ): Promise<SurveyResponseDto> {
    return this.surveyAdminService.closeSurvey(id, user.email);
  }

  @Post(':id/duplicate')
  @ApiOperation({
    summary: 'Duplicate survey',
    description: 'Creates a new survey based on existing one',
  })
  @ApiParam({
    name: 'id',
    description: 'Survey ID',
    type: Number,
  })
  @ApiResponse({
    status: 201,
    description: 'Survey duplicated successfully',
    type: SurveyResponseDto,
  })
  async duplicateSurvey(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: User,
  ): Promise<SurveyResponseDto> {
    return this.surveyAdminService.duplicateSurvey(id, user.email);
  }

  @Post(':id/activate')
  @ApiOperation({
    summary: 'Activate survey',
    description: 'Marks survey as active so it becomes available to users',
  })
  @ApiParam({
    name: 'id',
    description: 'Survey ID',
    type: Number,
  })
  @ApiResponse({
    status: 200,
    description: 'Survey activated successfully',
    type: SurveyResponseDto,
  })
  async activateSurvey(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: User,
  ): Promise<SurveyResponseDto> {
    return this.surveyAdminService.activateSurvey(id, user.email);
  }
}

