import React, { useState } from 'react';
import { useAppDispatch, useAppSelector } from '../../app/hooks';
import { addSale } from '../../features/db/dbSlice';
import { Sale, SaleItem } from '../../types/sale.types';
import { inventoryValidator } from '../../services/inventory/inventoryValidator';
import Input from '../common/Input';
import Select from '../common/Select';
import Button from '../common/Button';
import TextArea from '../common/TextArea';

interface SaleFormProps {
  onSuccess: () => void;
}

export const SaleForm: React.FC<SaleFormProps> = ({ onSuccess }) => {
  const dispatch = useAppDispatch();
  const products = useAppSelector(state => state.db.products);
  const variants = useAppSelector(state => state.db.variants);
  const categories = useAppSelector(state => state.db.categories);

  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'upi' | 'card' | 'credit'>('upi');
  const [paymentStatus, setPaymentStatus] = useState<'paid' | 'unpaid' | 'partial'>('paid');
  const [discountAmount, setDiscountAmount] = useState('0');
  const [notes, setNotes] = useState('');

  // Cart
  const [cartItems, setCartItems] = useState<SaleItem[]>([]);

  // Single item selector inputs
  const [selectedCategoryId, setSelectedCategoryId] = useState('');
  const [selectedProductId, setSelectedProductId] = useState('');
  const [selectedVariantId, setSelectedVariantId] = useState('');
  const [quantity, setQuantity] = useState('1');
  const [price, setPrice] = useState('');

  const [error, setError] = useState('');

  // Dropdown list options
  const saleVariants = variants.filter(v => v.purpose !== 'buy');
  const variantOptions = saleVariants.map(v => {
    const p = products.find(prod => prod.id === v.productId);
    const cleanedVarName = p && v.name.toLowerCase().startsWith(p.name.toLowerCase())
      ? v.name.slice(p.name.length).trim()
      : v.name;
    return {
      value: v.id,
      label: `${p ? p.name : 'Product'} - ${cleanedVarName} (Stock: ${v.stock})`
    };
  });

  const handleVariantChange = (id: string) => {
    setSelectedVariantId(id);
    const variant = variants.find(v => v.id === id);
    if (variant) {
      setPrice(variant.price.toString());
    }
  };

  const handleAddCartItem = () => {
    if (!selectedVariantId) {
      setError('Please select a product variant.');
      return;
    }
    const qtyVal = parseFloat(quantity);
    const priceVal = parseFloat(price);

    if (isNaN(qtyVal) || qtyVal <= 0) {
      setError('Quantity must be greater than zero.');
      return;
    }
    if (isNaN(priceVal) || priceVal < 0) {
      setError('Price must be positive.');
      return;
    }

    const matchedVariant = variants.find(v => v.id === selectedVariantId);
    if (!matchedVariant) return;

    if (matchedVariant.purpose === 'buy') {
      setError('Cannot sell a "Buy Only" variant.');
      return;
    }

    const parentProduct = products.find(p => p.id === matchedVariant.productId);
    const isTracked = parentProduct?.isStockTracked !== false;

    // Validate stock
    const validation = inventoryValidator.validateSaleQuantity(matchedVariant, qtyVal, isTracked, false);
    if (!validation.isValid) {
      setError(validation.error || 'Insufficient stock.');
      return;
    }

    // Check if item already exists in cart, accumulate if so
    const existingIndex = cartItems.findIndex(item => item.variantId === selectedVariantId);
    if (existingIndex !== -1) {
      const existingItem = cartItems[existingIndex];
      const newQty = existingItem.quantity + qtyVal;
      // Re-validate accumulated quantity
      const accValidation = inventoryValidator.validateSaleQuantity(matchedVariant, newQty, isTracked, false);
      if (!accValidation.isValid) {
        setError(accValidation.error || 'Insufficient stock.');
        return;
      }

      const updatedCart = [...cartItems];
      updatedCart[existingIndex] = {
        ...existingItem,
        quantity: newQty
      };
      setCartItems(updatedCart);
    } else {
      const newItem: SaleItem = {
        productId: matchedVariant.productId,
        variantId: matchedVariant.id,
        quantity: qtyVal,
        unitPrice: priceVal,
        discount: 0
      };
      setCartItems([...cartItems, newItem]);
    }

    // Reset input fields
    setSelectedCategoryId('');
    setSelectedProductId('');
    setSelectedVariantId('');
    setQuantity('1');
    setPrice('');
    setError('');
  };

  const handleRemoveCartItem = (idx: number) => {
    setCartItems(cartItems.filter((_, i) => i !== idx));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (cartItems.length === 0) {
      setError('Please add at least one item to sale.');
      return;
    }

    const subtotal = cartItems.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0);
    const discVal = parseFloat(discountAmount) || 0;
    const totalAmount = Math.max(0, subtotal - discVal);

    const newSale: Sale = {
      id: 'sale_' + Math.random().toString(36).substr(2, 9),
      customerName: customerName.trim() || undefined,
      customerPhone: customerPhone.trim() || undefined,
      saleDate: new Date().toISOString(),
      items: cartItems,
      subtotal,
      discount: discVal,
      totalAmount,
      paymentMethod,
      paymentStatus,
      notes: notes.trim() || undefined,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    dispatch(addSale(newSale));
    onSuccess();
  };

  const subtotal = cartItems.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0);
  const totalBill = Math.max(0, subtotal - (parseFloat(discountAmount) || 0));

  return (
    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '8px', overflowY: 'auto', maxHeight: '72vh' }}>
      {error && <div style={{ color: 'var(--danger)', fontSize: '0.85rem', fontWeight: 600 }}>{error}</div>}

      <div style={{ display: 'flex', gap: '10px' }}>
        <Input
          label="Customer Name"
          placeholder="Walk-in Customer"
          value={customerName}
          onChange={(e) => setCustomerName(e.target.value)}
          style={{ flex: 1 }}
        />
        <Input
          label="Phone Number"
          placeholder="10-digit number"
          value={customerPhone}
          onChange={(e) => setCustomerPhone(e.target.value)}
          style={{ flex: 1 }}
        />
      </div>

      <div style={{
        padding: '12px',
        border: '1px dashed var(--border-color)',
        borderRadius: 'var(--radius-md)',
        display: 'flex',
        flexDirection: 'column',
        gap: '6px'
      }}>
        <h5 style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>Add Sale Items</h5>
        <Select
          label="Category"
          options={categories.map(c => ({ value: c.id, label: c.name }))}
          value={selectedCategoryId}
          onChange={(e) => {
            setSelectedCategoryId(e.target.value);
            setSelectedProductId('');
            setSelectedVariantId('');
            setPrice('');
          }}
          placeholder="Choose category..."
        />
        {selectedCategoryId && (
          <Select
            label="Product"
            options={products.filter(p => p.categoryId === selectedCategoryId).map(p => ({ value: p.id, label: p.name }))}
            value={selectedProductId}
            onChange={(e) => {
              setSelectedProductId(e.target.value);
              setSelectedVariantId('');
              setPrice('');
            }}
            placeholder="Choose product..."
          />
        )}
        {selectedProductId && (
          <Select
            label="Variant"
            options={variants.filter(v => v.productId === selectedProductId && v.purpose !== 'buy').map(v => {
              const p = products.find(prod => prod.id === v.productId);
              const cleanedVarName = p && v.name.toLowerCase().startsWith(p.name.toLowerCase())
                ? v.name.slice(p.name.length).trim()
                : v.name;
              return {
                value: v.id,
                label: `${cleanedVarName} (Stock: ${v.stock})`
              };
            })}
            value={selectedVariantId}
            onChange={(e) => handleVariantChange(e.target.value)}
            placeholder="Choose variant..."
          />
        )}
        <div style={{ display: 'flex', gap: '8px' }}>
          <Input
            label="Quantity"
            type="number"
            value={quantity}
            onChange={(e) => setQuantity(e.target.value)}
            style={{ flex: 1 }}
          />
          <Input
            label="Unit Price (₹)"
            type="number"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            style={{ flex: 1 }}
          />
        </div>
        <Button type="button" variant="outline" size="sm" onClick={handleAddCartItem}>
          + Add to Invoice List
        </Button>
      </div>

      {/* Cart Items List */}
      {cartItems.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', margin: '8px 0' }}>
          <span style={{ fontSize: '0.8rem', fontWeight: 600 }}>Invoice list:</span>
          {cartItems.map((item, idx) => {
            const variant = variants.find(v => v.id === item.variantId);
            const prod = products.find(p => p.id === item.productId);
            return (
              <div key={idx} className="flex-between" style={{
                padding: '8px 12px',
                backgroundColor: 'var(--bg-tertiary)',
                borderRadius: 'var(--radius-sm)',
                fontSize: '0.8rem'
              }}>
                <div>
                  <strong>{prod ? prod.name : 'Product'} ({variant?.name})</strong>
                  <div style={{ color: 'var(--text-secondary)' }}>
                    Qty: {item.quantity} • Price: ₹{item.unitPrice} • Total: ₹{item.quantity * item.unitPrice}
                  </div>
                </div>
                <button type="button" onClick={() => handleRemoveCartItem(idx)} style={{ color: 'var(--danger)', fontWeight: 600 }}>
                  Remove
                </button>
              </div>
            );
          })}

          <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '8px', display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '4px' }}>
            <span style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>Subtotal: ₹{subtotal}</span>
            <div style={{ width: '120px' }}>
              <Input
                label="Bill Discount (₹)"
                type="number"
                value={discountAmount}
                onChange={(e) => setDiscountAmount(e.target.value)}
                min="0"
                style={{ marginBottom: 0 }}
              />
            </div>
            <strong style={{ fontSize: '1.1rem', color: 'var(--success)', fontFamily: 'var(--font-title)', marginTop: '4px' }}>
              Total Payable: ₹{totalBill}
            </strong>
          </div>
        </div>
      )}

      <div style={{ display: 'flex', gap: '8px' }}>
        <Select
          label="Method"
          options={[
            { value: 'upi', label: 'UPI / QR Code' },
            { value: 'cash', label: 'Cash' },
            { value: 'card', label: 'Card' },
            { value: 'credit', label: 'Credit' }
          ]}
          value={paymentMethod}
          onChange={(e) => setPaymentMethod(e.target.value as any)}
          style={{ flex: 1 }}
        />
        <Select
          label="Status"
          options={[
            { value: 'paid', label: 'Paid' },
            { value: 'unpaid', label: 'Unpaid (Credit)' },
            { value: 'partial', label: 'Partial' }
          ]}
          value={paymentStatus}
          onChange={(e) => setPaymentStatus(e.target.value as any)}
          style={{ flex: 1 }}
        />
      </div>

      <TextArea
        label="Notes"
        placeholder="Add special instructions or details..."
        value={notes}
        onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setNotes(e.target.value)}
      />

      <Button type="submit" fullWidth style={{ marginTop: '12px' }}>
        Complete Sale & Checkout
      </Button>
    </form>
  );
};
export default SaleForm;
