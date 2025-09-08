import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Transactional } from 'typeorm-transactional';
import { UsersService } from '../users/users.service';
import { RoleService } from '../users/services/role.service';
import { AdminLoginDto, AdminLoginResponseDto, AdminStatsResponseDto } from './dto/admin.dto';
import { PaginateQuery, paginate, Paginated } from 'nestjs-paginate';
import { User } from '../users/entities/user.entity';
import { ADMIN_USERS_PAGINATION_CONFIG } from './admin.config';
import { ErrorCode } from '../common/error-codes';
import { AppException } from '../common/exceptions/app.exception';
import * as bcrypt from 'bcrypt';

@Injectable()
export class AdminService {
  constructor(
    private readonly usersService: UsersService,
    private readonly roleService: RoleService,
    private readonly jwtService: JwtService,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  @Transactional()
  async adminLogin(adminLoginDto: AdminLoginDto): Promise<AdminLoginResponseDto> {
    const { email, password } = adminLoginDto;

    // Find user
    const user = await this.usersService.findByEmail(email);
    if (!user) {
      throw AppException.unauthorized(
        ErrorCode.ADMIN_INVALID_CREDENTIALS,
        'Invalid email or password provided'
      );
    }

    // Check if user is an administrator
    if (!this.roleService.hasRole(user.roles, 'admin')) {
      throw AppException.forbidden(
        ErrorCode.ADMIN_INSUFFICIENT_PERMISSIONS,
        'User does not have required permissions'
      );
    }

    // Check password
    if (!user.passwordHash) {
      throw AppException.unauthorized(
        ErrorCode.ADMIN_ACCOUNT_NO_PASSWORD_SUPPORT,
        'Account does not support password authentication'
      );
    }

    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
    if (!isPasswordValid) {
      throw AppException.unauthorized(
        ErrorCode.ADMIN_INVALID_CREDENTIALS,
        'Invalid email or password provided'
      );
    }

    // Check if email is verified
    if (!user.emailVerified) {
      throw AppException.unauthorized(
        ErrorCode.ADMIN_EMAIL_NOT_VERIFIED,
        'Email address is not verified'
      );
    }

    // Generate JWT token
    const accessToken = this.jwtService.sign({
      email: user.email,
      sub: user.id,
      roles: this.roleService.parseRoles(user.roles),
      isAdmin: true
    });

    // Remove sensitive data and transform roles
    const { passwordHash, ...adminWithoutSensitiveData } = user;

    return {
      accessToken,
      admin: {
        ...adminWithoutSensitiveData,
        roles: this.roleService.parseRoles(adminWithoutSensitiveData.roles)
      },
    };
  }

  async getUsers(query: PaginateQuery): Promise<Paginated<User>> {
    return paginate(query, this.userRepository, ADMIN_USERS_PAGINATION_CONFIG);
  }

  async getStats(): Promise<AdminStatsResponseDto> {
    try {
      // Get current month and last month dates
      const thisMonth = new Date();
      thisMonth.setDate(1);
      thisMonth.setHours(0, 0, 0, 0);

      const lastMonth = new Date(thisMonth);
      lastMonth.setMonth(lastMonth.getMonth() - 1);

      // Execute all queries in parallel using Promise.all
      const [
        totalUsers,
        totalAdmins,
        verifiedUsers,
        unverifiedUsers,
        usersThisMonth,
        usersLastMonth
      ] = await Promise.all([
        // Get total users count
        this.userRepository
          .createQueryBuilder('u')
          .where('u.isActive = :isActive', { isActive: true })
          .getCount(),

        // Get total admins count
        this.userRepository
          .createQueryBuilder('user')
          .where('user.isActive = :isActive', { isActive: true })
          .andWhere('user.roles LIKE :adminRole', { adminRole: '%admin%' })
          .getCount(),

        // Get verified users count
        this.userRepository
          .createQueryBuilder('u')
          .where('u.isActive = :isActive', { isActive: true })
          .andWhere('u.emailVerified = :emailVerified', { emailVerified: true })
          .getCount(),

        // Get unverified users count
        this.userRepository
          .createQueryBuilder('u')
          .where('u.isActive = :isActive', { isActive: true })
          .andWhere('u.emailVerified = :emailVerified', { emailVerified: false })
          .getCount(),

        // Get users created this month
        this.userRepository
          .createQueryBuilder('u')
          .where('u.isActive = :isActive', { isActive: true })
          .andWhere('u.createdAt >= :thisMonth', { thisMonth })
          .getCount(),

        // Get users created last month
        this.userRepository
          .createQueryBuilder('u')
          .where('u.isActive = :isActive', { isActive: true })
          .andWhere('u.createdAt >= :lastMonth', { lastMonth })
          .andWhere('u.createdAt < :thisMonth', { thisMonth })
          .getCount()
      ]);

      return {
        totalUsers,
        totalAdmins,
        verifiedUsers,
        unverifiedUsers,
        usersThisMonth,
        usersLastMonth,
      };
    } catch (error) {
      throw AppException.internal(
        ErrorCode.ADMIN_STATS_GENERATION_FAILED,
        'Failed to generate user statistics',
        { originalError: error.message }
      );
    }
  }
}
