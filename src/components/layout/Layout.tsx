import React from 'react';
import Header from './Header';
import Sidebar from './Sidebar';
import GradientBackground from '../GradientBackground';
import { MadeWithDyad } from '@/components/made-with-dyad';
import { useIsMobile } from '@/hooks/use-mobile';

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const isMobile = useIsMobile();

  return (
    <GradientBackground>
      <div className="flex min-h-screen">
        {!isMobile && <Sidebar />}
        <div className="flex flex-col flex-1">
          <Header onOpenSidebar={() => {}} /> {/* onOpenSidebar is handled by SheetTrigger internally */}
          <main className="flex-1 p-4 md:p-8">
            {children}
          </main>
          <MadeWithDyad />
        </div>
      </div>
    </GradientBackground>
  );
};

export default Layout;