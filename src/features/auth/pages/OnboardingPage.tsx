import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Zap, Package, BarChart3, ChevronRight } from 'lucide-react';
import Button from '../../../components/common/Button';
import { ROUTES } from '../../../constants/routes';

export const OnboardingPage: React.FC = () => {
  const navigate = useNavigate();
  const [activeSlide, setActiveSlide] = useState(0);

  const slides = [
    {
      title: 'Fast Checkout POS',
      desc: 'Tap product cards to sell. Process UPI, cash, card invoices in one tap.',
      icon: <Zap size={44} color="var(--success)" />
    },
    {
      title: 'Dynamic Stock Controls',
      desc: 'Track opening inventories, add variant prices, and configure threshold alert warnings.',
      icon: <Package size={44} color="var(--primary)" />
    },
    {
      title: 'Shop Sales Analytics',
      desc: 'Inspect revenue trends, profit growth charts, and category sale distributions.',
      icon: <BarChart3 size={44} color="var(--warning)" />
    }
  ];

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      height: '82vh',
      justifyContent: 'space-between',
      color: '#ffffff',
      textAlign: 'center',
      padding: '16px 0'
    }} className="animate-fade-in">
      
      {/* Header Skip link */}
      <div style={{ textAlign: 'right' }}>
        <button 
          onClick={() => navigate(ROUTES.LOGIN)}
          style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: 600 }}
          className="interactive"
        >
          Skip
        </button>
      </div>

      {/* Main Slide Carousel Content */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '20px' }}>
        <div style={{
          width: '80px',
          height: '80px',
          borderRadius: '50%',
          backgroundColor: 'var(--bg-secondary)',
          border: '1px solid var(--border-color)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: 'var(--shadow-md)',
          marginBottom: '10px'
        }}>
          {slides[activeSlide].icon}
        </div>

        <h2 style={{ fontSize: '1.6rem', fontWeight: 800, fontFamily: 'var(--font-title)' }}>
          {slides[activeSlide].title}
        </h2>
        <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', maxWidth: '300px', lineHeight: '1.45' }}>
          {slides[activeSlide].desc}
        </p>

        {/* Carousel indicators dots */}
        <div style={{ display: 'flex', gap: '8px', marginTop: '10px' }}>
          {slides.map((_, i) => (
            <span
              key={i}
              onClick={() => setActiveSlide(i)}
              style={{
                width: activeSlide === i ? '24px' : '8px',
                height: '8px',
                borderRadius: 'var(--radius-full)',
                backgroundColor: activeSlide === i ? 'var(--primary)' : 'var(--border-color)',
                cursor: 'pointer',
                transition: 'all 0.25s'
              }}
            ></span>
          ))}
        </div>
      </div>

      {/* Footer action buttons */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {activeSlide < slides.length - 1 ? (
          <Button 
            onClick={() => setActiveSlide(activeSlide + 1)}
            rightIcon={<ChevronRight size={18} />}
            fullWidth
          >
            Next Feature
          </Button>
        ) : (
          <Button 
            onClick={() => navigate(ROUTES.LOGIN)}
            fullWidth
          >
            Get Started Now
          </Button>
        )}
        <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
          Don't have an account?{' '}
          <button 
            onClick={() => navigate(ROUTES.REGISTER)}
            style={{ color: 'var(--primary)', fontWeight: 600, textDecoration: 'underline' }}
          >
            Register Shop
          </button>
        </span>
      </div>
    </div>
  );
};
export default OnboardingPage;
