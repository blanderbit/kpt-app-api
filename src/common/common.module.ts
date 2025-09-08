import { Module, Global } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { GoogleDriveFilesService } from './services/google-drive-files.service';

@Global()
@Module({
  imports: [ConfigModule],
  providers: [GoogleDriveFilesService],
  exports: [GoogleDriveFilesService],
})
export class CommonModule {}
