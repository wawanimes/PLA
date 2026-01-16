
import React, { useState, useEffect } from 'react';

interface AdBannerProps {
  zone: string;
  className?: string;
}

const AdBanner: React.FC<AdBannerProps> = ({ zone, className = "" }) => {
  const [adCode, setAdCode] = useState('');
  const [isMobile, setIsMobile] = useState(false);
  const [isEnabled, setIsEnabled] = useState(true);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    
    // Load ad config from localStorage
    const saved = localStorage.getItem('planet_streaming_ads');
    if (saved) {
      try {
        const config = JSON.parse(saved);
        const mode = window.innerWidth < 768 ? 'mobile' : 'desktop';
        
        if (config[zone]) {
          setIsEnabled(config[zone].enabled !== false);
          setAdCode(config[zone][mode] || '');
        } else {
          setIsEnabled(true);
          setAdCode('');
        }
      } catch (e) {
        console.error("Ad loading error", e);
      }
    }
    
    return () => window.removeEventListener('resize', handleResize);
  }, [zone, isMobile]);

  // If the zone is explicitly disabled in admin, don't show anything at all
  if (!isEnabled) return null;

  // Placeholder dimensions based on zone
  const getPlaceholderStyle = () => {
    if (zone.toLowerCase().includes('sidebar')) return { width: '160px', height: '600px', img: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?q=80&w=2070&auto=format&fit=crop' };
    if (zone.toLowerCase().includes('playerinside')) return { width: '300px', height: '250px', img: 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?q=80&w=2070&auto=format&fit=crop' };
    if (isMobile) return { width: '320px', height: '50px', img: 'https://images.unsplash.com/photo-1614850523459-c2f4c699c52e?q=80&w=2070&auto=format&fit=crop' };
    return { width: '728px', height: '90px', img: 'https://images.unsplash.com/photo-1614850523296-d8c1af93d400?q=80&w=2070&auto=format&fit=crop' };
  };

  const placeholder = getPlaceholderStyle();

  if (!adCode) {
    return (
      <div 
        className={`mx-auto bg-black/20 border border-white/5 flex flex-col items-center justify-center overflow-hidden relative group rounded ${className}`}
        style={{ width: placeholder.width, height: placeholder.height }}
      >
        <img src={placeholder.img} className="absolute inset-0 w-full h-full object-cover opacity-20 group-hover:opacity-40 transition-opacity" alt="placeholder" />
        <div className="relative z-10 text-center pointer-events-none">
          <p className="text-[9px] font-black text-white/40 uppercase tracking-[0.3em] mb-1">Espace Publicitaire</p>
          <p className="text-[7px] font-bold text-cyan-500/50 uppercase tracking-widest">{zone.replace(/([A-Z])/g, ' $1').trim()}</p>
        </div>
        <div className="absolute inset-0 border border-dashed border-white/10 m-1 pointer-events-none"></div>
      </div>
    );
  }

  return (
    <div 
      className={`mx-auto flex justify-center items-center overflow-hidden ${className}`}
      dangerouslySetInnerHTML={{ __html: adCode }}
    />
  );
};

export default AdBanner;
