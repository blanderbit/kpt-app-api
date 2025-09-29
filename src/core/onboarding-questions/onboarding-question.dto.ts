import { ApiProperty } from '@nestjs/swagger';

export class OnboardingAnswerDto {
  @ApiProperty({
    description: 'Unique identifier for the answer',
    example: 'more_energy',
  })
  id: string;

  @ApiProperty({
    description: 'Answer text',
    example: 'More energy',
  })
  text: string;

  @ApiProperty({
    description: 'Answer subtitle',
    example: 'Boost your daily vitality and feel more energized',
  })
  subtitle: string;

  @ApiProperty({
    description: 'SVG icon for the answer',
    example: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="#FFD700"><path d="M7 2v11h3v9l7-12h-4l4-8z"/></svg>',
  })
  icon: string;
}

export class OnboardingStepDto {
  @ApiProperty({
    description: 'Unique identifier for the step',
    example: 'improvement_goal',
  })
  stepName: string;

  @ApiProperty({
    description: 'Question for this step',
    example: 'What\'s the #1 thing you\'d love to improve with KPT?',
  })
  stepQuestion: string;

  @ApiProperty({
    description: 'Available answers for this step',
    type: [OnboardingAnswerDto],
  })
  answers: OnboardingAnswerDto[];

  @ApiProperty({
    description: 'Input type for this step',
    example: 'single',
    enum: ['single', 'multiple'],
  })
  inputType: string;

  @ApiProperty({
    description: 'Whether this step is required',
    example: true,
  })
  required: boolean;
}

export class OnboardingQuestionsDto {
  @ApiProperty({
    description: 'List of onboarding steps',
    type: [OnboardingStepDto],
  })
  onboardingSteps: OnboardingStepDto[];
}

export class OnboardingQuestionsStatsDto {
  @ApiProperty({
    description: 'Total number of onboarding steps',
    example: 6,
  })
  totalSteps: number;

  @ApiProperty({
    description: 'Total number of answers across all steps',
    example: 24,
  })
  totalAnswers: number;

  @ApiProperty({
    description: 'Average number of answers per step',
    example: 4,
  })
  averageAnswersPerStep: number;

  @ApiProperty({
    description: 'Number of required steps',
    example: 6,
  })
  requiredSteps: number;

  @ApiProperty({
    description: 'Number of optional steps',
    example: 0,
  })
  optionalSteps: number;
}
