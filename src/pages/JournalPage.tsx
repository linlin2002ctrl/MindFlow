import React from 'react';
import JournalSession from '@/components/JournalSession'; // Import the new component

const JournalPage = () => {
  return (
    // JournalSession component now handles the entire flow, including the GlassCard wrapper
    <JournalSession />
  );
};

export default JournalPage;