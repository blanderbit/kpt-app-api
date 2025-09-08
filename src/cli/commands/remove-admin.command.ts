import { Command, CommandRunner, Option } from 'nest-commander';
import { Transactional } from 'typeorm-transactional';
import { Injectable } from '@nestjs/common';
import { UsersService } from '../../users/users.service';
import { ErrorCode } from '../../common/error-codes';
import { AppException } from '../../common/exceptions/app.exception';

@Injectable()
@Command({
  name: 'remove-admin',
  description: 'Remove administrator by email',
})
export class RemoveAdminCommand extends CommandRunner {
  constructor(private readonly usersService: UsersService) {
    super();
  }

  @Transactional()
  async run(passedParams: string[], options?: { email: string }): Promise<void> {
    if (!options?.email) {
      const error = AppException.validation(
        ErrorCode.CLI_MISSING_REQUIRED_FIELDS,
        'Email is required',
        { usage: 'npm run cli remove-admin --email admin@example.com' }
      );
      console.error(error.getCliMessage());
      process.exit(1);
    }

    try {
      // Find user
      const user = await this.usersService.findByEmail(options.email);
      if (!user) {
        const error = AppException.notFound(
          ErrorCode.CLI_USER_NOT_FOUND,
          `User with email ${options.email} not found`
        );
        console.error(error.getCliMessage());
        process.exit(2);
      }

      // Check if user is an administrator
      if (!user.roles.includes('admin')) {
        const error = AppException.forbidden(
          ErrorCode.CLI_ADMIN_ROLE_INVALID,
          `User ${options.email} is not an administrator`
        );
        console.error(error.getCliMessage());
        process.exit(3);
      }

      // Remove administrator
      await this.usersService.delete(user.id);

      console.log('✅ Administrator removed successfully!');
      console.log(`📧 Email: ${user.email}`);
      console.log(`👤 Name: ${user.firstName} ${user.lastName}`);

    } catch (error) {
      const appError = AppException.internal(
        ErrorCode.CLI_ADMIN_REMOVAL_FAILED,
        'Error removing administrator',
        { originalError: error.message }
      );
      console.error(appError.getCliMessage());
      process.exit(1);
    }
  }

  @Option({
    flags: '-e, --email <email>',
    description: 'Administrator email to remove',
  })
  parseEmail(val: string): string {
    return val;
  }
}
