import React from 'react';
import GlassCard from '@/components/GlassCard';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { useTranslation } from '@/i18n/i18n';

interface WelcomeCardProps extends React.HTMLAttributes<HTMLDivElement> {
  userName?: string;
}

const WelcomeCard: React.FC<WelcomeCardProps> = ({ userName = 'User', className, ...props }) => {
  const { t } = useTranslation();
  const currentDate = format(new Date(), 'EEEE, MMMM do, yyyy');

  return (
    <GlassCard className={cn("p-6 text-center", className)} {...props}>
      <h2 className="text-3xl md:text-4xl font-bold text-white mb-2 animate-fade-in">
        {t('welcomeBack', userName)}
      </h2>
      <p className="text-lg text-white/80 mb-4 animate-fade-in-delay">
        {t('todayIs', currentDate)}
      </p>
      <p className="text-md text-white/70">
        {t('quote')}
      </p>
    </GlassCard>
  );
};

export default WelcomeCard;