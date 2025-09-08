# 🖥️ CLI Module

CLI module for managing administrators through the command line.

## 📁 Structure

```
src/cli/
├── cli.ts                    # CLI application entry point
├── cli.module.ts             # CLI module with dependencies
├── commands/                 # CLI commands
│   ├── create-admin.command.ts    # Create administrator
│   ├── remove-admin.command.ts    # Remove administrator
│   └── list-admins.command.ts     # List administrators
└── README.md                 # Module documentation
```

## 🚀 Usage

### Basic Commands

```bash
# Start CLI
npm run cli

# Build CLI
npm run cli:build
```

### Administrator Commands

```bash
# Create administrator
npm run cli:create-admin -- --email admin@example.com --password password123

# With additional parameters
npm run cli:create-admin -- --email admin@example.com --password password123 --firstName "John" --lastName "Doe"

# Remove administrator
npm run cli:remove-admin -- --email admin@example.com

# Show list of administrators
npm run cli:list-admins
```

### Direct Usage

```bash
# Create administrator
npx ts-node src/cli/cli.ts create-admin --email admin@example.com --password password123

# Remove administrator
npx ts-node src/cli/cli.ts remove-admin --email admin@example.com

# Show list of administrators
npx ts-node src/cli/cli.ts list-admins
```

## 🔧 Commands

### 1. create-admin

Creates a new administrator in the system.

**Parameters:**
- `--email, -e` - Administrator email (required)
- `--password, -p` - Administrator password (required)
- `--firstName` - Administrator first name (optional, default "Admin")
- `--lastName` - Administrator last name (optional, default "User")

**Examples:**
```bash
# Minimal parameters
npm run cli:create-admin -- --email admin@example.com --password password123

# With full parameters
npm run cli:create-admin -- --email admin@example.com --password password123 --firstName "John" --lastName "Doe"
```

**Result:**
```
✅ Administrator created successfully!
📧 Email: admin@example.com
👤 Name: John Doe
🔑 Roles: admin
🆔 ID: 1
```

### 2. remove-admin

Removes an administrator from the system by email.

**Parameters:**
- `--email, -e` - Administrator email to remove (required)

**Examples:**
```bash
npm run cli:remove-admin -- --email admin@example.com
```

**Result:**
```
✅ Administrator removed successfully!
📧 Email: admin@example.com
👤 Name: John Doe
```

### 3. list-admins

Shows a list of all administrators in the system.

**Parameters:**
- No parameters

**Examples:**
```bash
npm run cli:list-admins
```

**Result:**
```
📋 List of administrators:
────────────────────────────────────────────────────────────────────────────────
1. 👤 John Doe
   📧 Email: admin@example.com
   🆔 ID: 1
   🔑 Roles: admin
   📅 Created: 01/01/2024
   ✉️ Email verified: ✅
────────────────────────────────────────────────────────────────────────────────
Total administrators: 1
```

## 🚨 Error Code System

### Overview

The CLI Module uses the unified error code system from `src/common/error-codes.ts`. This system provides structured error responses with standardized codes across all modules.

### Error Code Structure

| Range | Category | Description |
|-------|----------|-------------|
| 3000-3099 | CLI General Errors | Initialization, commands, execution |
| 3100-3199 | Administrator Management | Creation, removal, role management |
| 3200-3299 | User Operations | User CRUD operations |
| 3300-3399 | Database Operations | Connection, queries, transactions |
| 3400-3499 | Validation Errors | Input validation, required fields |

### CLI Error Codes Used

```typescript
// CLI General Errors
CLI_COMMAND_EXECUTION_FAILED = '3004'    // Command execution failed

// Administrator Management
CLI_ADMIN_CREATION_FAILED = '3101'       // Administrator creation failed
CLI_ADMIN_REMOVAL_FAILED = '3102'        // Administrator removal failed
CLI_ADMIN_ROLE_INVALID = '3105'          // Invalid administrator role

// User Operations
CLI_USER_NOT_FOUND = '3204'              // User not found
CLI_USER_ALREADY_EXISTS = '3205'         // User already exists

// Validation Errors
CLI_MISSING_REQUIRED_FIELDS = '3404'     // Missing required fields
```

### Error Handling

The CLI commands use standardized error handling with exit codes:

- **Exit Code 1**: Validation errors, general failures
- **Exit Code 2**: Not found errors (user not found)
- **Exit Code 3**: Permission denied errors (not an admin)

### Example Error Output

```bash
❌ Error 3404: Missing required fields
Usage: npm run cli create-admin --email admin@example.com --password password123

❌ Error 3205: User with email admin@example.com already exists

❌ Error 3101: Error creating administrator: Database connection failed
```

## 🏗️ Architecture

### CLI Module (`cli.module.ts`)
- Imports `ConfigModule` for environment variables
- Imports `TypeOrmModule` for database connection
- Imports `UsersModule` for user management
- Provides all CLI commands

### Commands
All commands inherit from `CommandRunner` from `nest-commander`:

- **CreateAdminCommand** - creating administrators
- **RemoveAdminCommand** - removing administrators  
- **ListAdminsCommand** - viewing administrator list

### Dependencies
- **UsersService** - for user management
- **bcrypt** - for password hashing
- **TypeORM** - for database operations

## 🔐 Security

### Passwords
- Passwords are hashed using bcrypt (10 rounds)
- Only hashes are stored in logs and database

### Validations
- Check user existence before creation
- Check administrator role before removal
- Validate required parameters

### Roles
- Automatic assignment of `admin` role
- Email verification by default

## 🛠️ Development

### Adding New Commands

1. Create a new file in `src/cli/commands/`
2. Inherit from `CommandRunner`
3. Use `@Command` decorator
4. Add command to `cli.module.ts`
5. Add npm script to `package.json`

**Example:**
```typescript
@Injectable()
@Command({
  name: 'my-command',
  description: 'Command description',
})
export class MyCommand extends CommandRunner {
  async run(): Promise<void> {
    // Command logic
  }
}
```

### Testing Commands

```bash
# Test creating administrator
npm run cli:create-admin -- --email test@example.com --password test123

# Test listing administrators
npm run cli:list-admins

# Test removing administrator
npm run cli:remove-admin -- --email test@example.com
```

## 📊 Logging

### Log Levels
- **warn** - warnings
- **error** - errors

### Log Format
- Emojis for visual perception
- Structured information
- Clear error messages with error codes

## 🔍 Troubleshooting

### Database Connection Issues
```bash
# Check environment variables
echo $DATABASE_HOST
echo $DATABASE_PORT
echo $DATABASE_NAME
echo $DATABASE_USERNAME
echo $DATABASE_PASSWORD
```

### TypeScript Issues
```bash
# Rebuild CLI
npm run cli:build

# Run with ts-node
npx ts-node src/cli/cli.ts list-admins
```

### Dependency Issues
```bash
# Install dependencies
npm install

# Check versions
npm list @nestjs/typeorm
npm list @nestjs/config
```

## 📚 Useful Links

- [NestJS CLI](https://docs.nestjs.com/cli)
- [nest-commander](https://github.com/jmcdo29/nest-commander)
- [TypeORM CLI](https://typeorm.io/#/using-cli)

---

**Important:** Before using CLI, make sure the database is running and accessible.
