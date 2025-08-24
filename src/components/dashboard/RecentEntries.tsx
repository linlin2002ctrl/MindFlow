import React from 'react';
import GlassCard from '@/components/GlassCard';
import { Button } from '@/components/ui/button';
import { ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { format } from 'date-fns';

interface Entry {
  id: string;
  date: Date;
  snippet: string;
  mood: string;
}

const dummyEntries: Entry[] = [
  {
    id: '1',
    date: new Date(2024, 7, 15), // August 15, 2024
    snippet: 'Had a productive day, feeling energized after completing the project milestone. Celebrated with a nice dinner.',
    mood: 'Happy',
  },
  {
    id: '2',
    date: new Date(2024, 7, 14), // August 14, 2024
    snippet: 'Felt a bit overwhelmed with tasks today, but managed to prioritize and make progress. Need to remember to take breaks.',
    mood: 'Neutral',
  },
  {
    id: '3',
    date: new Date(2024, 7, 13), // August 13, 2024
    snippet: 'Enjoyed a quiet evening reading a new book. It was a peaceful end to a busy week.',
    mood: 'Joyful',
  },
];

const RecentEntries: React.FC = () => {
  return (
    <GlassCard className="p-6">
      <h3 className="text-2xl font-semibold text-white mb-4">Recent Journal Entries</h3>
      {dummyEntries.length > 0 ? (
        <div className="space-y-4">
          {dummyEntries.map((entry) => (
            <div key={entry.id} className="bg-white/10 p-4 rounded-lg border border-white/20 hover:bg-white/15 transition-colors duration-200">
              <p className="text-sm text-white/70 mb-1">{format(entry.date, 'MMM do, yyyy')}</p>
              <p className="text-white/90 line-clamp-2">{entry.snippet}</p>
              <p className="text-xs text-white/60 mt-2">Mood: {entry.mood}</p>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-white/70">No entries yet. Start your journaling journey!</p>
      )}
      <Link to="/journal">
        <Button className="mt-6 w-full bg-mindflow-blue hover:bg-mindflow-purple text-white">
          View All Entries <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
      </Link>
    </GlassCard>
  );
};

export default RecentEntries;