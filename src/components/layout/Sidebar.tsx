import React, { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Home, Book, Smile, MessageSquare, BarChart, Settings, UserCircle, Target } from 'lucide-react'; // Added Target icon
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';
import { useSession } from '@/contexts/SessionContext';
import { userService, Profile } from '@/services/userService';

const Sidebar: React.FC = () => {
  const location = useLocation();
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

  const navItems = [
    { path: '/dashboard', icon: Home, label: 'ပင်မစာမျက်နှာ' },
    { path: '/journal', icon: Book, label: 'နေ့စဉ်မှတ်တမ်း' },
    { path: '/mood-tracker', icon: Smile, label: 'စိတ်ခံစားမှုမှတ်တမ်း' },
    { path: '/ai-conversation', icon: MessageSquare, label: 'AI နှင့်စကားပြောခြင်း' },
    { path: '/insights', icon: BarChart, label: 'ထိုးထွင်းသိမြင်မှုများ' },
    { path: '/goals', icon: Target, label: 'ပန်းတိုင်များ' },
    { path: '/settings', icon: Settings, label: 'ဆက်တင်များ' },
  ];

  return (
    <aside className="hidden md:flex flex-col w-64 bg-white/10 backdrop-blur-md border-r border-white/20 p-4 h-screen sticky top-0">
      <div className="text-2xl font-bold text-white mb-8">MindFlow</div>
      <nav className="flex flex-col gap-2 flex-1">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <Link
              key={item.path}
              to={item.path}
              className={cn(
                "flex items-center gap-3 text-lg p-2 rounded-md transition-colors duration-200",
                isActive ? "text-mindflow-blue bg-white/20" : "text-white hover:bg-white/10"
              )}
            >
              <item.icon className="h-5 w-5" /> {item.label}
            </Link>
          );
        })}
      </nav>
      <div className="mt-auto pt-4 border-t border-white/20">
        <Link to="/settings" className="flex items-center gap-3 text-white hover:text-mindflow-blue transition-colors">
          <Avatar className="h-8 w-8 border border-white/30">
            <AvatarImage src={userProfile?.avatar_url || "https://github.com/shadcn.png"} alt={userProfile?.first_name || "User"} />
            <AvatarFallback><UserCircle className="h-6 w-6" /></AvatarFallback>
          </Avatar>
          <span className="text-lg">{userProfile?.first_name || "User Name"}</span>
        </Link>
      </div>
    </aside>
  );
};

export default Sidebar;