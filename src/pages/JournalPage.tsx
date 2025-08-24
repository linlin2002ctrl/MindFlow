import React from 'react';
import GlassCard from '@/components/GlassCard';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';

const JournalPage: React.FC = () => {
  return (
    <div className="flex flex-col items-center justify-center min-h-[calc(100vh-120px)] p-4">
      <GlassCard className="w-full max-w-2xl text-center">
        <h1 className="text-4xl font-bold mb-4 text-white">Your Journal</h1>
        <p className="text-lg text-white/80 mb-6">Write down your thoughts and feelings here.</p>
        <Textarea
          placeholder="What's on your mind today?"
          className="w-full h-48 bg-white/10 border border-white/20 text-white placeholder:text-white/60 focus:ring-2 focus:ring-mindflow-blue resize-none"
        />
        <Button className="mt-4 w-full bg-mindflow-blue hover:bg-mindflow-purple text-white">
          Save Entry
        </Button>
      </GlassCard>
    </div>
  );
};

export default JournalPage;