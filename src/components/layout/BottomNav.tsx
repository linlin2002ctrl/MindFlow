import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Home, Book, BarChart, Settings, Target } from 'lucide-react'; // Added Target icon
import { cn } from '@/lib/utils';

const BottomNav: React.FC = () => {
  const location = useLocation();

  const navItems = [
    { path: '/dashboard', icon: Home, label: 'Home' },
    { path: '/journal', icon: Book, label: 'Journal' },
    { path: '/insights', icon: BarChart, label: 'Insights' },
    { path: '/goals', icon: Target, label: 'Goals' }, // Added Goals link
    { path: '/settings', icon: Settings, label: 'Settings' },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 md:hidden bg-white/10 backdrop-blur-md border-t border-white/20 p-2">
      <div className="flex justify-around items-center h-full max-w-md mx-auto">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <Link
              key={item.path}
              to={item.path}
              className={cn(
                "flex flex-col items-center justify-center p-2 rounded-lg transition-colors duration-200",
                isActive ? "text-mindflow-blue bg-white/20" : "text-white hover:bg-white/10"
              )}
            >
              <item.icon className="h-6 w-6" />
              <span className="text-xs mt-1">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
};

export default BottomNav;