-- COI Generator V2: Supabase Setup
-- Run this migration to create tables for ACORD form templates and filled certificates

-- ============================================
-- Table 1: Available ACORD form templates
-- ============================================
CREATE TABLE IF NOT EXISTS acord_form_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  form_number VARCHAR(10) NOT NULL,
  form_name VARCHAR(255) NOT NULL,
  version VARCHAR(20),
  -- Array of coverage types this form handles
  coverage_types TEXT[] NOT NULL,
  -- Path to the blank PDF template in acord-templates bucket
  storage_path VARCHAR(500) NOT NULL,
  -- JSON schema defining the fields for this form
  field_schema JSONB,
  -- Whether this template is available for use
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  CONSTRAINT unique_form_number UNIQUE (form_number)
);

-- ============================================
-- Table 2: Generated/filled certificates
-- ============================================
CREATE TABLE IF NOT EXISTS filled_certificates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID,
  created_by UUID REFERENCES auth.users(id),

  -- Reference to the form template used
  template_id UUID REFERENCES acord_form_templates(id),
  form_number VARCHAR(10) NOT NULL,

  -- Path to the filled PDF in filled-certificates bucket
  storage_path VARCHAR(500) NOT NULL,

  -- Original source file info
  source_file_id UUID,
  source_file_name VARCHAR(255),

  -- Searchable fields (denormalized for quick queries)
  insured_name VARCHAR(255),
  carrier_name VARCHAR(255),
  policy_number VARCHAR(100),
  effective_date DATE,
  expiration_date DATE,
  certificate_holder VARCHAR(255),
  coverage_types TEXT[],

  -- Full extracted data (for regeneration/audit)
  extracted_data JSONB,
  -- Form data used to fill the certificate
  form_data JSONB,

  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- Indexes for performance
-- ============================================
CREATE INDEX IF NOT EXISTS idx_filled_certs_insured
  ON filled_certificates(insured_name);

CREATE INDEX IF NOT EXISTS idx_filled_certs_carrier
  ON filled_certificates(carrier_name);

CREATE INDEX IF NOT EXISTS idx_filled_certs_policy
  ON filled_certificates(policy_number);

CREATE INDEX IF NOT EXISTS idx_filled_certs_expiration
  ON filled_certificates(expiration_date);

CREATE INDEX IF NOT EXISTS idx_filled_certs_created
  ON filled_certificates(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_filled_certs_created_by
  ON filled_certificates(created_by);

CREATE INDEX IF NOT EXISTS idx_filled_certs_coverage
  ON filled_certificates USING GIN(coverage_types);

-- ============================================
-- Row Level Security (RLS)
-- ============================================
ALTER TABLE filled_certificates ENABLE ROW LEVEL SECURITY;

-- Users can view certificates they created or if organization_id is null (public)
CREATE POLICY "Users can view own certificates"
  ON filled_certificates FOR SELECT
  USING (
    auth.uid() = created_by
    OR organization_id IS NULL
  );

-- Users can insert certificates
CREATE POLICY "Users can create certificates"
  ON filled_certificates FOR INSERT
  WITH CHECK (auth.uid() = created_by);

-- Users can delete their own certificates
CREATE POLICY "Users can delete own certificates"
  ON filled_certificates FOR DELETE
  USING (auth.uid() = created_by);

-- Templates table is read-only for authenticated users
ALTER TABLE acord_form_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active templates"
  ON acord_form_templates FOR SELECT
  USING (is_active = true);

-- ============================================
-- Seed initial templates
-- (PDFs must be uploaded to acord-templates bucket separately)
-- ============================================
INSERT INTO acord_form_templates (form_number, form_name, version, coverage_types, storage_path, field_schema)
VALUES
  (
    '25',
    'Certificate of Liability Insurance',
    '2016/03',
    ARRAY['general_liability', 'auto_liability', 'workers_comp', 'umbrella', 'excess_liability', 'bop', 'professional_liability']::TEXT[],
    'acord-25.pdf',
    '{
      "form_id": "ACORD_25",
      "sections": ["producer", "insured", "insurers", "general_liability", "auto_liability", "umbrella", "workers_comp", "description", "certificate_holder"]
    }'::JSONB
  ),
  (
    '27',
    'Evidence of Property Insurance',
    '2016/03',
    ARRAY['property', 'inland_marine', 'equipment', 'residential_property']::TEXT[],
    'acord-27.pdf',
    '{
      "form_id": "ACORD_27",
      "sections": ["agency", "insured", "carrier", "property_coverage", "mortgage_holder"]
    }'::JSONB
  ),
  (
    '28',
    'Evidence of Commercial Property Insurance',
    '2016/03',
    ARRAY['commercial_property', 'business_property', 'building']::TEXT[],
    'acord-28.pdf',
    '{
      "form_id": "ACORD_28",
      "sections": ["agency", "insured", "carrier", "location", "coverage", "mortgage_holder"]
    }'::JSONB
  ),
  (
    '24',
    'Certificate of Property Insurance',
    '2016/03',
    ARRAY['property', 'dwelling', 'homeowners']::TEXT[],
    'acord-24.pdf',
    '{
      "form_id": "ACORD_24",
      "sections": ["agency", "insured", "carrier", "property", "coverage", "additional_interest"]
    }'::JSONB
  )
ON CONFLICT (form_number) DO UPDATE SET
  form_name = EXCLUDED.form_name,
  version = EXCLUDED.version,
  coverage_types = EXCLUDED.coverage_types,
  storage_path = EXCLUDED.storage_path,
  field_schema = EXCLUDED.field_schema,
  updated_at = NOW();

-- ============================================
-- Function to update updated_at timestamp
-- ============================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger for acord_form_templates
DROP TRIGGER IF EXISTS update_acord_form_templates_updated_at ON acord_form_templates;
CREATE TRIGGER update_acord_form_templates_updated_at
  BEFORE UPDATE ON acord_form_templates
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
