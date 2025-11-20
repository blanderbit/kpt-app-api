import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
} from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { File } from '../../../common/entities/file.entity';

export enum ArticleStatus {
  ACTIVE = 'active',
  ARCHIVED = 'archived',
  AVAILABLE = 'available',
}

@Entity('articles')
export class Article {
  @PrimaryGeneratedColumn()
  @ApiProperty({ description: 'Unique identifier for the article' })
  id: number;

  @Column({ length: 255 })
  @ApiProperty({ description: 'Article title' })
  title: string;

  @Column({ type: 'text' })
  @ApiProperty({ description: 'Article text content' })
  text: string;

  @Column({ type: 'enum', enum: ArticleStatus, default: ArticleStatus.AVAILABLE })
  @ApiProperty({ description: 'Article status', enum: ArticleStatus, default: ArticleStatus.AVAILABLE })
  status: ArticleStatus;

  @Column({ type: 'varchar', length: 10, nullable: true })
  @ApiProperty({ description: 'Language code for the article', example: 'en' })
  language: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  @ApiProperty({ description: 'User who last updated the article', required: false })
  updatedBy: string;

  @CreateDateColumn()
  @ApiProperty({ description: 'Article creation timestamp' })
  createdAt: Date;

  @UpdateDateColumn()
  @ApiProperty({ description: 'Article last update timestamp' })
  updatedAt: Date;

  @Column({ type: 'datetime', nullable: true })
  @ApiProperty({ description: 'Article archival timestamp', required: false })
  archivedAt: Date | null;

  @Column({ type: 'varchar', length: 255, nullable: true })
  @ApiProperty({ description: 'User who archived the article', required: false })
  archivedBy: string | null;

  @OneToMany(() => File, (file) => file.article, { cascade: true })
  @ApiProperty({ description: 'Article files', type: () => [File], required: false })
  files?: File[];
}

