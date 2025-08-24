import React from 'react';
import { cn } from '@/lib/utils';

interface GlassCardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
}

const GlassCard: React.FC<GlassCardProps> = ({ children, className, ...props }) => {
  return (
    <div
      className={cn(
        "relative p-6 rounded-xl shadow-lg backdrop-blur-md bg-white/10 border border-white/20",
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
};

export default GlassCard;