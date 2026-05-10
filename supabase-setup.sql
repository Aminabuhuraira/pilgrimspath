-- =============================================================
-- Pilgrim's Path — Supabase Profiles Table Setup
-- =============================================================
-- Run this SQL in your Supabase Dashboard → SQL Editor
-- Safe to re-run: uses IF NOT EXISTS and DROP ... IF EXISTS throughout.
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

-- 3. Add is_admin column FIRST — policies below reference it
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS is_admin BOOLEAN DEFAULT false;
-- Grant admin flag to the site admin (uncomment and run once):
-- UPDATE public.profiles SET is_admin = true WHERE email = 'admin@pilgrimspath.io';

-- 3b. RLS Policies — drop first so this script is idempotent
DROP POLICY IF EXISTS "Authenticated users can read all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users read own profile" ON public.profiles;
DROP POLICY IF EXISTS "Admins read all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Allow insert for service role" ON public.profiles;

-- Users may only read their own profile (fixes M3 — PII leak)
CREATE POLICY "Users read own profile"
    ON public.profiles FOR SELECT
    USING (auth.uid() = id);

-- Admins may read all profiles
CREATE POLICY "Admins read all profiles"
    ON public.profiles FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles p
            WHERE p.id = auth.uid() AND p.is_admin = true
        )
    );

-- Allow users to update their own profile
CREATE POLICY "Users can update own profile"
    ON public.profiles FOR UPDATE
    USING (auth.uid() = id);

-- Allow inserts from the trigger (runs as SECURITY DEFINER)
CREATE POLICY "Allow insert for service role"
    ON public.profiles FOR INSERT
    WITH CHECK (true);

-- 3c. paid_users table — records confirmed Paystack payments
CREATE TABLE IF NOT EXISTS public.paid_users (
    email TEXT PRIMARY KEY,
    paid_at TIMESTAMPTZ DEFAULT NOW(),
    paystack_ref TEXT,
    plan TEXT DEFAULT 'hajj',
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE public.paid_users ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Service role manages paid_users" ON public.paid_users;
-- Only service role (server) can write; nobody can read via anon key
CREATE POLICY "Service role manages paid_users"
    ON public.paid_users FOR ALL
    USING (false)
    WITH CHECK (false);

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


-- =============================================================
-- Pilgrim's Path — Transactions Table (Payments / Donations)
-- =============================================================
-- Stores verified Paystack purchases and donations so the admin
-- dashboard can show revenue history and recent transactions.
-- =============================================================

CREATE TABLE IF NOT EXISTS public.transactions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    reference TEXT NOT NULL UNIQUE,
    email TEXT NOT NULL,
    amount NUMERIC(10,2) NOT NULL,
    currency TEXT NOT NULL DEFAULT 'USD',
    status TEXT NOT NULL DEFAULT 'completed',
    type TEXT NOT NULL DEFAULT 'purchase',
    plan TEXT,
    source TEXT,
    provider TEXT NOT NULL DEFAULT 'paystack',
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
    paid_at TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS transactions_paid_at_idx ON public.transactions (paid_at DESC);
CREATE INDEX IF NOT EXISTS transactions_email_idx ON public.transactions (email);

ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can insert transactions"
    ON public.transactions FOR INSERT
    WITH CHECK (true);

CREATE POLICY "Authenticated users can read transactions"
    ON public.transactions FOR SELECT
    USING (auth.role() = 'authenticated');

-- =============================================================
-- ✅ Transactions table ready.
-- Verified Paystack payments can now be recorded for admin reporting.
-- =============================================================
