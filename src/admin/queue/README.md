# Queue Management Module

This module provides universal administrative endpoints for managing ALL Bull queues in the system via Redis.

## Services

### `AdminQueueService`

Universal service for managing any Bull queue in the system.

**Features:**
- Work with any queue by name
- Get list of all queues with pagination
- Clear all jobs, only failed, or only completed
- Pause/Resume any queue
- Get detailed statistics for any queue

## Controllers

### `QueueManagementController`

Located at: `/admin/queue`

**Authentication:** Requires JWT authentication and admin role

## API Endpoints

### 1. Get List of All Queues
```
GET /admin/queue/list?page=1&limit=10
```
Returns paginated list of all Bull queues with their statistics.

**Query Parameters:**
- `page` (optional, default: 1) - Page number
- `limit` (optional, default: 10, max: 100) - Items per page

**Response:**
```json
{
  "queues": [
    {
      "name": "suggested-activity",
      "waiting": 5,
      "active": 2,
      "completed": 150,
      "failed": 3,
      "delayed": 10,
      "paused": false
    }
  ],
  "total": 1,
  "page": 1,
  "limit": 10,
  "totalPages": 1
}
```

### 2. Get Queue Statistics
```
GET /admin/queue/:queueName/stats
```
Returns detailed statistics for a specific queue.

**Parameters:**
- `queueName` - Queue name (e.g., "suggested-activity")

**Response:**
```json
{
  "waiting": 5,
  "active": 2,
  "completed": 150,
  "failed": 3,
  "delayed": 10,
  "total": 170,
  "isPaused": false
}
```

### 3. Clear All Jobs
```
DELETE /admin/queue/:queueName/clear
```
Removes all jobs (waiting, active, completed, failed) from the queue.

**Response:**
```json
{
  "message": "Queue \"suggested-activity\" successfully cleared"
}
```

### 4. Clear Only Failed Jobs
```
DELETE /admin/queue/:queueName/clear-failed
```
Removes only failed jobs from the queue.

**Response:**
```json
{
  "cleared": 15
}
```

### 5. Clear Only Completed Jobs
```
DELETE /admin/queue/:queueName/clear-completed
```
Removes only completed jobs from the queue.

**Response:**
```json
{
  "cleared": 150
}
```

### 6. Pause Queue
```
POST /admin/queue/:queueName/pause
```
Pauses queue processing. No new jobs will be processed until resumed.

**Response:**
```json
{
  "message": "Queue \"suggested-activity\" paused",
  "status": "paused"
}
```

### 7. Resume Queue
```
POST /admin/queue/:queueName/resume
```
Resumes queue processing.

**Response:**
```json
{
  "message": "Queue \"suggested-activity\" resumed",
  "status": "resumed"
}
```

### 8. Add Test Jobs
```
POST /admin/queue/test/add-100-jobs
```
Adds 100 test jobs to the suggested-activity queue for testing purposes. Each job:
- Uses userId from 1 to 100 (cycling)
- Has varying priority from 0 to 10
- Targets tomorrow's date for suggestion generation

**Response:**
```json
{
  "message": "100 test jobs added to queue",
  "jobsAdded": 100,
  "jobIds": [1, 2, 3, ..., 100]
}
```

## Usage Examples

### Get List of All Queues

```bash
curl http://localhost:3000/admin/queue/list?page=1&limit=10 \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### Get Statistics for Specific Queue

```bash
curl http://localhost:3000/admin/queue/suggested-activity/stats \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### Clear Failed Jobs Only

```bash
curl -X DELETE http://localhost:3000/admin/queue/suggested-activity/clear-failed \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### Pause Queue

```bash
curl -X POST http://localhost:3000/admin/queue/suggested-activity/pause \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### Resume Queue

```bash
curl -X POST http://localhost:3000/admin/queue/suggested-activity/resume \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### Clear All Jobs

```bash
curl -X DELETE http://localhost:3000/admin/queue/suggested-activity/clear \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### Add 100 Test Jobs

```bash
curl -X POST http://localhost:3000/admin/queue/test/add-100-jobs \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

## Architecture

### Universal Queue Management

The `AdminQueueService` works with ANY Bull queue in the system:

1. **Redis-based Discovery**: Scans Redis for all Bull queue keys
2. **Dynamic Queue Access**: Works with any queue by name
3. **Centralized Management**: Single service to manage all queues

### Queue Registry

Currently supports:
- `suggested-activity` - Main queue for AI suggestion generation

To add more queues, inject them in `AdminQueueService` constructor and update `getQueueByName()` method.

## Dependencies

- `@nestjs/bull` - Bull queue integration
- `bull` - Queue system
- `ioredis` - Redis client
- `SuggestedActivityModule` - For queue access

## Frontend Integration

The admin panel at `/admin/queue` provides UI for:
- Viewing queue statistics in real-time
- Pausing/resuming queues
- Clearing jobs
- Adding test jobs

## Future Enhancements

- [ ] Add job details view (list jobs with filters)
- [ ] Add retry failed jobs functionality
- [ ] Add queue metrics and charts
- [ ] Add WebSocket for real-time updates
- [ ] Add support for delayed jobs management
- [ ] Add job priority management
- [ ] Add bulk operations for jobs

## Notes

- All endpoints require admin role
- Operations are logged for audit purposes
- Clear operations are destructive and cannot be undone
- Paused queues will not process jobs until explicitly resumed
- Statistics are calculated in real-time from Redis
