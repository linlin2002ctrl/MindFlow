import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Home, Book, Smile, MessageSquare, BarChart, Settings, UserCircle } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';

const Sidebar: React.FC = () => {
  const location = useLocation();

  const navItems = [
    { path: '/dashboard', icon: Home, label: 'Dashboard' },
    { path: '/journal', icon: Book, label: 'Journal' },
    { path: '/mood-tracker', icon: Smile, label: 'Mood Tracker' },
    { path: '/ai-conversation', icon: MessageSquare, label: 'AI Conversation' },
    { path: '/insights', icon: BarChart, label: 'Insights' },
    { path: '/settings', icon: Settings, label: 'Settings' },
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
            <AvatarImage src="https://github.com/shadcn.png" alt="@shadcn" /> {/* Replace with actual user avatar */}
            <AvatarFallback><UserCircle className="h-6 w-6" /></AvatarFallback>
          </Avatar>
          <span className="text-lg">User Name</span> {/* Replace with actual user name */}
        </Link>
      </div>
    </aside>
  );
};

export default Sidebar;