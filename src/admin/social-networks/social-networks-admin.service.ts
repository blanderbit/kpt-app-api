import { Injectable, Logger } from '@nestjs/common';
import { SocialNetworksService } from '../../core/social-networks';
import type { SocialNetwork } from '../../core/social-networks/social-networks.service';
import { LanguageService } from '../languages/services/language.service';

/** Get nested value by dot path, e.g. "social_networks.facebook.name" */
function getValueByPath(obj: Record<string, any>, pathKey: string): string | undefined {
  if (!obj || typeof pathKey !== 'string') return undefined;
  const parts = pathKey.split('.');
  let current: any = obj;
  for (const part of parts) {
    if (current == null || typeof current !== 'object') return undefined;
    current = current[part];
  }
  return typeof current === 'string' ? current : undefined;
}

/** Resolve a string that may be a translation key into the translated text */
function resolveText(
  value: string,
  translations: Record<string, any> | null,
): string {
  if (!value || typeof value !== 'string') return value || '';
  if (!translations) return value;
  const key = value.trim();
  if (!key.includes('.')) return value;
  const resolved = getValueByPath(translations, key);
  return resolved !== undefined ? resolved : value;
}

@Injectable()
export class SocialNetworksAdminService {
  private readonly logger = new Logger(SocialNetworksAdminService.name);

  constructor(
    private readonly socialNetworksService: SocialNetworksService,
    private readonly languageService: LanguageService,
  ) {}

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
   * Get all social networks with translation keys resolved for the given language
   */
  async getAllSocialNetworks(language?: string): Promise<SocialNetwork[]> {
    const networks = this.socialNetworksService.getAllSocialNetworks();
    return this.resolveSocialNetworksWithTranslations(networks, language);
  }

  /**
   * Get social networks by category with translation keys resolved
   */
  async getSocialNetworksByCategory(category: string, language?: string): Promise<SocialNetwork[]> {
    const networks = this.socialNetworksService.getSocialNetworksByCategory(category);
    return this.resolveSocialNetworksWithTranslations(networks, language);
  }

  /**
   * Get social networks statistics
   */
  async getSocialNetworksStats() {
    return this.socialNetworksService.getSocialNetworksStats();
  }

  /**
   * Get social network by ID with translation keys resolved
   */
  async getSocialNetworkById(id: string, language?: string): Promise<SocialNetwork | undefined> {
    const network = this.socialNetworksService.getSocialNetworkById(id);
    if (!network) return undefined;
    const [resolved] = this.resolveSocialNetworksWithTranslations([network], language);
    return resolved;
  }

  /**
   * Get all social network categories (values resolved if they are translation keys)
   */
  async getSocialNetworkCategories(language?: string): Promise<Record<string, string>> {
    const categories = this.socialNetworksService.getSocialNetworkCategories();
    const lang = language || 'en';
    const translations = this.languageService.getTranslationsByCode(lang);
    if (!translations || typeof translations !== 'object') return categories;
    const result: Record<string, string> = {};
    for (const [key, value] of Object.entries(categories)) {
      result[key] = resolveText(value, translations);
    }
    return result;
  }

  /**
   * Resolve translation keys in name and description for social networks
   */
  private resolveSocialNetworksWithTranslations(
    networks: SocialNetwork[],
    language?: string,
  ): SocialNetwork[] {
    const lang = language || 'en';
    const translations = this.languageService.getTranslationsByCode(lang);
    if (!translations || typeof translations !== 'object') return networks;
    return networks.map((network) => ({
      ...network,
      name: resolveText(network.name, translations),
      description: resolveText(network.description, translations),
    }));
  }
}
