import { Module } from '@nestjs/common';
import { ProgramsController } from './programs.controller';
import { ProgramsPublicController } from './programs.public.controller';
import { ProgramsAdminService } from './programs-admin.service';
import { ProgramsModule as CoreProgramsModule } from '../../core/programs';

@Module({
  imports: [CoreProgramsModule],
  controllers: [ProgramsController, ProgramsPublicController],
  providers: [ProgramsAdminService],
  exports: [ProgramsAdminService],
})
export class ProgramsModule {}
