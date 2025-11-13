import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  Index,
} from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';

@Entity('user_hidden_articles')
@Index(['userId', 'articleId'], { unique: true })
export class UserHiddenArticle {
  @PrimaryGeneratedColumn()
  @ApiProperty({ description: 'Unique identifier' })
  id: number;

  @Column({ name: 'user_id' })
  @ApiProperty({ description: 'User ID' })
  userId: number;

  @Column({ name: 'article_id' })
  @ApiProperty({ description: 'Article ID' })
  articleId: number;

  @CreateDateColumn()
  @ApiProperty({ description: 'Hide timestamp' })
  createdAt: Date;
}

