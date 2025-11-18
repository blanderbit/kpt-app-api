import {
  Controller,
  Get,
  Post,
  Param,
  Query,
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
} from '@nestjs/swagger';
import { Paginate, PaginateQuery, Paginated } from 'nestjs-paginate';
import { ArticlesPublicService } from './articles-public.service';
import { SettingsService } from '../settings/settings.service';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { User } from '../../users/entities/user.entity';
import { ArticleResponseDto } from './dto/article.dto';
import { Article } from './entities/article.entity';
import { articleConfig } from './articles.config';

@ApiTags('articles')
@Controller('articles')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class ArticlesPublicController {
  constructor(
    private readonly articlesPublicService: ArticlesPublicService,
    private readonly settingsService: SettingsService,
  ) {}

  @Get('random')
  @ApiOperation({
    summary: 'Get random article',
    description: 'Returns random active articles from temporary articles that user has not hidden',
  })
  @ApiResponse({
    status: 200,
    description: 'Random articles',
    type: [ArticleResponseDto],
  })
  @ApiResponse({
    status: 404,
    description: 'No articles available',
  })
  async getRandomArticle(
    @CurrentUser() user?: User,
  ): Promise<ArticleResponseDto[]> {
    return this.articlesPublicService.getRandomArticle(user?.id);
  }

  @Get()
  @ApiOperation({
    summary: 'Get paginated list of articles',
    description: 'Returns a paginated list of all active articles (excluding hidden ones)',
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
  @ApiResponse({
    status: 200,
    description: 'Paginated list of articles',
  })
  async getAllArticles(
    @Paginate() query: PaginateQuery,
    @CurrentUser() user?: User,
  ): Promise<Paginated<Article>> {
    return this.articlesPublicService.getArticlesPaginated(query, user?.id);
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Get article by ID',
    description: 'Returns article details by ID (only active articles)',
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
  @ApiResponse({
    status: 404,
    description: 'Article not found or archived',
  })
  async getArticleById(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user?: User,
  ): Promise<ArticleResponseDto> {
    return this.articlesPublicService.getArticleById(id, user?.id);
  }

  @Post(':id/hide')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Hide article for current user',
    description: 'Hides an article for the current user',
  })
  @ApiParam({
    name: 'id',
    description: 'Article ID',
    type: Number,
  })
  @ApiResponse({
    status: 200,
    description: 'Article hidden successfully',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean' },
        message: { type: 'string' },
      },
    },
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized access',
  })
  @ApiResponse({
    status: 404,
    description: 'Article not found or archived',
  })
  async hideArticle(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: User,
  ): Promise<{ success: boolean; message: string }> {
    return this.articlesPublicService.hideArticle(id, user.id);
  }

  @Get('temporary')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Get temporary articles for current user',
    description: 'Returns temporary articles assigned to the current user',
  })
  @ApiResponse({
    status: 200,
    description: 'List of temporary articles',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized access',
  })
  async getTemporaryArticles(@CurrentUser() user: User) {
    const temporaryArticles = await this.settingsService.getUserTemporaryArticles(user.id);
    return temporaryArticles.map(ta => ({
      id: ta.id,
      article: ta.article,
      expiresAt: ta.expiresAt,
      createdAt: ta.createdAt,
    }));
  }
}

