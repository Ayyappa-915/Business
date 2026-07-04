import React, { createContext, useContext, useState, ReactNode } from 'react';

type NotificationType = 'success' | 'danger' | 'warning' | 'info';

interface AlertData {
  isOpen: boolean;
  message: string;
  title: string;
  type: NotificationType;
}

interface NotificationContextProps {
  showNotification: (message: string, type?: NotificationType) => void;
  alert: (message: string, type?: NotificationType) => void;
}

const NotificationContext = createContext<NotificationContextProps | undefined>(undefined);

export const NotificationProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [alertData, setAlertData] = useState<AlertData | null>(null);

  const showNotification = (message: string, type: NotificationType = 'info') => {
    // Treat everything as a beautiful centered popup dialog!
    let title = 'Notification';
    if (type === 'success') title = 'Success';
    else if (type === 'danger') title = 'Access Denied / Error';
    else if (type === 'warning') title = 'Validation Warning';
    
    // Parse message to get a clean title if emojis are present
    if (message.includes('🔒') || message.includes('Access Denied')) {
      title = 'Access Denied';
      type = 'danger';
    } else if (message.includes('❌') || message.includes('Cannot Delete') || message.includes('failed')) {
      title = 'Error Action';
      type = 'danger';
    } else if (message.includes('🎉') || message.includes('success')) {
      title = 'Success';
      type = 'success';
    } else if (message.includes('⚠️') || message.includes('warning') || message.includes('Insufficient')) {
      title = 'Validation Warning';
      type = 'warning';
    }

    setAlertData({
      isOpen: true,
      message,
      title,
      type
    });
  };

  const alert = (message: string, type?: NotificationType) => {
    showNotification(message, type || 'info');
  };

  return (
    <NotificationContext.Provider value={{ showNotification, alert }}>
      {children}
      
      {/* Centered Alert Modal overlay */}
      {alertData?.isOpen && (
        <div 
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.45)',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 99999,
            animation: 'fadeIn 0.2s ease-out'
          }} 
          onClick={() => setAlertData(null)}
        >
          <div 
            style={{
              backgroundColor: 'var(--bg-primary)',
              borderRadius: 'var(--radius-lg)',
              border: '1px solid var(--border-color)',
              boxShadow: 'var(--shadow-xl)',
              width: '90%',
              maxWidth: '360px',
              padding: '24px 20px',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '14px',
              animation: 'scaleUp 0.25s cubic-bezier(0.34, 1.56, 0.64, 1) forwards',
              textAlign: 'center',
              boxSizing: 'border-box'
            }} 
            onClick={(e) => e.stopPropagation()}
          >
            <div 
              style={{
                width: '56px',
                height: '56px',
                borderRadius: '50%',
                backgroundColor: alertData.type === 'success' ? 'var(--success-soft)' : alertData.type === 'danger' ? 'var(--danger-soft)' : alertData.type === 'warning' ? 'var(--warning-soft)' : 'var(--primary-soft)',
                color: alertData.type === 'success' ? 'var(--success)' : alertData.type === 'danger' ? 'var(--danger)' : alertData.type === 'warning' ? 'var(--warning)' : 'var(--primary)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '1.8rem',
                fontWeight: 'bold',
              }}
            >
              {alertData.type === 'success' ? '✓' : alertData.type === 'danger' ? '✕' : alertData.type === 'warning' ? '⚠' : 'ℹ'}
            </div>
            
            <h4 style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
              {alertData.title}
            </h4>
            
            <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', margin: 0, lineHeight: '1.5' }}>
              {alertData.message}
            </p>
            
            <button 
              onClick={() => setAlertData(null)}
              style={{
                width: '100%',
                padding: '12px',
                borderRadius: 'var(--radius-md)',
                backgroundColor: alertData.type === 'success' ? 'var(--success)' : alertData.type === 'danger' ? 'var(--danger)' : alertData.type === 'warning' ? 'var(--warning)' : 'var(--primary)',
                color: '#ffffff',
                border: 'none',
                fontWeight: 700,
                fontSize: '0.9rem',
                cursor: 'pointer',
                boxShadow: 'var(--shadow-sm)',
                transition: 'filter 0.2s',
                marginTop: '6px'
              }}
              onMouseOver={(e) => e.currentTarget.style.filter = 'brightness(0.9)'}
              onMouseOut={(e) => e.currentTarget.style.filter = 'none'}
            >
              OK
            </button>
          </div>
        </div>
      )}

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes scaleUp {
          from {
            opacity: 0;
            transform: scale(0.9) translateY(10px);
          }
          to {
            opacity: 1;
            transform: scale(1) translateY(0);
          }
        }
      `}</style>
    </NotificationContext.Provider>
  );
};

export const useNotification = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotification must be used within a NotificationProvider');
  }
  return context;
};
