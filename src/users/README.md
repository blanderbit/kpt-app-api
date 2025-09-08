# 👥 Users Module

User management functionality for the KPT application with advanced pagination and filtering capabilities.

## 📁 Structure

```
src/users/
├── users.service.ts           # Main users service with pagination
├── users.controller.ts        # Users API controller
├── users.module.ts            # Module configuration
├── users.config.ts            # Pagination configuration
├── entities/
│   └── user.entity.ts         # User entity definition
└── README.md                  # Module documentation
```

## 🚀 Features

### User Management
- **CRUD Operations**: Create, read, update, and delete users
- **Advanced Search**: Find users by email, name, or other criteria
- **Role Management**: Support for user roles and permissions
- **Status Tracking**: Active/inactive status and email verification

### Pagination & Filtering
- **NestJS Paginate**: Full integration with `nestjs-paginate` library
- **Advanced Filtering**: Filter by any user field with multiple operators
- **Sorting**: Sort by any field in ascending or descending order
- **Search**: Full-text search across multiple fields
- **Performance**: Optimized queries with field selection

### CLI Integration
- **Admin Listing**: CLI command to list all administrators
- **Pagination Support**: CLI commands use the same pagination system
- **Formatted Output**: Beautiful console output with emojis and formatting

## 🔧 Configuration

### Pagination Configuration

```typescript
import { usersConfig } from './users.config';

// Configuration object with all pagination settings
usersConfig.defaultLimit          // Default items per page (20)
usersConfig.maxLimit              // Maximum items per page (100)
usersConfig.sortableColumns       // Available sortable fields
usersConfig.filterableColumns     // Available filterable fields
usersConfig.searchableColumns     // Searchable text fields
```

### Available Sortable Fields
- `id` - User ID
- `email` - Email address
- `firstName` - First name
- `lastName` - Last name
- `createdAt` - Creation date
- `updatedAt` - Last update date
- `lastLoginAt` - Last login date
- `isActive` - Active status
- `isVerified` - Email verification status

### Available Filter Operators
- **Equality**: `EQ` (equals)
- **Comparison**: `GT`, `GTE`, `LT`, `LTE` (greater/less than)
- **Text Search**: `CONTAINS`, `STARTS_WITH`, `ENDS_WITH`
- **Array**: `CONTAINS` (for roles field)

## 🔧 API Methods

### findById(id)
Find user by ID.

**Parameters:**
- `id`: User ID number

**Returns:**
- `Promise<User>`: User entity

**Error Handling:**
- `NotFoundException`: If user not found

### findByEmail(email)
Find user by email address.

**Parameters:**
- `email`: User email string

**Returns:**
- `Promise<User | null>`: User entity or null

### create(userData)
Create new user.

**Parameters:**
- `userData`: Partial user data

**Returns:**
- `Promise<User>`: Created user entity

### update(id, userData)
Update existing user.

**Parameters:**
- `id`: User ID number
- `userData`: Partial user data to update

**Returns:**
- `Promise<User>`: Updated user entity

**Error Handling:**
- `NotFoundException`: If user not found

### delete(id)
Delete user by ID.

**Parameters:**
- `id`: User ID number

**Returns:**
- `Promise<void>`

**Error Handling:**
- `NotFoundException`: If user not found

### findAdmins(query)
Find all administrators with pagination.

**Parameters:**
- `query`: PaginateQuery object with pagination parameters

**Returns:**
- `Promise<Paginated<User>>`: Paginated result with metadata

**Features:**
- Automatic role filtering (JSON_CONTAINS for admin role)
- Full pagination support
- Sorting and filtering capabilities

### findUsers(query)
Find all users with pagination.

**Parameters:**
- `query`: PaginateQuery object with pagination parameters

**Returns:**
- `Promise<Paginated<User>>`: Paginated result with metadata

**Features:**
- Full pagination support
- Advanced filtering and sorting
- Search functionality
- Performance optimization

### findUsersWithPagination(page, limit)
Get users with simple pagination for cron jobs.

**Parameters:**
- `page`: Page number (default: 1)
- `limit`: Items per page (default: 100)

**Returns:**
- `Promise<{ users: User[]; total: number }>`: Simple paginated result

**Features:**
- Optimized for bulk processing
- Selects only necessary fields
- Filters only active users
- Used by cron jobs and background tasks

### findAll()
Get all users without pagination.

**Returns:**
- `Promise<User[]>`: Array of all users

**Note:**
- **Deprecated**: Use `findUsers()` with pagination for better performance
- Returns all users in memory (not recommended for large datasets)

