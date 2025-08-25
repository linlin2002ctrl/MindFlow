import { Link } from "react-router-dom";
import GlassCard from "@/components/GlassCard";
import { useTranslation } from '@/i18n/i18n';

const Index = () => {
  const { t } = useTranslation();
  return (
    <div className="min-h-[calc(100vh-120px)] flex items-center justify-center p-4">
      <GlassCard className="text-center max-w-md w-full">
        <h1 className="text-5xl font-extrabold mb-4 text-white">{t('appName')}</h1>
        <p className="text-xl text-white/80 mb-6">
          {t('appDescription')}
        </p>
        <Link
          to="/dashboard"
          className="inline-block px-8 py-3 bg-mindflow-blue hover:bg-mindflow-purple text-white text-lg font-semibold rounded-lg transition-colors duration-300 shadow-lg"
        >
          {t('getStarted')}
        </Link>
      </GlassCard>
    </div>
  );
};

export default Index;