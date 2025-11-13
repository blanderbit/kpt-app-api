import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SurveyAdminController } from './survey-admin.controller';
import { SurveyPublicController } from './survey-public.controller';
import { SurveyAdminService } from './survey-admin.service';
import { SurveyPublicService } from './survey-public.service';
import { Survey } from './entities/survey.entity';
import { UserSurvey } from './entities/user-survey.entity';
import { UserTemporarySurvey } from '../settings/entities/user-temporary-survey.entity';
import { SettingsModule } from '../settings/settings.module';
import { File } from '../../common/entities/file.entity';
import { FileUploadModule } from '../../core/file-upload';

@Module({
  imports: [
    TypeOrmModule.forFeature([Survey, UserSurvey, UserTemporarySurvey, File]),
    FileUploadModule,
    forwardRef(() => SettingsModule),
  ],
  controllers: [SurveyAdminController, SurveyPublicController],
  providers: [SurveyAdminService, SurveyPublicService],
  exports: [SurveyAdminService, SurveyPublicService],
})
export class SurveyModule {}

