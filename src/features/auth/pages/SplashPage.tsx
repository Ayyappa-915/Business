import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Zap } from 'lucide-react';
import { useAuth } from '../../../hooks/useAuth';
import { ROUTES } from '../../../constants/routes';

export const SplashPage: React.FC = () => {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();

  useEffect(() => {
    const timer = setTimeout(() => {
      if (isAuthenticated) {
        navigate(ROUTES.DASHBOARD);
      } else {
        // Fallback to onboarding
        navigate(ROUTES.ONBOARDING);
      }
    }, 1500);

    return () => clearTimeout(timer);
  }, [isAuthenticated, navigate]);

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      height: '80vh',
      gap: '24px',
      color: '#ffffff',
      textAlign: 'center'
    }} className="animate-fade-in">
      {/* Dynamic Animated Logo Icon */}
      <div style={{
        width: '90px',
        height: '90px',
        borderRadius: 'var(--radius-lg)',
        backgroundColor: 'var(--primary-soft)',
        border: '2px solid var(--primary)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        boxShadow: 'var(--shadow-lg)',
        animation: 'pulse 2s infinite'
      }}>
        <Zap size={44} color="var(--primary)" fill="var(--primary)" />
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        <h1 style={{ fontSize: '2rem', fontWeight: 800, fontFamily: 'var(--font-title)', letterSpacing: '-0.02em' }}>
          BizTracker
        </h1>
        <span style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', fontWeight: 500 }}>
          Android Shop Management Suite
        </span>
      </div>

      {/* Spinner */}
      <div className="loader-spinner" style={{ width: '28px', height: '28px', borderWidth: '2.5px', marginTop: '20px' }}></div>

      <style>{`
        @keyframes pulse {
          0% { transform: scale(1); box-shadow: 0 0 0 0 rgba(30, 116, 253, 0.4); }
          70% { transform: scale(1.05); box-shadow: 0 0 0 15px rgba(30, 116, 253, 0); }
          100% { transform: scale(1); box-shadow: 0 0 0 0 rgba(30, 116, 253, 0); }
        }
      `}</style>
    </div>
  );
};
export default SplashPage;
