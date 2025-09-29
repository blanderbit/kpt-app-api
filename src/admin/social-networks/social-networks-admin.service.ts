import { Injectable, Logger } from '@nestjs/common';
import { SocialNetworksService } from '../../core/social-networks';

@Injectable()
export class SocialNetworksAdminService {
  private readonly logger = new Logger(SocialNetworksAdminService.name);

  constructor(private readonly socialNetworksService: SocialNetworksService) {}

  /**
   * Sync social networks with Google Drive
   * Reloads data from Google Drive
   */
  async syncWithDrive(): Promise<{ success: boolean; message: string }> {
    try {
      this.logger.log('Starting social networks sync with Google Drive...');
      
      // Reload social networks from Google Drive
      await this.socialNetworksService.loadSocialNetworks();
      
      this.logger.log('Social networks synced successfully with Google Drive');
      
      return {
        success: true,
        message: 'Social networks successfully synced with Google Drive'
      };
    } catch (error) {
      this.logger.error('Failed to sync social networks with Google Drive', error);
      
      return {
        success: false,
        message: `Sync error: ${error.message}`
      };
    }
  }

  /**
   * Get all social networks
   */
  async getAllSocialNetworks() {
    return this.socialNetworksService.getAllSocialNetworks();
  }

  /**
   * Get social networks by category
   */
  async getSocialNetworksByCategory(category: string) {
    return this.socialNetworksService.getSocialNetworksByCategory(category);
  }

  /**
   * Get social networks statistics
   */
  async getSocialNetworksStats() {
    return this.socialNetworksService.getSocialNetworksStats();
  }

  /**
   * Get social network by ID
   */
  async getSocialNetworkById(id: string) {
    return this.socialNetworksService.getSocialNetworkById(id);
  }

  /**
   * Get all social network categories
   */
  async getSocialNetworkCategories() {
    return this.socialNetworksService.getSocialNetworkCategories();
  }
}
