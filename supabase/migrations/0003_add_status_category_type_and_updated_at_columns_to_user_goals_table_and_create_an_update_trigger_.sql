-- Add 'status' column to user_goals table
ALTER TABLE public.user_goals
ADD COLUMN status TEXT DEFAULT 'active';

-- Add 'category' column to user_goals table
ALTER TABLE public.user_goals
ADD COLUMN category TEXT DEFAULT 'General';

-- Add 'type' column to user_goals table
ALTER TABLE public.user_goals
ADD COLUMN type TEXT DEFAULT 'Growth Goal';

-- Add 'updated_at' column to user_goals table
ALTER TABLE public.user_goals
ADD COLUMN updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- Create a function to update the 'updated_at' column automatically
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER
LANGUAGE PLPGSQL
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

-- Create a trigger to call the update_updated_at_column function before each update on user_goals
DROP TRIGGER IF EXISTS update_user_goals_updated_at ON public.user_goals;
CREATE TRIGGER update_user_goals_updated_at
BEFORE UPDATE ON public.user_goals
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Update RLS policies for the new columns (assuming user_id based RLS is already in place)
-- No changes needed for RLS as new columns are part of the same row and existing policies cover them.