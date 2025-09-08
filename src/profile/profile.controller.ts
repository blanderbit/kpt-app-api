import {
  Controller,
  Get,
  Put,
  Post,
  Delete,
  Body,
  Param,
  UseGuards,
  HttpCode,
  HttpStatus,
  Req,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiBody,
  ApiParam,
} from '@nestjs/swagger';
import { ProfileService } from './profile.service';
import {
  UpdateProfileDto,
  ChangeEmailDto,
  ChangePasswordDto,
  DeleteAccountDto,
  ProfileResponseDto,
} from './dto/profile.dto';
import { ConfirmEmailChangeDto } from './dto/confirm-email-change.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { BlacklistGuard } from '../auth/guards/blacklist.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { User } from '../users/entities/user.entity';

@ApiTags('profile')
@Controller('profile')
@UseGuards(JwtAuthGuard, BlacklistGuard)
@ApiBearerAuth()
export class ProfileController {
  constructor(private readonly profileService: ProfileService) {}

  @Get()
  @ApiOperation({
    summary: 'Get user profile',
    description: 'Returns the current profile of the authenticated user',
  })
  @ApiResponse({
    status: 200,
    description: 'User profile',
    type: ProfileResponseDto,
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized access',
  })
  @ApiResponse({
    status: 404,
    description: 'User not found',
  })
  async getProfile(@CurrentUser() user: User): Promise<ProfileResponseDto> {
    return this.profileService.getProfile(user.id);
  }

  @Put()
  @ApiOperation({
    summary: 'Update user profile',
    description: 'Updates profile information (first name, last name, avatar, theme)',
  })
  @ApiBody({ type: UpdateProfileDto })
  @ApiResponse({
    status: 200,
    description: 'Profile successfully updated',
    type: ProfileResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid data',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized access',
  })
  @ApiResponse({
    status: 404,
    description: 'User not found',
  })
  async updateProfile(
    @CurrentUser() user: User,
    @Body() updateProfileDto: UpdateProfileDto,
  ): Promise<ProfileResponseDto> {
    return this.profileService.updateProfile(user.id, updateProfileDto);
  }

  @Post('change-email')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Request email change',
    description: 'Sends a request to change email with confirmation to the new email',
  })
  @ApiBody({ type: ChangeEmailDto })
  @ApiResponse({
    status: 200,
    description: 'Email change request sent',
    schema: {
      type: 'object',
      properties: {
        message: {
          type: 'string',
          example: 'Check your new email for confirmation',
        },
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid data or email already exists',
  })
  @ApiResponse({
    status: 401,
    description: 'Invalid password',
  })
  @ApiResponse({
    status: 404,
    description: 'User not found',
  })
  async changeEmail(
    @CurrentUser() user: User,
    @Body() changeEmailDto: ChangeEmailDto,
  ): Promise<{ message: string }> {
    return this.profileService.changeEmail(user.id, changeEmailDto);
  }

  @Post('confirm-email-change')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Confirm email change',
    description: 'Confirms email change using verification code',
  })
  @ApiBody({ type: ConfirmEmailChangeDto })
  @ApiResponse({
    status: 200,
    description: 'Email successfully changed',
    schema: {
      type: 'object',
      properties: {
        message: {
          type: 'string',
          example: 'Email successfully changed',
        },
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid or expired verification code',
  })
  async confirmEmailChange(@Body() confirmEmailChangeDto: ConfirmEmailChangeDto): Promise<{ message: string }> {
    return this.profileService.confirmEmailChange(confirmEmailChangeDto.email, confirmEmailChangeDto.code);
  }

  @Post('change-password')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Change password',
    description: 'Changes user password',
  })
  @ApiBody({ type: ChangePasswordDto })
  @ApiResponse({
    status: 200,
    description: 'Password successfully changed',
    schema: {
      type: 'object',
      properties: {
        message: {
          type: 'string',
          example: 'Password successfully changed',
        },
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Account does not support password change',
  })
  @ApiResponse({
    status: 401,
    description: 'Invalid current password',
  })
  @ApiResponse({
    status: 404,
    description: 'User not found',
  })
  async changePassword(
    @CurrentUser() user: User,
    @Body() changePasswordDto: ChangePasswordDto,
  ): Promise<{ message: string }> {
    return this.profileService.changePassword(user.id, changePasswordDto);
  }

  @Delete('account')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Delete account',
    description: 'Deletes user account after confirmation',
  })
  @ApiBody({ type: DeleteAccountDto })
  @ApiResponse({
    status: 200,
    description: 'Account successfully deleted',
    schema: {
      type: 'object',
      properties: {
        message: {
          type: 'string',
          example: 'Account successfully deleted',
        },
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid data or missing confirmation',
  })
  @ApiResponse({
    status: 401,
    description: 'Invalid password',
  })
  @ApiResponse({
    status: 404,
    description: 'User not found',
  })
  async deleteAccount(
    @CurrentUser() user: User,
    @Body() deleteAccountDto: DeleteAccountDto,
    @Req() req: any,
  ): Promise<{ message: string }> {
    const accessToken = req.headers.authorization?.replace('Bearer ', '');
    return this.profileService.deleteAccount(user.id, deleteAccountDto, accessToken);
  }
}
