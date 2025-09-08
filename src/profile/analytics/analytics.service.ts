import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Activity } from '../activity/entities/activity.entity';
import { RateActivity } from '../activity/entities/rate-activity.entity';
import { MoodTracker } from '../mood-tracker/entities/mood-tracker.entity';

@Injectable()
export class AnalyticsService {
  constructor(
    @InjectRepository(Activity)
    private readonly activityRepository: Repository<Activity>,
    @InjectRepository(RateActivity)
    private readonly rateActivityRepository: Repository<RateActivity>,
    @InjectRepository(MoodTracker)
    private readonly moodTrackerRepository: Repository<MoodTracker>,
  ) {}

  /**
   * Получить количество дней с выполненными задачами
   */
  async getCompletedTasksDays(
    userId: number,
    startDate?: Date,
    endDate?: Date,
  ): Promise<{
    totalDays: number;
    completedDays: number;
    completionRate: number;
    period: { start: Date; end: Date };
  }> {
    // Определяем период анализа
    const period = this.getAnalysisPeriod(startDate, endDate);
    
    // Получаем количество дней в периоде
    const totalDays = Math.ceil((period.end.getTime() - period.start.getTime()) / (1000 * 60 * 60 * 24)) + 1;

    // Строим query для подсчета уникальных дней с выполненными задачами
    const queryBuilder = this.activityRepository
      .createQueryBuilder('activity')
      .select('DATE(activity.closedAt)', 'closedDate')
      .where('activity.userId = :userId', { userId })
      .andWhere('activity.status = :status', { status: 'closed' })
      .andWhere('activity.closedAt IS NOT NULL');

    if (startDate) {
      queryBuilder.andWhere('activity.closedAt >= :startDate', { startDate: period.start });
    }
    if (endDate) {
      queryBuilder.andWhere('activity.closedAt <= :endDate', { endDate: period.end });
    }

    const completedDaysResult = await queryBuilder
      .distinct()
      .getRawMany();

    const completedDays = completedDaysResult.length;
    const completionRate = totalDays > 0 ? (completedDays / totalDays) * 100 : 0;

    return {
      totalDays,
      completedDays,
      completionRate: Math.round(completionRate * 100) / 100,
      period,
    };
  }

  /**
   * Получить количество выполненных задач
   */
  async getCompletedTasksCount(
    userId: number,
    startDate?: Date,
    endDate?: Date,
  ): Promise<{
    totalTasks: number;
    completedTasks: number;
    completionRate: number;
    period: { start: Date; end: Date };
  }> {
    // Определяем период анализа
    const period = this.getAnalysisPeriod(startDate, endDate);

    // Получаем общее количество задач пользователя
    const totalTasksQuery = this.activityRepository
      .createQueryBuilder('activity')
      .where('activity.userId = :userId', { userId });

    if (startDate) {
      totalTasksQuery.andWhere('activity.createdAt >= :startDate', { startDate: period.start });
    }
    if (endDate) {
      totalTasksQuery.andWhere('activity.createdAt <= :endDate', { endDate: period.end });
    }

    const totalTasks = await totalTasksQuery.getCount();

    // Получаем количество выполненных задач
    const completedTasksQuery = this.activityRepository
      .createQueryBuilder('activity')
      .where('activity.userId = :userId', { userId })
      .andWhere('activity.status = :status', { status: 'closed' });

    if (startDate) {
      completedTasksQuery.andWhere('activity.closedAt >= :startDate', { startDate: period.start });
    }
    if (endDate) {
      completedTasksQuery.andWhere('activity.closedAt <= :endDate', { endDate: period.end });
    }

    const completedTasks = await completedTasksQuery.getCount();

    const completionRate = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;

    return {
      totalTasks,
      completedTasks,
      completionRate: Math.round(completionRate * 100) / 100,
      period,
    };
  }

