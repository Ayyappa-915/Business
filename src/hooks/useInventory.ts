import { useAppDispatch, useAppSelector } from '../app/hooks';
import {
  selectLowStockAlerts,
  selectInventoryValuation,
  selectAdjustmentLogs,
  addAdjustment
} from '../features/inventory/inventorySlice';
import { addProduct, updateProduct, deleteProduct } from '../features/db/dbSlice';
import { Product } from '../types/product.types';
import { ProductVariant } from '../types/variant.types';
import { StockAdjustmentLog } from '../types/inventory.types';

export const useInventory = () => {
  const dispatch = useAppDispatch();
  const products = useAppSelector((state) => state.db.products);
  const variants = useAppSelector((state) => state.db.variants);
  const categories = useAppSelector((state) => state.db.categories);
  const subcategories = useAppSelector((state) => state.db.subcategories);
  const units = useAppSelector((state) => state.db.units);
  
  const lowStockAlerts = useAppSelector(selectLowStockAlerts);
  const valuation = useAppSelector(selectInventoryValuation);
  const adjustments = useAppSelector(selectAdjustmentLogs);

  const addNewProduct = (product: Product, productVariants: ProductVariant[]) => {
    dispatch(addProduct({ product, variants: productVariants }));
  };

  const modifyProduct = (product: Product, productVariants: ProductVariant[]) => {
    dispatch(updateProduct({ product, variants: productVariants }));
  };

  const removeProduct = (productId: string) => {
    dispatch(deleteProduct(productId));
  };

  const adjustStockLevel = (log: StockAdjustmentLog) => {
    dispatch(addAdjustment(log));
  };

  return {
    products,
    variants,
    categories,
    subcategories,
    units,
    lowStockAlerts,
    valuation,
    adjustments,
    addNewProduct,
    modifyProduct,
    removeProduct,
    adjustStockLevel
  };
};
