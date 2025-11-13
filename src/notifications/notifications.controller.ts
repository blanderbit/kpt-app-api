import { Body, Controller, Delete, HttpCode, HttpStatus, Param, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { NotificationsService } from './notifications.service';
import { RegisterDeviceTokenDto } from './dto/register-device-token.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { User } from '../users/entities/user.entity';

@ApiTags('Notifications')
@Controller('notifications')
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Post('devices')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Register or update Firebase device token',
    description: 'Registers Firebase device token for push notifications',
  })
  @ApiResponse({
    status: 200,
    description: 'Device token registered successfully',
  })
  async registerDevice(
    @CurrentUser() user: User,
    @Body() dto: RegisterDeviceTokenDto,
  ) {
    const device = await this.notificationsService.registerDevice(user.id, dto);
    return {
      success: true,
      device,
    };
  }

  @Delete('devices/:token')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Remove Firebase device token',
  })
  @ApiResponse({
    status: 204,
    description: 'Device token removed',
  })
  @HttpCode(HttpStatus.NO_CONTENT)
  async removeDevice(
    @CurrentUser() user: User,
    @Param('token') token: string,
  ): Promise<void> {
    await this.notificationsService.removeDevice(user.id, token);
  }
}


