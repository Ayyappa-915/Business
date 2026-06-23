export interface DefaultUnit {
  id: string;
  name: string;
  abbreviation: string;
  isDecimalAllowed: boolean;
}

export const DEFAULT_UNITS: DefaultUnit[] = [
  { id: 'pcs', name: 'Pieces', abbreviation: 'pcs', isDecimalAllowed: false },
  { id: 'kg', name: 'Kilograms', abbreviation: 'kg', isDecimalAllowed: true },
  { id: 'ltr', name: 'Liters', abbreviation: 'ltr', isDecimalAllowed: true },
  { id: 'box', name: 'Boxes', abbreviation: 'box', isDecimalAllowed: false },
  { id: 'pkt', name: 'Packets', abbreviation: 'pkt', isDecimalAllowed: false },
  { id: 'g', name: 'Grams', abbreviation: 'g', isDecimalAllowed: true },
];
