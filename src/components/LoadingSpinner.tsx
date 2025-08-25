import React from 'react';
import { Loader2 } from 'lucide-react';
import { useTranslation } from '@/i18n/i18n';

const LoadingSpinner: React.FC = () => {
  const { t } = useTranslation();
  return (
    <div className="flex items-center justify-center min-h-[calc(100vh-120px)] text-white">
      <Loader2 className="h-10 w-10 animate-spin text-mindflow-blue" />
      <span className="ml-4 text-xl">{t('loading')}...</span>
    </div>
  );
};

export default LoadingSpinner;