import { BaseEntity } from './common.types';

export interface Category extends BaseEntity {
  name: string;
  description?: string;
  color?: string; // Hue or hex code for custom badges
  type: 'prepared' | 'exchanged';
}
