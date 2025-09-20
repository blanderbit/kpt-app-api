import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TooltipController } from './controllers/tooltip.controller';
import { ProfileTooltipController } from './controllers/public-tooltip.controller';
import { TooltipService } from './services/tooltip.service';
import { Tooltip } from './entities/tooltip.entity';
import { UserClosedTooltip } from './entities/user-closed-tooltip.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Tooltip, UserClosedTooltip])],
  controllers: [TooltipController, ProfileTooltipController],
  providers: [TooltipService],
  exports: [TooltipService],
})
export class TooltipModule {}
