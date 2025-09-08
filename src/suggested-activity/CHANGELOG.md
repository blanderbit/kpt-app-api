# Changelog

All notable changes to the Suggested Activity Module will be documented in this file.

## [1.0.0] - 2024-01-15

### Added
- **AI-Powered Generation**: Integration with ChatGPT for dynamic content generation
- **Smart Scheduling**: Daily generation at 6:00 AM based on user activity patterns
- **Queue System**: Bull queue with Redis for reliable job processing
- **User Pagination**: Efficient processing of large user bases through pagination
- **Admin Controls**: REST API endpoints for queue management and monitoring
- **Fallback Content**: Pre-generated content when AI services are unavailable
- **Comprehensive Logging**: Detailed logging for all operations and errors

### Changed
- **getUserSuggestedActivities**: Now returns suggestions only for the current day
- **addSuggestedActivityToActivities**: Removes suggestions after use and enforces daily limit of 10
- **refreshSuggestedActivities**: Updates only existing suggestions instead of regenerating all
- **generateSuggestedActivities**: Made public for cron job execution
- **AI Integration**: Combined `analyzeActivityPatterns` and `generateSingleSuggestion` into single AI-driven function

### Removed
- Manual cron implementation using `setInterval`/`setTimeout`
- `cleanupOldSuggestions` cron job (integrated into main generation)
- `checkAndRestoreSuggestions` cron job and related queue methods
- `addCheckAndRestoreJob` and `addBulkCheckAndRestoreJobs` methods

### Technical Improvements
- **Performance**: User pagination prevents memory overflow with large user bases
- **Reliability**: Bull queue ensures job persistence and retry mechanisms
- **Scalability**: Configurable page sizes and delays for different environments
- **Monitoring**: Real-time queue statistics and status endpoints
- **Error Handling**: Graceful degradation and comprehensive error logging

## [0.9.0] - 2024-01-10

### Added
- Initial implementation of suggested activity service
- Basic CRUD operations for suggested activities
- User activity pattern analysis
- Manual suggestion generation

### Changed
- Basic scheduling with manual cron implementation
- Simple user activity tracking

### Technical Notes
- Used manual `setInterval` for scheduling (deprecated)
- No queue system for job processing
- Limited error handling and monitoring

## [0.8.0] - 2024-01-05

### Added
- User activity entity and service
- Basic mood tracking functionality
- Activity type management

### Technical Notes
- Foundation for activity suggestion system
- Basic database schema implementation

## Migration Guide

### From 0.9.0 to 1.0.0

#### Environment Variables
Add the following to your `.env` file:
```bash
# OpenAI Configuration
OPENAI_API_KEY=your-openai-api-key

# Redis Configuration
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=
REDIS_DB=0
REDIS_PREFIX=bull:suggested-activity

# User Pagination
USERS_PAGE_SIZE=100
USERS_PAGE_DELAY=2000
```

#### Database Changes
No database schema changes required. The existing entities are compatible.

#### API Changes
- `getUserSuggestedActivities` no longer accepts `date` parameter
- New admin endpoints for queue management
- Enhanced error responses with detailed information

#### Cron Jobs
- Old manual cron implementation removed
- New `@nestjs/schedule` implementation with Bull queue integration
- Automatic cleanup and generation at 6:00 AM daily

### Breaking Changes
- **getUserSuggestedActivities**: Removed `date` parameter, now returns current day only
- **addSuggestedActivityToActivities**: Now removes suggestions after use
- **Cron Implementation**: Complete replacement of manual scheduling with `@nestjs/schedule`

### Deprecations
- Manual cron methods removed
- `setInterval`/`setTimeout` scheduling deprecated
- Direct service calls for bulk operations deprecated

## Future Plans

### Version 1.1.0
- Advanced AI prompt engineering
- User preference learning
- Activity recommendation algorithms
- Performance optimization for very large user bases

### Version 1.2.0
- Multi-language support for AI generation
- Advanced queue prioritization
- Real-time user activity streaming
- Machine learning integration

### Version 2.0.0
- Microservice architecture
- Event-driven architecture
- Advanced caching strategies
- Horizontal scaling support
