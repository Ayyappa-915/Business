import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Mail, User as UserIcon, Store, Shield } from 'lucide-react';
import { useAuth } from '../../../hooks/useAuth';
import { ROUTES } from '../../../constants/routes';
import Input from '../../../components/common/Input';
import Select from '../../../components/common/Select';
import Button from '../../../components/common/Button';

export const RegisterPage: React.FC = () => {
  const navigate = useNavigate();
  const { registerUser, error, isLoading } = useAuth();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [shopName, setShopName] = useState('');
  const [businessType, setBusinessType] = useState('Groceries');
  const [formError, setFormError] = useState('');

  const typeOptions = [
    { value: 'Groceries', label: 'Retail Grocery Store' },
    { value: 'Pharmacy', label: 'Pharmacy & Medical' },
    { value: 'Apparel', label: 'Clothing & Fashion' },
    { value: 'Electronics', label: 'Electronics & Mobiles' },
    { value: 'Restaurant', label: 'Restaurant & Cafe' },
    { value: 'Others', label: 'Others' }
  ];

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email || !shopName) {
      setFormError('Please fill in all required fields.');
      return;
    }

    const result = await registerUser(name, email, 'owner', shopName);
    if (result.success) {
      // Add custom businessType properties to state
      navigate(ROUTES.DASHBOARD);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }} className="animate-fade-in">
      <div style={{ textAlign: 'center', marginBottom: '8px' }}>
        <h2 style={{ fontSize: '1.75rem', fontWeight: 800, color: '#ffffff', fontFamily: 'var(--font-title)' }}>
          Register Store
        </h2>
        <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
          Setup your store database profile in 10 seconds
        </span>
      </div>

      <form onSubmit={handleRegister} style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
        {(error || formError) && (
          <div style={{ color: 'var(--danger)', fontSize: '0.82rem', fontWeight: 600, marginBottom: '8px' }}>
            {error || formError}
          </div>
        )}

        <Input
          label="Your Full Name"
          type="text"
          placeholder="e.g. Bala Ayyappa"
          value={name}
          onChange={(e) => {
            setName(e.target.value);
            setFormError('');
          }}
          leftIcon={<UserIcon size={18} />}
          required
        />

        <Input
          label="Email Address"
          type="email"
          placeholder="owner@supermart.com"
          value={email}
          onChange={(e) => {
            setEmail(e.target.value);
            setFormError('');
          }}
          leftIcon={<Mail size={18} />}
          required
        />

        <Input
          label="Store Shop Name"
          type="text"
          placeholder="Ayyappa Super Mart"
          value={shopName}
          onChange={(e) => {
            setShopName(e.target.value);
            setFormError('');
          }}
          leftIcon={<Store size={18} />}
          required
        />

        <Select
          label="Business Type"
          options={typeOptions}
          value={businessType}
          onChange={(e) => setBusinessType(e.target.value)}
          leftIcon={<Shield size={18} />}
        />

        <Button type="submit" fullWidth isLoading={isLoading} style={{ marginTop: '16px' }}>
          Create Profile & Start
        </Button>
      </form>

      <div style={{ textAlign: 'center', marginTop: '8px', fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
        Already registered?{' '}
        <button 
          onClick={() => navigate(ROUTES.LOGIN)}
          style={{ color: 'var(--primary)', fontWeight: 600, textDecoration: 'underline' }}
        >
          Log In
        </button>
      </div>
    </div>
  );
};
export default RegisterPage;
