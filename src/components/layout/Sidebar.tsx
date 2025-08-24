import React from 'react';
import { Link } from 'react-router-dom';
import { Home, Book, Smile, MessageSquare, BarChart } from 'lucide-react';

const Sidebar: React.FC = () => {
  return (
    <aside className="hidden md:flex flex-col w-64 bg-white/10 backdrop-blur-md border-r border-white/20 p-4 h-screen sticky top-0">
      <div className="text-2xl font-bold text-white mb-8">MindFlow</div>
      <nav className="flex flex-col gap-4">
        <Link to="/dashboard" className="flex items-center gap-3 text-lg text-white hover:text-mindflow-blue transition-colors">
          <Home className="h-5 w-5" /> Dashboard
        </Link>
        <Link to="/journal" className="flex items-center gap-3 text-lg text-white hover:text-mindflow-blue transition-colors">
          <Book className="h-5 w-5" /> Journal
        </Link>
        <Link to="/mood-tracker" className="flex items-center gap-3 text-lg text-white hover:text-mindflow-blue transition-colors">
          <Smile className="h-5 w-5" /> Mood Tracker
        </Link>
        <Link to="/ai-conversation" className="flex items-center gap-3 text-lg text-white hover:text-mindflow-blue transition-colors">
          <MessageSquare className="h-5 w-5" /> AI Conversation
        </Link>
        <Link to="/insights" className="flex items-center gap-3 text-lg text-white hover:text-mindflow-blue transition-colors">
          <BarChart className="h-5 w-5" /> Insights
        </Link>
      </nav>
    </aside>
  );
};

export default Sidebar;