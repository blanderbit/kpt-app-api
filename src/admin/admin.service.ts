import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Transactional } from 'typeorm-transactional';
import { UsersService } from '../users/users.service';
import { RoleService } from '../users/services/role.service';
import {
  AdminLoginDto,
  AdminLoginResponseDto,
  AdminUsersStatsResponseDto,
  AdminAdminsStatsResponseDto,
  AdminProfileResponseDto,
} from './dto/admin.dto';
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

  async getAdminProfile(userId: number): Promise<AdminProfileResponseDto> {
    const user = await this.usersService.findById(userId);

    if (!user) {
      throw AppException.unauthorized(
        ErrorCode.ADMIN_USER_NOT_FOUND,
        'Administrator not found',
      );
    }

    if (!this.roleService.hasRole(user.roles, 'admin')) {
      throw AppException.forbidden(
        ErrorCode.ADMIN_INSUFFICIENT_PERMISSIONS,
        'User does not have required permissions',
      );
    }

    const { passwordHash, ...adminWithoutSensitiveData } = user;

    return {
      id: adminWithoutSensitiveData.id,
      email: adminWithoutSensitiveData.email,
      firstName: adminWithoutSensitiveData.firstName,
      avatarUrl: adminWithoutSensitiveData.avatarUrl,
      emailVerified: adminWithoutSensitiveData.emailVerified,
      roles: this.roleService.parseRoles(adminWithoutSensitiveData.roles),
      createdAt: adminWithoutSensitiveData.createdAt,
      updatedAt: adminWithoutSensitiveData.updatedAt,
    };
  }

  async getUsers(query: PaginateQuery): Promise<Paginated<User>> {
    return paginate(query, this.userRepository, ADMIN_USERS_PAGINATION_CONFIG);
  }

  async getUserStats(): Promise<AdminUsersStatsResponseDto> {
    try {
      const hasIsActiveColumn = this.userRepository.metadata.columns.some(
        (column) => column.propertyName === 'isActive',
      );

      const ADMIN_ROLE_PATTERN = '%admin%';

      const baseQuery = () => {
        const qb = this.userRepository.createQueryBuilder('user');
        if (hasIsActiveColumn) {
          qb.andWhere('user.isActive = :isActive', { isActive: true });
        }
        qb.andWhere("COALESCE(user.roles, '') NOT LIKE :nonAdminRole", {
          nonAdminRole: ADMIN_ROLE_PATTERN,
        });
        return qb;
      };

      const thisMonth = new Date();
      thisMonth.setDate(1);
      thisMonth.setHours(0, 0, 0, 0);

      const lastMonth = new Date(thisMonth);
      lastMonth.setMonth(lastMonth.getMonth() - 1);

      const [
        totalUsers,
        verifiedUsers,
        unverifiedUsers,
        usersThisMonth,
        usersLastMonth,
      ] = await Promise.all([
        baseQuery().getCount(),
        baseQuery()
          .andWhere('user.emailVerified = :emailVerified', { emailVerified: true })
          .getCount(),
        baseQuery()
          .andWhere('user.emailVerified = :emailVerified', { emailVerified: false })
          .getCount(),
        baseQuery()
          .andWhere('user.createdAt >= :thisMonth', { thisMonth })
          .getCount(),
        baseQuery()
          .andWhere('user.createdAt >= :lastMonth', { lastMonth })
          .andWhere('user.createdAt < :thisMonth', { thisMonth })
          .getCount(),
      ]);

      return {
        totalUsers,
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

  async getAdminStats(): Promise<AdminAdminsStatsResponseDto> {
    try {
      const hasIsActiveColumn = this.userRepository.metadata.columns.some(
        (column) => column.propertyName === 'isActive',
      );

      const qb = this.userRepository.createQueryBuilder('user')
        .andWhere("COALESCE(user.roles, '') LIKE :adminRole", { adminRole: '%admin%' });

      if (hasIsActiveColumn) {
        qb.andWhere('user.isActive = :isActive', { isActive: true });
      }

      const totalAdmins = await qb.getCount();

      return { totalAdmins };
    } catch (error) {
      throw AppException.internal(
        ErrorCode.ADMIN_STATS_GENERATION_FAILED,
        'Failed to generate administrator statistics',
        { originalError: error.message }
      );
    }
  }
}
