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
  UploadedFiles,
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
import { FilesInterceptor } from '@nestjs/platform-express';
import { Paginate, PaginateQuery, Paginated } from 'nestjs-paginate';
import { ArticlesAdminService } from './articles-admin.service';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { User } from '../../users/entities/user.entity';
import {
  CreateArticleDto,
  UpdateArticleDto,
  ArticleResponseDto,
  ArticleStatisticsDto,
  UserArticlesAnalyticsDto,
} from './dto/article.dto';
import { Article, ArticleStatus } from './entities/article.entity';
import { FileUploadService } from '../../core/file-upload';

@ApiTags('admin/articles')
@Controller('admin/articles')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
@Roles('admin')
export class ArticlesAdminController {
  constructor(
    private readonly articlesAdminService: ArticlesAdminService,
    private readonly fileUploadService: FileUploadService,
  ) {}

  @Post()
  @UseInterceptors(FilesInterceptor('files', 1))
  @ApiConsumes('multipart/form-data')
  @ApiOperation({
    summary: 'Create new article',
    description: 'Creates a new article with optional file attachments (up to 10 files)',
  })
  @ApiResponse({
    status: 201,
    description: 'Article created successfully',
    type: ArticleResponseDto,
  })
  @ApiResponse({ status: 401, description: 'Unauthorized access' })
  @ApiResponse({ status: 403, description: 'Insufficient permissions (admin required)' })
  async createArticle(
    @Body() createArticleDto: CreateArticleDto,
    @UploadedFiles() files: Express.Multer.File[] | undefined,
    @CurrentUser() user: User,
  ): Promise<ArticleResponseDto> {
    const fileList = files && files.length > 0 ? [files[0]] : undefined;

    const article = await this.articlesAdminService.createArticle(
      createArticleDto,
      fileList,
      user.email,
    );

    const newFile = fileList?.[0];
    if (newFile && article.files?.length) {
      const fileRecord = article.files.find((file) => !file.fileKey || !file.fileUrl) ?? article.files[article.files.length - 1];
      if (fileRecord) {
        const uploadInfo = await this.fileUploadService.uploadFile(newFile, 'articles');
        await this.articlesAdminService.updateFileUrls(
          { id: fileRecord.id },
          uploadInfo.url,
          uploadInfo.key,
        );
        fileRecord.fileUrl = uploadInfo.url;
        fileRecord.fileKey = uploadInfo.key;
      }
    }

    return article;
  }

