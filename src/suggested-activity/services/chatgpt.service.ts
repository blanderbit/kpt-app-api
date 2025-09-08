import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ErrorCode } from '../../common/error-codes';
import { AppException } from '../../common/exceptions/app.exception';

@Injectable()
export class ChatGPTService {
  private readonly logger = new Logger(ChatGPTService.name);
  private readonly apiKey: string;
  private readonly apiUrl: string = 'https://api.openai.com/v1/chat/completions';

  constructor(private readonly configService: ConfigService) {
    this.apiKey = this.configService.get<string>('OPENAI_API_KEY') as string;
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
        this.logger.warn('OpenAI API key not configured, using fallback generation');
        return this.generateFallbackContent(activityType, patterns, index);
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

      // Fallback if ChatGPT didn't return a valid response
      return this.generateFallbackContent(activityType, patterns, index);
    } catch (error) {
      this.logger.error(`Error generating content through ChatGPT: ${error.message}`);
      return this.generateFallbackContent(activityType, patterns, index);
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
        this.logger.warn('OpenAI API key not configured, using fallback generation');
        return this.generateFallbackReasoning(patterns, activityType, confidenceScore);
      }

      const prompt = this.buildReasoningPrompt(patterns, activityType, confidenceScore);
      const response = await this.callChatGPT(prompt);

      if (response && response.choices && response.choices[0]) {
        const reasoning = response.choices[0].message.content.trim();
        
        if (reasoning && reasoning.length > 10) {
          return reasoning;
        }
      }

      // Fallback if ChatGPT didn't return a valid response
      return this.generateFallbackReasoning(patterns, activityType, confidenceScore);
    } catch (error) {
      this.logger.error(`Error generating reasoning through ChatGPT: ${error.message}`);
      return this.generateFallbackReasoning(patterns, activityType, confidenceScore);
    }
  }

  /**
   * Call ChatGPT API
   */
  private async callChatGPT(prompt: string): Promise<any> {
    try {
      const response = await fetch(this.apiUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
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
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`OpenAI API error: ${response.status} - ${errorText}`);
      }

      return await response.json();
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

  /**
   * Generate fallback content when ChatGPT is unavailable
   */
  private generateFallbackContent(activityType: string, patterns: any, index: number): { activityName: string; content: string } {
    const fallbackActivities = {
      health: [
        { name: 'Morning Walk', content: 'Take a refreshing morning walk to start your day with energy and fresh air.' },
        { name: 'Stretching Session', content: 'Do a gentle stretching routine to improve flexibility and reduce muscle tension.' },
        { name: 'Deep Breathing Exercise', content: 'Practice deep breathing techniques to reduce stress and improve focus.' }
      ],
      learning: [
        { name: 'Read a Book', content: 'Dedicate time to reading a book that interests you and expands your knowledge.' },
        { name: 'Online Course', content: 'Start or continue an online course to learn new skills or deepen existing ones.' },
        { name: 'Language Practice', content: 'Practice a foreign language through apps, videos, or conversation.' }
      ],
      work: [
        { name: 'Task Organization', content: 'Organize your tasks and priorities for better productivity and focus.' },
        { name: 'Skill Development', content: 'Work on developing a specific skill that will help in your career.' },
        { name: 'Networking', content: 'Connect with colleagues or industry professionals to expand your network.' }
      ],
      social: [
        { name: 'Call a Friend', content: 'Reach out to a friend or family member for a meaningful conversation.' },
        { name: 'Group Activity', content: 'Participate in a group activity or event to meet new people.' },
        { name: 'Volunteer Work', content: 'Find volunteer opportunities to help others and build community connections.' }
      ],
      creative: [
        { name: 'Drawing or Painting', content: 'Express your creativity through drawing, painting, or other art forms.' },
        { name: 'Writing', content: 'Write a story, poem, or journal entry to explore your thoughts and creativity.' },
        { name: 'Music Making', content: 'Play an instrument, sing, or create music to express yourself artistically.' }
      ]
    };

    const activities = fallbackActivities[activityType] || fallbackActivities.health;
    const selected = activities[index % activities.length];

    return {
      activityName: selected.name,
      content: selected.content,
    };
  }

  /**
   * Generate fallback reasoning when ChatGPT is unavailable
   */
  private generateFallbackReasoning(patterns: any, activityType: string, confidenceScore: number): string {
    const reasoningTemplates = {
      health: 'This health activity is recommended based on your current activity patterns and wellness goals.',
      learning: 'This learning activity aligns with your educational interests and skill development needs.',
      work: 'This work activity supports your professional growth and productivity objectives.',
      social: 'This social activity helps you maintain connections and build meaningful relationships.',
      creative: 'This creative activity provides an outlet for self-expression and artistic exploration.'
    };

    return reasoningTemplates[activityType] || reasoningTemplates.health;
  }
}
