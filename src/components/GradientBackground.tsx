import React from 'react';

interface GradientBackgroundProps {
  children: React.ReactNode;
}

const GradientBackground: React.FC<GradientBackgroundProps> = ({ children }) => {
  return (
    <div className="min-h-screen bg-gradient-to-r from-mindflow-purple to-mindflow-blue text-white">
      {children}
    </div>
  );
};

export default GradientBackground;