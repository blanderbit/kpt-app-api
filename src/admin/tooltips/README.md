# Tooltips Module

## Overview
The Tooltips module provides a flexible system for managing tooltips across different pages in the application. It supports multiple tooltip types with different JSON structures.

## Features

### Tooltip Types
- **Swipe Tooltips**: Multi-step tooltips with pagination
- **Text Tooltips**: Simple text-based tooltips with styling options

### Admin Operations
- ✅ Create tooltips
- ✅ Update tooltips
- ✅ Delete tooltips
- ✅ Search tooltips by type and page
- ✅ Get all tooltip types
- ✅ Get all pages

### Public Endpoints
- ✅ Get tooltips by page (unprotected)
- ✅ Get tooltips by page and type (unprotected)

## API Endpoints

### Admin Endpoints (Protected)
```
POST   /admin/tooltips           - Create tooltip
GET    /admin/tooltips           - Get all tooltips (with filtering)
GET    /admin/tooltips/types     - Get all tooltip types
GET    /admin/tooltips/pages     - Get all pages
GET    /admin/tooltips/:id       - Get tooltip by ID
PATCH  /admin/tooltips/:id       - Update tooltip
DELETE /admin/tooltips/:id       - Delete tooltip
GET    /admin/tooltips/search/type/:type/page/:page - Search by type and page
```

### Public Endpoints (Unprotected)
```
GET    /tooltips/page/:page                    - Get tooltips by page
GET    /tooltips/page/:page/type/:type        - Get tooltips by page and type
```

## Data Models

### SwipeModel
```typescript
{
  title: string;
  steps: SwipeStep[];
  showPagination?: boolean;
  autoAdvance?: number;
}

interface SwipeStep {
  title: string;
  description: string;
  imageUrl?: string;
  order?: number;
}
```

### TextModel
```typescript
{
  title: string;
  description: string;
  subtitle?: string;
  iconUrl?: string;
  backgroundColor?: string;
  textColor?: string;
  maxWidth?: number;
}
```

## Usage Examples

### Creating a Swipe Tooltip
```typescript
const swipeTooltip = {
  type: 'swipe',
  page: 'dashboard',
  json: {
    title: 'Welcome Guide',
    steps: [
      { title: 'Step 1', description: 'First step description', order: 1 },
      { title: 'Step 2', description: 'Second step description', order: 2 }
    ],
    showPagination: true,
    autoAdvance: 5000
  }
};
```

### Creating a Text Tooltip
```typescript
const textTooltip = {
  type: 'text',
  page: 'profile',
  json: {
    title: 'Profile Help',
    description: 'Need help with your profile?',
    backgroundColor: '#f0f8ff',
    textColor: '#333333',
    maxWidth: 400
  }
};
```

## Database Schema

```sql
CREATE TABLE tooltips (
  id INT PRIMARY KEY AUTO_INCREMENT,
  type VARCHAR(100) NOT NULL,
  page VARCHAR(100) NOT NULL,
  json JSON NOT NULL,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  INDEX idx_type (type),
  INDEX idx_page (page),
  INDEX idx_type_page (type, page),
  INDEX idx_created_at (createdAt)
);
```

## Security

- Admin endpoints are protected with JWT authentication and admin role requirement
- Public endpoints are completely unprotected for easy access
- JSON validation ensures data integrity based on tooltip type

## Validation

The module automatically validates JSON structure based on the tooltip type:
- Swipe tooltips must have `title` and `steps` array
- Text tooltips must have `title` and `description`
- Additional fields are optional and type-specific

## Error Handling

- Invalid JSON structure throws validation errors
- Missing tooltips return 404 Not Found
- Unauthorized access returns 401/403 errors
- Database errors are properly handled and logged
