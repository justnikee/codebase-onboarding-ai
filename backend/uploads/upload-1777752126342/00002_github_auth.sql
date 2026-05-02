-- Rename twitter_id to provider_id to be platform-agnostic
-- Add provider column to track which OAuth provider was used
ALTER TABLE public.profiles 
  RENAME COLUMN twitter_id TO provider_id;

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS auth_provider TEXT NOT NULL DEFAULT 'github';

-- Update the index name to match the renamed column
DROP INDEX IF EXISTS idx_profiles_twitter_id;
CREATE INDEX IF NOT EXISTS idx_profiles_provider_id ON public.profiles(provider_id);

-- Update the handle_new_user trigger to use provider_id and auth_provider
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, provider_id, auth_provider, username, display_name, avatar_url)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'provider_id', NEW.raw_user_meta_data->>'sub', NEW.id::text),
    COALESCE(NEW.raw_app_meta_data->>'provider', 'github'),
    COALESCE(
      NEW.raw_user_meta_data->>'user_name',
      NEW.raw_user_meta_data->>'preferred_username',
      NEW.raw_user_meta_data->>'login',
      'user_' || substr(NEW.id::text, 1, 8)
    ),
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', ''),
    COALESCE(NEW.raw_user_meta_data->>'avatar_url', NEW.raw_user_meta_data->>'picture', '')
  )
  ON CONFLICT (id) DO UPDATE SET
    provider_id   = EXCLUDED.provider_id,
    auth_provider = EXCLUDED.auth_provider,
    avatar_url    = EXCLUDED.avatar_url,
    updated_at    = now();
  RETURN NEW;
EXCEPTION
  WHEN others THEN
    RAISE WARNING 'handle_new_user failed for %: %', NEW.id, SQLERRM;
    RETURN NEW;
END;
$$;
