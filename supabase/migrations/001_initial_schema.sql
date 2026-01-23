-- GAIL Dashboard Database Schema
-- Run this in your Supabase SQL Editor

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- PROFILES TABLE (extends auth.users)
-- ============================================
CREATE TABLE public.profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email TEXT NOT NULL,
  full_name TEXT,
  role TEXT NOT NULL DEFAULT 'viewer' CHECK (role IN ('admin', 'editor', 'viewer')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Policies for profiles
CREATE POLICY "Users can view all profiles"
  ON public.profiles FOR SELECT
  USING (true);

CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY "Admins can update any profile"
  ON public.profiles FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- ============================================
-- WBR DATASETS TABLE
-- ============================================
CREATE TABLE public.wbr_datasets (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  year INTEGER NOT NULL,
  scenario TEXT NOT NULL DEFAULT 'actual' CHECK (scenario IN ('actual', 'base', 'upside')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  updated_by UUID REFERENCES public.profiles(id),
  UNIQUE(year, scenario)
);

-- Enable RLS
ALTER TABLE public.wbr_datasets ENABLE ROW LEVEL SECURITY;

-- Policies for datasets
CREATE POLICY "Authenticated users can read datasets"
  ON public.wbr_datasets FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "Editors can insert datasets"
  ON public.wbr_datasets FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role IN ('admin', 'editor')
    )
  );

CREATE POLICY "Editors can update datasets"
  ON public.wbr_datasets FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role IN ('admin', 'editor')
    )
  );

-- ============================================
-- MONTHLY DATA TABLE
-- ============================================
CREATE TABLE public.monthly_data (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  dataset_id UUID REFERENCES public.wbr_datasets(id) ON DELETE CASCADE,
  month INTEGER NOT NULL CHECK (month >= 1 AND month <= 12),
  smb_revenue NUMERIC DEFAULT 0,
  enterprise_revenue NUMERIC DEFAULT 0,
  banco_azteca_revenue NUMERIC DEFAULT 0,
  smb_accounts INTEGER DEFAULT 0,
  enterprise_accounts INTEGER DEFAULT 0,
  nps NUMERIC,
  burn NUMERIC DEFAULT 0,
  gross_margin_pct NUMERIC DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(dataset_id, month)
);

-- Enable RLS
ALTER TABLE public.monthly_data ENABLE ROW LEVEL SECURITY;

-- Policies for monthly_data
CREATE POLICY "Authenticated users can read monthly data"
  ON public.monthly_data FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "Editors can insert monthly data"
  ON public.monthly_data FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role IN ('admin', 'editor')
    )
  );

CREATE POLICY "Editors can update monthly data"
  ON public.monthly_data FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role IN ('admin', 'editor')
    )
  );

-- ============================================
-- TRIGGER: Auto-create profile on signup
-- ============================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    -- First user becomes admin, rest are viewers
    CASE
      WHEN (SELECT COUNT(*) FROM public.profiles) = 0 THEN 'admin'
      ELSE 'viewer'
    END
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============================================
-- TRIGGER: Update updated_at timestamp
-- ============================================
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_wbr_datasets_updated_at
  BEFORE UPDATE ON public.wbr_datasets
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_monthly_data_updated_at
  BEFORE UPDATE ON public.monthly_data
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================
-- SEED DATA: Create default datasets
-- ============================================
-- Note: These will be created automatically when data is first saved
-- But we can pre-create them for convenience:

-- INSERT INTO public.wbr_datasets (year, scenario) VALUES
--   (2025, 'actual'),
--   (2026, 'base'),
--   (2026, 'upside');
