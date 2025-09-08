import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { GoogleDriveFilesService } from '../../common/services/google-drive-files.service';
import { ErrorCode } from '../../common/error-codes';
import { AppException } from '../../common/exceptions/app.exception';

export interface ActivityType {
  id: string;
  name: string;
  description: string;
  keywords: string[];
  category: string;
  icon: string;
  color: string;
}

export interface ActivityTypesData {
  activityTypes: ActivityType[];
  categories: Record<string, string>;
}

@Injectable()
export class ActivityTypesService {
  private readonly logger = new Logger(ActivityTypesService.name);
  private activityTypesData: ActivityTypesData;
  private readonly fileId: string;

  constructor(
    private readonly configService: ConfigService,
    private readonly googleDriveFilesService: GoogleDriveFilesService,
  ) {
    this.fileId = this.configService.get<string>('ACTIVITY_TYPES_FILE_ID') || '';
    this.loadActivityTypes();
  }

  /**
   * Loads activity types from Google Drive
   */
  private async loadActivityTypes(): Promise<void> {
    try {
      // Load from Google Drive
      if (this.fileId && this.googleDriveFilesService.isAvailable()) {
        this.logger.log('Loading activity types from Google Drive');
        this.activityTypesData = await this.googleDriveFilesService.getFileContent(this.fileId);
        return;
      }

      // If Google Drive is unavailable, use basic types
      this.logger.warn('Google Drive not available, using fallback activity types');
      this.activityTypesData = {
        activityTypes: [
          {
            id: 'general',
            name: 'General activities',
            description: 'Other types of activities',
            keywords: ['activity', 'task', 'occupation'],
            category: 'other',
            icon: '⭐',
            color: '#9E9E9E'
          }
        ],
        categories: {
          'other': 'Other'
        }
      };
    } catch (error) {
      this.logger.error('Error loading activity types:', error);
      // Fallback to basic types
      this.activityTypesData = {
        activityTypes: [
          {
            id: 'general',
            name: 'General activities',
            description: 'Other types of activities',
            keywords: ['activity', 'task', 'occupation'],
            category: 'other',
            icon: '⭐',
            color: '#9E9E9E'
          }
        ],
        categories: {
          'other': 'Other'
        }
      };
    }
  }

  /**
   * Get all activity types
   */
  getAllActivityTypes(): ActivityType[] {
    return this.activityTypesData.activityTypes;
  }

  /**
   * Get activity type by ID
   */
  getActivityTypeById(id: string): ActivityType | undefined {
    return this.activityTypesData.activityTypes.find(type => type.id === id);
  }

  /**
   * Get all categories
   */
  getAllCategories(): Record<string, string> {
    return this.activityTypesData.categories;
  }

  /**
   * Get activity types by category
   */
  getActivityTypesByCategory(category: string): ActivityType[] {
    return this.activityTypesData.activityTypes.filter(type => type.category === category);
  }

  /**
   * Determine activity type by name and content
   */
  determineActivityType(activityName: string, content?: any): string {
    const name = activityName.toLowerCase();
    let bestMatch: { type: ActivityType; score: number } | null = null;

    // Go through all activity types
    for (const type of this.activityTypesData.activityTypes) {
      let score = 0;

      // Check keywords
      for (const keyword of type.keywords) {
        if (name.includes(keyword.toLowerCase())) {
          score += 2; // High weight for exact matches
        }
      }

      // Check type name
      if (name.includes(type.id.toLowerCase())) {
        score += 1;
      }

      // Check category
      if (name.includes(type.category.toLowerCase())) {
        score += 0.5;
      }

      // If there's content, analyze it
      if (content && typeof content === 'object') {
        const contentStr = JSON.stringify(content).toLowerCase();
        for (const keyword of type.keywords) {
          if (contentStr.includes(keyword.toLowerCase())) {
            score += 1;
          }
        }
      }

      // Update best match
      if (!bestMatch || score > bestMatch.score) {
        bestMatch = { type, score };
      }
    }

    // Return type with highest score or general by default
    return bestMatch && bestMatch.score > 0 ? bestMatch.type.id : 'general';
  }

  /**
   * Get activity types statistics
   */
  getActivityTypesStats(): {
    totalTypes: number;
    totalCategories: number;
    typesByCategory: Record<string, number>;
  } {
    const totalTypes = this.activityTypesData.activityTypes.length;
    const totalCategories = Object.keys(this.activityTypesData.categories).length;
    
    const typesByCategory: Record<string, number> = {};
    this.activityTypesData.activityTypes.forEach(type => {
      typesByCategory[type.category] = (typesByCategory[type.category] || 0) + 1;
    });

    return {
      totalTypes,
      totalCategories,
      typesByCategory,
    };
  }

  /**
   * Search activity types by keyword
   */
  searchActivityTypes(query: string): ActivityType[] {
    const searchQuery = query.toLowerCase();
    
    return this.activityTypesData.activityTypes.filter(type => 
      type.name.toLowerCase().includes(searchQuery) ||
      type.description.toLowerCase().includes(searchQuery) ||
      type.keywords.some(keyword => keyword.toLowerCase().includes(searchQuery)) ||
      type.category.toLowerCase().includes(searchQuery)
    );
  }

  /**
   * Get recommended types for activity name
   */
  getRecommendedTypes(activityName: string, limit: number = 3): ActivityType[] {
    const name = activityName.toLowerCase();
    const scoredTypes = this.activityTypesData.activityTypes.map(type => {
      let score = 0;
      
      // Check keywords
      for (const keyword of type.keywords) {
        if (name.includes(keyword.toLowerCase())) {
          score += 2;
        }
      }

      // Check type name
      if (name.includes(type.id.toLowerCase())) {
        score += 1;
      }

      return { type, score };
    });

    // Sort by score and return top results
    return scoredTypes
      .filter(item => item.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, limit)
      .map(item => item.type);
  }

  /**
   * Update activity types in Google Drive
   */
  async updateActivityTypes(newData: ActivityTypesData): Promise<void> {
    if (!this.fileId || !this.googleDriveFilesService.isAvailable()) {
      throw AppException.validation(ErrorCode.PROFILE_ACTIVITY_GOOGLE_DRIVE_UNAVAILABLE, 'Google Drive not available for updating activity types');
    }

    try {
      await this.googleDriveFilesService.updateFileContent(this.fileId, newData);
      this.activityTypesData = newData;
      this.logger.log('Activity types updated successfully in Google Drive');
    } catch (error) {
      this.logger.error('Failed to update activity types in Google Drive', error);
      throw error;
    }
  }

  /**
   * Reload activity types
   */
  async reloadActivityTypes(): Promise<void> {
    await this.loadActivityTypes();
  }
}
