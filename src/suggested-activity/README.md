# Suggested Activity Module

## Overview

The Suggested Activity Module is responsible for generating personalized activity suggestions for users based on their activity history and preferences. It uses AI-powered analysis to create relevant and engaging activity recommendations.

## Features

- **AI-Powered Generation**: Uses ChatGPT to generate personalized activity content and reasoning
- **Smart Scheduling**: Daily generation at 6:00 AM based on user activity patterns
- **Queue Management**: Bull queue system with Redis for reliable job processing
- **User Pagination**: Efficient processing of large user bases through pagination
- **Admin Controls**: REST API endpoints for queue management and monitoring

## Architecture

### Core Components

- **SuggestedActivityService**: Main business logic for activity generation and management
- **ChatGPTService**: AI integration for content generation
- **SuggestedActivityCronService**: Scheduled tasks and automation
- **SuggestedActivityQueueService**: Queue management and job scheduling
- **SuggestedActivityProcessor**: Bull queue job processors
- **QueueManagementController**: Admin API for queue control

### Data Flow

1. **Daily Generation (6:00 AM)**
   - Cleanup old suggestions
   - Analyze user activity patterns (last 7 days)
   - Generate personalized suggestions for each user
   - Add jobs to Bull queue for processing

2. **Queue Processing**
   - Jobs are processed asynchronously
   - AI content generation via ChatGPT
   - Database updates and user notifications

3. **User Interaction**
   - Users view suggested activities
   - Add activities to their profile
   - Rate and provide feedback

## Configuration

### ChatGPT
To use AI generation, configure OpenAI API:

1. Create `.env` file in project root:
```bash
OPENAI_API_KEY=your-openai-api-key-here
```

2. Or copy `config/third-party/openai.example.json` to `config/third-party/openai.json`

### User Pagination
For optimizing processing of large user bases:

1. Add to `.env`:
```bash
USERS_PAGE_SIZE=100          # User page size
USERS_PAGE_DELAY=2000        # Delay between pages (ms)
```

2. Or copy `config/third-party/users-pagination.example.json`

### Redis Configuration
For Bull queue system:

1. Add to `.env`:
```bash
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=
REDIS_DB=0
REDIS_PREFIX=bull:suggested-activity
```

2. Or copy `config/third-party/redis.example.json`

## Usage

### Automatic Generation

#### Daily Generation (6:00 AM)
- Generates suggestions for all users
- Based on analysis of previous 7 days
- Automatic startup when application starts
- **Cleanup old suggestions before generating new ones**
- **Process users by pagination (100 per page)**
- **Delay between pages to prevent overload**

#### Daily Check (12:00 PM)
- Checks for users without suggestions
- Generates missing suggestions if needed
- Ensures all users have daily recommendations

### Manual Generation

#### Admin CLI Commands
```bash
# Generate suggestions for specific users
npm run cli generate-suggestions --userIds=1,2,3

# Generate suggestions for all users
npm run cli generate-suggestions

# Check generation status
npm run cli check-status
```

#### API Endpoints
```http
# Manual generation for specific users
POST /admin/suggested-activities/generate
{
  "userIds": [1, 2, 3],
  "targetDate": "2024-01-15"
}

# Manual generation for all users
POST /admin/suggested-activities/generate
{
  "targetDate": "2024-01-15"
}
```

### Queue Management

#### Queue Statistics
```http
GET /admin/queue/stats
```

#### Queue Control
```http
POST /admin/queue/pause      # Pause queue
POST /admin/queue/resume     # Resume queue
DELETE /admin/queue/clear    # Clear all jobs
GET /admin/queue/status      # Queue status
```

## API Endpoints

### Suggested Activities
- `GET /suggested-activities` - Get user's suggested activities
- `POST /suggested-activities/:id/add` - Add suggestion to user activities
- `POST /suggested-activities/:id/rate` - Rate suggestion
- `GET /suggested-activities/refresh` - Refresh existing suggestions

### Admin Management
- `GET /admin/suggested-activities` - Get all suggestions
- `POST /admin/suggested-activities/generate` - Manual generation
- `DELETE /admin/suggested-activities/:id` - Delete suggestion

