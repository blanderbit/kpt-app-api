import { Command, CommandRunner, Option } from 'nest-commander';
import { Transactional } from 'typeorm-transactional';
import { Injectable } from '@nestjs/common';
import { UsersService } from '../../users/users.service';
import { RoleService } from '../../users/services/role.service';
import { ErrorCode } from '../../common/error-codes';
import { AppException } from '../../common/exceptions/app.exception';
import * as bcrypt from 'bcrypt';

interface CreateAdminOptions {
  email: string;
  password: string;
  firstName?: string;
  lastName?: string;
}

@Injectable()
@Command({
  name: 'create-admin',
  description: 'Create administrator',
})
export class CreateAdminCommand extends CommandRunner {
  constructor(
    private readonly usersService: UsersService,
    private readonly roleService: RoleService,
  ) {
    super();
  }

  @Transactional()
  async run(passedParams: string[], options?: CreateAdminOptions): Promise<void> {
    if (!options?.email || !options?.password) {
      const error = AppException.validation(
        ErrorCode.CLI_MISSING_REQUIRED_FIELDS,
        'Email and password are required',
        { usage: 'npm run cli create-admin --email admin@example.com --password password123' }
      );
      console.error(error.getCliMessage());
      process.exit(1);
    }

    try {
      // Check if user exists
      const existingUser = await this.usersService.findByEmail(options.email);
      if (existingUser) {
        const error = AppException.conflict(
          ErrorCode.CLI_USER_ALREADY_EXISTS,
          `User with email ${options.email} already exists`
        );
        console.error(error.getCliMessage());
        process.exit(1);
      }

      // Hash password
      const saltRounds = 10;
      const passwordHash = await bcrypt.hash(options.password, saltRounds);

      // Create administrator
      const adminData = {
        email: options.email,
        passwordHash,
        firstName: options.firstName || 'Admin',
        lastName: options.lastName || 'User',
        emailVerified: true,
        roles: this.roleService.stringifyRoles(['admin']),
      };

      const admin = await this.usersService.create(adminData);

      console.log('✅ Administrator created successfully!');
      console.log(`📧 Email: ${admin.email}`);
      console.log(`👤 Name: ${admin.firstName} ${admin.lastName}`);
      console.log(`🔑 Roles: ${this.roleService.parseRoles(admin.roles).join(', ')}`);
      console.log(`🆔 ID: ${admin.id}`);

    } catch (error) {
      const appError = AppException.internal(
        ErrorCode.CLI_ADMIN_CREATION_FAILED,
        'Error creating administrator',
        { originalError: error.message }
      );
      console.error(appError.getCliMessage());
      process.exit(1);
    }
  }

  @Option({
    flags: '-e, --email <email>',
    description: 'Administrator email',
  })
  parseEmail(val: string): string {
    return val;
  }

  @Option({
    flags: '-p, --password <password>',
    description: 'Administrator password',
  })
  parsePassword(val: string): string {
    return val;
  }

  @Option({
    flags: '--firstName <firstName>',
    description: 'Administrator first name',
  })
  parseFirstName(val: string): string {
    return val;
  }

  @Option({
    flags: '--lastName <lastName>',
    description: 'Administrator last name',
  })
  parseLastName(val: string): string {
    return val;
  }
}
