import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ArticlesAdminController } from './articles-admin.controller';
import { ArticlesPublicController } from './articles-public.controller';
import { ArticlesAdminService } from './articles-admin.service';
import { ArticlesPublicService } from './articles-public.service';
import { Article } from './entities/article.entity';
import { UserHiddenArticle } from './entities/user-hidden-article.entity';
import { UserTemporaryArticle } from '../settings/entities/user-temporary-article.entity';
import { File } from '../../common/entities/file.entity';
import { FileUploadModule } from '../../core/file-upload';
import { SettingsModule } from '../settings/settings.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Article, UserHiddenArticle, UserTemporaryArticle, File]),
    FileUploadModule,
    forwardRef(() => SettingsModule),
  ],
  controllers: [ArticlesAdminController, ArticlesPublicController],
  providers: [ArticlesAdminService, ArticlesPublicService],
  exports: [ArticlesAdminService, ArticlesPublicService],
})
export class ArticlesModule {}

