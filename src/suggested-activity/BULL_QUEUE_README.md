# Bull Queue Implementation

## Overview

The Bull Queue system provides reliable, scalable, and monitored job processing for the Suggested Activity Module. It uses Redis as a backend and provides advanced features like job prioritization, retry mechanisms, and comprehensive monitoring.

## 🏗️ Architecture

### Core Components

```
Bull Queue (Redis Backend)
├── Queue Management
│   ├── Job Creation
│   ├── Job Scheduling
│   └── Job Prioritization
├── Job Processing
│   ├── Processors
│   ├── Error Handling
│   └── Retry Logic
└── Monitoring
    ├── Statistics
    ├── Health Checks
    └── Admin Controls
```

### Queue Types

1. **cleanup-old-suggestions** (Priority: 10)
   - High priority cleanup jobs
   - Runs before generation jobs
   - Removes expired suggestions

2. **generate-suggestions** (Priority: 0)
   - Standard priority generation jobs
   - Processes user suggestions
   - AI-powered content generation

## 🔧 Configuration

### Redis Configuration
```typescript
// src/config/bull.config.ts
export default registerAs('bull', () => ({
  redis: {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379', 10),
    password: process.env.REDIS_PASSWORD || '',
    db: parseInt(process.env.REDIS_DB || '0', 10),
  },
  prefix: process.env.REDIS_PREFIX || 'bull:suggested-activity',
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 2000,
    },
    removeOnComplete: 100,
    removeOnFail: 50,
  },
  limiter: {
    max: 1000,
    duration: 5000,
  },
  settings: {
    stalledInterval: 30000,
    maxStalledCount: 1,
  },
}));
```

### Environment Variables
```bash
# .env file
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=
REDIS_DB=0
REDIS_PREFIX=bull:suggested-activity
```

## 📊 Queue Management

### Job Creation

#### Generate Suggestions Job
```typescript
// Add single job
await this.suggestedActivityQueue.addGenerateSuggestionsJob(
  userId, 
  targetDate, 
  priority
);

// Add bulk jobs
await this.suggestedActivityQueue.addBulkGenerateSuggestionsJobs(
  userIds, 
  targetDate
);
```

#### Cleanup Job
```typescript
// Add cleanup job with high priority
await this.suggestedActivityQueue.addCleanupJob(
  targetDate, 
  10 // High priority
);
```

### Job Options

#### Default Options
```typescript
{
  attempts: 3,                    // Retry attempts
  backoff: {                      // Retry strategy
    type: 'exponential',
    delay: 2000,
  },
  removeOnComplete: 100,          // Keep last 100 completed jobs
  removeOnFail: 50,               // Keep last 50 failed jobs
  priority: 0,                    // Job priority (0-10)
  delay: 0,                       // Delay before processing
  timeout: 30000,                 // Job timeout (30 seconds)
}
```

#### Custom Options
```typescript
// High priority cleanup job
{
  priority: 10,
  attempts: 5,
  timeout: 60000,
  removeOnComplete: true,
}

// Standard generation job
{
  priority: 0,
  attempts: 3,
  timeout: 30000,
  removeOnComplete: 100,
}
```

## 🔄 Job Processing

### Processors

#### Generate Suggestions Processor
```typescript
@Process('generate-suggestions')
async handleGenerateSuggestions(job: Job<GenerateSuggestionsJob>) {
  const { userId, targetDate } = job.data;
  
  try {
    // Process job
    await this.suggestedActivityService.generateSuggestedActivities(
      userId, 
      targetDate
    );
    
    this.logger.log(`Generated suggestions for user ${userId}`);
  } catch (error) {
    this.logger.error(`Failed to generate suggestions for user ${userId}: ${error.message}`);
    throw error; // Job will be retried
  }
}
```

#### Cleanup Processor
```typescript
@Process('cleanup-old-suggestions')
async handleCleanupOldSuggestions(job: Job<CleanupJob>) {
  const { targetDate } = job.data;
  
  try {
    // Cleanup old suggestions
    await this.suggestedActivityService.cleanupOldSuggestions(targetDate);
    
    this.logger.log(`Cleanup completed for ${targetDate}`);
  } catch (error) {
    this.logger.error(`Cleanup failed for ${targetDate}: ${error.message}`);
    throw error;
  }
}
```

