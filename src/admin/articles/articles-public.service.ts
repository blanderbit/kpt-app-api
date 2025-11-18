import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Transactional } from 'typeorm-transactional';
import { Article, ArticleStatus } from './entities/article.entity';
import { UserHiddenArticle } from './entities/user-hidden-article.entity';
import { UserTemporaryArticle } from '../settings/entities/user-temporary-article.entity';
import { ArticleResponseDto } from './dto/article.dto';
import { AppException } from '../../common/exceptions/app.exception';
import { ErrorCode } from '../../common/error-codes';
import { PaginateQuery, paginate, Paginated } from 'nestjs-paginate';
import { articleConfig } from './articles.config';

@Injectable()
export class ArticlesPublicService {
  private readonly logger = new Logger(ArticlesPublicService.name);

  constructor(
    @InjectRepository(Article)
    private readonly articleRepository: Repository<Article>,
    @InjectRepository(UserHiddenArticle)
    private readonly userHiddenArticleRepository: Repository<UserHiddenArticle>,
    @InjectRepository(UserTemporaryArticle)
    private readonly userTemporaryArticleRepository: Repository<UserTemporaryArticle>,
  ) {}

  /**
   * Get article by ID (public, only non-archived)
   */
  async getArticleById(id: number, userId?: number): Promise<ArticleResponseDto> {
    try {
      const article = await this.articleRepository.findOne({
        where: { id, status: ArticleStatus.ACTIVE },
        relations: ['files'],
      });

      if (!article) {
        throw AppException.notFound(ErrorCode.ADMIN_INTERNAL_SERVER_ERROR, 'Article not found or archived');
      }

      const response = this.mapToResponseDto(article);

      // Check if article is hidden for user
      if (userId) {
        const hiddenArticle = await this.userHiddenArticleRepository.findOne({
          where: { userId, articleId: id },
        });
        response.isHidden = !!hiddenArticle;
      }

      return response;
    } catch (error) {
      if (error instanceof AppException) {
        throw error;
      }

      this.logger.error('Failed to get article by ID:', error);
      throw AppException.internal(ErrorCode.ADMIN_INTERNAL_SERVER_ERROR, undefined, {
        error: error.message,
        operation: 'getArticleById',
        articleId: id,
      });
    }
  }

  /**
   * Get random article
   */
  async getRandomArticle(userId?: number): Promise<ArticleResponseDto[]> {
    try {
      const temporaryArticles = await this.userTemporaryArticleRepository
        .createQueryBuilder('userTemporaryArticle')
        .leftJoinAndSelect('userTemporaryArticle.article', 'article')
        .leftJoinAndSelect('article.files', 'files')
        .where('userTemporaryArticle.user_id = :userId', { userId })
        // .andWhere('article.status = :status', { status: ArticleStatus.ACTIVE })
        // .andWhere(
        //   '(userTemporaryArticle.expiresAt IS NULL OR userTemporaryArticle.expiresAt > :now)',
        //   { now: new Date() },
        // )
        // .andWhere(
        //   'NOT EXISTS (SELECT 1 FROM user_hidden_articles WHERE user_hidden_articles.article_id = article.id AND user_hidden_articles.user_id = :userId)',
        //   { userId },
        // )
        .orderBy('RAND()')
        .getMany();

      return temporaryArticles.map(ta => this.mapToResponseDto(ta.article));
    } catch (error) {
      this.logger.error('Failed to get random article:', error);
      throw AppException.internal(ErrorCode.ADMIN_INTERNAL_SERVER_ERROR, undefined, {
        error: error.message,
        operation: 'getRandomArticle',
      });
    }
  }

  /**
   * Get paginated list of articles (excluding hidden ones for user)
   */
  async getArticlesPaginated(query: PaginateQuery, userId?: number): Promise<Paginated<Article>> {
    try {
      // Get paginated articles
      const result = await paginate(query, this.articleRepository, {
        ...articleConfig,
        where: { status: ArticleStatus.ACTIVE },
      });

      // If user is logged in, filter out hidden articles
      if (userId) {
        const hiddenArticles = await this.userHiddenArticleRepository.find({
          where: { userId },
        });

        const hiddenIds = new Set(hiddenArticles.map(h => h.articleId));
        result.data = result.data.filter(article => !hiddenIds.has(article.id));

        // Update pagination metadata
        result.meta.totalItems = result.data.length;
        result.meta.totalPages = Math.ceil(result.meta.totalItems / result.meta.itemsPerPage);
      }

      return result;
    } catch (error) {
      this.logger.error('Failed to get paginated articles:', error);
      throw AppException.internal(ErrorCode.ADMIN_INTERNAL_SERVER_ERROR, undefined, {
        error: error.message,
        operation: 'getArticlesPaginated',
      });
    }
  }

  /**
   * Hide article for user
   */
  @Transactional()
  async hideArticle(
    articleId: number,
    userId: number,
  ): Promise<{ success: boolean; message: string }> {
    try {
      // Check if article exists and is not archived
      const article = await this.articleRepository.findOne({
        where: { id: articleId, status: ArticleStatus.ACTIVE },
      });

      if (!article) {
        throw AppException.notFound(ErrorCode.ADMIN_INTERNAL_SERVER_ERROR, 'Article not found or archived');
      }

      // Check if already hidden
      const existing = await this.userHiddenArticleRepository.findOne({
        where: { userId, articleId },
      });

      if (existing) {
        return { success: true, message: 'Article already hidden' };
      }

      // Create hidden article record
      const hiddenArticle = this.userHiddenArticleRepository.create({
        userId,
        articleId,
      });

      await this.userHiddenArticleRepository.save(hiddenArticle);

      this.logger.log(`Article ${articleId} hidden for user ${userId}`);
      return { success: true, message: 'Article hidden successfully' };
    } catch (error) {
      if (error instanceof AppException) {
        throw error;
      }

      this.logger.error('Failed to hide article:', error);
      throw AppException.internal(ErrorCode.ADMIN_INTERNAL_SERVER_ERROR, undefined, {
        error: error.message,
        operation: 'hideArticle',
        articleId,
        userId,
      });
    }
  }

  /**
   * Map entity to response DTO
   */
  private mapToResponseDto(article: Article): ArticleResponseDto {
    return {
      id: article.id,
      title: article.title,
      text: article.text,
      status: article.status,
      files: article.files?.map(file => ({
        id: file.id,
        fileUrl: file.fileUrl,
        fileKey: file.fileKey,
        fileName: file.fileName,
        mimeType: file.mimeType,
        size: file.size,
      })) || [],
      updatedBy: article.updatedBy,
      createdAt: article.createdAt,
      updatedAt: article.updatedAt,
      archivedAt: article.archivedAt ?? null,
      archivedBy: article.archivedBy ?? null,
    };
  }
}

