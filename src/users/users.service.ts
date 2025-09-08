import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './entities/user.entity';
import { RoleService } from './services/role.service';
import { PaginateQuery, paginate, Paginated } from 'nestjs-paginate';
import { usersConfig } from './users.config';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
  ) {}

  async findById(id: number): Promise<User> {
    const user = await this.usersRepository.findOne({ where: { id } });
    if (!user) {
      throw new NotFoundException('User not found');
    }
    return user;
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.usersRepository.findOne({ where: { email } });
  }

  async create(userData: Partial<User>): Promise<User> {
    const user = this.usersRepository.create(userData);
    return this.usersRepository.save(user);
  }

  async update(id: number, userData: Partial<User>): Promise<User> {
    await this.usersRepository.update(id, userData);
    return this.findById(id);
  }

  async delete(id: number): Promise<void> {
    const result = await this.usersRepository.delete(id);
    if (result.affected === 0) {
      throw new NotFoundException('User not found');
    }
  }

  /**
   * Find all administrators with pagination
   * Uses nestjs-paginate for efficient data loading
   */
  async findAdmins(query: PaginateQuery): Promise<Paginated<User>> {
    const queryBuilder = this.usersRepository
      .createQueryBuilder('user')
      .where('JSON_CONTAINS(user.roles, :role)', { role: '"admin"' })
      .orderBy('user.createdAt', 'DESC');

    return paginate(query, queryBuilder, usersConfig);
  }

  /**
   * Find all users with pagination
   * Uses nestjs-paginate for efficient data loading
   */
  async findUsers(query: PaginateQuery): Promise<Paginated<User>> {
    const queryBuilder = this.usersRepository
      .createQueryBuilder('user')
      .orderBy('user.createdAt', 'DESC');

    return paginate(query, queryBuilder, usersConfig);
  }

  /**
   * Get users with pagination for cron jobs
   * Optimized for bulk processing
   */
  async findUsersWithPagination(page: number = 1, limit: number = 100): Promise<{ users: User[]; total: number }> {
    const skip = (page - 1) * limit;
    
    const [users, total] = await this.usersRepository.findAndCount({
      select: ['id', 'email', 'createdAt'], // Select only needed fields
      skip,
      take: limit,
      order: { createdAt: 'DESC' },
      // where: { isActive: true }, // Only active users TODO need to check
    });

    return { users, total };
  }

  /**
   * Find all users without pagination
   * Use findUsers() with pagination for better performance
   * @deprecated Use findUsers() with pagination instead
   */
  async findAll(): Promise<User[]> {
    return this.usersRepository.find({
      order: { createdAt: 'DESC' },
    });
  }
}
