import React from 'react';
import { Loader2 } from 'lucide-react';

const LoadingSpinner: React.FC = () => {
  return (
    <div className="flex items-center justify-center min-h-[calc(100vh-120px)] text-white">
      <Loader2 className="h-10 w-10 animate-spin text-mindflow-blue" />
      <span className="ml-4 text-xl">Loading...</span>
    </div>
  );
};

export default LoadingSpinner;