-- Create pwa_install_events table
CREATE TABLE public.pwa_install_events (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL, -- e.g., 'beforeinstallprompt', 'appinstalled'
  event_data JSONB, -- Optional: store additional data about the event
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS (REQUIRED)
ALTER TABLE public.pwa_install_events ENABLE ROW LEVEL SECURITY;

-- Policies for pwa_install_events
CREATE POLICY "Users can insert their own PWA install events" ON public.pwa_install_events
FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view their own PWA install events" ON public.pwa_install_events
FOR SELECT TO authenticated USING (auth.uid() = user_id);

-- No update or delete policies needed for immutable event logs