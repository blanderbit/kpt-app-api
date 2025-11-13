# Survey Module

This module handles surveys (опросники) with admin CRUD operations and public endpoints for users to view and complete surveys.

## Features

### Admin Endpoints

- **POST /admin/surveys** - Create a new survey
- **GET /admin/surveys** - Get all surveys with pagination
- **GET /admin/surveys/all** - Get all surveys without pagination
- **GET /admin/surveys/:id** - Get survey by ID
- **PUT /admin/surveys/:id** - Update survey
- **DELETE /admin/surveys/:id** - Delete survey permanently
- **POST /admin/surveys/:id/archive** - Archive survey (soft delete)

### Public Endpoints

- **GET /surveys** - Get all active surveys (with completion status)
- **GET /surveys/random** - Get a random active survey
- **GET /surveys/:id** - Get survey by ID (with completion status)
- **POST /surveys/:id/submit** - Submit answer to a survey (requires authentication)

## Entities

### Survey

- `id` - Unique identifier
- `title` - Survey title
- `description` - Survey description
- `questions` - Array of questions with answer options (JSON)
- `isArchived` - Whether the survey is archived
- `createdBy` - Email of user who created the survey
- `updatedBy` - Email of user who last updated the survey
- `createdAt` - Creation timestamp
- `updatedAt` - Last update timestamp
- `archivedAt` - Archival timestamp (nullable)
- `archivedBy` - Email of user who archived the survey (nullable)

### Survey Question Structure

```typescript
{
  id: string;           // Question identifier (e.g., "q1")
  text: string;         // Question text
  type: 'single' | 'multiple' | 'text';
  options: [
    {
      id: string;       // Option identifier (e.g., "opt1")
      text: string;     // Option text
    }
  ]
}
```

### UserSurvey

Tracks which surveys users have completed:

- `id` - Unique identifier
- `userId` - User ID
- `surveyId` - Survey ID
- `answers` - User answers (JSON object mapping questionId to selected answers)
- `createdAt` - Submission timestamp
- `updatedAt` - Last update timestamp

## Usage

### Creating a Survey with Questions (Admin)

```bash
POST /admin/surveys
Authorization: Bearer <admin_token>

{
  "title": "Weekly Health Assessment",
  "description": "Please answer the following questions",
  "questions": [
    {
      "id": "q1",
      "text": "How satisfied are you with our service?",
      "type": "single",
      "options": [
        { "id": "opt1", "text": "Very satisfied" },
        { "id": "opt2", "text": "Satisfied" },
        { "id": "opt3", "text": "Neutral" },
        { "id": "opt4", "text": "Dissatisfied" }
      ]
    },
    {
      "id": "q2",
      "text": "Which features do you use? (select all that apply)",
      "type": "multiple",
      "options": [
        { "id": "opt1", "text": "Feature A" },
        { "id": "opt2", "text": "Feature B" },
        { "id": "opt3", "text": "Feature C" }
      ]
    },
    {
      "id": "q3",
      "text": "Any additional comments?",
      "type": "text",
      "options": []
    }
  ]
}
```

### Updating a Survey (Admin)

```bash
PUT /admin/surveys/:id
Authorization: Bearer <admin_token>

{
  "title": "Updated Weekly Health Assessment",
  "questions": [
    {
      "id": "q1",
      "text": "Updated question text?",
      "type": "single",
      "options": [
        { "id": "opt1", "text": "Yes" },
        { "id": "opt2", "text": "No" }
      ]
    }
  ]
}
```

### Getting Surveys (Public)

```bash
# Get all active surveys
GET /surveys

# Get random survey
GET /surveys/random

# Get specific survey by ID
GET /surveys/1
```

Response includes questions with options:

```json
{
  "id": 1,
  "title": "Weekly Health Assessment",
  "description": "Please answer the following questions",
  "questions": [
    {
      "id": "q1",
      "text": "How satisfied are you?",
      "type": "single",
      "options": [
        { "id": "opt1", "text": "Very satisfied" },
        { "id": "opt2", "text": "Satisfied" }
      ]
    }
  ],
  "isCompleted": false
}
```

### Submitting Survey Answers (User)

```bash
POST /surveys/:id/submit
Authorization: Bearer <user_token>

{
  "answers": [
    {
      "questionId": "q1",
      "answer": "opt1"
    },
    {
      "questionId": "q2",
      "answer": ["opt1", "opt2"]
    },
    {
      "questionId": "q3",
      "answer": "Custom text answer"
    }
  ]
}
```

**Note:**
- For `single` type questions: provide single option ID as string
- For `multiple` type questions: provide array of option IDs
- For `text` type questions: provide text answer as string

## Pagination

Admin endpoint supports full pagination with nestjs-paginate:

```bash
GET /admin/surveys?page=1&limit=20&sortBy=createdAt:DESC&filter.isArchived=false
```

Available query parameters:
- `page` - Page number (default: 1)
- `limit` - Items per page (default: 20, max: 100)
- `sortBy` - Sort field and direction (e.g., `createdAt:DESC`)
- `filter.isArchived` - Filter by archived status
- `search` - Search in title and description

## Question Types

1. **single** - User can select one option (radio button)
2. **multiple** - User can select multiple options (checkboxes)
3. **text** - User can provide free-text answer

## Completion Status

Public endpoints include `isCompleted` field in the response when a user is authenticated:

```json
{
  "id": 1,
  "title": "Weekly Health Assessment",
  "description": "...",
  "questions": [...],
  "isArchived": false,
  "isCompleted": true,  // <-- Shows if user has submitted answers
  ...
}
```

## Notes

- Users can submit multiple answers to the same survey
- If user submits again, the previous answer is updated
- Only non-archived surveys are visible in public endpoints
- Admin can see all surveys including archived ones
- Soft delete (archive) preserves data but hides it from users
- Questions and options are stored as JSON in the database
- Each question must have unique ID within the survey
- Each option must have unique ID within the question
