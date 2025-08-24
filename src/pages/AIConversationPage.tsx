import React from 'react';
import GlassCard from '@/components/GlassCard';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Send } from 'lucide-react';

const AIConversationPage: React.FC = () => {
  return (
    <div className="flex flex-col items-center justify-center min-h-[calc(100vh-120px)] p-4">
      <GlassCard className="w-full max-w-2xl text-center">
        <h1 className="text-4xl font-bold mb-4 text-white">Talk to MindFlow AI</h1>
        <p className="text-lg text-white/80 mb-6">Your personal AI companion is here to listen and guide you.</p>
        <div className="flex flex-col gap-4 h-64 overflow-y-auto p-4 bg-white/5 rounded-lg border border-white/10 mb-4">
          {/* Placeholder for chat messages */}
          <div className="text-left text-white/90">
            <span className="font-bold">AI:</span> Hello! How can I assist you today?
          </div>
          <div className="text-right text-white/90">
            <span className="font-bold">You:</span> I'm feeling a bit overwhelmed.
          </div>
        </div>
        <div className="flex gap-2">
          <Input
            placeholder="Type your message..."
            className="flex-1 bg-white/10 border border-white/20 text-white placeholder:text-white/60 focus:ring-2 focus:ring-mindflow-blue"
          />
          <Button className="bg-mindflow-blue hover:bg-mindflow-purple text-white">
            <Send className="h-5 w-5" />
          </Button>
        </div>
      </GlassCard>
    </div>
  );
};

export default AIConversationPage;