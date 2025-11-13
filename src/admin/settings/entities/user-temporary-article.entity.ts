import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { User } from '../../../users/entities/user.entity';
import { Article } from '../../articles/entities/article.entity';

@Entity('user_temporary_articles')
@Index(['userId', 'articleId'])
export class UserTemporaryArticle {
  @PrimaryGeneratedColumn()
  @ApiProperty({ description: 'Unique identifier' })
  id: number;

  @Column({ name: 'user_id' })
  @ApiProperty({ description: 'User ID' })
  userId: number;

  @Column({ name: 'article_id' })
  @ApiProperty({ description: 'Article ID' })
  articleId: number;

  @Column({ type: 'datetime', nullable: true })
  @ApiProperty({ description: 'Expiration date for this temporary article', required: false })
  expiresAt: Date | null;

  @CreateDateColumn()
  @ApiProperty({ description: 'Creation timestamp' })
  createdAt: Date;

  // Relations
  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user: User;

  @ManyToOne(() => Article, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'articleId' })
  article: Article;
}

