import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Transactional } from 'typeorm-transactional';
import { Tooltip, TooltipType, TooltipPage } from '../entities/tooltip.entity';
import { CreateTooltipDto } from '../dto/create-tooltip.dto';
import { UpdateTooltipDto } from '../dto/update-tooltip.dto';
import { SearchTooltipDto } from '../dto/search-tooltip.dto';
import { AppException } from '../../../common/exceptions/app.exception';
import { ErrorCode } from '../../../common/error-codes';

@Injectable()
export class TooltipService {
  constructor(
    @InjectRepository(Tooltip)
    private readonly tooltipRepository: Repository<Tooltip>,
  ) {}

  @Transactional()
  async create(createTooltipDto: CreateTooltipDto): Promise<Tooltip> {
    try {
      // Validation is now handled automatically by NestJS DTOs
      const tooltip = this.tooltipRepository.create(createTooltipDto);
      return await this.tooltipRepository.save(tooltip);
    } catch (error) {
      throw AppException.internal(ErrorCode.ADMIN_TOOLTIP_CREATION_FAILED, undefined, {
        error: error.message,
        operation: 'createTooltip'
      });
    }
  }

  async findAll(searchDto?: SearchTooltipDto): Promise<Tooltip[]> {
    try {
      const where: any = {};

      if (searchDto?.type) {
        where.type = searchDto.type;
      }

      if (searchDto?.page) {
        where.page = searchDto.page;
      }

      return await this.tooltipRepository.find({
        where,
        order: { createdAt: 'DESC' },
      });
    } catch (error) {
      throw AppException.internal(ErrorCode.ADMIN_INTERNAL_SERVER_ERROR, undefined, {
        error: error.message,
        operation: 'findAllTooltips'
      });
    }
  }

  async findByPage(page: TooltipPage): Promise<Tooltip[]> {
    try {
      return await this.tooltipRepository.find({
        where: { page },
        order: { createdAt: 'DESC' },
      });
    } catch (error) {
      throw AppException.internal(ErrorCode.ADMIN_INTERNAL_SERVER_ERROR, undefined, {
        error: error.message,
        operation: 'findByPage',
        page
      });
    }
  }

  async findOne(id: number): Promise<Tooltip> {
    try {
      const tooltip = await this.tooltipRepository.findOne({ where: { id } });
      if (!tooltip) {
        throw AppException.notFound(ErrorCode.ADMIN_TOOLTIP_NOT_FOUND, undefined, {
          tooltipId: id
        });
      }
      return tooltip;
    } catch (error) {
      if (error instanceof AppException) {
        throw error;
      }
      throw AppException.internal(ErrorCode.ADMIN_INTERNAL_SERVER_ERROR, undefined, {
        error: error.message,
        operation: 'findOneTooltip',
        tooltipId: id
      });
    }
  }

  @Transactional()
  async update(id: number, updateTooltipDto: UpdateTooltipDto): Promise<Tooltip> {
    try {
      const tooltip = await this.findOne(id);

      // Validation is handled automatically by NestJS DTOs
      Object.assign(tooltip, updateTooltipDto);
      return await this.tooltipRepository.save(tooltip);
    } catch (error) {
      if (error instanceof AppException) {
        throw error;
      }
      throw AppException.internal(ErrorCode.ADMIN_TOOLTIP_UPDATE_FAILED, undefined, {
        error: error.message,
        operation: 'updateTooltip',
        tooltipId: id
      });
    }
  }

  @Transactional()
  async remove(id: number): Promise<void> {
    try {
      const tooltip = await this.findOne(id);
      await this.tooltipRepository.remove(tooltip);
    } catch (error) {
      if (error instanceof AppException) {
        throw error;
      }
      throw AppException.internal(ErrorCode.ADMIN_TOOLTIP_DELETION_FAILED, undefined, {
        error: error.message,
        operation: 'removeTooltip',
        tooltipId: id
      });
    }
  }

  async findByTypeAndPage(type: TooltipType, page: TooltipPage): Promise<Tooltip[]> {
    try {
      return await this.tooltipRepository.find({
        where: { type, page },
        order: { createdAt: 'DESC' },
      });
    } catch (error) {
      throw AppException.internal(ErrorCode.ADMIN_INTERNAL_SERVER_ERROR, undefined, {
        error: error.message,
        operation: 'findByTypeAndPage',
        type,
        page
      });
    }
  }

  async getTooltipTypes(): Promise<TooltipType[]> {
    try {
      const result = await this.tooltipRepository
        .createQueryBuilder('tooltip')
        .select('DISTINCT tooltip.type', 'type')
        .getRawMany();
      
      return result.map(item => item.type);
    } catch (error) {
      throw AppException.internal(ErrorCode.ADMIN_INTERNAL_SERVER_ERROR, undefined, {
        error: error.message,
        operation: 'getTooltipTypes'
      });
    }
  }

  async getPages(): Promise<TooltipPage[]> {
    try {
      const result = await this.tooltipRepository
        .createQueryBuilder('tooltip')
        .select('DISTINCT tooltip.page', 'page')
        .getRawMany();
      
      return result.map(item => item.page);
    } catch (error) {
      throw AppException.internal(ErrorCode.ADMIN_INTERNAL_SERVER_ERROR, undefined, {
        error: error.message,
        operation: 'getPages'
      });
    }
  }
}
