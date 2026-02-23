import { Module } from '@nestjs/common';
import { ProgramsModule } from '../core/programs/programs.module';
import { ChatGPTModule } from '../core/chatgpt/chatgpt.module';
import { ProgramSelectionController } from './program-selection.controller';
import { ProgramSelectionService } from './program-selection.service';

@Module({
  imports: [ProgramsModule, ChatGPTModule],
  controllers: [ProgramSelectionController],
  providers: [ProgramSelectionService],
  exports: [ProgramSelectionService],
})
export class ProgramSelectionModule {}
