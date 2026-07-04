import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Mail, Shield, User as UserIcon } from 'lucide-react';
import { useAuth } from '../../../hooks/useAuth';
import { ROUTES } from '../../../constants/routes';
import { UserRole } from '../../../types/auth.types';
import Input from '../../../components/common/Input';
import Select from '../../../components/common/Select';
import Button from '../../../components/common/Button';

export const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const { loginUser, error, isLoading } = useAuth();
  
  const [email, setEmail] = useState('owner@biztracker.com');
  const [role, setRole] = useState<UserRole>('owner');
  const [formError, setFormError] = useState('');

  const roleOptions = [
    { value: 'owner', label: 'Shop Owner' },
    { value: 'manager', label: 'Store Manager' },
    { value: 'cashier', label: 'Cashier' }
  ];

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      setFormError('Please enter your email.');
      return;
    }
    
    const result = await loginUser(email, role);
    if (result.success) {
      navigate(ROUTES.DASHBOARD);
    }
  };

  const handleQuickDemoLogin = async (demoRole: UserRole) => {
    const demoEmail = demoRole === 'owner' ? 'owner@biztracker.com' : 'cashier@biztracker.com';
    setEmail(demoEmail);
    setRole(demoRole);
    
    const result = await loginUser(demoEmail, demoRole);
    if (result.success) {
      navigate(ROUTES.DASHBOARD);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }} className="animate-fade-in">
      <div style={{ textAlign: 'center', marginBottom: '12px' }}>
        <h2 style={{ fontSize: '1.75rem', fontWeight: 800, color: '#ffffff', fontFamily: 'var(--font-title)' }}>
          Welcome Back
        </h2>
        <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
          Log in to manage your shop transactions
        </span>
      </div>

      <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
        {(error || formError) && (
          <div style={{ color: 'var(--danger)', fontSize: '0.82rem', fontWeight: 600, marginBottom: '8px' }}>
            {error || formError}
          </div>
        )}

        <Input
          label="Email Address"
          type="email"
          placeholder="owner@biztracker.com"
          value={email}
          onChange={(e) => {
            setEmail(e.target.value);
            setFormError('');
          }}
          leftIcon={<Mail size={18} />}
          required
        />

        <Select
          label="Access Role"
          options={roleOptions}
          value={role}
          onChange={(e) => setRole(e.target.value as UserRole)}
          leftIcon={<Shield size={18} />}
        />

        <Button type="submit" fullWidth isLoading={isLoading} style={{ marginTop: '16px' }}>
          Verify & Access Dashboard
        </Button>
      </form>

      {/* Quick Demo Shortcuts */}
      <div style={{
        backgroundColor: 'var(--bg-secondary)',
        border: '1px solid var(--border-color)',
        borderRadius: 'var(--radius-md)',
        padding: '16px',
        display: 'flex',
        flexDirection: 'column',
        gap: '10px',
        marginTop: '12px'
      }}>
        <span style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
          Demo Accounts Shortcut:
        </span>
        <div style={{ display: 'flex', gap: '8px' }}>
          <Button 
            type="button" 
            variant="outline" 
            size="sm" 
            style={{ flex: 1, fontSize: '0.78rem' }}
            onClick={() => handleQuickDemoLogin('owner')}
          >
            🔑 Log Owner
          </Button>
          <Button 
            type="button" 
            variant="outline" 
            size="sm" 
            style={{ flex: 1, fontSize: '0.78rem' }}
            onClick={() => handleQuickDemoLogin('cashier')}
          >
            🔑 Log Cashier
          </Button>
        </div>
      </div>

      <div style={{ textAlign: 'center', marginTop: '8px', fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
        Registering new store?{' '}
        <button 
          onClick={() => navigate(ROUTES.REGISTER)}
          style={{ color: 'var(--primary)', fontWeight: 600, textDecoration: 'underline' }}
        >
          Sign Up
        </button>
      </div>
    </div>
  );
};
export default LoginPage;
