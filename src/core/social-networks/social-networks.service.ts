import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { GoogleDriveFilesService } from '../../common/services/google-drive-files.service';
import { ErrorCode } from '../../common/error-codes';
import { AppException } from '../../common/exceptions/app.exception';
import { SocialNetworkDto, SocialNetworksStatsDto } from './social-network.dto';

export interface SocialNetwork {
  id: string;
  name: string;
  description: string;
  svg: string;
  color: string;
  category: string;
}

export interface SocialNetworksData {
  socialNetworks: SocialNetwork[];
  categories: Record<string, string>;
}

@Injectable()
export class SocialNetworksService {
  private readonly logger = new Logger(SocialNetworksService.name);
  private socialNetworksData: SocialNetworksData;
  private readonly fileId: string;

  constructor(
    private readonly configService: ConfigService,
    private readonly googleDriveFilesService: GoogleDriveFilesService,
  ) {
    this.fileId = this.configService.get<string>('SOCIAL_NETWORKS_FILE_ID') || '';
    this.loadSocialNetworks();
  }

  /**
   * Loads social networks from Google Drive
   */
  async loadSocialNetworks(): Promise<void> {
    try {
      // Load from Google Drive
      if (this.fileId && this.googleDriveFilesService.isAvailable()) {
        this.logger.log('Loading social networks from Google Drive');
        this.socialNetworksData = await this.googleDriveFilesService.getFileContent(this.fileId);
        return;
      }

      // If Google Drive is unavailable, use empty array
      this.logger.warn('Google Drive not available, using empty social networks');
      this.socialNetworksData = {
        socialNetworks: [],
        categories: {}
      };
    } catch (error) {
      this.logger.error('Error loading social networks:', error);
      // Fallback to empty array
      this.socialNetworksData = {
        socialNetworks: [],
        categories: {}
      };
    }
  }

  /**
   * Get all social networks
   */
  getAllSocialNetworks(): SocialNetworkDto[] {
    return this.socialNetworksData.socialNetworks;
  }

  /**
   * Get social networks by category
   */
  getSocialNetworksByCategory(category: string): SocialNetworkDto[] {
    return this.socialNetworksData.socialNetworks.filter(
      network => network.category === category
    );
  }

  /**
   * Get all available categories
   */
  getSocialNetworkCategories(): Record<string, string> {
    return this.socialNetworksData.categories;
  }

  /**
   * Get social networks statistics
   */
  getSocialNetworksStats(): SocialNetworksStatsDto {
    const networks = this.socialNetworksData.socialNetworks;
    const categoryCounts: Record<string, number> = {};
    
    networks.forEach(network => {
      categoryCounts[network.category] = (categoryCounts[network.category] || 0) + 1;
    });

    return {
      totalCount: networks.length,
      categoryCounts,
      categories: Object.keys(this.socialNetworksData.categories)
    };
  }

  /**
   * Get social network by ID
   */
  getSocialNetworkById(id: string): SocialNetworkDto | undefined {
    return this.socialNetworksData.socialNetworks.find(network => network.id === id);
  }
}