### Error Handling

#### Retry Logic
```typescript
// Exponential backoff
{
  attempts: 3,
  backoff: {
    type: 'exponential',
    delay: 2000, // 2s, 4s, 8s delays
  },
}
```

#### Job Failure Handling
```typescript
try {
  // Process job
  await this.processJob(job.data);
} catch (error) {
  // Log error
  this.logger.error(`Job failed: ${error.message}`);
  
  // Job will be retried automatically
  throw error;
}
```

## 📈 Monitoring and Statistics

### Queue Statistics
```typescript
// Get comprehensive queue statistics
const stats = await this.queue.getJobCounts();

// Available counts
{
  waiting: 0,      // Jobs waiting to be processed
  active: 5,       // Currently processing jobs
  completed: 100,  // Successfully completed jobs
  failed: 2,       // Failed jobs
  delayed: 0,      // Delayed jobs
  paused: false,   // Queue pause status
}
```

### Job Progress Tracking
```typescript
// Update job progress
await job.progress(50); // 50% complete

// Get job progress
const progress = await job.progress(); // Returns 50
```

### Queue Health Monitoring
```typescript
// Check queue status
const isActive = !this.queue.isPaused();
const isProcessing = this.queue.isRunning();

// Get queue metrics
const metrics = {
  isActive,
  isProcessing,
  jobCounts: await this.queue.getJobCounts(),
  workerCount: this.queue.workers.length,
};
```

## 🎛️ Admin Controls

### Queue Management API

#### Get Queue Statistics
```http
GET /admin/queue/stats
Authorization: Bearer <jwt-token>
```

Response:
```json
{
  "waiting": 0,
  "active": 5,
  "completed": 100,
  "failed": 2,
  "delayed": 0,
  "paused": false,
  "totalJobs": 107
}
```

#### Pause Queue
```http
POST /admin/queue/pause
Authorization: Bearer <jwt-token>
```

Response:
```json
{
  "success": true,
  "message": "Queue paused successfully",
  "timestamp": "2024-01-15T10:30:00Z"
}
```

#### Resume Queue
```http
POST /admin/queue/resume
Authorization: Bearer <jwt-token>
```

Response:
```json
{
  "success": true,
  "message": "Queue resumed successfully",
  "timestamp": "2024-01-15T10:35:00Z"
}
```

#### Clear Queue
```http
DELETE /admin/queue/clear
Authorization: Bearer <jwt-token>
```

Response:
```json
{
  "success": true,
  "message": "Queue cleared successfully",
  "clearedJobs": 107,
  "timestamp": "2024-01-15T10:40:00Z"
}
```

#### Get Queue Status
```http
GET /admin/queue/status
Authorization: Bearer <jwt-token>
```

Response:
```json
{
  "isActive": true,
  "isProcessing": true,
  "isPaused": false,
  "workerCount": 2,
  "lastActivity": "2024-01-15T10:30:00Z"
}
```

## 🔒 Security and Access Control

### Authentication
- **JWT Tokens**: All endpoints require valid JWT authentication
- **Role-Based Access**: Only users with 'admin' role can access queue management
- **API Security**: Rate limiting and request validation

### Authorization Decorators
```typescript
@Controller('admin/queue')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class QueueManagementController {
  
  @Get('stats')
  @Roles('admin')
  async getQueueStats() {
    // Only admins can access
  }
}
```

## 🧪 Testing

### Unit Testing
```typescript
// Test queue service
describe('SuggestedActivityQueueService', () => {
  it('should add generate suggestions job', async () => {
    const job = await service.addGenerateSuggestionsJob(1, new Date());
    expect(job).toBeDefined();
    expect(job.data.userId).toBe(1);
  });
});
```

### Integration Testing
```typescript
// Test complete workflow
describe('Queue Integration', () => {
  it('should process generate suggestions job', async () => {
    // Add job
    const job = await queueService.addGenerateSuggestionsJob(1, new Date());
    
    // Wait for processing
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Check job status
    const jobStatus = await job.getState();
    expect(jobStatus).toBe('completed');
  });
});
```

