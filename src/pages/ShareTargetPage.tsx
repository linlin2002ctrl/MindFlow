import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import GlassCard from '@/components/GlassCard';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Share2, Save, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { useSession } from '@/contexts/SessionContext';
import { journalService } from '@/services/journalService';
import { useTranslation } from '@/i18n/i18n';

const ShareTargetPage: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useSession();
  const { t } = useTranslation();
  const [title, setTitle] = useState('');
  const [text, setText] = useState('');
  const [url, setUrl] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    setTitle(params.get('title') || '');
    setText(params.get('text') || '');
    setUrl(params.get('url') || '');
  }, [location.search]);

  const handleSaveAsJournalEntry = async () => {
    if (!user) {
      toast.error(t('errorLoginToSave'));
      navigate('/login');
      return;
    }
    if (!text.trim() && !title.trim() && !url.trim()) {
      toast.error(t('errorNoContentToSave'));
      return;
    }

    setIsSaving(true);
    try {
      const entryContent = [
        title && `${t('title')}: ${title}`,
        text && `${t('text')}: ${text}`,
        url && `${t('url')}: ${url}`
      ].filter(Boolean).join('\n\n');

      const newEntry = await journalService.createEntry({
        user_id: user.id,
        session_type: 'quick_checkin',
        mood_rating: null,
        conversation: [],
        ai_analysis: null,
        entry_text: entryContent,
        tags: ['shared_content'],
      });

      if (newEntry) {
        toast.success(t('sharedContentSaved'));
        navigate('/journal');
      } else {
        toast.error(t('errorSavingSharedContent'));
      }
    } catch (error) {
      console.error("Error saving shared content:", error);
      toast.error(t('errorUnexpectedSavingShared'));
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[calc(100vh-120px)] p-4">
      <GlassCard className="w-full max-w-2xl text-center">
        <h1 className="text-4xl font-bold mb-4 text-white flex items-center justify-center gap-2">
          <Share2 className="h-8 w-8 text-mindflow-blue" /> {t('receiveSharedContent')}
        </h1>
        <p className="text-lg text-white/80 mb-6">
          {t('sharedContentDescription')}
        </p>

        <div className="space-y-4 text-left">
          <div>
            <Label htmlFor="shared-title" className="block text-white/90 text-sm font-medium mb-1">{t('title')}</Label>
            <Input
              id="shared-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder={t('noTitleShared')}
              className="bg-white/10 border border-white/20 text-white placeholder:text-white/60"
              disabled={isSaving}
            />
          </div>
          <div>
            <Label htmlFor="shared-text" className="block text-white/90 text-sm font-medium mb-1">{t('text')}</Label>
            <Textarea
              id="shared-text"
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder={t('noTextShared')}
              className="bg-white/10 border border-white/20 text-white placeholder:text-white/60 min-h-[100px]"
              disabled={isSaving}
            />
          </div>
          <div>
            <Label htmlFor="shared-url" className="block text-white/90 text-sm font-medium mb-1">{t('url')}</Label>
            <Input
              id="shared-url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder={t('noURLShared')}
              className="bg-white/10 border border-white/20 text-white placeholder:text-white/60"
              disabled={isSaving}
            />
          </div>
          <Button
            onClick={handleSaveAsJournalEntry}
            className="w-full bg-mindflow-blue hover:bg-mindflow-purple text-white text-lg py-6"
            disabled={isSaving || (!title.trim() && !text.trim() && !url.trim())}
          >
            {isSaving ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <Save className="h-5 w-5 mr-2" />}
            {t('saveAsJournalEntry')}
          </Button>
          <Button
            onClick={() => navigate('/dashboard')}
            variant="outline"
            className="w-full bg-white/10 hover:bg-white/20 text-white border-white/20 text-lg py-6"
            disabled={isSaving}
          >
            {t('goToDashboard')}
          </Button>
        </div>
      </GlassCard>
    </div>
  );
};

export default ShareTargetPage;