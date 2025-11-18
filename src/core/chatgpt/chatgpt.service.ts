import { Injectable, Logger } from '@nestjs/common';
import OpenAI from 'openai';
import { ErrorCode } from '../../common/error-codes';
import { AppException } from '../../common/exceptions/app.exception';

type ChatGPTRequestOptions = {
  temperature?: number;
  maxTokens?: number;
};

type ActivityBatchItem = {
  activityName: string;
  content: string;
  category?: string;
  reasoning?: string;
  activityType?: string;
};

type ActivityClassificationResult = {
  activityType: string;
  confidence?: number;
};

@Injectable()
export class ChatGPTService {
  private readonly logger = new Logger(ChatGPTService.name);
  private readonly apiKey: string;
  private readonly openai: OpenAI;

  constructor() {
    this.apiKey = process.env.OPENAI_API_KEY as string;
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
      this.assertApiKey();

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
   * Generates multiple recommendations in a single ChatGPT call
   */
  async generateActivityBatch(patterns: any, count: number, activityTypeNames: string[] = []): Promise<ActivityBatchItem[]> {
    try {
      this.assertApiKey();

      const prompt = this.buildActivityBatchPrompt(patterns, count, activityTypeNames);
      const response = await this.callChatGPT(prompt, {
        temperature: 0.75,
        maxTokens: Math.min(600 + count * 150, 2000),
      });

      const rawContent = response?.choices?.[0]?.message?.content;
      console.log(rawContent)
      if (!rawContent) {
        throw new Error('Empty response content');
      }

      const parsed = this.parseActivityBatch(rawContent);

      return parsed || [];
    } catch (error) {
      this.logger.error(`Error generating activity batch through ChatGPT: ${error.message}`);
      throw AppException.internal(ErrorCode.SUGGESTED_ACTIVITY_CHATGPT_API_ERROR, error.message, {
        operation: 'generateActivityBatch',
      });
    }
  }

  /**
   * Classify activity title/name into one of the known types
   */
  async getActivityType(
    activityTitle: string,
    availableTypes: string[],
    keywords: Record<string, string[]> = {},
  ): Promise<ActivityClassificationResult> {
    try {
      this.assertApiKey();

      const prompt = this.buildActivityTypePrompt(activityTitle, availableTypes, keywords);
      const response = await this.callChatGPT(prompt, {
        temperature: 0.3,
        maxTokens: 200,
      });

      const rawContent = response?.choices?.[0]?.message?.content;
      if (!rawContent) {
        throw new Error('Empty response content');
      }

      const parsed = this.parseActivityType(rawContent);
      if (!parsed || !parsed.activityType) {
        return { activityType: 'unknown' };
      }

      return parsed;
    } catch (error) {
      this.logger.error(`Error determining activity type via ChatGPT: ${error.message}`);
      return { activityType: 'unknown' };
    }
  }

  /**
   * Call ChatGPT API
   */
  private async callChatGPT(prompt: string, options: ChatGPTRequestOptions = {}): Promise<any> {
    const { temperature = 0.7, maxTokens = 500 } = options;

    try {
      const response = await this.openai.chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages: [
          {
            role: 'system',
            content: 'You are an assistant for generating personalized activity recommendations. Respond in English.',
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        max_tokens: maxTokens,
        temperature,
      });

      return response;
    } catch (error) {
      this.logger.error(`Error calling ChatGPT API: ${error.message}`);
      throw AppException.internal(ErrorCode.SUGGESTED_ACTIVITY_CHATGPT_API_ERROR, undefined, {
        error: error.message,
        operation: 'callChatGPT',
      });
    }
  }

  private assertApiKey(): void {
    if (!this.apiKey) {
      this.logger.warn('OpenAI API key not configured');
      throw AppException.internal(ErrorCode.SUGGESTED_ACTIVITY_CHATGPT_API_ERROR, 'OpenAI API key not configured');
    }
  }

  /**
   * Build prompt for activity content generation
   */
  private buildActivityContentPrompt(activityType: string, patterns: any, index: number): string {
    const activityPreferences = Array.isArray(patterns.activityPreferences)
      ? patterns.activityPreferences.join(', ')
      : 'not specified';

    return `Generate a personalized activity recommendation for user with the following patterns:
    
Activity Type: ${activityType}
User Patterns:
- Activity Types: ${JSON.stringify(patterns.types ?? {})}
- Satisfaction Level: ${patterns.satisfaction ?? 'not specified'}/100
- Hardness Level: ${patterns.hardness ?? 'not specified'}/100
- Completion Rate: ${patterns.completionRate ?? 'not specified'}%
- Activity Preferences: ${activityPreferences}
- Time Patterns: ${JSON.stringify(patterns.timePatterns ?? {})}
- Difficulty Trend: ${patterns.difficultyTrend ?? 'neutral'}

Generate activity #${index + 1} with:
1. Creative and engaging activity name
2. 1 sentence description of the activity, no more than 20 words

Format: JSON with "activityName" and "content" fields.`;
  }

  private buildActivityBatchPrompt(patterns: any, count: number, activityTypeNames: string[] = []): string {
    const onboardingInsights = this.formatKeyValuePairs(patterns.onboardingQuestionAndAnswers);
    const socialNetworks = (patterns.socialNetworks || []).join(', ') || 'not specified';
    const activityPreferences = (patterns.activityPreferences || []).join(', ') || 'not specified';
    const satisfactionLevel = patterns.satisfactionLevel !== undefined ? `${patterns.satisfactionLevel}/100` : 'not specified';
    const hardnessLevel = patterns.hardnessLevel !== undefined ? `${patterns.hardnessLevel}/100` : 'not specified';
    const completionRate = patterns.completionRate !== undefined ? `${patterns.completionRate}%` : 'not specified';
    
    const activityTypesList = activityTypeNames.length > 0 
      ? `Available activity types: ${activityTypeNames.join(', ')}`
      : '';

    return `You are a coach generating ${count} personalized activities for a user.

User profile:
- Current feeling: ${patterns.feelingToday || 'not specified'}
- Social networks: ${socialNetworks}
- Activity preferences: ${activityPreferences}
- Satisfaction Level: ${satisfactionLevel}
- Hardness Level: ${hardnessLevel}
- Completion Rate: ${completionRate}
- Additional insights: ${onboardingInsights}

${activityTypesList}

Respond with strict JSON in the following format (no additional text):
{
  "activities": [
    {
      "activityName": "string",
      "content": "1 sentence description of the activity, no more than 20 words",
      "activityType": "one of the available activity types from the list above that best matches this activity"
    }
  ]
}

Ensure activities are diverse, actionable today, and tailored to the user's current state. For each activity, select the most appropriate activity type from the available list.`;
  }

  private formatKeyValuePairs(data: Record<string, unknown> | undefined): string {
    if (!data || Object.keys(data).length === 0) {
      return 'not specified';
    }

    return Object.entries(data)
      .map(([key, value]) => `${key}: ${value}`)
      .join(', ');
  }

  /**
   * Build prompt for activity type classification
   */
  private buildActivityTypePrompt(
    activityTitle: string,
    availableTypes: string[],
    keywords: Record<string, string[]>,
  ): string {
    const formattedTypes = availableTypes.join(', ');
    const keywordHints = Object.entries(keywords)
      .filter(([type]) => availableTypes.includes(type))
      .map(([type, words]) => `${type}: ${words.join(', ')}`)
      .join('\n');

    return `You are an assistant that classifies user activities into one of the supported activity types.

Available activity types: ${formattedTypes}

Helpful keywords per activity type (if available):
${keywordHints || 'No additional keywords provided.'}

Given the activity title below, choose the single best matching type from the list. If you cannot determine a good match, respond with "unknown".

Activity title: "${activityTitle}"

Respond strictly in JSON:
{
  "activityType": "one of the provided types or 'unknown'",
  "confidence": number between 0 and 1
}`;
  }

  /**
   * Parse activity content from ChatGPT response
   */
  private parseActivityContent(content: string): { activityName: string; content: string } | null {
    try {
      const parsed = JSON.parse(content);
      if (parsed.activityName && parsed.content) {
        return {
          activityName: parsed.activityName.trim(),
          content: parsed.content.trim(),
        };
      }
    } catch (e) {
      this.logger.warn('Failed to parse JSON response, attempting text extraction');
    }

    const lines = content.split('\n').filter(line => line.trim());
    if (lines.length >= 2) {
      return {
        activityName: lines[0].replace(/^[0-9\-\.\s]+/, '').trim(),
        content: lines.slice(1).join(' ').trim(),
      };
    }

    return null;
  }

  private parseActivityBatch(content: string): ActivityBatchItem[] | null {
    try {
      const parsed = JSON.parse(content);
      const activities = Array.isArray(parsed)
        ? parsed
        : Array.isArray(parsed.activities)
          ? parsed.activities
          : [];

      return activities
        .map((item: any) => ({
          activityName: item.activityName?.trim(),
          content: item.content?.trim(),
          category: item.category?.trim(),
          reasoning: item.reasoning?.trim(),
          activityType: item.activityType?.trim(),
        }))
        .filter(item => item.activityName && item.content);
    } catch (error) {
      this.logger.warn('Failed to parse activity batch as JSON, attempting fallback extraction');
      return null;
    }
  }

  private parseActivityType(content: string): ActivityClassificationResult | null {
    try {
      const parsed = JSON.parse(content);
      if (parsed && typeof parsed.activityType === 'string') {
        return {
          activityType: parsed.activityType.trim(),
          confidence:
            typeof parsed.confidence === 'number'
              ? Math.max(0, Math.min(1, parsed.confidence))
              : undefined,
        };
      }
    } catch (error) {
      this.logger.warn('Failed to parse activity type classification as JSON');
    }

    return null;
  }
}