  @Get()
  @ApiOperation({
    summary: 'Get all articles with pagination',
    description: 'Returns a paginated list of all articles',
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
    example: 'updatedAt:DESC',
  })
  @ApiQuery({
    name: 'filter.status',
    description: 'Filter by article status',
    type: 'string',
    required: false,
    example: 'active',
  })
  @ApiResponse({
    status: 200,
    description: 'Paginated list of articles',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized access' })
  @ApiResponse({ status: 403, description: 'Insufficient permissions (admin required)' })
  async getAllArticlesPaginated(
    @Paginate() query: PaginateQuery,
  ): Promise<Paginated<Article>> {
    return this.articlesAdminService.getArticlesPaginated(query);
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Get article by ID',
    description: 'Returns article details by ID',
  })
  @ApiParam({
    name: 'id',
    description: 'Article ID',
    type: Number,
  })
  @ApiResponse({
    status: 200,
    description: 'Article details',
    type: ArticleResponseDto,
  })
  @ApiResponse({ status: 401, description: 'Unauthorized access' })
  @ApiResponse({ status: 403, description: 'Insufficient permissions (admin required)' })
  @ApiResponse({ status: 404, description: 'Article not found' })
  async getArticleById(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<ArticleResponseDto> {
    return this.articlesAdminService.getArticleById(id);
  }

  @Put(':id')
  @UseInterceptors(FilesInterceptor('files', 1))
  @ApiConsumes('multipart/form-data')
  @ApiOperation({
    summary: 'Update article',
    description: 'Updates an existing article and optionally adds new file attachments (up to 10 files)',
  })
  @ApiParam({
    name: 'id',
    description: 'Article ID',
    type: Number,
  })
  @ApiResponse({
    status: 200,
    description: 'Article updated successfully',
    type: ArticleResponseDto,
  })
  @ApiResponse({ status: 401, description: 'Unauthorized access' })
  @ApiResponse({ status: 403, description: 'Insufficient permissions (admin required)' })
  @ApiResponse({ status: 404, description: 'Article not found' })
  async updateArticle(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateArticleDto: UpdateArticleDto,
    @UploadedFiles() files: Express.Multer.File[] | undefined,
    @CurrentUser() user: User,
  ): Promise<ArticleResponseDto> {
    const fileList = files && files.length > 0 ? [files[0]] : undefined;

    const article = await this.articlesAdminService.updateArticle(
      id,
      updateArticleDto,
      fileList,
      user.email,
    );

    const newFile = fileList?.[0];
    if (newFile && article.files?.length) {
      const fileRecord = article.files.find((file) => !file.fileKey || !file.fileUrl) ?? article.files.at(-1);
      if (fileRecord) {
        const uploadInfo = await this.fileUploadService.uploadFile(newFile, 'articles');
        await this.articlesAdminService.updateFileUrls(
          { id: fileRecord.id },
          uploadInfo.url,
          uploadInfo.key,
        );
        fileRecord.fileUrl = uploadInfo.url;
        fileRecord.fileKey = uploadInfo.key;
      }
    }

    return article;
  }

  @Delete(':id')
  @ApiOperation({
    summary: 'Delete article',
    description: 'Deletes an article permanently',
  })
  @ApiParam({
    name: 'id',
    description: 'Article ID',
    type: Number,
  })
  @ApiResponse({
    status: 200,
    description: 'Article deleted successfully',
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
  @ApiResponse({ status: 404, description: 'Article not found' })
  async deleteArticle(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: User,
  ): Promise<{ success: boolean; message: string }> {
    return this.articlesAdminService.deleteArticle(id, user.email);
  }

  @Get(':id/statistics')
  @ApiOperation({ summary: 'Get article statistics' })
  @ApiParam({ name: 'id', description: 'Article ID', type: Number })
  @ApiResponse({ status: 200, type: ArticleStatisticsDto })
  async getArticleStatistics(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<ArticleStatisticsDto> {
    return this.articlesAdminService.getArticleStatistics(id);
  }

  @Get('users/:userId/analytics')
  @ApiOperation({ summary: 'Get article analytics for user' })
  @ApiParam({ name: 'userId', description: 'User ID', type: Number })
  @ApiResponse({ status: 200, type: UserArticlesAnalyticsDto })
  async getUserArticlesAnalytics(
    @Param('userId', ParseIntPipe) userId: number,
  ): Promise<UserArticlesAnalyticsDto> {
    return this.articlesAdminService.getUserArticlesAnalytics(userId);
  }

  @Post(':id/close')
  @ApiOperation({ summary: 'Archive (close) article' })
  @ApiParam({ name: 'id', description: 'Article ID', type: Number })
  @ApiResponse({ status: 200, type: ArticleResponseDto })
  async closeArticle(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: User,
  ): Promise<ArticleResponseDto> {
    return this.articlesAdminService.closeArticle(id, user.email);
  }

  @Post(':id/activate')
  @ApiOperation({ summary: 'Activate article' })
  @ApiParam({ name: 'id', description: 'Article ID', type: Number })
  @ApiResponse({ status: 200, type: ArticleResponseDto })
  async activateArticle(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: User,
  ): Promise<ArticleResponseDto> {
    return this.articlesAdminService.activateArticle(id, user.email);
  }

  @Post(':id/duplicate')
  @ApiOperation({ summary: 'Duplicate article' })
  @ApiParam({ name: 'id', description: 'Article ID', type: Number })
  @ApiResponse({ status: 201, type: ArticleResponseDto })
  async duplicateArticle(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: User,
  ): Promise<ArticleResponseDto> {
    return this.articlesAdminService.duplicateArticle(id, user.email);
  }
}

