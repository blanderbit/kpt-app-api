import { Controller, Post, Body } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBody } from '@nestjs/swagger';
import { ProgramSelectionService } from './program-selection.service';
import { SelectProgramRequestDto, SelectProgramResponseDto } from './dto/select-program.dto';

@ApiTags('public/select-program')
@Controller('public/select-program')
export class ProgramSelectionController {
  constructor(private readonly programSelectionService: ProgramSelectionService) {}

  @Post()
  @ApiOperation({
    summary: 'Select program by quiz answers',
    description:
      'Accepts quiz question/answer pairs and returns the most suitable program. No authentication required. Uses ChatGPT to match answers to programs; falls back to default program if needed.',
  })
  @ApiBody({
    type: SelectProgramRequestDto,
    description: 'Quiz pairs (questionText, answerText). Example uses all 10 questions from our sample quiz.',
  })
  @ApiResponse({
    status: 201,
    description: 'Selected program',
    type: SelectProgramResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Validation error (e.g. empty quiz)' })
  async selectProgram(@Body() dto: SelectProgramRequestDto): Promise<SelectProgramResponseDto> {
    return this.programSelectionService.selectProgram(dto.quiz);
  }
}
