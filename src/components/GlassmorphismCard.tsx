import React from 'react';

interface GlassmorphismCardProps {
  children: React.ReactNode;
  className?: string;
}

export function GlassmorphismCard({ children, className = '' }: GlassmorphismCardProps) {
  return (
    <div className={`
      bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-6 shadow-2xl
      hover:bg-white/15 transition-all duration-300
      ${className}
    `}>
      {children}
    </div>
  );
}