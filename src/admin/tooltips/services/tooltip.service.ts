import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Transactional } from 'typeorm-transactional';
import { Tooltip, TooltipType, TooltipPage } from '../entities/tooltip.entity';
import { UserClosedTooltip } from '../entities/user-closed-tooltip.entity';
import { User } from '../../../users/entities/user.entity';
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
    @InjectRepository(UserClosedTooltip)
    private readonly userClosedTooltipRepository: Repository<UserClosedTooltip>,
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

  async findByPage(page: TooltipPage, userId?: number): Promise<Tooltip[]> {
    try {
      const query = this.tooltipRepository
        .createQueryBuilder('tooltip')
        .where('tooltip.page = :page', { page })
        .orderBy('tooltip.createdAt', 'DESC');

      // Если пользователь авторизован, исключаем закрытые им тултипы
      if (userId) {
        query
          .leftJoin(UserClosedTooltip, 'closed', 'closed.tooltipId = tooltip.id AND closed.userId = :userId', { userId })
          .andWhere('closed.id IS NULL');
      }

      return await query.getMany();
    } catch (error) {
      throw AppException.internal(ErrorCode.ADMIN_INTERNAL_SERVER_ERROR, undefined, {
        error: error.message,
        operation: 'findByPage',
        page,
        userId
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

  async findByTypeAndPage(type: TooltipType, page: TooltipPage, userId?: number): Promise<Tooltip[]> {
    try {
      const query = this.tooltipRepository
        .createQueryBuilder('tooltip')
        .where('tooltip.type = :type', { type })
        .andWhere('tooltip.page = :page', { page })
        .orderBy('tooltip.createdAt', 'DESC');

      // Если пользователь авторизован, исключаем закрытые им тултипы
      if (userId) {
        query
          .leftJoin(UserClosedTooltip, 'closed', 'closed.tooltipId = tooltip.id AND closed.userId = :userId', { userId })
          .andWhere('closed.id IS NULL');
      }

      return await query.getMany();
    } catch (error) {
      throw AppException.internal(ErrorCode.ADMIN_INTERNAL_SERVER_ERROR, undefined, {
        error: error.message,
        operation: 'findByTypeAndPage',
        type,
        page,
        userId
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

  /**
   * Закрывает тултип для пользователя (добавляет в список скрытых)
   */
  @Transactional()
  async closeTooltipForUser(tooltipId: number, user: User): Promise<{ message: string }> {
    try {
      // Проверяем, существует ли тултип
      const tooltip = await this.tooltipRepository.findOne({ where: { id: tooltipId } });
      if (!tooltip) {
        throw AppException.notFound(ErrorCode.ADMIN_TOOLTIP_NOT_FOUND, 'Tooltip not found');
      }

      // Проверяем, не закрыт ли уже тултип этим пользователем
      const existingClosed = await this.userClosedTooltipRepository.findOne({
        where: { 
          tooltip: { id: tooltipId },
          user: { id: user.id }
        }
      });

      if (existingClosed) {
        return { message: 'Tooltip already closed for this user' };
      }

      // Создаем запись о закрытом тултипе
      const closedTooltip = this.userClosedTooltipRepository.create({
        tooltip,
        user
      });

      await this.userClosedTooltipRepository.save(closedTooltip);
      
      return { message: 'Tooltip closed successfully' };
    } catch (error) {
      if (error instanceof AppException) {
        throw error;
      }
      
      throw AppException.internal(ErrorCode.ADMIN_TOOLTIP_UPDATE_FAILED, undefined, {
        error: error.message,
        operation: 'closeTooltipForUser',
        tooltipId,
        userId: user.id
      });
    }
  }
}
