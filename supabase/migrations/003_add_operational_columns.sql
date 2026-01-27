-- Migration: Add support for Customers, Customer Service, and Sales tabs
-- This migration:
-- 1. Updates the wbr_datasets.scenario CHECK constraint to allow new scenario types
-- 2. Adds new columns to monthly_data for customer service, sales, and customer metrics

-- ============================================
-- Step 1: Update wbr_datasets scenario CHECK constraint
-- ============================================

-- Drop the existing constraint
ALTER TABLE public.wbr_datasets DROP CONSTRAINT IF EXISTS wbr_datasets_scenario_check;

-- Add new constraint with additional scenarios
ALTER TABLE public.wbr_datasets
ADD CONSTRAINT wbr_datasets_scenario_check
CHECK (scenario IN (
  'actual', 'base', 'upside',
  'customers', 'customers_goals',
  'customer_service', 'customer_service_goals',
  'sales', 'sales_goals'
));

-- ============================================
-- Step 2: Add Customer metrics columns to monthly_data
-- ============================================

ALTER TABLE public.monthly_data
ADD COLUMN IF NOT EXISTS gailgpt_seats INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS smb_calls INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS enterprise_calls INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS smb_talk_time INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS enterprise_talk_time INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS churned INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS start_of_period_accounts INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS enterprise_revenue_customers NUMERIC DEFAULT 0,
ADD COLUMN IF NOT EXISTS enterprise_expansion NUMERIC DEFAULT 0;

-- ============================================
-- Step 3: Add Customer Service metrics columns to monthly_data
-- ============================================

ALTER TABLE public.monthly_data
ADD COLUMN IF NOT EXISTS ticket_volume INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS resolution_time NUMERIC DEFAULT 0,
ADD COLUMN IF NOT EXISTS customer_service_nps NUMERIC DEFAULT 0,
ADD COLUMN IF NOT EXISTS first_response_time NUMERIC DEFAULT 0;

-- ============================================
-- Step 4: Add Sales metrics columns to monthly_data
-- ============================================

ALTER TABLE public.monthly_data
ADD COLUMN IF NOT EXISTS pipeline_added NUMERIC DEFAULT 0,
ADD COLUMN IF NOT EXISTS total_pipeline NUMERIC DEFAULT 0,
ADD COLUMN IF NOT EXISTS deals_closed INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS revenue_closed NUMERIC DEFAULT 0,
ADD COLUMN IF NOT EXISTS win_rate NUMERIC DEFAULT 0,
ADD COLUMN IF NOT EXISTS meetings_booked INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS qualified_leads INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS avg_deal_size NUMERIC DEFAULT 0;

-- ============================================
-- Step 5: Create indexes for better query performance
-- ============================================

CREATE INDEX IF NOT EXISTS idx_monthly_data_dataset_month
ON public.monthly_data(dataset_id, month);

-- ============================================
-- Verify: List all columns on monthly_data (optional - for debugging)
-- ============================================
-- SELECT column_name, data_type, column_default
-- FROM information_schema.columns
-- WHERE table_name = 'monthly_data'
-- ORDER BY ordinal_position;
