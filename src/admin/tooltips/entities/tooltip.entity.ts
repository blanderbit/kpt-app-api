import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { OneToMany, RelationCount } from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { UserClosedTooltip } from './user-closed-tooltip.entity';

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
  TEXT = 'text',
  TEXT_WITH_LINK = 'textWithLink',
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

  @OneToMany(() => UserClosedTooltip, (closed) => closed.tooltip)
  closedTooltips: UserClosedTooltip[];

  @RelationCount((tooltip: Tooltip) => tooltip.closedTooltips)
  closedCount: number;

  @CreateDateColumn()
  @ApiProperty({ description: 'Creation timestamp' })
  createdAt: Date;

  @UpdateDateColumn()
  @ApiProperty({ description: 'Last update timestamp' })
  updatedAt: Date;
}
