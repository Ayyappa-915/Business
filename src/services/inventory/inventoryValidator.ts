import { ProductVariant } from '../../types/variant.types';
import { Unit } from '../../types/unit.types';

export const inventoryValidator = {
  validateSaleQuantity(variant: ProductVariant, quantity: number, isStockTracked: boolean = true, allowNegativeStock: boolean = false): { isValid: boolean; error?: string } {
    if (quantity <= 0) {
      return { isValid: false, error: 'Quantity must be greater than zero.' };
    }
    
    if (isStockTracked && !allowNegativeStock && variant.stock < quantity) {
      return {
        isValid: false,
        error: `Insufficient stock for "${variant.name}". Available: ${variant.stock}. Requested: ${quantity}.`
      };
    }

    return { isValid: true };
  },

  validateUnitQuantity(quantity: number, unit: Unit): { isValid: boolean; error?: string } {
    if (!unit.isDecimalAllowed && !Number.isInteger(quantity)) {
      return {
        isValid: false,
        error: `Decimals are not allowed for unit type "${unit.name}" (${unit.abbreviation}).`
      };
    }
    return { isValid: true };
  }
};
