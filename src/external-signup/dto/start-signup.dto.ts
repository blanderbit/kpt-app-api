import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsEmail, IsInt, IsOptional, IsString, Min, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

export class QuizPairDto {
  @ApiProperty({ example: 'What would you most like to improve?' })
  @IsString()
  questionText: string;

  @ApiProperty({ example: 'My stress levels' })
  @IsString()
  answerText: string;
}

export class StartSignupRequestDto {
  @ApiProperty({ type: [QuizPairDto], description: 'Quiz question/answer pairs' })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => QuizPairDto)
  quiz: QuizPairDto[];

  @ApiProperty({ example: 'user@example.com' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: 1, description: 'Program id from select-program' })
  @IsInt()
  @Min(1)
  programId: number;

  @ApiProperty({ example: 'Stress and Anxiety Management', required: false })
  @IsOptional()
  @IsString()
  programName?: string;
}

export class StartSignupResponseDto {
  @ApiProperty({ description: 'Identifier to pass to checkout and signup-result' })
  appUserId: string;

  @ApiProperty({ description: 'Checkout URL (if backend creates via Paddle API)', required: false })
  checkoutUrl?: string;
}