### Queue Management
- `GET /admin/queue/stats` - Queue statistics
- `POST /admin/queue/pause` - Pause queue
- `POST /admin/queue/resume` - Resume queue
- `DELETE /admin/queue/clear` - Clear queue
- `GET /admin/queue/status` - Queue status

## Database Schema

### SuggestedActivity Entity
```typescript
{
  id: number;
  userId: number;
  activityName: string;
  content: string;
  reasoning: string;
  difficulty: 'easy' | 'medium' | 'hard';
  estimatedDuration: number;
  category: string;
  isUsed: boolean;
  createdAt: Date;
  updatedAt: Date;
}
```

### Activity Entity
```typescript
{
  id: number;
  userId: number;
  activityName: string;
  content: string;
  difficulty: 'easy' | 'medium' | 'hard';
  duration: number;
  category: string;
  notes: string;
  createdAt: Date;
  updatedAt: Date;
}
```

## Monitoring

### Logs
- **Generation Process**: Progress tracking and error logging
- **Queue Operations**: Job processing and status updates
- **AI Integration**: ChatGPT API calls and responses
- **Performance Metrics**: Processing time and user counts

### Metrics
- **Queue Statistics**: Job counts, processing rates, failures
- **Generation Performance**: Time per user, success rates
- **AI Usage**: API calls, response times, fallback usage
- **User Engagement**: Suggestion usage, ratings, feedback

### Health Checks
- **Queue Status**: Active, paused, or stopped
- **Redis Connection**: Connection health and performance
- **AI Service**: ChatGPT API availability
- **Database**: Connection and query performance

## Error Handling

### AI Service Failures
- **Fallback Content**: Pre-generated content when AI is unavailable
- **Retry Logic**: Automatic retry for failed API calls
- **Graceful Degradation**: Continue operation without AI features

### Queue Failures
- **Job Retries**: Automatic retry with exponential backoff
- **Dead Letter Queue**: Failed jobs moved to separate queue
- **Error Logging**: Detailed error information for debugging

### Database Issues
- **Connection Retry**: Automatic reconnection attempts
- **Transaction Rollback**: Safe rollback on errors
- **Data Validation**: Input validation and sanitization

## Testing

### Unit Tests
```bash
npm run test suggested-activity
```

### Integration Tests
```bash
npm run test:e2e
```

### Manual Testing
```bash
# Test cron jobs
npm run cli test-cron

# Test queue processing
npm run cli test-queue

# Test AI generation
npm run cli test-ai
```

## Deployment

### Environment Variables
```bash
# Required
OPENAI_API_KEY=your-api-key
REDIS_HOST=redis-host
REDIS_PORT=6379

# Optional
USERS_PAGE_SIZE=100
USERS_PAGE_DELAY=2000
QUEUE_BATCH_SIZE=50
QUEUE_BATCH_DELAY=1000
```

### Docker
```bash
# Build image
docker build -t kpt-app .

# Run with Redis
docker-compose up -d
```

### Health Checks
```bash
# Check queue status
curl http://localhost:3000/admin/queue/status

# Check generation status
curl http://localhost:3000/admin/suggested-activities/status
```

## Troubleshooting

### Common Issues

#### Queue Not Processing
- Check Redis connection
- Verify queue status
- Check job processor logs

#### AI Generation Failing
- Verify OpenAI API key
- Check API rate limits
- Review fallback content

#### Slow Performance
- Adjust pagination settings
- Check database indexes
- Monitor Redis performance

### Debug Mode
```bash
# Enable debug logging
DEBUG=suggested-activity:* npm start

# Check detailed logs
tail -f logs/suggested-activity.log
```

## Contributing

### Code Style
- Follow NestJS conventions
- Use TypeScript strict mode
- Add comprehensive tests
- Update documentation

### Testing
- Write unit tests for new features
- Test with different user counts
- Verify AI integration
- Check queue performance

### Documentation
- Update README files
- Add API documentation
- Include examples
- Document configuration options

## License

This module is part of the KPT Application and follows the same license terms.
