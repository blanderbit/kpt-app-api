import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Transactional } from 'typeorm-transactional';
import { PaginateQuery, paginate, Paginated } from 'nestjs-paginate';
import { Article, ArticleStatus } from './entities/article.entity';
import { File } from '../../common/entities/file.entity';
import {
  CreateArticleDto,
  UpdateArticleDto,
  ArticleResponseDto,
  ArticleStatisticsDto,
  UserArticlesAnalyticsDto,
} from './dto/article.dto';
import { AppException } from '../../common/exceptions/app.exception';
import { ErrorCode } from '../../common/error-codes';
import { articleConfig } from './articles.config';
import { UserTemporaryArticle } from '../settings/entities/user-temporary-article.entity';
import { UserHiddenArticle } from './entities/user-hidden-article.entity';
import { FileUploadService } from '../../core/file-upload';

@Injectable()
export class ArticlesAdminService {
  private readonly logger = new Logger(ArticlesAdminService.name);

  constructor(
    @InjectRepository(Article)
    private readonly articleRepository: Repository<Article>,
    @InjectRepository(File)
    private readonly fileRepository: Repository<File>,
    @InjectRepository(UserTemporaryArticle)
    private readonly userTemporaryArticleRepository: Repository<UserTemporaryArticle>,
    @InjectRepository(UserHiddenArticle)
    private readonly userHiddenArticleRepository: Repository<UserHiddenArticle>,
    private readonly fileUploadService: FileUploadService,
  ) {}

  /**
   * Create new article
   */
  @Transactional()
  async createArticle(
    createArticleDto: CreateArticleDto,
    files: Express.Multer.File[] | undefined,
    updatedBy: string,
  ): Promise<ArticleResponseDto> {
    try {
      const article = this.articleRepository.create({
        ...createArticleDto,
        status: ArticleStatus.AVAILABLE,
        updatedBy,
      });

      const savedArticle = await this.articleRepository.save(article);

      // If files provided, create file records
      if (files && files.length > 0) {
        const [file] = files;
        const articleFile = this.fileRepository.create({
          fileName: file.originalname,
          fileUrl: '',
          fileKey: '',
          mimeType: file.mimetype,
          size: file.size,
          entityType: 'article',
          entityId: savedArticle.id,
          articleId: savedArticle.id,
        });

        const savedFile = await this.fileRepository.save(articleFile);
        savedArticle.files = [savedFile];
      }

      this.logger.log(`Article created with ID: ${savedArticle.id}`);
      const reloaded = await this.articleRepository.findOne({
        where: { id: savedArticle.id },
        relations: ['files'],
      });

      return this.mapToResponseDto(reloaded ?? savedArticle);
    } catch (error) {
      this.logger.error('Failed to create article:', error);
      throw AppException.internal(ErrorCode.ADMIN_INTERNAL_SERVER_ERROR, undefined, {
        error: error.message,
        operation: 'createArticle',
      });
    }
  }

  /**
   * Get articles with pagination
   */
  async getArticlesPaginated(query: PaginateQuery): Promise<Paginated<Article>> {
    return paginate(query, this.articleRepository, articleConfig);
  }

