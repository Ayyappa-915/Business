import React, { useState, useRef } from 'react';
import { Download, Upload, CheckCircle, AlertTriangle, Trash2 } from 'lucide-react';
import { useAppDispatch, useAppSelector } from '../../../app/hooks';
import { restoreDatabase } from '../../db/dbSlice';
import { exportService } from '../../../services/backup/exportService';
import { importService } from '../../../services/backup/importService';
import { SEED_USERS, SEED_UNITS } from '../../../utils/seedData';
import Button from '../../../components/common/Button';

export const BackupPage: React.FC = () => {
  const dispatch = useAppDispatch();
  const db = useAppSelector(state => state.db);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [message, setMessage] = useState('');
  const [isError, setIsError] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleExport = () => {
    try {
      setIsLoading(true);
      exportService.exportDatabase(db);
      setMessage('✓ Database backup file downloaded successfully!');
      setIsError(false);
    } catch (e: any) {
      setMessage(e.message || 'Failed to export backup.');
      setIsError(true);
    } finally {
      setIsLoading(false);
    }
  };

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setIsLoading(true);
      setMessage('');
      
      const restoredState = await importService.importDatabase(file);
      
      // Confirm import dialog style overlay (simulate immediate load)
      dispatch(restoreDatabase(restoredState));
      
      setMessage('✓ Database restored successfully! Reloading profiles.');
      setIsError(false);
    } catch (err: any) {
      setMessage(err.message || 'File restore failed.');
      setIsError(true);
    } finally {
      setIsLoading(false);
      // Reset input
      e.target.value = '';
    }
  };

  const handleResetDatabase = () => {
    if (window.confirm('⚠️ Are you sure you want to permanently delete all data? This cannot be undone.')) {
      const cleanDb = {
        users: SEED_USERS,
        categories: [],
        subcategories: [],
        products: [],
        variants: [],
        purchases: [],
        sales: [],
        expenses: [],
        adjustments: [],
        units: SEED_UNITS
      };
      
      dispatch(restoreDatabase(cleanDb));
      setMessage('✓ Database has been reset to a clean state!');
      setIsError(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }} className="animate-fade-in">
      <div>
        <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Security & Storage</span>
        <h3 style={{ fontSize: '1.25rem', marginTop: '2px', fontWeight: 800 }}>Backup & Restore</h3>
      </div>

      {/* Info status warnings */}
      {message && (
        <div style={{
          padding: '12px',
          backgroundColor: isError ? 'var(--danger-soft)' : 'var(--success-soft)',
          border: `1.5px solid ${isError ? 'var(--danger)' : 'var(--success)'}`,
          borderRadius: 'var(--radius-md)',
          fontSize: '0.85rem',
          color: isError ? 'var(--danger)' : 'var(--success)',
          display: 'flex',
          alignItems: 'center',
          gap: '8px'
        }}>
          {isError ? <AlertTriangle size={16} /> : <CheckCircle size={16} />}
          <span>{message}</span>
        </div>
      )}

      {/* Backup instructions */}
      <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        <h4 style={{ fontSize: '1rem', fontWeight: 700 }}>Data Safety</h4>
        <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: '1.4' }}>
          All business data is saved locally on your Android phone's web storage partition. We recommend downloading a backup file weekly to protect against lost devices or browser cache clearing.
        </p>
      </div>

      {/* Action Buttons */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '6px' }}>
        {/* Export Card */}
        <div className="card flex-between" style={{ padding: '16px' }}>
          <div>
            <strong style={{ fontSize: '0.92rem', display: 'block' }}>Export Backup File</strong>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Download shop data as JSON file</span>
          </div>
          <Button 
            onClick={handleExport}
            leftIcon={<Download size={16} />}
            size="sm"
            isLoading={isLoading}
          >
            Backup
          </Button>
        </div>

        {/* Import Card */}
        <div className="card flex-between" style={{ padding: '16px' }}>
          <div>
            <strong style={{ fontSize: '0.92rem', display: 'block' }}>Restore Database</strong>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Upload a previously saved backup file</span>
          </div>
          <div>
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              accept=".json"
              style={{ display: 'none' }}
            />
            <Button 
              onClick={handleImportClick}
              leftIcon={<Upload size={16} />}
              variant="outline"
              size="sm"
              isLoading={isLoading}
            >
              Restore
            </Button>
          </div>
        </div>

        {/* Danger Zone Reset Card */}
        <div className="card flex-between" style={{ borderColor: 'var(--danger)', padding: '16px' }}>
          <div>
            <strong style={{ fontSize: '0.92rem', color: 'var(--danger)', display: 'block' }}>Danger Zone</strong>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Erase all categories, products, stock logs, and transactions</span>
          </div>
          <Button 
            onClick={handleResetDatabase}
            leftIcon={<Trash2 size={16} />}
            variant="danger"
            size="sm"
          >
            Reset
          </Button>
        </div>
      </div>

    </div>
  );
};
export default BackupPage;
