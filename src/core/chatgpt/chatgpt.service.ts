import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import OpenAI from 'openai';
import { ErrorCode } from '../../common/error-codes';
import { AppException } from '../../common/exceptions/app.exception';

@Injectable()
export class ChatGPTService {
  private readonly logger = new Logger(ChatGPTService.name);
  private readonly apiKey: string;
  private readonly openai: OpenAI;

  constructor(private readonly configService: ConfigService) {
    this.apiKey = this.configService.get<string>('OPENAI_API_KEY') as string;
    this.openai = new OpenAI({
      apiKey: this.apiKey,
    });
  }

  /**
   * Generates activity content through ChatGPT
   */
  async generateActivityContent(
    activityType: string,
    patterns: any,
    index: number
  ): Promise<{ activityName: string; content: string }> {
    try {
      if (!this.apiKey) {
        this.logger.warn('OpenAI API key not configured');
        throw AppException.internal(ErrorCode.SUGGESTED_ACTIVITY_CHATGPT_API_ERROR, 'OpenAI API key not configured');
      }

      const prompt = this.buildActivityContentPrompt(activityType, patterns, index);
      const response = await this.callChatGPT(prompt);

      if (response && response.choices && response.choices[0]) {
        const content = response.choices[0].message.content;
        const parsed = this.parseActivityContent(content);
        
        if (parsed) {
          return parsed;
        }
      }

      throw AppException.internal(ErrorCode.SUGGESTED_ACTIVITY_CHATGPT_API_ERROR, 'Invalid response from ChatGPT');
    } catch (error) {
      this.logger.error(`Error generating content through ChatGPT: ${error.message}`);
      throw error;
    }
  }

  /**
   * Generates recommendation reasoning through ChatGPT
   */
  async generateReasoning(
    patterns: any,
    activityType: string,
    confidenceScore: number
  ): Promise<string> {
    try {
      if (!this.apiKey) {
        this.logger.warn('OpenAI API key not configured');
        throw AppException.internal(ErrorCode.SUGGESTED_ACTIVITY_CHATGPT_API_ERROR, 'OpenAI API key not configured');
      }

      const prompt = this.buildReasoningPrompt(patterns, activityType, confidenceScore);
      const response = await this.callChatGPT(prompt);

      if (response && response.choices && response.choices[0]) {
        const reasoning = response.choices[0].message.content.trim();
        
        if (reasoning && reasoning.length > 10) {
          return reasoning;
        }
      }

      throw AppException.internal(ErrorCode.SUGGESTED_ACTIVITY_CHATGPT_API_ERROR, 'Invalid response from ChatGPT');
    } catch (error) {
      this.logger.error(`Error generating reasoning through ChatGPT: ${error.message}`);
      throw error;
    }
  }

  /**
   * Call ChatGPT API
   */
  private async callChatGPT(prompt: string): Promise<any> {
    try {
      const response = await this.openai.chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages: [
          {
            role: 'system',
            content: 'You are an assistant for generating personalized activity recommendations. Respond in English.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        max_tokens: 500,
        temperature: 0.7,
      });

      return response;
    } catch (error) {
      this.logger.error(`Error calling ChatGPT API: ${error.message}`);
      throw AppException.internal(ErrorCode.SUGGESTED_ACTIVITY_CHATGPT_API_ERROR, undefined, {
        error: error.message,
        operation: 'callChatGPT'
      });
    }
  }

  /**
   * Build prompt for activity content generation
   */
  private buildActivityContentPrompt(activityType: string, patterns: any, index: number): string {
    return `Generate a personalized activity recommendation for user with the following patterns:
    
Activity Type: ${activityType}
User Patterns:
- Activity Types: ${JSON.stringify(patterns.types)}
- Satisfaction Level: ${patterns.satisfaction}/100
- Hardness Level: ${patterns.hardness}/100
- Completion Rate: ${patterns.completionRate}%
- Activity Preferences: ${patterns.activityPreferences.join(', ')}
- Time Patterns: ${JSON.stringify(patterns.timePatterns)}
- Difficulty Trend: ${patterns.difficultyTrend}

Generate activity #${index + 1} with:
1. Creative and engaging activity name
2. Detailed description (2-3 sentences)
3. Why this activity would be good for this user

Format: JSON with "activityName" and "content" fields.`;
  }

  /**
   * Build prompt for reasoning generation
   */
  private buildReasoningPrompt(patterns: any, activityType: string, confidenceScore: number): string {
    return `Explain why this activity recommendation makes sense for the user:

User Patterns:
- Activity Types: ${JSON.stringify(patterns.types)}
- Satisfaction Level: ${patterns.satisfaction}/100
- Hardness Level: ${patterns.hardness}/100
- Completion Rate: ${patterns.completionRate}%
- Activity Preferences: ${patterns.activityPreferences.join(', ')}

Recommended Activity Type: ${activityType}
Confidence Score: ${confidenceScore}/100

Provide a brief, personalized explanation (1-2 sentences) of why this activity type is recommended for this user.`;
  }

  /**
   * Parse activity content from ChatGPT response
   */
  private parseActivityContent(content: string): { activityName: string; content: string } | null {
    try {
      // Try to parse JSON response
      const parsed = JSON.parse(content);
      if (parsed.activityName && parsed.content) {
        return {
          activityName: parsed.activityName.trim(),
          content: parsed.content.trim(),
        };
      }
    } catch (e) {
      // If JSON parsing fails, try to extract from text
      this.logger.warn('Failed to parse JSON response, attempting text extraction');
    }

    // Fallback text extraction
    const lines = content.split('\n').filter(line => line.trim());
    if (lines.length >= 2) {
      return {
        activityName: lines[0].replace(/^[0-9\-\.\s]+/, '').trim(),
        content: lines.slice(1).join(' ').trim(),
      };
    }

    return null;
  }

}
