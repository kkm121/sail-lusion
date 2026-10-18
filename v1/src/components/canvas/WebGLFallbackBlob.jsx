import React, { useEffect, useState } from 'react';

/**
 * WebGLFallbackBlob
 * High-performance CSS3D & SVG luminous multifaceted crystal core fallback.
 * Automatically activates on devices lacking WebGL support or with hardware acceleration disabled.
 * Ensures the beloved visual identity is preserved identically across every screen and device.
 */
export function WebGLFallbackBlob({ themeColor = '#00F5D4' }) {
  const [offsetY, setOffsetY] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      const scroll = window.scrollY || 0;
      const max = Math.max(document.body.scrollHeight - window.innerHeight, 1);
      setOffsetY(Math.min(Math.max(scroll / max, 0), 1));
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <div className="fixed inset-0 w-full h-full z-0 pointer-events-none overflow-hidden flex items-center justify-center">
      {/* Background Deep Obsidian Atmosphere */}
      <div className="absolute inset-0 bg-[#030407]" />

      {/* Dynamic Radial Ambient Illumination Glow */}
      <div
        className="absolute w-[500px] h-[500px] md:w-[700px] md:h-[700px] rounded-full blur-[120px] md:blur-[160px] opacity-40 transition-all duration-1000 ease-out"
        style={{
          background: `radial-gradient(circle, ${themeColor} 0%, rgba(3,4,7,0) 70%)`,
          transform: `translate3d(${offsetY * 120}px, ${Math.sin(offsetY * Math.PI) * -30}px, 0)`,
        }}
      />

      {/* Luminous Morphing Crystalline Core */}
      <div 
        className="relative w-72 h-72 sm:w-96 sm:h-96 md:w-[480px] md:h-[480px] flex items-center justify-center transition-transform duration-700 ease-out animate-float"
        style={{
          transform: `translate3d(${offsetY > 0 ? '15%' : '0'}, 0, 0) scale(${0.92 - offsetY * 0.1})`,
        }}
      >
        {/* SVG Multifaceted Crystal Shell */}
        <svg
          viewBox="0 0 400 400"
          className="w-full h-full drop-shadow-[0_0_50px_rgba(0,245,212,0.45)] animate-spin-slow"
          style={{
            filter: `drop-shadow(0 0 40px ${themeColor}66)`,
          }}
        >
          <defs>
            <linearGradient id="crystalGrad1" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#ffffff" stopOpacity="0.85" />
              <stop offset="50%" stopColor={themeColor} stopOpacity="0.65" />
              <stop offset="100%" stopColor="#030407" stopOpacity="0.9" />
            </linearGradient>
            <linearGradient id="crystalGrad2" x1="100%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor={themeColor} stopOpacity="0.8" />
              <stop offset="70%" stopColor="#8B5CF6" stopOpacity="0.4" />
              <stop offset="100%" stopColor="#ffffff" stopOpacity="0.3" />
            </linearGradient>
            <radialGradient id="apexGlow" cx="50%" cy="40%" r="60%">
              <stop offset="0%" stopColor="#ffffff" stopOpacity="0.95" />
              <stop offset="45%" stopColor={themeColor} stopOpacity="0.75" />
              <stop offset="100%" stopColor="#000000" stopOpacity="0" />
            </radialGradient>
          </defs>

          {/* Facet Geometries (Icosahedron projection) */}
          <polygon points="200,40 320,130 200,200" fill="url(#crystalGrad1)" stroke="rgba(255,255,255,0.4)" strokeWidth="1" />
          <polygon points="200,40 80,130 200,200" fill="url(#crystalGrad2)" stroke="rgba(255,255,255,0.4)" strokeWidth="1" />
          <polygon points="80,130 80,270 200,200" fill="url(#crystalGrad1)" opacity="0.8" stroke="rgba(255,255,255,0.3)" strokeWidth="1" />
          <polygon points="320,130 320,270 200,200" fill="url(#crystalGrad2)" opacity="0.8" stroke="rgba(255,255,255,0.3)" strokeWidth="1" />
          <polygon points="80,270 200,360 200,200" fill="url(#crystalGrad2)" stroke="rgba(255,255,255,0.4)" strokeWidth="1" />
          <polygon points="320,270 200,360 200,200" fill="url(#crystalGrad1)" stroke="rgba(255,255,255,0.4)" strokeWidth="1" />
          <polygon points="200,40 200,200 200,360" stroke="rgba(255,255,255,0.6)" strokeWidth="1.5" fill="none" />
          
          {/* Incandescent Core Center */}
          <circle cx="200" cy="185" r="70" fill="url(#apexGlow)" className="animate-pulse" />
        </svg>

        {/* Floating Ambient Sparkles (CSS) */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-10 left-16 w-2 h-2 rounded-full bg-white/70 animate-ping" style={{ animationDuration: '3s' }} />
          <div className="absolute bottom-16 right-20 w-2.5 h-2.5 rounded-full bg-accent/80 animate-ping" style={{ animationDuration: '4s' }} />
          <div className="absolute top-1/2 right-8 w-1.5 h-1.5 rounded-full bg-white/90 animate-pulse" />
          <div className="absolute bottom-1/3 left-10 w-1.5 h-1.5 rounded-full bg-accent/90 animate-pulse" />
        </div>
      </div>
    </div>
  );
}
