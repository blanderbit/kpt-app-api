import { BadRequestException, Body, Controller, Get, Post, Query } from '@nestjs/common';
import { ApiOperation, ApiQuery, ApiResponse, ApiTags } from '@nestjs/swagger';
import { ExternalSignupService } from './external-signup.service';
import { StartSignupRequestDto, StartSignupResponseDto } from './dto/start-signup.dto';
import { SignupResultResponseDto } from './dto/signup-result.dto';

@ApiTags('public/external')
@Controller('public/external')
export class ExternalSignupController {
  constructor(private readonly externalSignupService: ExternalSignupService) {}

  @Post('start-signup')
  @ApiOperation({ summary: 'Start external signup (quiz + email + program), get app_user_id for checkout' })
  @ApiResponse({ status: 201, description: 'Signup record created', type: StartSignupResponseDto })
  @ApiResponse({ status: 409, description: 'Email already registered or pending payment exists' })
  async startSignup(@Body() dto: StartSignupRequestDto): Promise<StartSignupResponseDto> {
    return this.externalSignupService.startSignup(dto);
  }

  @Get('signup-result')
  @ApiOperation({ summary: 'After payment: get registration link and auth tokens' })
  @ApiQuery({ name: 'app_user_id', required: true, description: 'From start-signup response' })
  @ApiResponse({ status: 200, description: 'Link and tokens', type: SignupResultResponseDto })
  @ApiResponse({ status: 404, description: 'Signup not found or payment not yet processed' })
  async signupResult(@Query('app_user_id') appUserId: string): Promise<SignupResultResponseDto> {
    if (!appUserId?.trim()) {
      throw new BadRequestException('app_user_id is required');
    }
    return this.externalSignupService.getSignupResult(appUserId.trim());
  }
}
