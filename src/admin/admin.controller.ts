import {
  Controller,
  Post,
  Get,
  Body,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { AdminService } from './admin.service';
import { AdminLoginDto, AdminLoginResponseDto } from './dto/admin.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { Paginate, PaginateQuery, Paginated } from 'nestjs-paginate';
import { User } from '../users/entities/user.entity';
import { ADMIN_USERS_PAGINATION_CONFIG } from './admin.config';
import { PaginatedSwaggerDocs } from 'nestjs-paginate';

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

  @Get('stats')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Get statistics',
    description: 'Returns general user statistics (administrators only)',
  })
  @ApiResponse({
    status: 200,
    description: 'User statistics',
    schema: {
      type: 'object',
      properties: {
        totalUsers: { type: 'number' },
        totalAdmins: { type: 'number' },
        verifiedUsers: { type: 'number' },
        unverifiedUsers: { type: 'number' },
        usersThisMonth: { type: 'number' },
        usersLastMonth: { type: 'number' },
      },
    },
  })
  async getStats() {
    return this.adminService.getStats();
  }
}
