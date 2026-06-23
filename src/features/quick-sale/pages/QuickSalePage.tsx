import React, { useState } from 'react';
import { ShoppingCart, User as UserIcon, Tag, CreditCard } from 'lucide-react';
import { useInventory } from '../../../hooks/useInventory';
import { useAppDispatch } from '../../../app/hooks';
import { addSale } from '../../db/dbSlice';
import QuickSaleCard from '../../../components/cards/QuickSaleCard';
import SearchBar from '../../../components/common/SearchBar';
import BottomSheet from '../../../components/common/BottomSheet';
import Input from '../../../components/common/Input';
import Select from '../../../components/common/Select';
import Button from '../../../components/common/Button';
import SegmentedControl from '../../../components/common/SegmentedControl';
import { Sale, SaleItem } from '../../../types/sale.types';
import { inventoryValidator } from '../../../services/inventory/inventoryValidator';

export const QuickSalePage: React.FC = () => {
  const dispatch = useAppDispatch();
  const { products, variants, categories } = useInventory();
  
  const [activeTab, setActiveTab] = useState<'exchanged' | 'prepared'>('exchanged');
  const [search, setSearch] = useState('');
  const [selectedCatId, setSelectedCatId] = useState<string>('all');
  
  // Checkout Cart
  const [cart, setCart] = useState<{ variantId: string; quantity: number }[]>([]);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  
  // Checkout Form Details
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'upi' | 'card' | 'credit'>('upi');
  const [billDiscount, setBillDiscount] = useState('0');
  const [error, setError] = useState('');

  // Filtered variants to display in the POS grid
  const filteredVariants = variants.filter(v => {
    const prod = products.find(p => p.id === v.productId);
    if (!prod) return false;
    
    const cat = categories.find(c => c.id === prod.categoryId);
    const catType = cat ? cat.type : 'exchanged';
    if (catType !== activeTab) return false;

    const matchesSearch = prod.name.toLowerCase().includes(search.toLowerCase()) || 
                          (v.sku && v.sku.toLowerCase().includes(search.toLowerCase())) || 
                          (v.barcode && v.barcode.includes(search));
                          
    const matchesCat = selectedCatId === 'all' || prod.categoryId === selectedCatId;
    
    return matchesSearch && matchesCat;
  });

  const handleTapProduct = (variantId: string) => {
    const variant = variants.find(v => v.id === variantId);
    if (!variant) return;

    const parentProd = products.find(p => p.id === variant.productId);
    const isTracked = parentProd?.isStockTracked !== false;

    const existingCartItem = cart.find(item => item.variantId === variantId);
    const currentQty = existingCartItem ? existingCartItem.quantity : 0;
    const newQty = currentQty + 1;

    // Validate stock
    const validation = inventoryValidator.validateSaleQuantity(variant, newQty, isTracked, false);
    if (!validation.isValid) {
      alert(validation.error || 'Insufficient stock.');
      return;
    }

    if (existingCartItem) {
      setCart(cart.map(item => item.variantId === variantId ? { ...item, quantity: newQty } : item));
    } else {
      setCart([...cart, { variantId, quantity: 1 }]);
    }
  };

  const handleAdjustQuantity = (variantId: string, delta: number) => {
    const variant = variants.find(v => v.id === variantId);
    if (!variant) return;

    const parentProd = products.find(p => p.id === variant.productId);
    const isTracked = parentProd?.isStockTracked !== false;

    const existing = cart.find(item => item.variantId === variantId);
    if (!existing) return;

    const newQty = existing.quantity + delta;
    if (newQty <= 0) {
      setCart(cart.filter(item => item.variantId !== variantId));
      return;
    }

    const validation = inventoryValidator.validateSaleQuantity(variant, newQty, isTracked, false);
    if (!validation.isValid) {
      alert(validation.error || 'Insufficient stock.');
      return;
    }

    setCart(cart.map(item => item.variantId === variantId ? { ...item, quantity: newQty } : item));
  };

  const handleSetQuantity = (variantId: string, qty: number) => {
    const variant = variants.find(v => v.id === variantId);
    if (!variant) return;

    if (qty <= 0) {
      setCart(cart.filter(item => item.variantId !== variantId));
      return;
    }

    const parentProd = products.find(p => p.id === variant.productId);
    const isTracked = parentProd?.isStockTracked !== false;

    const validation = inventoryValidator.validateSaleQuantity(variant, qty, isTracked, false);
    if (!validation.isValid) {
      alert(validation.error || 'Insufficient stock.');
      return;
    }

    setCart(cart.map(item => item.variantId === variantId ? { ...item, quantity: qty } : item));
  };

  // Calculations
  const cartTotalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
  
  const getSubtotal = () => {
    return cart.reduce((sum, item) => {
      const v = variants.find(varItem => varItem.id === item.variantId);
      return sum + (v ? v.price * item.quantity : 0);
    }, 0);
  };

  const handleCheckoutSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (cart.length === 0) return;

    const subtotal = getSubtotal();
    const discount = parseFloat(billDiscount) || 0;
    const totalAmount = Math.max(0, subtotal - discount);

    const saleItems: SaleItem[] = cart.map(item => {
      const v = variants.find(varItem => varItem.id === item.variantId);
      return {
        productId: v ? v.productId : '',
        variantId: item.variantId,
        quantity: item.quantity,
        unitPrice: v ? v.price : 0,
        discount: 0
      };
    });

    const newSale: Sale = {
      id: 'sale_' + Math.random().toString(36).substr(2, 9),
      customerName: customerName.trim() || undefined,
      customerPhone: customerPhone.trim() || undefined,
      saleDate: new Date().toISOString(),
      items: saleItems,
      subtotal,
      discount,
      totalAmount,
      paymentMethod,
      paymentStatus: paymentMethod === 'credit' ? 'unpaid' : 'paid',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    dispatch(addSale(newSale));
    
    // Clear Checkout Cart and form
    setCart([]);
    setCustomerName('');
    setCustomerPhone('');
    setBillDiscount('0');
    setPaymentMethod('upi');
    setIsCheckoutOpen(false);
    
    alert('🎉 Sale processed and checkout completed successfully!');
  };

  const subtotal = getSubtotal();
  const discVal = parseFloat(billDiscount) || 0;
  const totalBill = Math.max(0, subtotal - discVal);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }} className="animate-fade-in">
      
      <SegmentedControl
        options={[
          { value: 'exchanged', label: 'Exchanged Items' },
          { value: 'prepared', label: 'Prepared Items' }
        ]}
        value={activeTab}
        onChange={(val) => {
          setActiveTab(val as any);
          setSelectedCatId('all');
        }}
      />

      {/* Category Horizontal Filter Pills */}
      <div style={{
        display: 'flex',
        gap: '8px',
        overflowX: 'auto',
        paddingBottom: '4px',
        whiteSpace: 'nowrap'
      }}>
        <button
          onClick={() => setSelectedCatId('all')}
          style={{
            padding: '8px 14px',
            backgroundColor: selectedCatId === 'all' ? 'var(--primary)' : 'var(--bg-secondary)',
            color: selectedCatId === 'all' ? '#ffffff' : 'var(--text-secondary)',
            border: '1px solid var(--border-color)',
            borderRadius: 'var(--radius-full)',
            fontSize: '0.8rem',
            fontWeight: 600,
            cursor: 'pointer'
          }}
        >
          All Items
        </button>
        {categories.filter(cat => cat.type === activeTab).map(cat => (
          <button
            key={cat.id}
            onClick={() => setSelectedCatId(cat.id)}
            style={{
              padding: '8px 14px',
              backgroundColor: selectedCatId === cat.id ? 'var(--primary)' : 'var(--bg-secondary)',
              color: selectedCatId === cat.id ? '#ffffff' : 'var(--text-secondary)',
              border: '1px solid var(--border-color)',
              borderRadius: 'var(--radius-full)',
              fontSize: '0.8rem',
              fontWeight: 600,
              cursor: 'pointer'
            }}
          >
            {cat.name}
          </button>
        ))}
      </div>

      <SearchBar 
        value={search}
        onChange={setSearch}
        placeholder="Scan barcode or type item title..."
      />

      {/* POS Grid */}
      {filteredVariants.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '40px 16px', color: 'var(--text-muted)' }}>
          No sellable products found
        </div>
      ) : (
        <div className="pos-grid" style={{ paddingBottom: cartTotalItems > 0 ? '120px' : '30px' }}>
          {filteredVariants.map(v => {
            const p = products.find(prod => prod.id === v.productId);
            if (!p) return null;
            const inCart = cart.find(item => item.variantId === v.id)?.quantity || 0;
            return (
              <QuickSaleCard
                key={v.id}
                product={p}
                variant={v}
                quantityInCart={inCart}
                onTap={() => handleTapProduct(v.id)}
              />
            );
          })}
        </div>
      )}

      {/* Bottom Floating Checkout Bar */}
      {cartTotalItems > 0 && (
        <div style={{
          position: 'fixed',
          bottom: 'calc(var(--bottom-nav-height) + var(--safe-area-bottom))',
          left: 0,
          right: 0,
          backgroundColor: 'var(--bg-secondary)',
          borderTop: '2px solid var(--primary)',
          boxShadow: 'var(--shadow-lg)',
          padding: '12px 16px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          zIndex: 98,
          animation: 'slideUp var(--transition-fast) forwards'
        }}>
          <div>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', display: 'block' }}>
              Selected: {cartTotalItems} {cartTotalItems === 1 ? 'item' : 'items'}
            </span>
            <span style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--success)', fontFamily: 'var(--font-title)' }}>
              ₹{getSubtotal()}
            </span>
          </div>
          <Button 
            onClick={() => setIsCheckoutOpen(true)}
            rightIcon={<ShoppingCart size={18} />}
            variant="success"
            size="md"
          >
            Review & Checkout
          </Button>
        </div>
      )}

      {/* Checkout details slide-up bottom sheet */}
      <BottomSheet 
        isOpen={isCheckoutOpen} 
        onClose={() => setIsCheckoutOpen(false)} 
        title="POS Invoice Details"
      >
        <form onSubmit={handleCheckoutSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {error && <div style={{ color: 'var(--danger)', fontSize: '0.85rem', fontWeight: 600 }}>{error}</div>}

          {/* Cart review list with increment controls */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginBottom: '10px' }}>
            <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Review Cart list:</span>
            {cart.map((item) => {
              const v = variants.find(varItem => varItem.id === item.variantId);
              const p = products.find(prod => prod.id === (v ? v.productId : ''));
              if (!v || !p) return null;
              return (
                <div key={item.variantId} className="flex-between" style={{
                  padding: '8px 12px',
                  backgroundColor: 'var(--bg-tertiary)',
                  borderRadius: 'var(--radius-sm)',
                  fontSize: '0.82rem'
                }}>
                  <div>
                    <strong>{p.name}</strong>
                    <span style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', display: 'block' }}>
                      {v.name.toLowerCase().startsWith(p.name.toLowerCase()) ? v.name.slice(p.name.length).trim() : v.name} • ₹{v.price}
                    </span>
                  </div>
                  {/* Plus minus counters with custom numeric input */}
                  <div className="flex-align-center" style={{ gap: '10px' }}>
                    <button type="button" onClick={() => handleAdjustQuantity(item.variantId, -1)} style={{ width: '26px', height: '26px', borderRadius: '50%', backgroundColor: 'var(--border-color)', fontWeight: 700 }}>
                      -
                    </button>
                    <input
                      type="number"
                      step="any"
                      min="0"
                      value={item.quantity}
                      onChange={(e) => {
                        const val = parseFloat(e.target.value);
                        handleSetQuantity(item.variantId, isNaN(val) ? 0 : val);
                      }}
                      style={{
                        width: '54px',
                        textAlign: 'center',
                        border: '1px solid var(--border-color)',
                        borderRadius: 'var(--radius-sm)',
                        padding: '4px 2px',
                        fontWeight: 600,
                        backgroundColor: 'var(--bg-primary)',
                        color: 'var(--text-primary)',
                        outline: 'none'
                      }}
                    />
                    <button type="button" onClick={() => handleAdjustQuantity(item.variantId, 1)} style={{ width: '26px', height: '26px', borderRadius: '50%', backgroundColor: 'var(--border-color)', fontWeight: 700 }}>
                      +
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          <div style={{ display: 'flex', gap: '8px' }}>
            <Input
              label="Customer Name"
              placeholder="e.g. Ramesh Reddy"
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              style={{ flex: 1 }}
            />
            <Input
              label="Customer Phone"
              placeholder="10-digit phone"
              value={customerPhone}
              onChange={(e) => setCustomerPhone(e.target.value)}
              style={{ flex: 1 }}
            />
          </div>

          <div style={{ display: 'flex', gap: '8px' }}>
            <Select
              label="Payment Type"
              options={[
                { value: 'upi', label: 'UPI / Paytm / GPay' },
                { value: 'cash', label: 'Cash' },
                { value: 'card', label: 'Card Payment' },
                { value: 'credit', label: 'Credit (Udhari)' }
              ]}
              value={paymentMethod}
              onChange={(e) => setPaymentMethod(e.target.value as any)}
              style={{ flex: 1 }}
            />
            <Input
              label="Discount (₹)"
              type="number"
              value={billDiscount}
              onChange={(e) => setBillDiscount(e.target.value)}
              min="0"
              style={{ flex: 1 }}
            />
          </div>

          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '12px',
            backgroundColor: 'var(--primary-soft)',
            borderRadius: 'var(--radius-md)',
            margin: '8px 0'
          }}>
            <span style={{ fontWeight: 600, fontSize: '0.85rem' }}>Subtotal: ₹{getSubtotal()}</span>
            <strong style={{ fontSize: '1.2rem', color: 'var(--success)', fontFamily: 'var(--font-title)' }}>
              Final Amount: ₹{totalBill}
            </strong>
          </div>

          <Button type="submit" fullWidth variant="success" size="lg">
            Print Bill & Record Sale (₹{totalBill})
          </Button>
        </form>
      </BottomSheet>
      
    </div>
  );
};
export default QuickSalePage;
