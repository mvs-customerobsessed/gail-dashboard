-- Operational metrics for dashboard tabs
-- Stores metrics for Customers, Finance, Customer Service, Engineering, Product, Team tabs

CREATE TABLE operational_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tab_name TEXT NOT NULL,           -- 'customers', 'finance', 'customer_service', 'engineering', 'product', 'team'
  period_type TEXT NOT NULL,        -- 'week', 'month', 'quarter', 'year'
  period_start DATE NOT NULL,       -- Start date of the period
  metrics JSONB NOT NULL DEFAULT '{}',  -- Flexible JSON for tab-specific metrics
  goals JSONB DEFAULT '{}',         -- Goal values for each metric
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  updated_by UUID REFERENCES profiles(id),
  UNIQUE(tab_name, period_type, period_start)
);

-- Index for faster lookups
CREATE INDEX idx_operational_metrics_lookup ON operational_metrics(tab_name, period_type, period_start);
CREATE INDEX idx_operational_metrics_history ON operational_metrics(tab_name, period_type, period_start DESC);

-- Enable Row Level Security
ALTER TABLE operational_metrics ENABLE ROW LEVEL SECURITY;

-- All authenticated users can view metrics
CREATE POLICY "Authenticated users can view metrics"
  ON operational_metrics FOR SELECT TO authenticated USING (true);

-- Only editors and admins can insert metrics
CREATE POLICY "Editors and admins can insert metrics"
  ON operational_metrics FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'editor'))
  );

-- Only editors and admins can update metrics
CREATE POLICY "Editors and admins can update metrics"
  ON operational_metrics FOR UPDATE TO authenticated
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'editor'))
  );

-- Only admins can delete metrics
CREATE POLICY "Admins can delete metrics"
  ON operational_metrics FOR DELETE TO authenticated
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- Trigger to auto-update updated_at timestamp
CREATE TRIGGER update_operational_metrics_updated_at
  BEFORE UPDATE ON operational_metrics
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
