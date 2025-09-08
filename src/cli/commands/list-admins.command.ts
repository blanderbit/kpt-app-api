import { Command, CommandRunner } from 'nest-commander';
import { Injectable } from '@nestjs/common';
import { UsersService } from '../../users/users.service';
import { ErrorCode } from '../../common/error-codes';
import { AppException } from '../../common/exceptions/app.exception';

@Injectable()
@Command({
  name: 'list-admins',
  description: 'Show list of all administrators',
})
export class ListAdminsCommand extends CommandRunner {
  constructor(private readonly usersService: UsersService) {
    super();
  }

  async run(): Promise<void> {
    try {
      // Create a mock pagination query for CLI usage
      const mockQuery = {
        page: 1,
        limit: 1000, // Large limit to get all admins
        sortBy: [['createdAt', 'DESC']] as [string, string][],
        filter: {},
        search: '',
        path: '/cli/list-admins'
      };

      const adminsResult = await this.usersService.findAdmins(mockQuery);

      if (adminsResult.data.length === 0) {
        console.log('📋 No administrators found');
        return;
      }

      console.log('📋 List of administrators:');
      console.log('─'.repeat(80));

      adminsResult.data.forEach((admin, index) => {
        console.log(`${index + 1}. 👤 ${admin.firstName || 'N/A'} ${admin.lastName || 'N/A'}`);
        console.log(`   📧 Email: ${admin.email}`);
        console.log(`   🆔 ID: ${admin.id}`);
        console.log(`   🔑 Roles: ${Array.isArray(admin.roles) ? admin.roles.join(', ') : admin.roles || 'N/A'}`);
        console.log(`   📅 Created: ${admin.createdAt ? admin.createdAt.toLocaleDateString('en-US') : 'N/A'}`);
        // console.log(`   ✉️ Email verified: ${admin.isVerified ? '✅' : '❌'}`);
        // console.log(`   🟢 Active: ${admin.isActive ? '✅' : '❌'}`);
        console.log('─'.repeat(80));
      });

      console.log(`Total administrators: ${adminsResult.meta.totalItems}`);
      console.log(`Page: ${adminsResult.meta.currentPage} of ${adminsResult.meta.totalPages}`);

    } catch (error) {
      const appError = AppException.internal(
        ErrorCode.CLI_COMMAND_EXECUTION_FAILED,
        'Error getting list of administrators',
        { originalError: error.message }
      );
      console.error(appError.getCliMessage());
      process.exit(1);
    }
  }
}
