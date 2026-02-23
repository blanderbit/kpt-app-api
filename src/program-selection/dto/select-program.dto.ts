import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsString, IsNotEmpty, ValidateNested, ArrayMinSize } from 'class-validator';
import { Type } from 'class-transformer';

export class QuizPairDto {
  @ApiProperty({ description: 'Question text', example: 'What would you most like to improve right now?' })
  @IsString()
  @IsNotEmpty()
  questionText: string;

  @ApiProperty({ description: 'Selected answer text', example: 'My stress and anxiety levels' })
  @IsString()
  @IsNotEmpty()
  answerText: string;
}

export class SelectProgramRequestDto {
  @ApiProperty({
    description: 'List of question/answer pairs from the quiz',
    type: [QuizPairDto],
    example: [
      { questionText: 'What would you most like to improve right now?', answerText: 'My energy and focus' },
      { questionText: 'How would you describe your current sleep?', answerText: 'I sleep well and wake rested' },
      { questionText: 'When do you feel most stressed?', answerText: 'At work or with deadlines' },
      { questionText: 'How is your relationship with food and nutrition?', answerText: 'I eat a balanced diet most of the time' },
      { questionText: 'Which habit would you most like to change?', answerText: 'Screen time or procrastination' },
      { questionText: 'How do you usually handle difficult emotions?', answerText: 'I talk to someone or write it down' },
      { questionText: 'Do you practice mindfulness or meditation?', answerText: 'Yes, regularly' },
      { questionText: 'How would you rate your work–life balance?', answerText: 'Good; I have clear boundaries' },
      { questionText: 'What matters most to you in your relationships?', answerText: 'Honest communication' },
      { questionText: 'How do you feel about your self-confidence?', answerText: 'Generally confident' },
    ],
  })
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => QuizPairDto)
  quiz: QuizPairDto[];
}

export class ProgramRefDto {
  @ApiProperty({ description: 'Program id (number or string)', example: 1 })
  id: number | string;
  @ApiProperty({ description: 'Program name', example: 'Stress and Anxiety Management' })
  name: string;
}

export class SelectProgramResponseDto {
  @ApiProperty({
    description: 'Selected program (id + name)',
    type: ProgramRefDto,
    example: { id: 1, name: 'Stress and Anxiety Management' },
  })
  program: ProgramRefDto;
}
