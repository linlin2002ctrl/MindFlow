import React from 'react';
import Header from './Header';
import Sidebar from './Sidebar';
import BottomNav from './BottomNav';
import GradientBackground from '../GradientBackground';
import { MadeWithDyad } from '@/components/made-with-dyad';
import { useIsMobile } from '@/hooks/use-mobile';
import { cn } from '@/lib/utils';

interface AppLayoutProps {
  children: React.ReactNode;
}

const AppLayout: React.FC<AppLayoutProps> = ({ children }) => {
  const isMobile = useIsMobile();

  return (
    <GradientBackground>
      <div className="flex min-h-screen">
        {!isMobile && <Sidebar />}
        <div className="flex flex-col flex-1">
          <Header onOpenSidebar={() => {}} />
          <main className={cn("flex-1 p-4 md:p-8", isMobile && "pb-20")}>
            {children}
          </main>
          <MadeWithDyad />
        </div>
        {isMobile && <BottomNav />}
      </div>
    </GradientBackground>
  );
};

export default AppLayout;