  /**
   * Get article by ID
   */
  async getArticleById(id: number): Promise<ArticleResponseDto> {
    try {
      const article = await this.articleRepository.findOne({
        where: { id },
        relations: ['files'],
      });

      if (!article) {
        throw AppException.notFound(ErrorCode.ADMIN_INTERNAL_SERVER_ERROR, 'Article not found');
      }

      return this.mapToResponseDto(article);
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
   * Update article
   */
  @Transactional()
  async updateArticle(
    id: number,
    updateArticleDto: UpdateArticleDto,
    files: Express.Multer.File[] | undefined,
    updatedBy: string,
  ): Promise<ArticleResponseDto> {
    try {
      const article = await this.articleRepository.findOne({
        where: { id },
        relations: ['files'],
      });

      if (!article) {
        throw AppException.notFound(ErrorCode.ADMIN_INTERNAL_SERVER_ERROR, 'Article not found');
      }

      if (article.status !== ArticleStatus.AVAILABLE) {
        throw AppException.validation(
          ErrorCode.ADMIN_INTERNAL_SERVER_ERROR,
          'Only available articles can be updated'
        );
      }

      const { removeFileId, ...articlePayload } = updateArticleDto;

      if (removeFileId) {
        const fileToRemove = article.files?.find((file) => file.id === removeFileId);

        if (fileToRemove) {
          await this.removeArticleFile(fileToRemove);
          article.files = (article.files ?? []).filter((file) => file.id !== removeFileId);
        } else {
          this.logger.warn(`Article ${id}: requested to remove missing file ${removeFileId}`);
        }
      }

      Object.assign(article, articlePayload, { updatedBy });
      const updatedArticle = await this.articleRepository.save(article);

      if (files && files.length > 0) {
        const [file] = files;
        const articleFile = this.fileRepository.create({
          fileName: file.originalname,
          fileUrl: '',
          fileKey: '',
          mimeType: file.mimetype,
          size: file.size,
          entityType: 'article',
          entityId: updatedArticle.id,
          articleId: updatedArticle.id,
        });

        const savedFile = await this.fileRepository.save(articleFile);
        updatedArticle.files = [...(updatedArticle.files ?? []), savedFile];
      }

      this.logger.log(`Article updated with ID: ${updatedArticle.id}`);

      const reloaded = await this.articleRepository.findOne({
        where: { id: updatedArticle.id },
        relations: ['files'],
      });

      return this.mapToResponseDto(reloaded ?? updatedArticle);
    } catch (error) {
      if (error instanceof AppException) {
        throw error;
      }

      this.logger.error('Failed to update article:', error);
      throw AppException.internal(ErrorCode.ADMIN_INTERNAL_SERVER_ERROR, undefined, {
        error: error.message,
        operation: 'updateArticle',
        articleId: id,
      });
    }
  }

  /**
   * Delete article
   */
  @Transactional()
  async deleteArticle(
    id: number,
    deletedBy: string,
  ): Promise<{ success: boolean; message: string }> {
    try {
      const article = await this.articleRepository.findOne({
        where: { id },
        relations: ['files'],
      });

      if (!article) {
        throw AppException.notFound(ErrorCode.ADMIN_INTERNAL_SERVER_ERROR, 'Article not found');
      }

      if (article.status === ArticleStatus.ACTIVE) {
        throw AppException.validation(
          ErrorCode.ADMIN_INTERNAL_SERVER_ERROR,
          'Active articles cannot be deleted. Close the article first.'
        );
      }

      if (article.files && article.files.length > 0) {
        for (const file of article.files) {
          await this.removeArticleFile(file);
        }
      }

      await this.articleRepository.remove(article);

      this.logger.log(`Article deleted with ID: ${id}`);
      return { success: true, message: 'Article deleted successfully' };
    } catch (error) {
      if (error instanceof AppException) {
        throw error;
      }

      this.logger.error('Failed to delete article:', error);
      throw AppException.internal(ErrorCode.ADMIN_INTERNAL_SERVER_ERROR, undefined, {
        error: error.message,
        operation: 'deleteArticle',
        articleId: id,
      });
    }
  }

  /**
   * Update file URLs after upload
   */
  async updateFileUrls(file: { id: number }, url: string, key: string): Promise<void> {
    try {
      const fileRecord = await this.fileRepository.findOne({ where: { id: file.id } });
      if (fileRecord) {
        fileRecord.fileUrl = url;
        fileRecord.fileKey = key;
        await this.fileRepository.save(fileRecord);
      }
    } catch (error) {
      this.logger.error(`Failed to update file URLs for file ID: ${file.id}`, error);
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

  private async removeArticleFile(file: File): Promise<void> {
    try {
      if (file.fileKey) {
        await this.fileUploadService.deleteFile(file.fileKey);
      }
    } catch (error) {
      this.logger.warn(
        `Failed to delete article file from storage (id=${file.id}, key=${file.fileKey}): ${error instanceof Error ? error.message : String(error)}`,
      );
    }

    await this.fileRepository.delete(file.id);
  }

  async getArticleStatistics(articleId: number): Promise<ArticleStatisticsDto> {
    try {
      const now = new Date();

      const [assignedUsers, hiddenUsers] = await Promise.all([
        this.userTemporaryArticleRepository
          .createQueryBuilder('assignment')
          .where('assignment.articleId = :articleId', { articleId })
          .andWhere('(assignment.expiresAt IS NULL OR assignment.expiresAt > :now)', { now })
          .getCount(),
        this.userHiddenArticleRepository
          .createQueryBuilder('hidden')
          .where('hidden.articleId = :articleId', { articleId })
          .getCount(),
      ]);

      return {
        assignedUsers,
        hiddenUsers,
      };
    } catch (error) {
      this.logger.error('Failed to get article statistics:', error);
      throw AppException.internal(ErrorCode.ADMIN_INTERNAL_SERVER_ERROR, undefined, {
        error: error.message,
        operation: 'getArticleStatistics',
        articleId,
      });
    }
  }

  async getUserArticlesAnalytics(userId: number): Promise<UserArticlesAnalyticsDto> {
    try {
      const now = new Date();

      const [assignedArticles, hiddenArticles] = await Promise.all([
        this.userTemporaryArticleRepository
          .createQueryBuilder('assignment')
          .innerJoin(Article, 'article', 'article.id = assignment.articleId')
          .where('assignment.userId = :userId', { userId })
          .andWhere('(assignment.expiresAt IS NULL OR assignment.expiresAt > :now)', { now })
          .andWhere('article.status = :status', { status: ArticleStatus.ACTIVE })
          .getCount(),
        this.userHiddenArticleRepository
          .createQueryBuilder('hidden')
          .where('hidden.userId = :userId', { userId })
          .getCount(),
      ]);

      return {
        assignedArticles,
        hiddenArticles,
      };
    } catch (error) {
      this.logger.error('Failed to get user articles analytics:', error);
      throw AppException.internal(ErrorCode.ADMIN_INTERNAL_SERVER_ERROR, undefined, {
        error: error.message,
        operation: 'getUserArticlesAnalytics',
        userId,
      });
    }
  }

  @Transactional()
  async closeArticle(id: number, archivedBy: string): Promise<ArticleResponseDto> {
    try {
      const article = await this.articleRepository.findOne({ where: { id } });

      if (!article) {
        throw AppException.notFound(ErrorCode.ADMIN_INTERNAL_SERVER_ERROR, 'Article not found');
      }

      if (article.status === ArticleStatus.ARCHIVED) {
        return this.mapToResponseDto(article);
      }

      if (article.status !== ArticleStatus.ACTIVE) {
        throw AppException.validation(
          ErrorCode.ADMIN_INTERNAL_SERVER_ERROR,
          'Only active articles can be archived'
        );
      }

      article.status = ArticleStatus.ARCHIVED;
      article.archivedAt = new Date();
      article.archivedBy = archivedBy;
      article.updatedBy = archivedBy ?? article.updatedBy;

      const updated = await this.articleRepository.save(article);
      return this.mapToResponseDto(updated);
    } catch (error) {
      if (error instanceof AppException) {
        throw error;
      }

      this.logger.error('Failed to archive article:', error);
      throw AppException.internal(ErrorCode.ADMIN_INTERNAL_SERVER_ERROR, undefined, {
        error: error.message,
        operation: 'closeArticle',
        articleId: id,
      });
    }
  }

  @Transactional()
  async activateArticle(id: number, activatedBy: string): Promise<ArticleResponseDto> {
    try {
      const article = await this.articleRepository.findOne({ where: { id } });

      if (!article) {
        throw AppException.notFound(ErrorCode.ADMIN_INTERNAL_SERVER_ERROR, 'Article not found');
      }

      if (article.status === ArticleStatus.ACTIVE) {
        return this.mapToResponseDto(article);
      }

      article.status = ArticleStatus.ACTIVE;
      article.archivedAt = null;
      article.archivedBy = null;
      article.updatedBy = activatedBy ?? article.updatedBy;

      const updated = await this.articleRepository.save(article);
      return this.mapToResponseDto(updated);
    } catch (error) {
      if (error instanceof AppException) {
        throw error;
      }

      this.logger.error('Failed to activate article:', error);
      throw AppException.internal(ErrorCode.ADMIN_INTERNAL_SERVER_ERROR, undefined, {
        error: error.message,
        operation: 'activateArticle',
        articleId: id,
      });
    }
  }

  @Transactional()
  async duplicateArticle(id: number, createdBy: string): Promise<ArticleResponseDto> {
    try {
      const article = await this.articleRepository.findOne({ where: { id }, relations: ['files'] });

      if (!article) {
        throw AppException.notFound(ErrorCode.ADMIN_INTERNAL_SERVER_ERROR, 'Article not found');
      }

      const duplicatedArticle = this.articleRepository.create({
        title: `${article.title} (Copy)`,
        text: article.text,
        status: ArticleStatus.AVAILABLE,
        updatedBy: createdBy,
      });

      const saved = await this.articleRepository.save(duplicatedArticle);
      return this.mapToResponseDto(saved);
    } catch (error) {
      if (error instanceof AppException) {
        throw error;
      }

      this.logger.error('Failed to duplicate article:', error);
      throw AppException.internal(ErrorCode.ADMIN_INTERNAL_SERVER_ERROR, undefined, {
        error: error.message,
        operation: 'duplicateArticle',
        articleId: id,
      });
    }
  }
}

