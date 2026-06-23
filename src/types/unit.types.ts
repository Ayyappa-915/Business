import { BaseEntity } from './common.types';

export interface Unit extends BaseEntity {
  name: string;
  abbreviation: string;
  isDecimalAllowed: boolean; // true for kg/liters, false for pieces/boxes
}
