import { Test, TestingModule } from '@nestjs/testing';
import { TemplateService } from './template.service';
import { ErrorCode } from '../common/error-codes';
import { AppException } from '../common/exceptions/app.exception';

describe('TemplateService', () => {
  let service: TemplateService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [TemplateService],
    }).compile();

    service = module.get<TemplateService>(TemplateService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getAvailableTemplates', () => {
    it('should return list of available templates', () => {
      const templates = service.getAvailableTemplates();
      
      expect(Array.isArray(templates)).toBe(true);
      expect(templates).toContain('email-verification');
      expect(templates).toContain('password-reset');
      expect(templates).toContain('email-change-confirmation');
    });

    it('should only return .html files without extension', () => {
      const templates = service.getAvailableTemplates();
      
      templates.forEach(template => {
        expect(template).not.toContain('.html');
        expect(template).not.toContain('.');
      });
    });
  });

  describe('templateExists', () => {
    it('should return true for existing templates', () => {
      expect(service.templateExists('email-verification')).toBe(true);
      expect(service.templateExists('password-reset')).toBe(true);
      expect(service.templateExists('email-change-confirmation')).toBe(true);
    });

    it('should return false for non-existing templates', () => {
      expect(service.templateExists('non-existing-template')).toBe(false);
    });
  });

  describe('renderTemplate', () => {
    it('should render template with variables', async () => {
      const variables = {
        verificationUrl: 'https://example.com/verify',
        email: 'test@example.com'
      };

      const result = await service.renderTemplate('email-verification', variables);
      
      expect(result).toContain('https://example.com/verify');
      expect(result).toContain('test@example.com');
      expect(result).toContain('{{verificationUrl}}').toBe(false);
      expect(result).toContain('{{email}}').toBe(false);
    });

    it('should throw EMAIL_TEMPLATE_NOT_FOUND for non-existing template', async () => {
      const variables = { test: 'value' };

      try {
        await service.renderTemplate('non-existing-template', variables);
        fail('Should have thrown an error');
      } catch (error) {
        expect(error).toBeInstanceOf(AppException);
        expect(error.errorCode).toBe(ErrorCode.EMAIL_TEMPLATE_NOT_FOUND);
        expect(error.message).toContain('Template \'non-existing-template\' not found');
      }
    });

    it('should throw EMAIL_TEMPLATE_LOAD_FAILED for other errors', async () => {
      // Mock the service to simulate file system error
      jest.spyOn(require('fs'), 'readFileSync').mockImplementation(() => {
        throw new Error('Permission denied');
      });

      const variables = { test: 'value' };

      try {
        await service.renderTemplate('email-verification', variables);
        fail('Should have thrown an error');
      } catch (error) {
        expect(error).toBeInstanceOf(AppException);
        expect(error.errorCode).toBe(ErrorCode.EMAIL_TEMPLATE_LOAD_FAILED);
        expect(error.message).toContain('Failed to load template');
      }
    });
  });
});
