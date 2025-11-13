import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';

@Entity('files')
export class File {
  // Article relation (optional - file can belong to article or other entities)
  @PrimaryGeneratedColumn()
  @ApiProperty({ description: 'Unique identifier for the file' })
  id: number;

  @Column({ length: 255 })
  @ApiProperty({ description: 'File name' })
  fileName: string;

  @Column({ type: 'text' })
  @ApiProperty({ description: 'File URL' })
  fileUrl: string;

  @Column({ type: 'varchar', length: 255 })
  @ApiProperty({ description: 'File key in storage' })
  fileKey: string;

  @Column({ type: 'varchar', length: 100 })
  @ApiProperty({ description: 'File MIME type' })
  mimeType: string;

  @Column({ type: 'int' })
  @ApiProperty({ description: 'File size in bytes' })
  size: number;

  @Column({ type: 'varchar', length: 50, nullable: true })
  @ApiProperty({ description: 'Entity type this file belongs to (e.g., article, profile)', required: false })
  entityType: string | null;

  @Column({ type: 'int', nullable: true, name: 'entity_id' })
  @ApiProperty({ description: 'Entity ID this file belongs to', required: false })
  entityId: number | null;

  @Column({ type: 'int', nullable: true, name: 'articleId' })
  @ApiProperty({ description: 'Article ID this file belongs to', required: false })
  articleId: number | null;

  @Column({ type: 'int', nullable: true, name: 'surveyId' })
  @ApiProperty({ description: 'Survey ID this file belongs to', required: false })
  surveyId: number | null;

  // Relations
  @ManyToOne(() => {
    // Dynamic import to avoid circular dependency
    return require('../../admin/articles/entities/article.entity').Article;
  }, (article: any) => article.files, { onDelete: 'CASCADE', nullable: true })
  @JoinColumn({ name: 'articleId' })
  @ApiProperty({ description: 'Article this file belongs to', required: false })
  article?: any;

  @ManyToOne(() => {
    return require('../../admin/survey/entities/survey.entity').Survey;
  }, (survey: any) => survey.files, { onDelete: 'CASCADE', nullable: true })
  @JoinColumn({ name: 'surveyId' })
  @ApiProperty({ description: 'Survey this file belongs to', required: false })
  survey?: any;

  @CreateDateColumn()
  @ApiProperty({ description: 'File creation timestamp' })
  createdAt: Date;

  @UpdateDateColumn()
  @ApiProperty({ description: 'File last update timestamp' })
  updatedAt: Date;
}

