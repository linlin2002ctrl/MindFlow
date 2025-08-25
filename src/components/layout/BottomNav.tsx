import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Home, Book, BarChart, Settings, Target } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useTranslation } from '@/i18n/i18n';

const BottomNav: React.FC = () => {
  const location = useLocation();
  const { t } = useTranslation();

  const navItems = [
    { path: '/dashboard', icon: Home, label: t('home') },
    { path: '/journal', icon: Book, label: t('journal') },
    { path: '/insights', icon: BarChart, label: t('insights') },
    { path: '/goals', icon: Target, label: t('goals') },
    { path: '/settings', icon: Settings, label: t('settings') },
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