import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TooltipController } from './controllers/tooltip.controller';
import { PublicTooltipController } from './controllers/public-tooltip.controller';
import { TooltipService } from './services/tooltip.service';
import { Tooltip } from './entities/tooltip.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Tooltip])],
  controllers: [TooltipController, PublicTooltipController],
  providers: [TooltipService],
  exports: [TooltipService],
})
export class TooltipModule {}
