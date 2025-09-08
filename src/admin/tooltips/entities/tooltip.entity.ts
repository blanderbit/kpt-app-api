import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';

// Enum for tooltip pages
export enum TooltipPage {
  DASHBOARD = 'dashboard',
  PROFILE = 'profile',
  SETTINGS = 'settings',
  ACTIVITIES = 'activities',
  MOOD_TRACKER = 'mood-tracker',
  ANALYTICS = 'analytics',
  HELP = 'help',
  ONBOARDING = 'onboarding',
  TUTORIAL = 'tutorial',
  WELCOME = 'welcome'
}

// Enum for tooltip types
export enum TooltipType {
  SWIPE = 'swipe',
  TEXT = 'text'
}

@Entity('tooltips')
export class Tooltip {
  @PrimaryGeneratedColumn()
  @ApiProperty({ description: 'Unique identifier for the tooltip' })
  id: number;

  @Column({ 
    type: 'enum', 
    nullable: false,
    enum: TooltipType
  })
  @ApiProperty({ 
    description: 'Type of the tooltip',
    enum: TooltipType,
    example: TooltipType.SWIPE
  })
  type: TooltipType;

  @Column({ 
    type: 'enum', 
    nullable: false,
    enum: TooltipPage
  })
  @ApiProperty({ 
    description: 'Page where the tooltip is displayed',
    enum: TooltipPage,
    example: TooltipPage.DASHBOARD
  })
  page: TooltipPage;

  @Column({ type: 'json', nullable: false })
  @ApiProperty({ description: 'Tooltip content in JSON format based on type' })
  json: any;

  @CreateDateColumn()
  @ApiProperty({ description: 'Creation timestamp' })
  createdAt: Date;

  @UpdateDateColumn()
  @ApiProperty({ description: 'Last update timestamp' })
  updatedAt: Date;
}
