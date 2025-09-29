import { ApiProperty } from '@nestjs/swagger';

export class SocialNetworkDto {
  @ApiProperty({
    description: 'Unique identifier for the social network',
    example: 'facebook',
  })
  id: string;

  @ApiProperty({
    description: 'Display name of the social network',
    example: 'Facebook',
  })
  name: string;

  @ApiProperty({
    description: 'Description of the social network',
    example: 'Connect with friends and family, share photos and videos, and discover new content.',
  })
  description: string;

  @ApiProperty({
    description: 'SVG icon for the social network',
    example: '<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M17 2H14C12.3431 2 11 3.34315 11 5V8H8V12H11V22H15V12H18L19 8H15V5C15 4.44772 15.4477 4 16 4H17V2Z" fill="#1877F2"/></svg>',
  })
  svg: string;

  @ApiProperty({
    description: 'Primary color of the social network',
    example: '#1877F2',
  })
  color: string;

  @ApiProperty({
    description: 'Category of the social network',
    example: 'social',
  })
  category: string;
}

export class SocialNetworksStatsDto {
  @ApiProperty({
    description: 'Total number of social networks',
    example: 10,
  })
  totalCount: number;

  @ApiProperty({
    description: 'Number of social networks by category',
    example: { social: 8, professional: 2 },
  })
  categoryCounts: Record<string, number>;

  @ApiProperty({
    description: 'Available categories',
    example: ['social', 'professional', 'messaging'],
  })
  categories: string[];
}