### Performance Testing
```typescript
// Test high load scenarios
describe('Queue Performance', () => {
  it('should handle 1000 jobs efficiently', async () => {
    const startTime = Date.now();
    
    // Add 1000 jobs
    const jobs = [];
    for (let i = 0; i < 1000; i++) {
      jobs.push(await queueService.addGenerateSuggestionsJob(i, new Date()));
    }
    
    // Wait for completion
    await Promise.all(jobs.map(job => job.finished()));
    
    const duration = Date.now() - startTime;
    expect(duration).toBeLessThan(60000); // Should complete in < 1 minute
  });
});
```

## 🚀 Performance Optimization

### Job Batching
```typescript
// Process multiple users in batches
async addBulkGenerateSuggestionsJobs(userIds: number[], targetDate: Date) {
  const jobs = [];
  
  for (const userId of userIds) {
    const job = await this.addGenerateSuggestionsJob(userId, targetDate);
    jobs.push(job);
  }
  
  return jobs;
}
```

### Priority Management
```typescript
// High priority for cleanup jobs
await this.addCleanupJob(targetDate, 10);

// Standard priority for generation jobs
await this.addGenerateSuggestionsJob(userId, targetDate, 0);
```

### Rate Limiting
```typescript
// Configure rate limiting
limiter: {
  max: 1000,        // Maximum 1000 jobs
  duration: 5000,   // Per 5 seconds
}
```

## 🔍 Troubleshooting

### Common Issues

#### Queue Not Processing
```bash
# Check Redis connection
redis-cli ping

# Check queue status
curl -H "Authorization: Bearer <token>" http://localhost:3000/admin/queue/status

# Check logs
tail -f logs/application.log | grep "queue"
```

#### Jobs Stuck in Queue
```bash
# Check job counts
curl -H "Authorization: Bearer <token>" http://localhost:3000/admin/queue/stats

# Clear stuck jobs
curl -X DELETE -H "Authorization: Bearer <token>" http://localhost:3000/admin/queue/clear
```

#### High Memory Usage
```bash
# Check Redis memory usage
redis-cli info memory

# Check queue job counts
curl -H "Authorization: Bearer <token>" http://localhost:3000/admin/queue/stats
```

### Debug Mode
```typescript
// Enable debug logging
const queue = new Bull('suggested-activity', {
  redis: redisConfig,
  debug: true, // Enable debug mode
});

// Check detailed job information
const job = await queue.getJob(jobId);
console.log('Job data:', job.data);
console.log('Job options:', job.opts);
console.log('Job state:', await job.getState());
```

## 📚 Best Practices

### Job Design
- **Keep jobs small**: Break large operations into smaller jobs
- **Handle errors gracefully**: Implement proper error handling and retry logic
- **Use appropriate timeouts**: Set reasonable timeouts for different job types
- **Monitor progress**: Update job progress for long-running operations

### Queue Management
- **Monitor queue health**: Regular health checks and alerting
- **Set appropriate priorities**: Use priorities to manage job importance
- **Implement rate limiting**: Prevent queue overload and system crashes
- **Clean up old jobs**: Regular cleanup of completed and failed jobs

### Performance
- **Optimize job processing**: Efficient algorithms and database queries
- **Use appropriate batch sizes**: Balance between memory usage and performance
- **Monitor resource usage**: Track CPU, memory, and database performance
- **Scale horizontally**: Add more processors for high load scenarios

## 🎯 Conclusion

The Bull Queue implementation provides a robust, scalable, and monitored job processing system for the Suggested Activity Module. Key benefits include:

- **Reliability**: Job persistence and automatic retry mechanisms
- **Scalability**: Horizontal scaling through multiple processors
- **Monitoring**: Comprehensive queue statistics and health checks
- **Admin Control**: Full control over queue operations and status
- **Performance**: Optimized job processing and resource management

The system is production-ready and can handle enterprise-scale workloads with confidence.
