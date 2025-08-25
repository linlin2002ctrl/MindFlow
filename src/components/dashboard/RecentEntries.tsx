import React, { useEffect, useState } from 'react';
import GlassCard from '@/components/GlassCard';
import { Button } from '@/components/ui/button';
import { ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { format } from 'date-fns';
import { journalService, JournalEntry } from '@/services/journalService';
import { useSession } from '@/contexts/SessionContext';
import { useTranslation } from '@/i18n/i18n';

const RecentEntries: React.FC = () => {
  const { user } = useSession();
  const { t } = useTranslation();
  const [recentEntries, setRecentEntries] = useState<JournalEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchEntries = async () => {
      if (user) {
        setIsLoading(true);
        const entries = await journalService.getEntriesByUser(user.id, t);
        setRecentEntries(entries ? entries.slice(0, 3) : []);
        setIsLoading(false);
      } else {
        setRecentEntries([]);
        setIsLoading(false);
      }
    };
    fetchEntries();
  }, [user, t]);

  return (
    <GlassCard className="p-6">
      <h3 className="text-2xl font-semibold text-white mb-4">{t('recentJournalEntries')}</h3>
      {isLoading ? (
        <p className="text-white/70">{t('loadingEntries')}</p>
      ) : recentEntries.length > 0 ? (
        <div className="space-y-4">
          {recentEntries.map((entry) => (
            <div key={entry.id} className="bg-white/10 p-4 rounded-lg border border-white/20 hover:bg-white/15 transition-colors duration-200">
              <p className="text-sm text-white/70 mb-1">{format(new Date(entry.created_at), 'MMM do, yyyy')}</p>
              <p className="text-white/90 line-clamp-2">{entry.entry_text}</p>
              <p className="text-xs text-white/60 mt-2">{t('mood')}: {entry.mood_rating ? `${entry.mood_rating}/10` : t('moodN/A')}</p>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-white/70">{t('noEntriesYet')}</p>
      )}
      <Link to="/journal">
        <Button className="mt-6 w-full bg-mindflow-blue hover:bg-mindflow-purple text-white">
          {t('viewAllEntries')} <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
      </Link>
    </GlassCard>
  );
};

export default RecentEntries;