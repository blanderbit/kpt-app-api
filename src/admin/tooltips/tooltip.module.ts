import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TooltipController } from './controllers/tooltip.controller';
import { ProfileTooltipController } from './controllers/public-tooltip.controller';
import { TooltipService } from './services/tooltip.service';
import { Tooltip } from './entities/tooltip.entity';
import { UserClosedTooltip } from './entities/user-closed-tooltip.entity';
import { LanguageModule } from '../languages/language.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Tooltip, UserClosedTooltip]),
    forwardRef(() => LanguageModule),
  ],
  controllers: [TooltipController, ProfileTooltipController],
  providers: [TooltipService],
  exports: [TooltipService],
})
export class TooltipModule {}
