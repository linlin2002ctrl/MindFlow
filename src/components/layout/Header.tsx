import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Menu, UserCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { useIsMobile } from '@/hooks/use-mobile';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useSession } from '@/contexts/SessionContext';
import { userService, Profile } from '@/services/userService';

interface HeaderProps {
  onOpenSidebar: () => void;
}

const Header: React.FC<HeaderProps> = ({ onOpenSidebar }) => {
  const isMobile = useIsMobile();
  const { user } = useSession();
  const [userProfile, setUserProfile] = useState<Profile | null>(null);

  useEffect(() => {
    const fetchProfile = async () => {
      if (user) {
        const profile = await userService.getProfile(user.id);
        setUserProfile(profile);
      } else {
        setUserProfile(null);
      }
    };
    fetchProfile();
  }, [user]);

  return (
    <header className="sticky top-0 z-40 w-full bg-white/10 backdrop-blur-md border-b border-white/20 p-4 flex items-center justify-between">
      <Link to="/" className="text-2xl font-bold text-white">
        MindFlow
      </Link>
      <div className="flex items-center gap-4">
        {/* User Profile */}
        <Link to="/settings" className="flex items-center gap-2 text-white hover:text-mindflow-blue transition-colors">
          <Avatar className="h-8 w-8 border border-white/30">
            <AvatarImage src={userProfile?.avatar_url || "https://github.com/shadcn.png"} alt={userProfile?.first_name || "User"} />
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
                <Link to="/dashboard" className="text-lg hover:text-mindflow-blue transition-colors">ပင်မစာမျက်နှာ</Link>
                <Link to="/journal" className="text-lg hover:text-mindflow-blue transition-colors">နေ့စဉ်မှတ်တမ်း</Link>
                <Link to="/mood-tracker" className="text-lg hover:text-mindflow-blue transition-colors">စိတ်ခံစားမှုမှတ်တမ်း</Link>
                <Link to="/ai-conversation" className="text-lg hover:text-mindflow-blue transition-colors">AI နှင့်စကားပြောခြင်း</Link>
                <Link to="/insights" className="text-lg hover:text-mindflow-blue transition-colors">ထိုးထွင်းသိမြင်မှုများ</Link>
                <Link to="/goals" className="text-lg hover:text-mindflow-blue transition-colors">ပန်းတိုင်များ</Link>
                <Link to="/settings" className="text-lg hover:text-mindflow-blue transition-colors">ဆက်တင်များ</Link>
              </nav>
            </SheetContent>
          </Sheet>
        )}
      </div>
    </header>
  );
};

export default Header;