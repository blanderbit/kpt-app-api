import {
  Controller,
  Post,
  Get,
  Body,
  UseGuards,
  Req,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { AdminService } from './admin.service';
import {
  AdminLoginDto,
  AdminLoginResponseDto,
  AdminUsersStatsResponseDto,
  AdminAdminsStatsResponseDto,
  AdminProfileResponseDto,
} from './dto/admin.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { Paginate, PaginateQuery, Paginated } from 'nestjs-paginate';
import { User } from '../users/entities/user.entity';
import { Request } from 'express';
import { ADMIN_USERS_PAGINATION_CONFIG } from './admin.config';
import { PaginatedSwaggerDocs } from 'nestjs-paginate';

type AuthenticatedRequest = Request & { user: User };

@ApiTags('admin')
@Controller('admin')
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Post('login')
  @ApiOperation({
    summary: 'Admin panel login',
    description: 'Administrator authentication by email and password',
  })
  @ApiResponse({
    status: 200,
    description: 'Successful admin panel login',
    type: AdminLoginResponseDto,
  })
  @ApiResponse({
    status: 401,
    description: 'Invalid credentials',
  })
  @ApiResponse({
    status: 403,
    description: 'Insufficient permissions for admin panel access',
  })
  async adminLogin(@Body() adminLoginDto: AdminLoginDto): Promise<AdminLoginResponseDto> {
    return this.adminService.adminLogin(adminLoginDto);
  }

  @Get('me')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Get authenticated administrator profile',
    description: 'Returns information about the currently authenticated administrator',
  })
  @ApiResponse({
    status: 200,
    description: 'Authenticated administrator profile',
    type: AdminProfileResponseDto,
  })
  async getAuthenticatedAdmin(@Req() req: AuthenticatedRequest): Promise<AdminProfileResponseDto> {
    return this.adminService.getAdminProfile(req.user.id);
  }

  @Get('users')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @ApiBearerAuth()
  @PaginatedSwaggerDocs(User, ADMIN_USERS_PAGINATION_CONFIG)
  @ApiOperation({
    summary: 'Get users list',
    description: 'Returns a list of all users with pagination, filtering and search (administrators only)',
  })
  @ApiResponse({
    status: 200,
    description: 'Users list with pagination',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized access',
  })
  @ApiResponse({
    status: 403,
    description: 'Insufficient permissions',
  })
  async getUsers(
    @Paginate() query: PaginateQuery,
  ): Promise<Paginated<User>> {
    return this.adminService.getUsers(query);
  }

  @Get('stats/users')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Get user statistics',
    description: 'Returns aggregated statistics for regular users (administrators only)',
  })
  @ApiResponse({
    status: 200,
    description: 'User statistics',
    type: AdminUsersStatsResponseDto,
  })
  async getUserStats(): Promise<AdminUsersStatsResponseDto> {
    return this.adminService.getUserStats();
  }

  @Get('stats/admins')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Get administrator statistics',
    description: 'Returns aggregated statistics for administrator users (administrators only)',
  })
  @ApiResponse({
    status: 200,
    description: 'Administrator statistics',
    type: AdminAdminsStatsResponseDto,
  })
  async getAdminStats(): Promise<AdminAdminsStatsResponseDto> {
    return this.adminService.getAdminStats();
  }
}
