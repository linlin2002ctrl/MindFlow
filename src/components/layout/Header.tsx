import React from 'react';
import { Link } from 'react-router-dom';
import { Menu, UserCircle } from 'lucide-react'; // Import UserCircle for profile icon
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { useIsMobile } from '@/hooks/use-mobile';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'; // Import Avatar components

interface HeaderProps {
  onOpenSidebar: () => void;
}

const Header: React.FC<HeaderProps> = ({ onOpenSidebar }) => {
  const isMobile = useIsMobile();

  return (
    <header className="sticky top-0 z-40 w-full bg-white/10 backdrop-blur-md border-b border-white/20 p-4 flex items-center justify-between">
      <Link to="/" className="text-2xl font-bold text-white">
        MindFlow
      </Link>
      <div className="flex items-center gap-4">
        {/* User Profile Placeholder */}
        <Link to="/settings" className="flex items-center gap-2 text-white hover:text-mindflow-blue transition-colors">
          <Avatar className="h-8 w-8 border border-white/30">
            <AvatarImage src="https://github.com/shadcn.png" alt="@shadcn" /> {/* Replace with actual user avatar */}
            <AvatarFallback><UserCircle className="h-6 w-6" /></AvatarFallback>
          </Avatar>
        </Link>

        {isMobile && (
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="text-white">
                <Menu className="h-6 w-6" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="bg-mindflow-purple/90 border-r border-white/20 text-white">
              <nav className="flex flex-col gap-4 p-4">
                <Link to="/dashboard" className="text-lg hover:text-mindflow-blue transition-colors">Dashboard</Link>
                <Link to="/journal" className="text-lg hover:text-mindflow-blue transition-colors">Journal</Link>
                <Link to="/mood-tracker" className="text-lg hover:text-mindflow-blue transition-colors">Mood Tracker</Link>
                <Link to="/ai-conversation" className="text-lg hover:text-mindflow-blue transition-colors">AI Conversation</Link>
                <Link to="/insights" className="text-lg hover:text-mindflow-blue transition-colors">Insights</Link>
                <Link to="/settings" className="text-lg hover:text-mindflow-blue transition-colors">Settings</Link>
              </nav>
            </SheetContent>
          </Sheet>
        )}
      </div>
    </header>
  );
};

export default Header;