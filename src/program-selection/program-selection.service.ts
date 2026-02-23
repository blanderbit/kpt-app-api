import { Injectable, Logger } from '@nestjs/common';
import { ProgramsService } from '../core/programs/programs.service';
import { ChatGPTService } from '../core/chatgpt/chatgpt.service';
import { SelectProgramResponseDto } from './dto/select-program.dto';

@Injectable()
export class ProgramSelectionService {
  private readonly logger = new Logger(ProgramSelectionService.name);

  constructor(
    private readonly programsService: ProgramsService,
    private readonly chatGPTService: ChatGPTService,
  ) {}

  async selectProgram(quiz: { questionText: string; answerText: string }[]): Promise<SelectProgramResponseDto> {
    const programs = this.programsService.getProgramsData().programs;
    const defaultProgram = this.programsService.getDefaultProgram();

    if (!programs.length) {
      this.logger.warn('No programs available');
      return {
        program: { id: 0 as number | string, name: defaultProgram?.name ?? 'General Wellness' },
      };
    }

    const programNames = programs.map((p) => p.name);
    const selectedName = await this.chatGPTService.selectProgram(quiz, programNames);

    const resolved =
      selectedName && programNames.includes(selectedName)
        ? programs.find((p) => p.name === selectedName)!
        : defaultProgram ?? programs[0];

    return {
      program: { id: resolved.id, name: resolved.name },
    };
  }
}
