-- =============================================================
-- Pilgrim's Path — Supabase Profiles Table Setup
-- =============================================================
-- Run this SQL in your Supabase Dashboard → SQL Editor
-- This creates a profiles table that auto-populates when users sign up
-- and keeps last_sign_in_at updated on every login.
-- =============================================================

-- 1. Create the profiles table
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    email TEXT,
    first_name TEXT,
    last_name TEXT,
    display_name TEXT,
    country TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    last_sign_in_at TIMESTAMPTZ,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Enable Row Level Security
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- 3. RLS Policies
-- Allow all authenticated users to read all profiles (needed for admin dashboard)
CREATE POLICY "Authenticated users can read all profiles"
    ON public.profiles FOR SELECT
    USING (auth.role() = 'authenticated');

-- Allow users to update their own profile
CREATE POLICY "Users can update own profile"
    ON public.profiles FOR UPDATE
    USING (auth.uid() = id);

-- Allow inserts from the trigger (runs as SECURITY DEFINER)
CREATE POLICY "Allow insert for service role"
    ON public.profiles FOR INSERT
    WITH CHECK (true);

-- 4. Trigger: auto-create profile when a new user signs up
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, email, first_name, last_name, display_name, country, created_at, last_sign_in_at)
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'first_name', ''),
        COALESCE(NEW.raw_user_meta_data->>'last_name', ''),
        COALESCE(NEW.raw_user_meta_data->>'display_name', ''),
        COALESCE(NEW.raw_user_meta_data->>'country', ''),
        NEW.created_at,
        NEW.last_sign_in_at
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop trigger if it already exists (safe re-run)
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_new_user();

-- 5. Trigger: update last_sign_in_at when user signs in
CREATE OR REPLACE FUNCTION public.handle_user_signin()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.last_sign_in_at IS DISTINCT FROM OLD.last_sign_in_at THEN
        UPDATE public.profiles
        SET last_sign_in_at = NEW.last_sign_in_at,
            updated_at = NOW()
        WHERE id = NEW.id;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop trigger if it already exists (safe re-run)
DROP TRIGGER IF EXISTS on_auth_user_signin ON auth.users;

CREATE TRIGGER on_auth_user_signin
    AFTER UPDATE ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_user_signin();

-- 6. Optional: Backfill existing users into profiles
-- (Run this if you already have users registered before creating this table)
INSERT INTO public.profiles (id, email, first_name, last_name, display_name, country, created_at, last_sign_in_at)
SELECT
    id,
    email,
    COALESCE(raw_user_meta_data->>'first_name', ''),
    COALESCE(raw_user_meta_data->>'last_name', ''),
    COALESCE(raw_user_meta_data->>'display_name', ''),
    COALESCE(raw_user_meta_data->>'country', ''),
    created_at,
    last_sign_in_at
FROM auth.users
ON CONFLICT (id) DO NOTHING;

-- =============================================================
-- ✅ Done! Your profiles table is now set up.
-- Every new signup will auto-create a profile row.
-- Every login will update the last_sign_in_at timestamp.
-- The admin dashboard will automatically pick up this data.
-- =============================================================


-- =============================================================
-- Pilgrim's Path — Leads Table (Email Capture / Funnel)
-- =============================================================
-- Captures emails from the free VR preview gate, article CTAs,
-- and other lead magnets. Used for nurture email sequences.
-- =============================================================

CREATE TABLE IF NOT EXISTS public.leads (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    email TEXT NOT NULL,
    first_name TEXT,
    source TEXT DEFAULT 'free-preview',
    page TEXT,
    converted BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for fast email lookups and deduplication
CREATE UNIQUE INDEX IF NOT EXISTS leads_email_idx ON public.leads (email);

-- Enable RLS
ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;

-- Allow anonymous inserts (the email gate runs before login)
CREATE POLICY "Anyone can insert leads"
    ON public.leads FOR INSERT
    WITH CHECK (true);

-- Only authenticated users can read leads (admin dashboard)
CREATE POLICY "Authenticated users can read leads"
    ON public.leads FOR SELECT
    USING (auth.role() = 'authenticated');

-- Allow update for marking converted
CREATE POLICY "Authenticated users can update leads"
    ON public.leads FOR UPDATE
    USING (auth.role() = 'authenticated');

-- =============================================================
-- ✅ Leads table ready.
-- Run this in Supabase Dashboard → SQL Editor.
-- =============================================================
