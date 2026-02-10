# COI Generator V2 Setup Guide

This guide walks through setting up the V2 COI Generator with Supabase storage for templates and generated certificates.

## What's New in V2

1. **Database Tables**: Templates and generated certificates stored in Supabase
2. **Auto Form Selection**: Coverage type → ACORD form mapping from database
3. **Certificate Persistence**: All generated COIs saved and retrievable
4. **New Tools**: `list_certificates` and `get_certificate` for accessing past COIs

## Setup Steps

### 1. Run Database Migration

Execute the SQL migration in your Supabase SQL Editor:

```bash
# File location
supabase/migrations/20250202_coi_generator_v2.sql
```

This creates:
- `acord_form_templates` - Available ACORD form templates
- `filled_certificates` - Generated certificate records
- Indexes for efficient querying
- RLS policies for security
- Initial template seed data (ACORD 25, 27, 28, 24)

### 2. Create Storage Buckets

In Supabase Dashboard → Storage:

1. **Create `acord-templates` bucket**
   - Visibility: Private
   - Purpose: Blank ACORD form PDFs

2. **Create `filled-certificates` bucket**
   - Visibility: Private
   - Purpose: Generated COI PDFs/data

### 3. Set Storage Policies

Run the policies from `supabase/storage-setup.sql` or configure via Dashboard:

**acord-templates bucket:**
- Authenticated users can READ
- Service role can WRITE (for admin uploads)

**filled-certificates bucket:**
- Users can READ/WRITE to their own folder (`{user_id}/*`)
- Service role has full access

### 4. Upload ACORD Templates (Required for PDF Output)

To generate actual filled PDF certificates, upload your fillable ACORD templates:

1. Go to Supabase Dashboard → Storage → `acord-templates`
2. Upload with exact names matching `storage_path` in database:
   - `acord-25.pdf` - Certificate of Liability Insurance
   - `acord-27.pdf` - Evidence of Property Insurance
   - `acord-28.pdf` - Evidence of Commercial Property Insurance
   - `acord-24.pdf` - Certificate of Property Insurance

**Important**: The PDFs must be fillable forms with form fields, not flat/scanned PDFs.

### 5. Discover PDF Field Names

Run the field discovery script to see what fields exist in your PDFs:

```bash
# Install pdf-lib if needed
npm install pdf-lib

# Run discovery script
npx tsx scripts/discover-pdf-fields.ts ./path/to/acord-25.pdf --schema
```

This outputs all form fields. The system tries common field name patterns:
- `PRODUCER`, `INSURED`, `INSURER_A`, `GL_POLICY`, etc.
- `ProducerName`, `InsuredName`, `InsurerA`, etc.

If your PDF uses different field names, you can update the `field_schema` column in `acord_form_templates` with the mapping, or modify `fillPdfTemplate()` in [tools.ts](../supabase/functions/gailgpt-chat/tools.ts).

### 6. Verify PDF Generation

After uploading templates:

1. Generate a test COI through GailGPT
2. Check the `filled-certificates` bucket for `.pdf` files (not `.json`)
3. Download and verify the PDF is properly filled

**Fallback Behavior**: If a template PDF is not found in storage, the system falls back to saving JSON data instead of a filled PDF.

### 6. Deploy Edge Function

```bash
supabase functions deploy gailgpt-chat
```

## New API Capabilities

### process_coi_request (Enhanced)

Now automatically:
- Queries database for best matching form template
- Saves generated certificate to `filled-certificates` bucket
- Returns certificate ID and download URL
- Records all metadata for future retrieval

### list_certificates (New)

```json
{
  "name": "list_certificates",
  "input": {
    "insured_name": "Acme Corp",  // optional filter
    "carrier_name": "Hartford",   // optional filter
    "limit": 10                   // optional, default 10
  }
}
```

Returns array of certificates with download URLs.

### get_certificate (New)

```json
{
  "name": "get_certificate",
  "input": {
    "certificate_id": "uuid-here"
  }
}
```

Returns full certificate details and fresh signed URL.

## Database Schema Reference

### acord_form_templates

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| form_number | VARCHAR(10) | e.g., "25", "27" |
| form_name | VARCHAR(255) | Human-readable name |
| version | VARCHAR(20) | e.g., "2016/03" |
| coverage_types | TEXT[] | Array of supported coverages |
| storage_path | VARCHAR(500) | Path in acord-templates bucket |
| field_schema | JSONB | Field definitions for this form |
| is_active | BOOLEAN | Whether template is available |

### filled_certificates

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| created_by | UUID | User who generated it |
| template_id | UUID | FK to acord_form_templates |
| form_number | VARCHAR(10) | Form number used |
| storage_path | VARCHAR(500) | Path in filled-certificates bucket |
| insured_name | VARCHAR(255) | Searchable insured name |
| carrier_name | VARCHAR(255) | Searchable carrier name |
| policy_number | VARCHAR(100) | Primary policy number |
| effective_date | DATE | Policy effective date |
| expiration_date | DATE | Policy expiration date |
| certificate_holder | VARCHAR(255) | Cert holder name |
| coverage_types | TEXT[] | Array of coverage types |
| extracted_data | JSONB | Full extracted policy data |
| form_data | JSONB | Data used to fill the form |
| created_at | TIMESTAMPTZ | Generation timestamp |

## Coverage Type Mapping

The system automatically maps detected coverages to normalized types:

| Detected | Normalized |
|----------|-----------|
| "General Liability", "GL", "CGL" | `general_liability` |
| "Auto", "Automobile", "Commercial Auto" | `auto_liability` |
| "Workers Comp", "WC" | `workers_comp` |
| "Umbrella" | `umbrella` |
| "Property", "Commercial Property" | `property`, `commercial_property` |
| "BOP", "Business Owners" | `bop` |
| "E&O", "Professional Liability" | `professional_liability` |

## Form Selection Logic

```
1. Has liability coverage (GL, Auto, WC, Umbrella)?
   → ACORD 25

2. Property only, no liability?
   → Commercial property → ACORD 28
   → Residential/general → ACORD 27

3. Multiple coverage types?
   → May return multiple forms (ACORD 25 + ACORD 27)

4. No matches?
   → Default to ACORD 25
```

## Troubleshooting

### "No templates found" warning
- Check that migration ran successfully
- Verify `acord_form_templates` table has seed data
- Ensure RLS isn't blocking service role reads

### Certificate not saving
- Check `filled-certificates` bucket exists
- Verify service role key is configured
- Check storage policies allow writes

### Download URLs expired
- URLs are valid for 1 hour
- Use `get_certificate` to get fresh URL