  /**
   * Получить средние показатели RateActivity
   */
  async getRateActivityAverages(
    userId: number,
    startDate?: Date,
    endDate?: Date,
  ): Promise<{
    averageSatisfactionLevel: number;
    averageHardnessLevel: number;
    totalRateActivities: number;
    period: { start: Date; end: Date };
    satisfactionDistribution: Record<string, number>;
    hardnessDistribution: Record<string, number>;
  }> {
    // Определяем период анализа
    const period = this.getAnalysisPeriod(startDate, endDate);

    // Получаем все RateActivity пользователя за период
    const rateActivitiesQuery = this.rateActivityRepository
      .createQueryBuilder('rateActivity')
      .leftJoin('rateActivity.activity', 'activity')
      .where('activity.userId = :userId', { userId });

    if (startDate) {
      rateActivitiesQuery.andWhere('activity.closedAt >= :startDate', { startDate: period.start });
    }
    if (endDate) {
      rateActivitiesQuery.andWhere('activity.closedAt <= :endDate', { endDate: period.end });
    }

    const rateActivities = await rateActivitiesQuery.getMany();

    if (rateActivities.length === 0) {
      return {
        averageSatisfactionLevel: 0,
        averageHardnessLevel: 0,
        totalRateActivities: 0,
        period,
        satisfactionDistribution: {},
        hardnessDistribution: {},
      };
    }

    // Вычисляем средние значения
    let totalSatisfaction = 0;
    let totalHardness = 0;
    const satisfactionDistribution: Record<string, number> = {};
    const hardnessDistribution: Record<string, number> = {};

    rateActivities.forEach(rateActivity => {
      totalSatisfaction += rateActivity.satisfactionLevel;
      totalHardness += rateActivity.hardnessLevel;

      // Распределение по satisfactionLevel (группируем по диапазонам)
      const satisfactionRange = this.getSatisfactionRange(rateActivity.satisfactionLevel);
      satisfactionDistribution[satisfactionRange] = (satisfactionDistribution[satisfactionRange] || 0) + 1;

      // Распределение по hardnessLevel (группируем по диапазонам)
      const hardnessRange = this.getHardnessRange(rateActivity.hardnessLevel);
      hardnessDistribution[hardnessRange] = (hardnessDistribution[hardnessRange] || 0) + 1;
    });

    const averageSatisfactionLevel = totalSatisfaction / rateActivities.length;
    const averageHardnessLevel = totalHardness / rateActivities.length;

    return {
      averageSatisfactionLevel: Math.round(averageSatisfactionLevel * 100) / 100,
      averageHardnessLevel: Math.round(averageHardnessLevel * 100) / 100,
      totalRateActivities: rateActivities.length,
      period,
      satisfactionDistribution,
      hardnessDistribution,
    };
  }

  /**
   * Получить общий обзор аналитики
   */
  async getAnalyticsOverview(
    userId: number,
    startDate?: Date,
    endDate?: Date,
  ): Promise<{
    period: { start: Date; end: Date };
    tasks: {
      total: number;
      completed: number;
      completionRate: number;
      completedDays: number;
      totalDays: number;
      daysCompletionRate: number;
    };
    rateActivity: {
      total: number;
      averageSatisfaction: number;
      averageHardness: number;
      satisfactionDistribution: Record<string, number>;
      hardnessDistribution: Record<string, number>;
    };
    summary: {
      productivityScore: number;
      satisfactionTrend: string;
      recommendations: string[];
    };
  }> {
    // Получаем все метрики
    const [tasksDays, tasksCount, rateActivity] = await Promise.all([
      this.getCompletedTasksDays(userId, startDate, endDate),
      this.getCompletedTasksCount(userId, startDate, endDate),
      this.getRateActivityAverages(userId, startDate, endDate),
    ]);

    // Вычисляем общий продуктивности
    const productivityScore = this.calculateProductivityScore(
      tasksCount.completionRate,
      tasksDays.completionRate,
      rateActivity.averageSatisfactionLevel,
    );

    // Определяем тренд удовлетворенности
    const satisfactionTrend = this.getSatisfactionTrend(rateActivity.averageSatisfactionLevel);

    // Генерируем рекомендации
    const recommendations = this.generateRecommendations(
      tasksCount.completionRate,
      tasksDays.completionRate,
      rateActivity.averageSatisfactionLevel,
      rateActivity.averageHardnessLevel,
    );

    return {
      period: tasksDays.period,
      tasks: {
        total: tasksCount.totalTasks,
        completed: tasksCount.completedTasks,
        completionRate: tasksCount.completionRate,
        completedDays: tasksDays.completedDays,
        totalDays: tasksDays.totalDays,
        daysCompletionRate: tasksDays.completionRate,
      },
      rateActivity: {
        total: rateActivity.totalRateActivities,
        averageSatisfaction: rateActivity.averageSatisfactionLevel,
        averageHardness: rateActivity.averageHardnessLevel,
        satisfactionDistribution: rateActivity.satisfactionDistribution,
        hardnessDistribution: rateActivity.hardnessDistribution,
      },
      summary: {
        productivityScore: Math.round(productivityScore * 100) / 100,
        satisfactionTrend,
        recommendations,
      },
    };
  }

