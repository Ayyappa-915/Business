import React, { useState } from 'react';
import { useAuth } from '../../../hooks/useAuth';
import { useAppDispatch, useAppSelector } from '../../../app/hooks';
import { toggleTheme, selectTheme } from '../../settings/settingsSlice';
import { addUnit, deleteUnit } from '../../db/dbSlice';
import Input from '../../../components/common/Input';
import Button from '../../../components/common/Button';
import Badge from '../../../components/common/Badge';
import BottomSheet from '../../../components/common/BottomSheet';
import ConfirmDialog from '../../../components/common/ConfirmDialog';
import { Unit } from '../../../types/unit.types';

export const SettingsPage: React.FC = () => {
  const dispatch = useAppDispatch();
  const { user, updateUserProfile } = useAuth();
  const theme = useAppSelector(selectTheme);
  const units = useAppSelector(state => state.db.units);
  const products = useAppSelector(state => state.db.products);

  // Profile Form States
  const [shopName, setShopName] = useState(user?.shopName || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [businessType, setBusinessType] = useState(user?.businessType || '');
  const [profileSuccess, setProfileSuccess] = useState(false);

  // Unit Form States
  const [isUnitSheetOpen, setIsUnitSheetOpen] = useState(false);
  const [unitName, setUnitName] = useState('');
  const [unitAbbr, setUnitAbbr] = useState('');
  const [allowDecimal, setAllowDecimal] = useState(false);
  const [unitError, setUnitError] = useState('');
  const [deletingUnitItem, setDeletingUnitItem] = useState<Unit | null>(null);

  const isUnitLinked = (unitId: string) => {
    return products.some(p => p.unitId === unitId);
  };

  const handleDeleteUnit = () => {
    if (deletingUnitItem) {
      dispatch(deleteUnit(deletingUnitItem.id));
      setDeletingUnitItem(null);
    }
  };

  const handleProfileSave = (e: React.FormEvent) => {
    e.preventDefault();
    updateUserProfile({ shopName, phone, businessType });
    setProfileSuccess(true);
    setTimeout(() => setProfileSuccess(false), 3000);
  };

  const handleCreateUnit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!unitName.trim() || !unitAbbr.trim()) {
      setUnitError('Unit label and shorthand code are required.');
      return;
    }

    dispatch(addUnit({
      id: 'unit_' + Math.random().toString(36).substr(2, 9),
      name: unitName.trim(),
      abbreviation: unitAbbr.trim().toLowerCase(),
      isDecimalAllowed: allowDecimal,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }));

    setUnitName('');
    setUnitAbbr('');
    setAllowDecimal(false);
    setIsUnitSheetOpen(false);
    setUnitError('');
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', paddingBottom: '30px' }} className="animate-fade-in">
      <div>
        <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>App Parameters</span>
        <h3 style={{ fontSize: '1.25rem', marginTop: '2px', fontWeight: 800 }}>Profile & Settings</h3>
      </div>

      {/* Theme Toggler Card */}
      <div className="card flex-between" style={{ padding: '14px' }}>
        <div>
          <strong style={{ fontSize: '0.92rem', display: 'block' }}>Visual Theme</strong>
          <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>Toggle dark/light backdrop</span>
        </div>
        <Button onClick={() => dispatch(toggleTheme())} variant="secondary" size="sm">
          {theme === 'light' ? '🌙 Dark Mode' : '☀️ Light Mode'}
        </Button>
      </div>

      {/* Profile Details Settings */}
      <div className="card">
        <h4 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '12px' }}>Shop Details</h4>
        <form onSubmit={handleProfileSave} style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
          {profileSuccess && (
            <div style={{ color: 'var(--success)', fontSize: '0.82rem', fontWeight: 600, marginBottom: '8px' }}>
              ✓ Shop settings saved successfully!
            </div>
          )}

          <Input
            label="Shop Name"
            value={shopName}
            onChange={(e) => setShopName(e.target.value)}
            required
          />

          <Input
            label="Business Type"
            value={businessType}
            onChange={(e) => setBusinessType(e.target.value)}
          />

          <Input
            label="Support Phone Contact"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
          />

          <Button type="submit" size="sm" style={{ marginTop: '8px', alignSelf: 'flex-end' }}>
            Save Changes
          </Button>
        </form>
      </div>

      {/* Measurement Units Administration */}
      <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        <div className="flex-between">
          <h4 style={{ fontSize: '1rem', fontWeight: 700 }}>Measurement Units</h4>
          <Button onClick={() => setIsUnitSheetOpen(true)} variant="outline" size="sm">
            + Custom Unit
          </Button>
        </div>

        <div style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: '8px',
          marginTop: '6px'
        }}>
          {units.map((unit) => (
            <div
              key={unit.id}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '6px 12px',
                backgroundColor: 'var(--bg-tertiary)',
                border: '1px solid var(--border-color)',
                borderRadius: 'var(--radius-sm)',
                fontSize: '0.8rem'
              }}
            >
              <strong>{unit.name} ({unit.abbreviation})</strong>
              {unit.isDecimalAllowed && <span style={{ fontSize: '0.65rem', color: 'var(--success)' }}>.00 ok</span>}
              
              {/* Avoid deleting default stock system units pcs/kg for integrity */}
              {!['pcs', 'kg', 'ltr', 'box'].includes(unit.id) && (
                <button
                  onClick={() => setDeletingUnitItem(unit)}
                  className="interactive"
                  style={{ color: 'var(--danger)', fontSize: '0.85rem', marginLeft: '4px', border: 'none', backgroundColor: 'transparent', cursor: 'pointer' }}
                >
                  ✕
                </button>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Add Custom unit bottom sheet */}
      <BottomSheet isOpen={isUnitSheetOpen} onClose={() => setIsUnitSheetOpen(false)} title="Add Measurement Unit">
        <form onSubmit={handleCreateUnit} style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {unitError && <div style={{ color: 'var(--danger)', fontSize: '0.85rem', fontWeight: 600 }}>{unitError}</div>}

          <Input
            label="Unit Label"
            placeholder="e.g. Kilograms, Pieces"
            value={unitName}
            onChange={(e) => setUnitName(e.target.value)}
            required
          />

          <Input
            label="Shorthand Code"
            placeholder="e.g. kg, pcs, box"
            value={unitAbbr}
            onChange={(e) => setUnitAbbr(e.target.value)}
            required
          />

          <div className="flex-between" style={{ padding: '8px 0', borderBottom: '1px solid var(--border-color)' }}>
            <span style={{ fontSize: '0.9rem', fontWeight: 600 }}>Allow decimal quantities (e.g. 1.5 kg)</span>
            <input
              type="checkbox"
              checked={allowDecimal}
              onChange={(e) => setAllowDecimal(e.target.checked)}
              style={{ width: '20px', height: '20px', cursor: 'pointer' }}
            />
          </div>

          <Button type="submit" fullWidth style={{ marginTop: '12px' }}>
            Add Unit
          </Button>
        </form>
      </BottomSheet>

      {/* Delete Unit Confirmation Dialog */}
      <ConfirmDialog
        isOpen={deletingUnitItem !== null}
        title={deletingUnitItem && isUnitLinked(deletingUnitItem.id) ? "Cannot Delete Unit" : "Delete Measurement Unit?"}
        message={
          deletingUnitItem && isUnitLinked(deletingUnitItem.id)
            ? `Cannot delete unit "${deletingUnitItem.name}" because it is currently assigned to one or more catalog products. Please reassign those products before deleting this unit.`
            : `Are you sure you want to permanently delete the measurement unit "${deletingUnitItem?.name}"?`
        }
        onConfirm={deletingUnitItem && isUnitLinked(deletingUnitItem.id) ? () => setDeletingUnitItem(null) : handleDeleteUnit}
        onCancel={() => setDeletingUnitItem(null)}
        confirmLabel={deletingUnitItem && isUnitLinked(deletingUnitItem.id) ? "Close" : "Yes, Delete"}
        cancelLabel={deletingUnitItem && isUnitLinked(deletingUnitItem.id) ? "" : "Cancel"}
        isDanger={!(deletingUnitItem && isUnitLinked(deletingUnitItem.id))}
      />
    </div>
  );
};
export default SettingsPage;
