import React from 'react';
import GoalManager from '@/components/GoalManager';
import { useTranslation } from '@/i18n/i18n';

const GoalsPage: React.FC = () => {
  const { t } = useTranslation();
  return (
    <GoalManager />
  );
};

export default GoalsPage;