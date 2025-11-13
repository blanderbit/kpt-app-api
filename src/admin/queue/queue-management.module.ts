import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { QueueManagementController } from './queue-management.controller';
import { AdminQueueService } from './admin-queue.service';

@Module({
  imports: [ConfigModule],
  controllers: [QueueManagementController],
  providers: [AdminQueueService],
  exports: [AdminQueueService],
})
export class QueueManagementModule {}

