import React, { useState } from 'react';
import { Trash2, ShieldAlert } from 'lucide-react';
import { useAppDispatch, useAppSelector } from '../../../app/hooks';
import { addShopUser, deleteShopUser } from '../../db/dbSlice';
import SearchBar from '../../../components/common/SearchBar';
import BottomSheet from '../../../components/common/BottomSheet';
import ConfirmDialog from '../../../components/common/ConfirmDialog';
import Button from '../../../components/common/Button';
import Input from '../../../components/common/Input';
import Select from '../../../components/common/Select';
import { User, UserRole } from '../../../types/auth.types';

export const UsersPage: React.FC = () => {
  const dispatch = useAppDispatch();
  const users = useAppSelector(state => state.db.users);
  
  const [search, setSearch] = useState('');
  
  // Sheet states
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [deletingUserId, setDeletingUserId] = useState<string | null>(null);

  // Form inputs
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [role, setRole] = useState<UserRole>('cashier');
  const [error, setError] = useState('');

  const filtered = users.filter(u => 
    u.name.toLowerCase().includes(search.toLowerCase()) ||
    u.email.toLowerCase().includes(search.toLowerCase())
  );

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim()) {
      setError('Staff name and email address are required.');
      return;
    }

    const newUser: User = {
      id: 'user_' + Math.random().toString(36).substr(2, 9),
      name: name.trim(),
      email: email.trim(),
      role,
      phone: phone.trim() || undefined,
      createdAt: new Date().toISOString()
    };

    dispatch(addShopUser(newUser));
    
    // Reset
    setName('');
    setEmail('');
    setPhone('');
    setRole('cashier');
    setIsAddOpen(false);
    setError('');
  };

  const handleDelete = () => {
    if (deletingUserId) {
      dispatch(deleteShopUser(deletingUserId));
      setDeletingUserId(null);
    }
  };

  return (
    <div className="responsive-page-container animate-fade-in">
      <div className="flex-between">
        <div>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Staff Credentials</span>
          <h3 style={{ fontSize: '1.25rem', marginTop: '2px', fontWeight: 800 }}>User Management</h3>
        </div>
        <Button onClick={() => setIsAddOpen(true)} size="sm">
          + Add Staff
        </Button>
      </div>

      <SearchBar 
        value={search}
        onChange={setSearch}
        placeholder="Search staff members..."
      />

      {filtered.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '40px 16px', color: 'var(--text-muted)' }}>
          No registered staff members found
        </div>
      ) : (
        <div className="responsive-list-grid">
          {filtered.map(usr => (
            <div key={usr.id} className="card" style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <div className="flex-between">
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <div style={{
                    width: '36px',
                    height: '36px',
                    borderRadius: '50%',
                    backgroundColor: usr.role === 'owner' ? 'var(--primary-soft)' : 'var(--bg-tertiary)',
                    color: usr.role === 'owner' ? 'var(--primary)' : 'var(--text-secondary)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: 700
                  }}>
                    {usr.name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <h4 style={{ fontSize: '0.98rem', fontWeight: 700 }}>{usr.name}</h4>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                      Role: {usr.role.toUpperCase()} • {usr.email}
                    </span>
                  </div>
                </div>

                {usr.role !== 'owner' && (
                  <button 
                    onClick={() => setDeletingUserId(usr.id)}
                    className="interactive"
                    style={{ padding: '6px', color: 'var(--danger)' }}
                  >
                    <Trash2 size={15} />
                  </button>
                )}
              </div>
              {usr.phone && (
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', borderTop: '1px solid var(--border-color)', paddingTop: '6px', marginTop: '2px' }}>
                  📞 {usr.phone}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Add staff sheet */}
      <BottomSheet isOpen={isAddOpen} onClose={() => setIsAddOpen(false)} title="Register Store Staff Member">
        <form onSubmit={handleCreate} style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {error && <div style={{ color: 'var(--danger)', fontSize: '0.85rem', fontWeight: 600 }}>{error}</div>}

          <Input
            label="Staff Name"
            placeholder="e.g. Ramesh Reddy"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />

          <Input
            label="Email Address"
            type="email"
            placeholder="ramesh@biztracker.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />

          <Input
            label="Phone Contact"
            placeholder="e.g. +91 99999 88888"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
          />

          <Select
            label="Store Permission Role"
            options={[
              { value: 'cashier', label: 'Cashier (Access Sales, Products)' },
              { value: 'manager', label: 'Store Manager (Access Inventory, Sales)' }
            ]}
            value={role}
            onChange={(e) => setRole(e.target.value as UserRole)}
          />

          <Button type="submit" fullWidth style={{ marginTop: '14px' }}>
            Register Staff Account
          </Button>
        </form>
      </BottomSheet>

      {/* Delete confirm */}
      <ConfirmDialog
        isOpen={deletingUserId !== null}
        title="Revoke Staff Access?"
        message="This action will revoke the staff credentials and block their device login session immediately. Are you sure?"
        onConfirm={handleDelete}
        onCancel={() => setDeletingUserId(null)}
        isDanger
      />
    </div>
  );
};
export default UsersPage;
