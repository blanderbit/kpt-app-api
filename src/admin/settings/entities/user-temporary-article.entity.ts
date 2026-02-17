import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  RelationId,
} from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { User } from '../../../users/entities/user.entity';
import { Article } from '../../articles/entities/article.entity';

@Entity('user_temporary_articles')
export class UserTemporaryArticle {
  @PrimaryGeneratedColumn()
  @ApiProperty({ description: 'Unique identifier' })
  id: number;

  @Column({ type: 'datetime', nullable: true })
  @ApiProperty({ description: 'Expiration date for this temporary article', required: false })
  expiresAt: Date | null;

  @CreateDateColumn()
  @ApiProperty({ description: 'Creation timestamp' })
  createdAt: Date;

  @Column({ type: 'varchar', length: 10, nullable: true })
  @ApiProperty({ description: 'Language code this temporary item is for (e.g. en, ru)' })
  language: string | null;

  // Relations
  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user: User;

  @ManyToOne(() => Article, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'articleId' })
  article: Article;

  // Relation IDs for indexing
  @RelationId((entity: UserTemporaryArticle) => entity.user)
  userId: number;

  @RelationId((entity: UserTemporaryArticle) => entity.article)
  articleId: number;
}

