import { Injectable } from '@nestjs/common';
import { readFileSync, readdirSync } from 'fs';
import { join } from 'path';
import { ErrorCode } from '../common/error-codes';
import { AppException } from '../common/exceptions/app.exception';

@Injectable()
export class TemplateService {
  private readonly templatesPath = join(process.cwd(), 'src', 'email', 'templates');

  /**
   * Loads HTML template and replaces variables
   */
  async renderTemplate(templateName: string, variables: Record<string, string>): Promise<string> {
    try {
      const templatePath = join(this.templatesPath, `${templateName}.html`);
      let template = readFileSync(templatePath, 'utf8');
      
      // Replace variables in template
      Object.entries(variables).forEach(([key, value]) => {
        const regex = new RegExp(`{{${key}}}`, 'g');
        template = template.replace(regex, value);
      });
      
      return template;
    } catch (error) {
      if (error.code === 'ENOENT') {
        throw AppException.notFound(
          ErrorCode.EMAIL_TEMPLATE_NOT_FOUND,
          `Template '${templateName}' not found`
        );
      }
      
      throw AppException.internal(
        ErrorCode.EMAIL_TEMPLATE_LOAD_FAILED,
        `Failed to load template '${templateName}': ${error.message}`
      );
    }
  }

  /**
   * Gets list of available templates dynamically from templates directory
   */
  getAvailableTemplates(): string[] {
    try {
      const files = readdirSync(this.templatesPath, { withFileTypes: true });
      
      return files
        .filter(file => file.isFile() && file.name.endsWith('.html'))
        .map(file => file.name.replace('.html', ''));
    } catch (error) {
      if (error.code === 'ENOENT') {
        throw AppException.notFound(
          ErrorCode.EMAIL_TEMPLATE_DIRECTORY_NOT_FOUND,
          'Templates directory not found'
        );
      }
      
      throw AppException.internal(
        ErrorCode.EMAIL_TEMPLATE_DIRECTORY_ACCESS_FAILED,
        `Failed to access templates directory: ${error.message}`
      );
    }
  }

  /**
   * Checks if template exists
   */
  templateExists(templateName: string): boolean {
    try {
      const templatePath = join(this.templatesPath, `${templateName}.html`);
      readFileSync(templatePath, 'utf8');
      return true;
    } catch {
      return false;
    }
  }
}
