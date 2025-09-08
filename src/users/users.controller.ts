import {
  Controller,
  Get,
  Put,
  Delete,
  Body,
  Param,
  UseGuards,
  ParseIntPipe,
  Query,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';
import { UsersService } from './users.service';
import { User } from './entities/user.entity';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { Paginate, PaginateQuery, Paginated } from 'nestjs-paginate';
import { ApiPaginationQuery } from 'nestjs-paginate';
import { usersConfig } from './users.config';

@ApiTags('users')
@Controller('users')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('profile')
  @ApiOperation({
    summary: 'Get current user profile',
    description: 'Returns the profile of the authenticated user',
  })
  @ApiResponse({
    status: 200,
    description: 'User profile',
    type: User,
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized access',
  })
  async getCurrentUserProfile(@Body('userId') userId: number): Promise<User> {
    return this.usersService.findById(userId);
  }

  @Get()
  @Roles('admin')
  @ApiPaginationQuery(usersConfig)
  @ApiOperation({
    summary: 'Get all users with pagination',
    description: 'Returns paginated list of all users (admin only)',
  })
  @ApiQuery({
    name: 'page',
    description: 'Page number',
    type: 'number',
    required: false,
    example: 1,
  })
  @ApiQuery({
    name: 'limit',
    description: 'Items per page',
    type: 'number',
    required: false,
    example: 20,
  })
  @ApiQuery({
    name: 'sortBy',
    description: 'Sort by field',
    type: 'string',
    required: false,
    example: 'createdAt:DESC',
  })
  @ApiQuery({
    name: 'filter.email',
    description: 'Filter by email',
    type: 'string',
    required: false,
    example: 'john@example.com',
  })
  @ApiQuery({
    name: 'filter.isActive',
    description: 'Filter by active status',
    type: 'boolean',
    required: false,
    example: true,
  })
  @ApiQuery({
    name: 'search',
    description: 'Search in email, firstName, lastName',
    type: 'string',
    required: false,
    example: 'john',
  })
  @ApiResponse({
    status: 200,
    description: 'Users list with pagination',
    type: User,
    isArray: true
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized access',
  })
  @ApiResponse({
    status: 403,
    description: 'Insufficient permissions',
  })
  async getAllUsers(@Paginate() query: PaginateQuery): Promise<Paginated<User>> {
    return this.usersService.findUsers(query);
  }

  @Get('admins')
  @Roles('admin')
  @ApiPaginationQuery(usersConfig)
  @ApiOperation({
    summary: 'Get all administrators with pagination',
    description: 'Returns paginated list of all administrators (admin only)',
  })
  @ApiQuery({
    name: 'page',
    description: 'Page number',
    type: 'number',
    required: false,
    example: 1,
  })
  @ApiQuery({
    name: 'limit',
    description: 'Items per page',
    type: 'number',
    required: false,
    example: 20,
  })
  @ApiQuery({
    name: 'sortBy',
    description: 'Sort by field',
    type: 'string',
    required: false,
    example: 'createdAt:DESC',
  })
  @ApiResponse({
    status: 200,
    description: 'Administrators list with pagination',
    type: User,
    isArray: true
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized access',
  })
  @ApiResponse({
    status: 403,
    description: 'Insufficient permissions',
  })
  async getAllAdmins(@Paginate() query: PaginateQuery): Promise<Paginated<User>> {
    return this.usersService.findAdmins(query);
  }

  @Get(':id')
  @Roles('admin')
  @ApiOperation({
    summary: 'Get user by ID',
    description: 'Returns user by ID (admin only)',
  })
  @ApiParam({
    name: 'id',
    description: 'User ID',
    type: 'number',
    example: 1,
  })
  @ApiResponse({
    status: 200,
    description: 'User found',
    type: User,
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized access',
  })
  @ApiResponse({
    status: 403,
    description: 'Insufficient permissions',
  })
  @ApiResponse({
    status: 404,
    description: 'User not found',
  })
  async getUserById(@Param('id', ParseIntPipe) id: number): Promise<User> {
    return this.usersService.findById(id);
  }

  @Put(':id')
  @Roles('admin')
  @ApiOperation({
    summary: 'Update user',
    description: 'Updates user information (admin only)',
  })
  @ApiParam({
    name: 'id',
    description: 'User ID',
    type: 'number',
    example: 1,
  })
  @ApiResponse({
    status: 200,
    description: 'User successfully updated',
    type: User,
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized access',
  })
  @ApiResponse({
    status: 403,
    description: 'Insufficient permissions',
  })
  @ApiResponse({
    status: 404,
    description: 'User not found',
  })
  async updateUser(
    @Param('id', ParseIntPipe) id: number,
    @Body() userData: Partial<User>,
  ): Promise<User> {
    return this.usersService.update(id, userData);
  }

  @Delete(':id')
  @Roles('admin')
  @ApiOperation({
    summary: 'Delete user',
    description: 'Deletes user by ID (admin only)',
  })
  @ApiParam({
    name: 'id',
    description: 'User ID',
    type: 'number',
    example: 1,
  })
  @ApiResponse({
    status: 200,
    description: 'User successfully deleted',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized access',
  })
  @ApiResponse({
    status: 403,
    description: 'Insufficient permissions',
  })
  @ApiResponse({
    status: 404,
    description: 'User not found',
  })
  async deleteUser(@Param('id', ParseIntPipe) id: number): Promise<void> {
    return this.usersService.delete(id);
  }
}