  /**
   * Определить период анализа
   */
  private getAnalysisPeriod(startDate?: Date, endDate?: Date): { start: Date; end: Date } {
    const now = new Date();
    
    if (!startDate) {
      startDate = new Date();
      startDate.setMonth(startDate.getMonth() - 1); // По умолчанию последний месяц
    }
    
    if (!endDate) {
      endDate = now;
    }

    // Нормализуем даты
    const start = new Date(startDate);
    start.setHours(0, 0, 0, 0);
    
    const end = new Date(endDate);
    end.setHours(23, 59, 59, 999);

    return { start, end };
  }

  /**
   * Получить диапазон satisfactionLevel
   */
  private getSatisfactionRange(level: number): string {
    if (level >= 80) return '80-100% (Отлично)';
    if (level >= 60) return '60-79% (Хорошо)';
    if (level >= 40) return '40-59% (Удовлетворительно)';
    if (level >= 20) return '20-39% (Плохо)';
    return '0-19% (Очень плохо)';
  }

  /**
   * Получить диапазон hardnessLevel
   */
  private getHardnessRange(level: number): string {
    if (level >= 80) return '80-100% (Очень сложно)';
    if (level >= 60) return '60-79% (Сложно)';
    if (level >= 40) return '40-59% (Средне)';
    if (level >= 20) return '20-39% (Легко)';
    return '0-19% (Очень легко)';
  }

  /**
   * Вычислить общий скор продуктивности
   */
  private calculateProductivityScore(
    taskCompletionRate: number,
    daysCompletionRate: number,
    averageSatisfaction: number,
  ): number {
    // Взвешенная формула: задачи (40%) + дни (30%) + удовлетворенность (30%)
    const taskScore = (taskCompletionRate / 100) * 0.4;
    const daysScore = (daysCompletionRate / 100) * 0.3;
    const satisfactionScore = (averageSatisfaction / 100) * 0.3;
    
    return (taskScore + daysScore + satisfactionScore) * 100;
  }

  /**
   * Определить тренд удовлетворенности
   */
  private getSatisfactionTrend(averageSatisfaction: number): string {
    if (averageSatisfaction >= 80) return 'Высокий уровень удовлетворенности';
    if (averageSatisfaction >= 60) return 'Хороший уровень удовлетворенности';
    if (averageSatisfaction >= 40) return 'Средний уровень удовлетворенности';
    if (averageSatisfaction >= 20) return 'Низкий уровень удовлетворенности';
    return 'Очень низкий уровень удовлетворенности';
  }

  /**
   * Генерировать рекомендации
   */
  private generateRecommendations(
    taskCompletionRate: number,
    daysCompletionRate: number,
    averageSatisfaction: number,
    averageHardness: number,
  ): string[] {
    const recommendations: string[] = [];

    if (taskCompletionRate < 50) {
      recommendations.push('Попробуйте разбить большие задачи на более мелкие подзадачи');
      recommendations.push('Установите более реалистичные сроки выполнения');
    }

    if (daysCompletionRate < 30) {
      recommendations.push('Старайтесь выполнять хотя бы одну задачу каждый день');
      recommendations.push('Создайте ежедневный ритуал планирования задач');
    }

    if (averageSatisfaction < 50) {
      recommendations.push('Выбирайте задачи, которые действительно вас интересуют');
      recommendations.push('Чередуйте сложные и простые задачи');
    }

    if (averageHardness > 80) {
      recommendations.push('Добавьте больше простых задач для баланса');
      recommendations.push('Не бойтесь просить помощи с очень сложными задачами');
    }

    if (averageHardness < 20) {
      recommendations.push('Попробуйте браться за более сложные задачи для развития');
      recommendations.push('Установите более амбициозные цели');
    }

    if (recommendations.length === 0) {
      recommendations.push('Отличная работа! Продолжайте в том же духе');
    }

    return recommendations;
  }
}
