import React from 'react';
import GlassCard from '@/components/GlassCard';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

interface WelcomeCardProps extends React.HTMLAttributes<HTMLDivElement> {
  userName?: string;
}

const WelcomeCard: React.FC<WelcomeCardProps> = ({ userName = 'User', className, ...props }) => {
  const currentDate = format(new Date(), 'EEEE, MMMM do, yyyy');

  return (
    <GlassCard className={cn("p-6 text-center", className)} {...props}>
      <h2 className="text-3xl md:text-4xl font-bold text-white mb-2 animate-fade-in">
        Welcome back, {userName}!
      </h2>
      <p className="text-lg text-white/80 mb-4 animate-fade-in-delay">
        Today is {currentDate}.
      </p>
      <p className="text-md text-white/70">
        "The best way to predict the future is to create it."
      </p>
    </GlassCard>
  );
};

export default WelcomeCard;