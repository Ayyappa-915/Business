import React from 'react';
import { Menu, Bell, Sun, Moon } from 'lucide-react';
import { useAppDispatch, useAppSelector } from '../../app/hooks';
import { toggleTheme, selectTheme } from '../../features/settings/settingsSlice';
import { useDashboard } from '../../hooks/useDashboard';

interface MobileHeaderProps {
  title: string;
  onMenuClick: () => void;
  onNotificationsClick: () => void;
}

export const MobileHeader: React.FC<MobileHeaderProps> = ({
  title,
  onMenuClick,
  onNotificationsClick
}) => {
  const dispatch = useAppDispatch();
  const theme = useAppSelector(selectTheme);
  const { notifications } = useDashboard();
  const unreadCount = notifications.filter(n => !n.isRead).length;

  return (
    <header className="glass-header flex-between">
      <div className="flex-align-center" style={{ gap: '14px' }}>
        <button 
          onClick={onMenuClick} 
          className="interactive"
          style={{ padding: '6px', color: 'var(--text-primary)' }}
        >
          <Menu size={22} />
        </button>
        <h1 style={{ fontSize: '1.15rem', fontWeight: 700, fontFamily: 'var(--font-title)' }}>
          {title}
        </h1>
      </div>
      <div className="flex-align-center" style={{ gap: '8px' }}>
        <button 
          onClick={() => dispatch(toggleTheme())}
          className="interactive"
          style={{ padding: '6px', color: 'var(--text-secondary)' }}
        >
          {theme === 'light' ? <Moon size={20} /> : <Sun size={20} />}
        </button>
        <button 
          onClick={onNotificationsClick}
          className="interactive"
          style={{ padding: '6px', color: 'var(--text-secondary)', position: 'relative' }}
        >
          <Bell size={20} />
          {unreadCount > 0 && (
            <span style={{
              position: 'absolute',
              top: '4px',
              right: '4px',
              backgroundColor: 'var(--danger)',
              color: '#ffffff',
              fontSize: '0.65rem',
              fontWeight: 'bold',
              borderRadius: '50%',
              width: '15px',
              height: '15px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              {unreadCount}
            </span>
          )}
        </button>
      </div>
    </header>
  );
};
export default MobileHeader;