## 🏗️ Architecture

### Core Components

#### UsersService
- **User Operations**: Handles all user management operations
- **Pagination Integration**: Full integration with nestjs-paginate
- **Query Building**: Uses TypeORM QueryBuilder for complex queries
- **Error Handling**: Proper error handling with custom exceptions

#### Users Configuration
- **Pagination Settings**: Configurable limits and defaults
- **Filter Definitions**: Defines available filters and operators
- **Sort Options**: Configurable sorting fields and defaults
- **Performance**: Optimized field selection and relations

### Dependencies
- **@nestjs/typeorm**: TypeORM integration
- **nestjs-paginate**: Advanced pagination library
- **TypeORM**: Database ORM with QueryBuilder

## 📊 Pagination Usage

### Basic Pagination

```typescript
// Get first page with 20 items
const query: PaginateQuery = {
  page: 1,
  limit: 20
};

const result = await this.usersService.findUsers(query);
console.log(`Page ${result.meta.currentPage} of ${result.meta.totalPages}`);
console.log(`Total users: ${result.meta.totalItems}`);
```

### Advanced Filtering

```typescript
// Filter by email and status
const query: PaginateQuery = {
  page: 1,
  limit: 20,
  filter: {
    email: 'john@example.com',
    isActive: true
  }
};

const result = await this.usersService.findUsers(query);
```

### Sorting

```typescript
// Sort by creation date descending
const query: PaginateQuery = {
  page: 1,
  limit: 20,
  sortBy: [['createdAt', 'DESC']]
};

const result = await this.usersService.findUsers(query);
```

### Search

```typescript
// Search across email, firstName, lastName
const query: PaginateQuery = {
  page: 1,
  limit: 20,
  search: 'john'
};

const result = await this.usersService.findUsers(query);
```

## 🔐 Security Features

### Data Protection
- **Field Selection**: Only necessary fields are selected by default
- **Role Filtering**: Automatic filtering for admin operations
- **Status Filtering**: Only active users are returned by default

### Input Validation
- **Query Validation**: Pagination queries are validated
- **Parameter Sanitization**: Input parameters are sanitized
- **Limit Enforcement**: Maximum limits are enforced

## 📊 Performance Optimization

### Query Optimization
- **Field Selection**: Only required fields are selected
- **Index Usage**: Proper ordering for index utilization
- **Relation Control**: No unnecessary relations loaded

### Pagination Benefits
- **Memory Efficiency**: Only requested page loaded
- **Network Optimization**: Reduced data transfer
- **Scalability**: Handles large datasets efficiently

## 🛠️ Development

### Adding New Filters

1. **Update Configuration**: Add new field to `filterableColumns` in `users.config.ts`
2. **Add Operators**: Choose appropriate filter operators
3. **Update Entity**: Ensure field exists in User entity
4. **Test**: Verify filtering works correctly

### Example: Adding Phone Filter

```typescript
// In users.config.ts
filterableColumns: {
  // ... existing filters
  phone: [FilterOperator.EQ, FilterOperator.CONTAINS, FilterOperator.STARTS_WITH],
}
```

### Adding New Sortable Fields

1. **Update Configuration**: Add field to `sortableColumns` in `users.config.ts`
2. **Ensure Index**: Add database index for performance
3. **Test**: Verify sorting works correctly

## 🧪 Testing

### Unit Tests

```bash
# Run users module tests
npm run test users

# Run specific test file
npm run test users.service.spec.ts
```

### Integration Tests

```bash
# Run e2e tests
npm run test:e2e users
```

### Testing Pagination

```typescript
// Test pagination functionality
const query: PaginateQuery = {
  page: 1,
  limit: 10
};

const result = await usersService.findUsers(query);
expect(result.data).toHaveLength(10);
expect(result.meta.currentPage).toBe(1);
expect(result.meta.totalItems).toBeGreaterThan(0);
```

## 📚 Useful Links

- [NestJS TypeORM](https://docs.nestjs.com/techniques/database)
- [nestjs-paginate](https://github.com/ppetzold/nestjs-paginate)
- [TypeORM QueryBuilder](https://typeorm.io/#/select-query-builder)
- [Pagination Best Practices](https://www.npmjs.com/package/nestjs-paginate)

---

**Important:** 
- Always use pagination for user listing operations
- The `findAll()` method is deprecated - use `findUsers()` with pagination
- CLI commands automatically use pagination with large limits
- All pagination operations respect the configuration limits and filters
