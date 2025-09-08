import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, IsInt, Min, Max, Validate } from 'class-validator';

// Custom validator to check that satisfactionLevel + hardnessLevel = 100
export class TotalEqualsHundredConstraint {
  validate(value: any, args: any) {
    const { satisfactionLevel, hardnessLevel } = args.object;
    return satisfactionLevel + hardnessLevel === 100;
  }

  defaultMessage() {
    return 'Sum of satisfactionLevel and hardnessLevel must equal 100';
  }
}

export class CreateRateActivityDto {
  @ApiProperty({
    description: 'Activity ID',
    example: 1,
  })
  @IsNumber()
  activityId: number;

  @ApiProperty({
    description: 'Satisfaction level (0-100)',
    example: 70,
    minimum: 0,
    maximum: 100,
  })
  @IsInt()
  @Min(0)
  @Max(100)
  satisfactionLevel: number;

  @ApiProperty({
    description: 'Difficulty level (0-100)',
    example: 30,
    minimum: 0,
    maximum: 100,
  })
  @IsInt()
  @Min(0)
  @Max(100)
  hardnessLevel: number;
}

export class UpdateRateActivityDto {
  @ApiProperty({
    description: 'Satisfaction level (0-100)',
    example: 80,
    minimum: 0,
    maximum: 100,
    required: false,
  })
  @IsInt()
  @Min(0)
  @Max(100)
  satisfactionLevel?: number;

  @ApiProperty({
    description: 'Difficulty level (0-100)',
    example: 20,
    minimum: 0,
    maximum: 100,
    required: false,
  })
  @IsInt()
  @Min(0)
  @Max(100)
  hardnessLevel?: number;
}

export class RateActivityResponseDto {
  @ApiProperty({
    description: 'Unique rating identifier',
    example: 1,
  })
  id: number;

  @ApiProperty({
    description: 'Activity ID',
    example: 1,
  })
  activityId: number;

  @ApiProperty({
    description: 'Satisfaction level (0-100)',
    example: 70,
  })
  satisfactionLevel: number;

  @ApiProperty({
    description: 'Difficulty level (0-100)',
    example: 30,
  })
  hardnessLevel: number;

  @ApiProperty({
    description: 'Record creation date',
    example: '2024-01-01T00:00:00.000Z',
  })
  createdAt: Date;

  @ApiProperty({
    description: 'Rating sum (always 100)',
    example: 100,
  })
  get total(): number {
    return this.satisfactionLevel + this.hardnessLevel;
  }
}
