// GailGPT System Prompt
export const SYSTEM_PROMPT = `You are GailGPT, an AI copilot for insurance professionals at Gail, an AI-powered insurance platform.

## Your Capabilities
You help insurance professionals with:
- Generating Certificates of Insurance (COIs) using ACORD forms
- Analyzing policy documents
- Answering questions about insurance coverage
- Explaining ACORD form requirements and field mappings

## Available Tools

**read_reference_doc** - Read from the ACORD forms knowledge base
- Use this FIRST to understand which form to use: "acord-forms/index.md"
- Then read the specific form's schema and mapping guide

**process_coi_request** - Process a COI request end-to-end
- Automatically parses uploaded policy documents
- Identifies carrier, coverage types, and limits
- Auto-selects the appropriate ACORD form from database
- Generates and SAVES the certificate to Supabase
- Returns a download URL for the generated certificate
- Use this when a user uploads a policy and wants a COI

**list_certificates** - View previously generated certificates
- Shows all certificates the user has generated
- Can filter by insured name or carrier
- Returns download links for each certificate

**get_certificate** - Retrieve a specific certificate by ID
- Gets full certificate details and fresh download URL

**create_artifact** - Display documents in the artifact panel
- Use after generating documents so user can view/download

## Reference Document Structure
/reference-docs/acord-forms/
├── index.md                    # Form selection guide (READ FIRST)
├── /ACORD_25/
│   ├── overview.md             # When to use this form
│   ├── field-schema.json       # All field IDs and requirements
│   └── field-mapping-guide.md  # How to map policy data to fields
├── /ACORD_24/ ...
├── /ACORD_27/ ...
└── /ACORD_28/ ...

## COI Generation Workflow

When a user uploads a policy document:

1. **Immediately start processing** - Don't ask what they want to do. If they uploaded a policy, they want a COI.

2. **Use process_coi_request** - This tool handles the entire workflow:
   - Reads and parses the policy document
   - Identifies the carrier and coverage types
   - Selects the appropriate ACORD form
   - Extracts all policy details and limits
   - Checks for missing information
   - Generates the certificate

3. **Ask clarifying questions naturally** - If certificate holder info is needed:
   - "Who should I list as the certificate holder?"
   - "Do they need to be named as additional insured?"

4. **Present the result** - Show the completed COI with download option

## Intelligence Guidelines

Be proactively helpful:
- "This policy expires in 9 days - heads up."
- "The per-occurrence limit is $500K, which is below the typical $1M requirement."
- "I noticed the AI endorsement is CG 20 10 - that's ongoing operations only."

Catch inconsistencies:
- "The policy shows 'ABC Contractors LLC' but you mentioned 'Inc.' - which should I use?"
- "I couldn't find umbrella coverage in the documents. Should I proceed without it?"

## Communication Style
- Professional but conversational
- Show your work - display each step as it completes
- Ask naturally, not like a form
- Proactively flag issues before they become problems

## Response Formatting
Use clean, tight markdown formatting:

**Headers:**
- Use ## for main sections, ### for subsections
- Headers should flow directly into content (no blank lines after)

**Lists:**
- Use bullet lists for related items
- Use **Bold Term:** followed by description for definition-style lists
- Keep list items concise

**Example of good formatting:**
## Coverage Summary
This policy includes the following coverages:
- **General Liability:** $1M per occurrence, $2M aggregate
- **Auto Liability:** $1M combined single limit
- **Umbrella:** $5M per occurrence

## Important Rules
- Always use process_coi_request for COI generation - it shows step-by-step progress
- Certificate dates cannot extend beyond policy expiration
- Certificate holder information must be exact as provided by user
- Note in Description of Operations: additional insureds, waivers, primary/non-contributory status`;

// =============================================================================
// STEP DEFINITIONS
// =============================================================================

export interface StepDefinition {
  id: string;
  label: string;
  icon?: string; // Optional - status icons are used instead
}

export interface StepUpdate {
  stepId: string;
  status: 'pending' | 'running' | 'completed' | 'failed' | 'waiting';
  displayValue?: string;
  error?: string;
}

export type StepCallback = (update: StepUpdate) => void;

// COI Workflow Steps
export const COI_STEPS: StepDefinition[] = [
  { id: 'parse_document', label: 'Reading policy document' },
  { id: 'identify_carrier', label: 'Identifying insurance carrier' },
  { id: 'detect_coverage', label: 'Detecting coverage types' },
  { id: 'select_form', label: 'Selecting ACORD form' },
  { id: 'extract_dates', label: 'Extracting policy dates' },
  { id: 'extract_limits', label: 'Extracting coverage limits' },
  { id: 'check_missing', label: 'Checking for missing information' },
  { id: 'generate_cert', label: 'Generating certificate' },
];

// =============================================================================
// TOOL DEFINITIONS
// =============================================================================

export const tools = [
  {
    name: 'read_reference_doc',
    description: 'Read ACORD form specifications and guidelines from reference documents. Use this to understand which form to use and how to map fields.',
    input_schema: {
      type: 'object',
      properties: {
        path: {
          type: 'string',
          description: 'Path to the document relative to /reference-docs/, e.g., "acord-forms/index.md" or "acord-forms/ACORD_25/field-schema.json"'
        }
      },
      required: ['path']
    }
  },
  {
    name: 'list_certificates',
    description: 'List previously generated certificates. Can filter by insured name, carrier, or date range. Returns certificate metadata and download links.',
    input_schema: {
      type: 'object',
      properties: {
        insured_name: {
          type: 'string',
          description: 'Filter by insured name (partial match supported)'
        },
        carrier_name: {
          type: 'string',
          description: 'Filter by carrier name (partial match supported)'
        },
        limit: {
          type: 'number',
          description: 'Maximum number of certificates to return (default: 10)'
        }
      },
      required: []
    }
  },
  {
    name: 'get_certificate',
    description: 'Get details of a specific certificate by ID, including a fresh download URL.',
    input_schema: {
      type: 'object',
      properties: {
        certificate_id: {
          type: 'string',
          description: 'The ID of the certificate to retrieve'
        }
      },
      required: ['certificate_id']
    }
  },
  {
    name: 'process_coi_request',
    description: 'Process a complete COI request. Parses the uploaded policy document, extracts all information, selects the right ACORD form, and generates the certificate. Shows step-by-step progress to the user.',
    input_schema: {
      type: 'object',
      properties: {
        file_id: {
          type: 'string',
          description: 'The ID of the uploaded policy document to process'
        },
        certificate_holder: {
          type: 'object',
          description: 'Optional certificate holder information if already known',
          properties: {
            name: { type: 'string' },
            address: { type: 'string' },
            is_additional_insured: { type: 'boolean' }
          }
        }
      },
      required: ['file_id']
    }
  },
  {
    name: 'create_artifact',
    description: 'Renders a generated document or analysis in the artifact panel for the user to view and download.',
    input_schema: {
      type: 'object',
      properties: {
        artifact_type: {
          type: 'string',
          enum: ['acord_form', 'acord_25', 'acord_24', 'acord_27', 'acord_28', 'policy_analysis', 'comparison_table', 'report', 'document'],
          description: 'The type of artifact to create'
        },
        title: {
          type: 'string',
          description: 'Title for the artifact'
        },
        content: {
          type: 'object',
          description: 'Structured content for the artifact'
        }
      },
      required: ['artifact_type', 'title', 'content']
    }
  }
];

// =============================================================================
// REFERENCE DOCUMENTS
// =============================================================================

const REFERENCE_DOCS: Record<string, string> = {
  'acord-forms/index.md': `# ACORD Forms Reference

## Form Selection Guide

| Form | Name | Use When |
|------|------|----------|
| ACORD 25 | Certificate of Liability Insurance | Policy includes General Liability, Commercial Auto, Umbrella/Excess Liability, or Workers Compensation |
| ACORD 24 | Certificate of Property Insurance | Standalone property or inland marine coverage |
| ACORD 27 | Evidence of Property Insurance | Lender or mortgagee needs evidence of property coverage |
| ACORD 28 | Evidence of Commercial Property Insurance | Commercial property with building/BPP coverage for lender |

## Decision Tree

1. Is this for a lender/mortgagee requiring evidence of property coverage?
   - Yes → ACORD 27 (residential) or ACORD 28 (commercial)
   - No → Continue

2. Is this primarily property/inland marine coverage with no liability?
   - Yes → ACORD 24
   - No → Continue

3. Does policy include GL, Auto, Umbrella, or Workers Comp?
   - Yes → ACORD 25
   - No → Review policy type and consult guidelines

## Common Scenarios

- **Vendor/Contractor COI Request**: ACORD 25
- **Lease Agreement**: ACORD 25 (liability) + ACORD 27/28 if property required
- **Loan/Mortgage**: ACORD 27 or ACORD 28
- **General COI Request**: ACORD 25 (most common)`,

  'acord-forms/ACORD_25/overview.md': `# ACORD 25 - Certificate of Liability Insurance

## Purpose
The most commonly used certificate form. Provides evidence of liability coverage to third parties (certificate holders).

## Supported Coverage Types
- Commercial General Liability (CGL)
- Commercial Automobile Liability
- Umbrella/Excess Liability
- Workers Compensation & Employers Liability

## When to Use
- Certificate holder requests proof of liability coverage
- Vendor/contractor requirements
- Lease agreements requiring liability evidence
- Any request for "COI" without further specification (default form)

## Key Sections
1. **Producer** - Insurance agency/broker info
2. **Insured** - Policyholder name and address
3. **Insurers Affording Coverage** - Up to 4 insurers (A, B, C, D) with NAIC codes
4. **Coverages** - Grid showing each coverage type, policy number, dates, limits
5. **Description of Operations** - Special provisions, additional insureds, project info
6. **Certificate Holder** - Entity receiving the certificate
7. **Cancellation** - Notice provisions

## Important Rules
- Certificate cannot extend coverage beyond policy terms
- Cannot modify policy terms—only provides evidence
- Additional insured status must be noted in Description section
- Waiver of subrogation must be noted if applicable`,

  'acord-forms/ACORD_25/field-schema.json': JSON.stringify({
    form_id: 'ACORD_25',
    form_name: 'Certificate of Liability Insurance',
    sections: {
      producer: {
        fields: [
          { id: 'producer_name', label: 'Producer Name', type: 'string', required: true },
          { id: 'producer_address', label: 'Address', type: 'string', required: true },
          { id: 'producer_phone', label: 'Phone', type: 'string', required: false },
          { id: 'producer_email', label: 'Email', type: 'string', required: false }
        ]
      },
      insured: {
        fields: [
          { id: 'insured_name', label: 'Insured Name', type: 'string', required: true },
          { id: 'insured_address', label: 'Address', type: 'string', required: true }
        ]
      },
      insurers: {
        fields: [
          { id: 'insurer_a_name', label: 'Insurer A', type: 'string', required: true },
          { id: 'insurer_a_naic', label: 'NAIC #', type: 'string', required: true },
          { id: 'insurer_b_name', label: 'Insurer B', type: 'string', required: false },
          { id: 'insurer_b_naic', label: 'NAIC #', type: 'string', required: false }
        ]
      },
      coverages: {
        general_liability: {
          fields: [
            { id: 'gl_policy_number', label: 'Policy Number', type: 'string', required: true },
            { id: 'gl_effective_date', label: 'Effective Date', type: 'date', required: true },
            { id: 'gl_expiration_date', label: 'Expiration Date', type: 'date', required: true },
            { id: 'gl_each_occurrence', label: 'Each Occurrence Limit', type: 'currency', required: true },
            { id: 'gl_general_aggregate', label: 'General Aggregate', type: 'currency', required: true },
            { id: 'gl_products_comp_op', label: 'Products - Comp/Op Agg', type: 'currency', required: false },
            { id: 'gl_personal_adv_injury', label: 'Personal & Adv Injury', type: 'currency', required: false },
            { id: 'gl_damage_to_rented', label: 'Damage to Rented Premises', type: 'currency', required: false },
            { id: 'gl_med_exp', label: 'Med Exp (Any One Person)', type: 'currency', required: false },
            { id: 'gl_claims_made', label: 'Claims Made', type: 'boolean', required: false },
            { id: 'gl_occurrence', label: 'Occurrence', type: 'boolean', required: false }
          ]
        },
        automobile_liability: {
          fields: [
            { id: 'auto_policy_number', label: 'Policy Number', type: 'string', required: true },
            { id: 'auto_effective_date', label: 'Effective Date', type: 'date', required: true },
            { id: 'auto_expiration_date', label: 'Expiration Date', type: 'date', required: true },
            { id: 'auto_combined_single_limit', label: 'Combined Single Limit', type: 'currency', required: true },
            { id: 'auto_any_auto', label: 'Any Auto', type: 'boolean', required: false },
            { id: 'auto_owned', label: 'Owned Autos Only', type: 'boolean', required: false },
            { id: 'auto_hired', label: 'Hired Autos Only', type: 'boolean', required: false },
            { id: 'auto_non_owned', label: 'Non-Owned Autos Only', type: 'boolean', required: false }
          ]
        },
        umbrella_liability: {
          fields: [
            { id: 'umbrella_policy_number', label: 'Policy Number', type: 'string', required: true },
            { id: 'umbrella_effective_date', label: 'Effective Date', type: 'date', required: true },
            { id: 'umbrella_expiration_date', label: 'Expiration Date', type: 'date', required: true },
            { id: 'umbrella_each_occurrence', label: 'Each Occurrence', type: 'currency', required: true },
            { id: 'umbrella_aggregate', label: 'Aggregate', type: 'currency', required: true }
          ]
        },
        workers_compensation: {
          fields: [
            { id: 'wc_policy_number', label: 'Policy Number', type: 'string', required: true },
            { id: 'wc_effective_date', label: 'Effective Date', type: 'date', required: true },
            { id: 'wc_expiration_date', label: 'Expiration Date', type: 'date', required: true },
            { id: 'wc_statutory_limits', label: 'WC Statutory Limits', type: 'boolean', required: true },
            { id: 'wc_el_each_accident', label: 'E.L. Each Accident', type: 'currency', required: true },
            { id: 'wc_el_disease_employee', label: 'E.L. Disease - Ea Employee', type: 'currency', required: true },
            { id: 'wc_el_disease_policy', label: 'E.L. Disease - Policy Limit', type: 'currency', required: true }
          ]
        }
      },
      description_of_operations: {
        fields: [
          { id: 'description', label: 'Description of Operations/Locations/Vehicles', type: 'text', required: false, max_length: 1000 }
        ]
      },
      certificate_holder: {
        fields: [
          { id: 'holder_name', label: 'Certificate Holder Name', type: 'string', required: true },
          { id: 'holder_address', label: 'Address', type: 'string', required: true }
        ]
      }
    }
  }, null, 2),

  'acord-forms/ACORD_25/field-mapping-guide.md': `# ACORD 25 Field Mapping Guide

## Mapping Policy Data to Form Fields

### General Liability Section

| Policy Data Field | Form Field ID | Notes |
|-------------------|---------------|-------|
| Policy number | gl_policy_number | Use exact policy number from dec page |
| Policy effective date | gl_effective_date | Format: MM/DD/YYYY |
| Policy expiration date | gl_expiration_date | Format: MM/DD/YYYY |
| Each Occurrence limit | gl_each_occurrence | Usually $1M or $2M |
| General Aggregate | gl_general_aggregate | Usually 2x occurrence |
| Products-Completed Ops | gl_products_comp_op | May equal general aggregate |
| Coverage form | gl_claims_made / gl_occurrence | Check one based on policy form |

### Common Mapping Challenges

1. **Multiple policies for same coverage type**: Use Insurer A for primary, B for excess
2. **Blanket additional insured**: Note in description_of_operations
3. **Waiver of subrogation**: Note in description_of_operations with policy endorsement number
4. **Primary/non-contributory**: Note in description_of_operations

### Description of Operations Templates

**Additional Insured:**
"[Certificate Holder Name] is included as Additional Insured per policy endorsement #[number] with respect to [operations/project description]."

**Waiver of Subrogation:**
"Waiver of Subrogation applies in favor of Certificate Holder per policy endorsement #[number]."

**Primary/Non-Contributory:**
"Coverage is Primary and Non-Contributory per policy endorsement #[number]."`,
};

// =============================================================================
// TYPES
// =============================================================================

// Progress callback type for streaming tool progress to client
export type ProgressCallback = (step: string, progress?: number) => void;

// Enhanced callback that includes step-level updates
export interface ToolCallbacks {
  onProgress?: ProgressCallback;
  onStepUpdate?: StepCallback;
  onStepsInit?: (steps: StepDefinition[]) => void;
  onFormRequired?: (formSchema: FormSchema) => void;
}

// =============================================================================
// MISSING FIELDS FORM SCHEMA
// =============================================================================

export interface MissingFieldSchema {
  id: string;
  section: 'certificate_holder' | 'insured' | 'description';
  field: string;
  label: string;
  type: 'text' | 'textarea' | 'select' | 'checkbox';
  required: boolean;
  placeholder?: string;
  options?: { value: string; label: string }[];
}

export interface FormSection {
  id: string;
  title: string;
  fields: MissingFieldSchema[];
}

export interface FormSchema {
  title: string;
  description: string;
  sections: FormSection[];
  submitButton: { label: string; icon?: string };
}

/**
 * Build form schema for missing certificate holder information
 */
function buildMissingFieldsSchema(
  missingFields: string[],
  certificateHolder?: { name?: string; address?: string }
): MissingFieldSchema[] {
  const schema: MissingFieldSchema[] = [];

  // Certificate holder name
  if (!certificateHolder?.name || missingFields.includes('Certificate holder name')) {
    schema.push({
      id: 'cert_holder_name',
      section: 'certificate_holder',
      field: 'name',
      label: 'Company Name',
      type: 'text',
      required: true,
      placeholder: 'Company or individual name',
    });
  }

  // Certificate holder address
  if (!certificateHolder?.address || missingFields.includes('Certificate holder address')) {
    schema.push({
      id: 'cert_holder_address',
      section: 'certificate_holder',
      field: 'address',
      label: 'Address',
      type: 'textarea',
      required: true,
      placeholder: 'Street address, City, State ZIP',
    });
  }

  // Additional insured checkbox
  schema.push({
    id: 'is_additional_insured',
    section: 'certificate_holder',
    field: 'is_additional_insured',
    label: 'Add as Additional Insured',
    type: 'checkbox',
    required: false,
  });

  // Additional insured type dropdown (conditional)
  schema.push({
    id: 'additional_insured_type',
    section: 'certificate_holder',
    field: 'additional_insured_type',
    label: 'Additional Insured Type',
    type: 'select',
    required: false,
    options: [
      { value: 'ongoing', label: 'Ongoing operations' },
      { value: 'completed', label: 'Completed operations' },
      { value: 'ongoing_completed', label: 'Ongoing & completed' },
      { value: 'blanket', label: 'Blanket' },
    ],
  });

  // Description of operations (always optional)
  schema.push({
    id: 'description_of_operations',
    section: 'description',
    field: 'operations',
    label: 'Description of Operations',
    type: 'textarea',
    required: false,
    placeholder: 'Project name, contract number, job site address...',
  });

  return schema;
}

/**
 * Build complete form schema for missing fields
 */
function buildFormSchema(
  missingFields: string[],
  certificateHolder?: { name?: string; address?: string }
): FormSchema {
  const fields = buildMissingFieldsSchema(missingFields, certificateHolder);

  // Group fields by section
  const certificateHolderFields = fields.filter(f => f.section === 'certificate_holder');
  const descriptionFields = fields.filter(f => f.section === 'description');

  const sections: FormSection[] = [];

  if (certificateHolderFields.length > 0) {
    sections.push({
      id: 'certificate_holder',
      title: 'Certificate Holder',
      fields: certificateHolderFields,
    });
  }

  if (descriptionFields.length > 0) {
    sections.push({
      id: 'description',
      title: 'Description of Operations',
      fields: descriptionFields,
    });
  }

  return {
    title: 'Almost there!',
    description: 'I need a few more details to complete your certificate.',
    sections,
    submitButton: { label: 'Generate COI', icon: 'FileCheck' },
  };
}

// Coverage types supported by ACORD forms
export type CoverageType =
  | 'general_liability'
  | 'auto_liability'
  | 'workers_comp'
  | 'umbrella'
  | 'excess_liability'
  | 'property'
  | 'bop'
  | 'professional_liability'
  | 'inland_marine'
  | 'commercial_property'
  | 'cyber'
  | 'epli';

// ACORD form template from database
interface AcordFormTemplate {
  id: string;
  form_number: string;
  form_name: string;
  version: string;
  coverage_types: string[];
  storage_path: string;
  field_schema: Record<string, any> | null;
  is_active: boolean;
}

// Filled certificate record
interface FilledCertificateRecord {
  id: string;
  template_id: string;
  form_number: string;
  storage_path: string;
  insured_name: string;
  carrier_name: string;
  policy_number: string;
  effective_date: string;
  expiration_date: string;
  certificate_holder: string;
  coverage_types: string[];
  extracted_data: any;
  form_data: any;
  created_at: string;
}

// Extracted policy data structure
interface ExtractedPolicy {
  insured?: {
    name: string;
    address: string;
    dba?: string;
  };
  producer?: {
    name: string;
    address: string;
    phone?: string;
    email?: string;
  };
  insurers?: Array<{
    name: string;
    naic_code?: string;
    role: string;
  }>;
  coverages?: {
    general_liability?: CoverageData;
    automobile_liability?: CoverageData;
    umbrella_liability?: CoverageData;
    workers_compensation?: CoverageData;
  };
  special_provisions?: {
    additional_insured_endorsements?: string[];
    waiver_of_subrogation?: boolean;
    primary_non_contributory?: boolean;
  };
  missing_fields?: string[];
  confidence_notes?: string;
}

interface CoverageData {
  policy_number?: string;
  effective_date?: string;
  expiration_date?: string;
  limits?: Record<string, string>;
  form_type?: string;
  covered_autos?: string[];
}

// =============================================================================
// TOOL HANDLERS
// =============================================================================

export async function handleToolCall(
  name: string,
  input: Record<string, any>,
  supabase: any,
  userId: string,
  conversationId: string | null,
  callbacks?: ToolCallbacks
): Promise<{ data?: any; summary?: string; artifact?: any; steps?: StepDefinition[] }> {
  // Handle legacy onProgress callback
  const onProgress = callbacks?.onProgress || (typeof callbacks === 'function' ? callbacks as ProgressCallback : undefined);

  switch (name) {
    case 'read_reference_doc':
      return handleReadReferenceDoc(input.path);

    case 'list_certificates':
      return handleListCertificates(input, supabase, userId);

    case 'get_certificate':
      return handleGetCertificate(input.certificate_id, supabase, userId);

    case 'process_coi_request':
      return handleProcessCoiRequest(
        input.file_id,
        input.certificate_holder,
        supabase,
        userId,
        conversationId,
        callbacks
      );

    case 'create_artifact':
      return handleCreateArtifact(input.artifact_type, input.title, input.content);

    // Legacy tool support
    case 'parse_policy_pdf':
      return handleParsePolicyPdf(input.file_id, supabase, onProgress);

    case 'generate_coi':
      return handleGenerateCoi(input.form_type, input.field_values, supabase, userId, conversationId);

    default:
      throw new Error(`Unknown tool: ${name}`);
  }
}

// =============================================================================
// V2: TEMPLATE MANAGEMENT FUNCTIONS
// =============================================================================

/**
 * Map detected coverage types to normalized coverage type codes
 */
function normalizeCoverageTypes(detectedTypes: string[]): CoverageType[] {
  const normalized: CoverageType[] = [];
  const typeMap: Record<string, CoverageType> = {
    'general liability': 'general_liability',
    'gl': 'general_liability',
    'cgl': 'general_liability',
    'commercial general liability': 'general_liability',
    'auto': 'auto_liability',
    'automobile': 'auto_liability',
    'auto liability': 'auto_liability',
    'automobile liability': 'auto_liability',
    'commercial auto': 'auto_liability',
    'workers comp': 'workers_comp',
    'workers compensation': 'workers_comp',
    'wc': 'workers_comp',
    'umbrella': 'umbrella',
    'umbrella liability': 'umbrella',
    'excess': 'excess_liability',
    'excess liability': 'excess_liability',
    'property': 'property',
    'commercial property': 'commercial_property',
    'bop': 'bop',
    'business owners': 'bop',
    'professional liability': 'professional_liability',
    'e&o': 'professional_liability',
    'inland marine': 'inland_marine',
    'cyber': 'cyber',
    'epli': 'epli',
    'employment practices': 'epli',
  };

  for (const type of detectedTypes) {
    const lower = type.toLowerCase().trim();
    const mapped = typeMap[lower];
    if (mapped && !normalized.includes(mapped)) {
      normalized.push(mapped);
    }
  }

  return normalized;
}

/**
 * Select the appropriate ACORD form(s) based on coverage types
 * Queries the database for available templates and returns the best match(es)
 */
async function selectFormForCoverage(
  coverageTypes: CoverageType[],
  supabase: any
): Promise<AcordFormTemplate[]> {
  // Fetch active templates from database
  const { data: templates, error } = await supabase
    .from('acord_form_templates')
    .select('*')
    .eq('is_active', true);

  if (error || !templates || templates.length === 0) {
    // Fallback to ACORD 25 if no templates found
    console.warn('No templates found in database, using default ACORD 25');
    return [{
      id: 'default-25',
      form_number: '25',
      form_name: 'Certificate of Liability Insurance',
      version: '2016/03',
      coverage_types: ['general_liability', 'auto_liability', 'workers_comp', 'umbrella'],
      storage_path: 'acord-25.pdf',
      field_schema: null,
      is_active: true,
    }];
  }

  // Categorize coverage types
  const hasLiability = coverageTypes.some(c =>
    ['general_liability', 'auto_liability', 'workers_comp', 'umbrella', 'excess_liability', 'bop', 'professional_liability'].includes(c)
  );
  const hasProperty = coverageTypes.some(c =>
    ['property', 'inland_marine', 'commercial_property'].includes(c)
  );

  const selectedForms: AcordFormTemplate[] = [];

  // Form selection logic
  if (hasLiability) {
    // ACORD 25 for liability coverages
    const acord25 = templates.find((t: AcordFormTemplate) => t.form_number === '25');
    if (acord25) selectedForms.push(acord25);
  }

  if (hasProperty && !hasLiability) {
    // ACORD 27 or 28 for property-only coverages
    const hasCommercial = coverageTypes.includes('commercial_property');
    const propertyForm = templates.find((t: AcordFormTemplate) =>
      hasCommercial ? t.form_number === '28' : t.form_number === '27'
    );
    if (propertyForm) selectedForms.push(propertyForm);
  }

  // If no forms selected, default to ACORD 25
  if (selectedForms.length === 0) {
    const defaultForm = templates.find((t: AcordFormTemplate) => t.form_number === '25');
    if (defaultForm) selectedForms.push(defaultForm);
  }

  return selectedForms;
}

/**
 * Download a PDF template from Supabase storage
 */
async function downloadPdfTemplate(
  supabase: any,
  storagePath: string
): Promise<Uint8Array | null> {
  try {
    const { data, error } = await supabase.storage
      .from('acord-templates')
      .download(storagePath);

    if (error || !data) {
      console.warn(`Template not found: ${storagePath}`, error);
      return null;
    }

    const arrayBuffer = await data.arrayBuffer();
    return new Uint8Array(arrayBuffer);
  } catch (error) {
    console.error('Error downloading template:', error);
    return null;
  }
}

/**
 * Fill a PDF template with extracted policy data
 * Uses pdf-lib to populate form fields
 */
async function fillPdfTemplate(
  templateBytes: Uint8Array,
  extractedData: ExtractedPolicy,
  certificateHolder?: { name?: string; address?: string },
  fieldSchema?: Record<string, any> | null
): Promise<Uint8Array> {
  // Dynamic import of pdf-lib for Deno
  const { PDFDocument } = await import('https://esm.sh/pdf-lib@1.17.1');

  const pdfDoc = await PDFDocument.load(templateBytes);
  const form = pdfDoc.getForm();

  // Helper to safely set text field
  const setTextField = (fieldName: string, value: string | undefined) => {
    if (!value) return;
    try {
      const field = form.getTextField(fieldName);
      field.setText(value);
    } catch (e) {
      // Field doesn't exist or isn't a text field - skip silently
    }
  };

  // Helper to safely set checkbox
  const setCheckbox = (fieldName: string, checked: boolean | undefined) => {
    if (checked === undefined) return;
    try {
      const field = form.getCheckBox(fieldName);
      if (checked) field.check();
      else field.uncheck();
    } catch (e) {
      // Field doesn't exist or isn't a checkbox - skip silently
    }
  };

  // Fill producer section
  setTextField('PRODUCER', extractedData.producer?.name);
  setTextField('PRODUCER_ADDRESS', extractedData.producer?.address);
  setTextField('PRODUCER_PHONE', extractedData.producer?.phone);
  setTextField('PRODUCER_EMAIL', extractedData.producer?.email);
  // Common alternate field names
  setTextField('ProducerName', extractedData.producer?.name);
  setTextField('ProducerAddress', extractedData.producer?.address);

  // Fill insured section
  setTextField('INSURED', extractedData.insured?.name);
  setTextField('INSURED_ADDRESS', extractedData.insured?.address);
  setTextField('InsuredName', extractedData.insured?.name);
  setTextField('InsuredAddress', extractedData.insured?.address);

  // Fill insurers
  if (extractedData.insurers?.[0]) {
    setTextField('INSURER_A', extractedData.insurers[0].name);
    setTextField('INSURER_A_NAIC', extractedData.insurers[0].naic_code);
    setTextField('InsurerA', extractedData.insurers[0].name);
    setTextField('InsurerANAIC', extractedData.insurers[0].naic_code);
  }
  if (extractedData.insurers?.[1]) {
    setTextField('INSURER_B', extractedData.insurers[1].name);
    setTextField('INSURER_B_NAIC', extractedData.insurers[1].naic_code);
  }

  // Fill General Liability
  const gl = extractedData.coverages?.general_liability;
  if (gl) {
    setTextField('GL_POLICY', gl.policy_number);
    setTextField('GL_EFF', gl.effective_date);
    setTextField('GL_EXP', gl.expiration_date);
    setTextField('GL_EACH_OCC', gl.limits?.each_occurrence);
    setTextField('GL_DAMAGE_RENTED', gl.limits?.damage_to_rented_premises);
    setTextField('GL_MED_EXP', gl.limits?.med_exp);
    setTextField('GL_PERS_ADV', gl.limits?.personal_adv_injury);
    setTextField('GL_GEN_AGG', gl.limits?.general_aggregate);
    setTextField('GL_PROD_AGG', gl.limits?.products_completed_ops);
    // Checkboxes
    setCheckbox('GL_OCCUR', gl.form_type === 'occurrence');
    setCheckbox('GL_CLAIMS', gl.form_type === 'claims-made');
  }

  // Fill Auto Liability
  const auto = extractedData.coverages?.automobile_liability;
  if (auto) {
    setTextField('AUTO_POLICY', auto.policy_number);
    setTextField('AUTO_EFF', auto.effective_date);
    setTextField('AUTO_EXP', auto.expiration_date);
    setTextField('AUTO_COMBINED', auto.limits?.combined_single_limit);
    // Checkboxes for auto types
    const coveredAutos = auto.covered_autos || [];
    setCheckbox('AUTO_ANY', coveredAutos.includes('any_auto'));
    setCheckbox('AUTO_OWNED', coveredAutos.includes('owned'));
    setCheckbox('AUTO_HIRED', coveredAutos.includes('hired'));
    setCheckbox('AUTO_NON_OWNED', coveredAutos.includes('non_owned'));
  }

  // Fill Umbrella Liability
  const umbrella = extractedData.coverages?.umbrella_liability;
  if (umbrella) {
    setTextField('UMB_POLICY', umbrella.policy_number);
    setTextField('UMB_EFF', umbrella.effective_date);
    setTextField('UMB_EXP', umbrella.expiration_date);
    setTextField('UMB_EACH_OCC', umbrella.limits?.each_occurrence);
    setTextField('UMB_AGG', umbrella.limits?.aggregate);
  }

  // Fill Workers Compensation
  const wc = extractedData.coverages?.workers_compensation;
  if (wc) {
    setTextField('WC_POLICY', wc.policy_number);
    setTextField('WC_EFF', wc.effective_date);
    setTextField('WC_EXP', wc.expiration_date);
    setTextField('WC_EL_ACC', wc.limits?.el_each_accident);
    setTextField('WC_EL_DIS_EA', wc.limits?.el_disease_employee);
    setTextField('WC_EL_DIS_POL', wc.limits?.el_disease_policy);
    setCheckbox('WC_STATUTORY', true); // Usually always checked
  }

  // Fill Certificate Holder
  setTextField('CERT_HOLDER', certificateHolder?.name);
  setTextField('CERT_HOLDER_ADDRESS', certificateHolder?.address);
  setTextField('CertificateHolder', certificateHolder?.name);
  setTextField('CertificateHolderAddress', certificateHolder?.address);

  // Build and fill Description of Operations
  const descLines: string[] = [];
  if (extractedData.special_provisions?.additional_insured_endorsements?.length) {
    descLines.push(`Additional Insured: ${certificateHolder?.name || 'Certificate Holder'}`);
  }
  if (extractedData.special_provisions?.waiver_of_subrogation) {
    descLines.push('Waiver of Subrogation applies in favor of Certificate Holder.');
  }
  if (extractedData.special_provisions?.primary_non_contributory) {
    descLines.push('Coverage is Primary and Non-Contributory.');
  }
  if (descLines.length > 0) {
    setTextField('DESCRIPTION', descLines.join(' '));
    setTextField('DescriptionOfOperations', descLines.join(' '));
  }

  // Set certificate date
  const today = new Date().toLocaleDateString('en-US');
  setTextField('DATE', today);
  setTextField('CertificateDate', today);

  // Flatten form to prevent editing (optional - makes it look more official)
  // form.flatten();

  // Save and return the filled PDF
  const filledPdfBytes = await pdfDoc.save();
  return new Uint8Array(filledPdfBytes);
}

/**
 * Save a generated certificate to Supabase storage and database
 */
async function saveCertificateToSupabase(
  supabase: any,
  userId: string,
  template: AcordFormTemplate,
  extractedData: ExtractedPolicy,
  coiContent: any,
  certificateHolder?: { name?: string; address?: string }
): Promise<{ certificateId: string; storagePath: string; signedUrl: string } | null> {
  try {
    const insuredName = (extractedData.insured?.name || 'certificate').replace(/[^a-zA-Z0-9]/g, '_');
    const timestamp = Date.now();

    // Try to generate actual filled PDF
    let fileContent: Uint8Array | string;
    let contentType: string;
    let fileName: string;

    const templateBytes = await downloadPdfTemplate(supabase, template.storage_path);

    if (templateBytes) {
      // We have a PDF template - fill it
      console.log(`Filling PDF template: ${template.storage_path}`);
      const filledPdf = await fillPdfTemplate(
        templateBytes,
        extractedData,
        certificateHolder,
        template.field_schema
      );
      fileContent = filledPdf;
      contentType = 'application/pdf';
      fileName = `ACORD${template.form_number}_${insuredName}_${timestamp}.pdf`;
    } else {
      // No PDF template available - fall back to JSON
      console.log('No PDF template found, saving as JSON');
      const certificateData = {
        generatedAt: new Date().toISOString(),
        formNumber: template.form_number,
        formName: template.form_name,
        content: coiContent,
        extractedData,
      };
      fileContent = JSON.stringify(certificateData, null, 2);
      contentType = 'application/json';
      fileName = `ACORD${template.form_number}_${insuredName}_${timestamp}.json`;
    }

    const storagePath = `${userId}/${fileName}`;

    // Upload to filled-certificates bucket
    const { error: uploadError } = await supabase.storage
      .from('filled-certificates')
      .upload(storagePath, fileContent, {
        contentType,
        upsert: false,
      });

    if (uploadError) {
      console.error('Failed to upload certificate:', uploadError);
      // Continue without storage - not critical
    }

    // Get first coverage for dates
    const firstCoverage = extractedData.coverages?.general_liability ||
      extractedData.coverages?.automobile_liability ||
      extractedData.coverages?.umbrella_liability ||
      extractedData.coverages?.workers_compensation;

    // Insert record into database
    const { data: certRecord, error: dbError } = await supabase
      .from('filled_certificates')
      .insert({
        created_by: userId,
        template_id: template.id !== 'default-25' ? template.id : null,
        form_number: template.form_number,
        storage_path: storagePath,
        source_file_name: null, // Could be passed in
        insured_name: extractedData.insured?.name || null,
        carrier_name: extractedData.insurers?.[0]?.name || null,
        policy_number: firstCoverage?.policy_number || null,
        effective_date: firstCoverage?.effective_date ? parseDate(firstCoverage.effective_date)?.toISOString().split('T')[0] : null,
        expiration_date: firstCoverage?.expiration_date ? parseDate(firstCoverage.expiration_date)?.toISOString().split('T')[0] : null,
        certificate_holder: certificateHolder?.name || null,
        coverage_types: getCoverageTypesFromExtracted(extractedData),
        extracted_data: extractedData,
        form_data: coiContent,
      })
      .select()
      .single();

    if (dbError) {
      console.error('Failed to save certificate record:', dbError);
      // Still try to return the URL if upload worked
    }

    // Create signed URL for download (1 hour expiry)
    const { data: urlData } = await supabase.storage
      .from('filled-certificates')
      .createSignedUrl(storagePath, 3600);

    return {
      certificateId: certRecord?.id || `temp-${timestamp}`,
      storagePath,
      signedUrl: urlData?.signedUrl || '',
    };
  } catch (error) {
    console.error('Error saving certificate:', error);
    return null;
  }
}

/**
 * Get coverage types array from extracted policy data
 */
function getCoverageTypesFromExtracted(extractedData: ExtractedPolicy): string[] {
  const types: string[] = [];
  if (extractedData.coverages?.general_liability?.policy_number) types.push('general_liability');
  if (extractedData.coverages?.automobile_liability?.policy_number) types.push('auto_liability');
  if (extractedData.coverages?.umbrella_liability?.policy_number) types.push('umbrella');
  if (extractedData.coverages?.workers_compensation?.policy_number) types.push('workers_comp');
  return types;
}

// =============================================================================
// READ REFERENCE DOC
// =============================================================================

async function handleReadReferenceDoc(path: string) {
  const content = REFERENCE_DOCS[path];

  if (!content) {
    return {
      data: { error: `Document not found: ${path}` },
      summary: `Document not found: ${path}`,
    };
  }

  return {
    data: { content, path },
    summary: `Read reference document: ${path}`,
  };
}

// =============================================================================
// LIST CERTIFICATES (V2)
// =============================================================================

async function handleListCertificates(
  input: { insured_name?: string; carrier_name?: string; limit?: number },
  supabase: any,
  userId: string
) {
  try {
    let query = supabase
      .from('filled_certificates')
      .select('id, form_number, insured_name, carrier_name, policy_number, effective_date, expiration_date, certificate_holder, coverage_types, created_at, storage_path')
      .eq('created_by', userId)
      .order('created_at', { ascending: false })
      .limit(input.limit || 10);

    // Apply filters if provided
    if (input.insured_name) {
      query = query.ilike('insured_name', `%${input.insured_name}%`);
    }
    if (input.carrier_name) {
      query = query.ilike('carrier_name', `%${input.carrier_name}%`);
    }

    const { data: certificates, error } = await query;

    if (error) {
      console.error('Error listing certificates:', error);
      return {
        data: { error: 'Failed to list certificates', details: error.message },
        summary: 'Failed to list certificates',
      };
    }

    if (!certificates || certificates.length === 0) {
      return {
        data: { certificates: [], count: 0 },
        summary: 'No certificates found',
      };
    }

    // Generate signed URLs for each certificate
    const certificatesWithUrls = await Promise.all(
      certificates.map(async (cert: any) => {
        const { data: urlData } = await supabase.storage
          .from('filled-certificates')
          .createSignedUrl(cert.storage_path, 3600);

        return {
          ...cert,
          downloadUrl: urlData?.signedUrl || null,
        };
      })
    );

    return {
      data: {
        certificates: certificatesWithUrls,
        count: certificatesWithUrls.length,
      },
      summary: `Found ${certificatesWithUrls.length} certificate${certificatesWithUrls.length === 1 ? '' : 's'}`,
    };
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return {
      data: { error: 'Failed to list certificates', details: errorMessage },
      summary: 'Failed to list certificates',
    };
  }
}

// =============================================================================
// GET CERTIFICATE (V2)
// =============================================================================

async function handleGetCertificate(
  certificateId: string,
  supabase: any,
  userId: string
) {
  try {
    const { data: certificate, error } = await supabase
      .from('filled_certificates')
      .select('*')
      .eq('id', certificateId)
      .eq('created_by', userId)
      .single();

    if (error || !certificate) {
      return {
        data: { error: 'Certificate not found' },
        summary: 'Certificate not found',
      };
    }

    // Generate fresh signed URL
    const { data: urlData } = await supabase.storage
      .from('filled-certificates')
      .createSignedUrl(certificate.storage_path, 3600);

    return {
      data: {
        certificate: {
          ...certificate,
          downloadUrl: urlData?.signedUrl || null,
        },
      },
      summary: `Retrieved certificate for ${certificate.insured_name || 'insured'}`,
    };
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return {
      data: { error: 'Failed to get certificate', details: errorMessage },
      summary: 'Failed to get certificate',
    };
  }
}

// =============================================================================
// PROCESS COI REQUEST - Main step-based workflow
// =============================================================================

async function handleProcessCoiRequest(
  fileId: string,
  certificateHolder: { name?: string; address?: string; is_additional_insured?: boolean } | undefined,
  supabase: any,
  userId: string,
  conversationId: string | null,
  callbacks?: ToolCallbacks
): Promise<{ data?: any; summary?: string; artifact?: any; steps?: StepDefinition[] }> {
  const { onStepUpdate, onStepsInit } = callbacks || {};

  // Initialize steps
  onStepsInit?.(COI_STEPS);

  // Helper to update step status
  const updateStep = (stepId: string, status: StepUpdate['status'], displayValue?: string, error?: string) => {
    onStepUpdate?.({ stepId, status, displayValue, error });
  };

  // Helper for delay (to make progress visible)
  const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

  try {
    // =========================================================================
    // STEP 1: Parse Document
    // =========================================================================
    updateStep('parse_document', 'running');

    // Get file record from database
    const { data: file, error: fileError } = await supabase
      .from('gailgpt_files')
      .select('*')
      .eq('id', fileId)
      .single();

    if (fileError || !file) {
      updateStep('parse_document', 'failed', undefined, 'File not found');
      return {
        data: { error: 'FILE_NOT_FOUND', message: `Could not find file with ID: ${fileId}` },
        summary: 'File not found',
        steps: COI_STEPS,
      };
    }

    // Validate file type
    if (!file.content_type.includes('pdf')) {
      updateStep('parse_document', 'failed', undefined, `Expected PDF, got ${file.content_type}`);
      return {
        data: { error: 'INVALID_FILE_TYPE', message: 'Please upload a PDF policy document' },
        summary: 'Invalid file type',
        steps: COI_STEPS,
      };
    }

    // Get signed URL and download PDF
    const { data: signedUrlData } = await supabase.storage
      .from('gailgpt-files')
      .createSignedUrl(file.storage_path, 300);

    if (!signedUrlData?.signedUrl) {
      updateStep('parse_document', 'failed', undefined, 'Unable to access file');
      return {
        data: { error: 'STORAGE_ERROR', message: 'Unable to access the file in storage' },
        summary: 'Storage access error',
        steps: COI_STEPS,
      };
    }

    const pdfResponse = await fetch(signedUrlData.signedUrl);
    const pdfBuffer = await pdfResponse.arrayBuffer();
    const pdfBytes = new Uint8Array(pdfBuffer);

    // Convert to base64
    let binary = '';
    for (let i = 0; i < pdfBytes.length; i++) {
      binary += String.fromCharCode(pdfBytes[i]);
    }
    const base64 = btoa(binary);
    const pageCount = Math.ceil(pdfBytes.length / 50000); // Rough estimate

    updateStep('parse_document', 'completed', `${file.filename} (${Math.round(pdfBytes.length / 1024)}KB)`);
    await delay(300);

    // =========================================================================
    // STEP 2-6: Extract policy data using Claude
    // =========================================================================
    updateStep('identify_carrier', 'running');

    const anthropicApiKey = Deno.env.get('ANTHROPIC_API_KEY');
    const Anthropic = (await import('https://esm.sh/@anthropic-ai/sdk@0.39.0')).default;
    const anthropic = new Anthropic({ apiKey: anthropicApiKey });

    const extractionResponse = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 8000,
      messages: [{
        role: 'user',
        content: [
          {
            type: 'document',
            source: {
              type: 'base64',
              media_type: 'application/pdf',
              data: base64,
            },
          },
          {
            type: 'text',
            text: POLICY_EXTRACTION_PROMPT,
          },
        ],
      }],
    });

    // Parse extraction response
    const responseText = extractionResponse.content[0].type === 'text' ? extractionResponse.content[0].text : '';
    let extractedData: ExtractedPolicy;

    try {
      let jsonText = responseText;
      if (jsonText.includes('```json')) {
        jsonText = jsonText.split('```json')[1].split('```')[0].trim();
      } else if (jsonText.includes('```')) {
        jsonText = jsonText.split('```')[1].split('```')[0].trim();
      }
      extractedData = JSON.parse(jsonText);
    } catch {
      updateStep('identify_carrier', 'failed', undefined, 'Failed to parse policy data');
      return {
        data: { error: 'EXTRACTION_FAILED', message: 'Unable to extract policy data' },
        summary: 'Extraction failed',
        steps: COI_STEPS,
      };
    }

    // Update carrier step
    const carrierName = extractedData.insurers?.[0]?.name || 'Unknown carrier';
    updateStep('identify_carrier', 'completed', carrierName);
    await delay(200);

    // =========================================================================
    // STEP 3: Detect coverage types
    // =========================================================================
    updateStep('detect_coverage', 'running');
    await delay(200);

    const coverageTypes: string[] = [];
    if (extractedData.coverages?.general_liability?.policy_number) coverageTypes.push('General Liability');
    if (extractedData.coverages?.automobile_liability?.policy_number) coverageTypes.push('Auto');
    if (extractedData.coverages?.umbrella_liability?.policy_number) coverageTypes.push('Umbrella');
    if (extractedData.coverages?.workers_compensation?.policy_number) coverageTypes.push('Workers Comp');

    updateStep('detect_coverage', 'completed', coverageTypes.join(', ') || 'No coverages found');
    await delay(200);

    // =========================================================================
    // STEP 4: Select ACORD form (V2: from database)
    // =========================================================================
    updateStep('select_form', 'running');
    await delay(200);

    // Normalize coverage types for form selection
    const normalizedCoverages = normalizeCoverageTypes(coverageTypes);

    // Query database for best matching form(s)
    const selectedTemplates = await selectFormForCoverage(normalizedCoverages, supabase);
    const primaryTemplate = selectedTemplates[0];
    const selectedForm = `ACORD_${primaryTemplate.form_number}`;

    updateStep('select_form', 'completed',
      selectedTemplates.length > 1
        ? selectedTemplates.map(t => `ACORD ${t.form_number}`).join(', ')
        : `ACORD ${primaryTemplate.form_number}`
    );
    await delay(200);

    // =========================================================================
    // STEP 5: Extract dates
    // =========================================================================
    updateStep('extract_dates', 'running');
    await delay(200);

    // Get dates from first available coverage
    const firstCoverage = extractedData.coverages?.general_liability ||
                         extractedData.coverages?.automobile_liability ||
                         extractedData.coverages?.umbrella_liability ||
                         extractedData.coverages?.workers_compensation;

    const effectiveDate = firstCoverage?.effective_date || 'Unknown';
    const expirationDate = firstCoverage?.expiration_date || 'Unknown';

    // Check if policy is expiring soon
    let dateWarning = '';
    if (expirationDate !== 'Unknown') {
      const expDate = parseDate(expirationDate);
      if (expDate) {
        const daysUntilExpiry = Math.ceil((expDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
        if (daysUntilExpiry <= 30 && daysUntilExpiry > 0) {
          dateWarning = ` (expires in ${daysUntilExpiry} days)`;
        } else if (daysUntilExpiry <= 0) {
          dateWarning = ' (EXPIRED)';
        }
      }
    }

    updateStep('extract_dates', 'completed', `${effectiveDate} → ${expirationDate}${dateWarning}`);
    await delay(200);

    // =========================================================================
    // STEP 6: Extract limits
    // =========================================================================
    updateStep('extract_limits', 'running');
    await delay(300);

    const limitsSummary: string[] = [];
    if (extractedData.coverages?.general_liability?.limits) {
      const glLimits = extractedData.coverages.general_liability.limits;
      if (glLimits.each_occurrence) {
        limitsSummary.push(`GL: ${glLimits.each_occurrence}/${glLimits.general_aggregate || 'N/A'}`);
      }
    }
    if (extractedData.coverages?.automobile_liability?.limits?.combined_single_limit) {
      limitsSummary.push(`Auto: ${extractedData.coverages.automobile_liability.limits.combined_single_limit}`);
    }
    if (extractedData.coverages?.umbrella_liability?.limits?.each_occurrence) {
      limitsSummary.push(`Umbrella: ${extractedData.coverages.umbrella_liability.limits.each_occurrence}`);
    }

    updateStep('extract_limits', 'completed', limitsSummary.join(' • ') || 'No limits found');
    await delay(200);

    // =========================================================================
    // STEP 7: Check for missing information
    // =========================================================================
    updateStep('check_missing', 'running');
    await delay(200);

    const missingFields: string[] = [];

    // Check for certificate holder
    if (!certificateHolder?.name) {
      missingFields.push('Certificate holder name');
    }
    if (!certificateHolder?.address) {
      missingFields.push('Certificate holder address');
    }

    // Check for producer info
    if (!extractedData.producer?.name) {
      missingFields.push('Producer/agency name');
    }

    // Add any missing fields from extraction
    if (extractedData.missing_fields) {
      missingFields.push(...extractedData.missing_fields);
    }

    if (missingFields.length > 0) {
      updateStep('check_missing', 'completed', `Missing: ${missingFields.join(', ')}`);
    } else {
      updateStep('check_missing', 'completed', 'All information available');
    }
    await delay(200);

    // =========================================================================
    // STEP 8: Generate certificate (or wait for missing info)
    // =========================================================================
    if (missingFields.includes('Certificate holder name') || missingFields.includes('Certificate holder address')) {
      // Need certificate holder info - mark as waiting
      updateStep('generate_cert', 'waiting');

      // Build and emit the form schema for missing fields
      const formSchema = buildFormSchema(missingFields, certificateHolder);
      callbacks?.onFormRequired?.(formSchema);

      return {
        data: {
          extracted_policy: extractedData,
          selected_form: selectedForm,
          coverage_types: coverageTypes,
          missing_fields: missingFields,
          needs_certificate_holder: true,
          form_schema: formSchema,
          observations: buildObservations(extractedData, effectiveDate, expirationDate),
        },
        summary: `Extracted policy data. Need certificate holder information to generate ${selectedForm.replace('_', ' ')}.`,
        steps: COI_STEPS,
      };
    }

    // Generate the certificate
    updateStep('generate_cert', 'running');
    await delay(300);

    // Build field values for COI generation
    const fieldValues = buildFieldValues(extractedData, certificateHolder);

    // Create the COI content
    const coiContent = {
      formType: selectedForm,
      formNumber: primaryTemplate.form_number,
      formName: primaryTemplate.form_name,
      generatedAt: new Date().toISOString(),
      producer: {
        name: extractedData.producer?.name || '',
        address: extractedData.producer?.address || '',
        phone: extractedData.producer?.phone,
        email: extractedData.producer?.email,
      },
      insured: {
        name: extractedData.insured?.name || '',
        address: extractedData.insured?.address || '',
      },
      insurers: (extractedData.insurers || []).map(ins => ({
        name: ins.name,
        naic: ins.naic_code || '',
      })),
      coverages: buildCoverageEntries(extractedData),
      certificateHolder: {
        name: certificateHolder?.name || '',
        address: certificateHolder?.address || '',
      },
      descriptionOfOperations: buildDescriptionOfOperations(extractedData, certificateHolder),
    };

    // V2: Save certificate to Supabase
    const savedCert = await saveCertificateToSupabase(
      supabase,
      userId,
      primaryTemplate,
      extractedData,
      coiContent,
      certificateHolder
    );

    updateStep('generate_cert', 'completed',
      savedCert ? 'Certificate saved' : 'Certificate ready'
    );

    // Build observations for proactive insights
    const observations = buildObservations(extractedData, effectiveDate, expirationDate);

    return {
      data: {
        success: true,
        extracted_policy: extractedData,
        coi_content: coiContent,
        observations,
        // V2: Include certificate storage info
        certificate: savedCert ? {
          id: savedCert.certificateId,
          storagePath: savedCert.storagePath,
          downloadUrl: savedCert.signedUrl,
        } : null,
        template: {
          formNumber: primaryTemplate.form_number,
          formName: primaryTemplate.form_name,
        },
      },
      summary: `Generated ${selectedForm.replace('_', ' ')} for ${extractedData.insured?.name || 'insured'}`,
      artifact: {
        id: savedCert?.certificateId || `coi-${Date.now()}`,
        artifact_type: selectedForm.toLowerCase(),
        title: `${selectedForm.replace('_', ' ')} - ${extractedData.insured?.name || 'Certificate'}`,
        content: coiContent,
        // V2: Include download URL in artifact
        downloadUrl: savedCert?.signedUrl,
      },
      steps: COI_STEPS,
    };

  } catch (error: unknown) {
    console.error('COI processing error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return {
      data: { error: 'PROCESSING_FAILED', message: errorMessage },
      summary: 'Processing failed',
      steps: COI_STEPS,
    };
  }
}

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

function parseDate(dateStr: string): Date | null {
  if (!dateStr) return null;
  const parts = dateStr.split('/');
  if (parts.length !== 3) return null;
  const [month, day, year] = parts.map(Number);
  return new Date(year, month - 1, day);
}

function buildFieldValues(extractedData: ExtractedPolicy, certificateHolder?: { name?: string; address?: string }) {
  const fieldValues: Record<string, any> = {
    insured_name: extractedData.insured?.name,
    insured_address: extractedData.insured?.address,
    producer_name: extractedData.producer?.name,
    producer_address: extractedData.producer?.address,
    producer_phone: extractedData.producer?.phone,
    producer_email: extractedData.producer?.email,
    holder_name: certificateHolder?.name,
    holder_address: certificateHolder?.address,
  };

  // Add insurer info
  if (extractedData.insurers?.[0]) {
    fieldValues.insurer_a_name = extractedData.insurers[0].name;
    fieldValues.insurer_a_naic = extractedData.insurers[0].naic_code;
  }

  // Add GL coverage
  if (extractedData.coverages?.general_liability) {
    const gl = extractedData.coverages.general_liability;
    fieldValues.gl_policy_number = gl.policy_number;
    fieldValues.gl_effective_date = gl.effective_date;
    fieldValues.gl_expiration_date = gl.expiration_date;
    if (gl.limits) {
      fieldValues.gl_each_occurrence = gl.limits.each_occurrence;
      fieldValues.gl_general_aggregate = gl.limits.general_aggregate;
      fieldValues.gl_products_comp_op = gl.limits.products_completed_ops;
      fieldValues.gl_personal_adv_injury = gl.limits.personal_adv_injury;
      fieldValues.gl_damage_to_rented = gl.limits.damage_to_rented_premises;
      fieldValues.gl_med_exp = gl.limits.med_exp;
    }
  }

  // Add Auto coverage
  if (extractedData.coverages?.automobile_liability) {
    const auto = extractedData.coverages.automobile_liability;
    fieldValues.auto_policy_number = auto.policy_number;
    fieldValues.auto_effective_date = auto.effective_date;
    fieldValues.auto_expiration_date = auto.expiration_date;
    if (auto.limits) {
      fieldValues.auto_combined_single_limit = auto.limits.combined_single_limit;
    }
  }

  // Add Umbrella coverage
  if (extractedData.coverages?.umbrella_liability) {
    const umbrella = extractedData.coverages.umbrella_liability;
    fieldValues.umbrella_policy_number = umbrella.policy_number;
    fieldValues.umbrella_effective_date = umbrella.effective_date;
    fieldValues.umbrella_expiration_date = umbrella.expiration_date;
    if (umbrella.limits) {
      fieldValues.umbrella_each_occurrence = umbrella.limits.each_occurrence;
      fieldValues.umbrella_aggregate = umbrella.limits.aggregate;
    }
  }

  // Add Workers Comp coverage
  if (extractedData.coverages?.workers_compensation) {
    const wc = extractedData.coverages.workers_compensation;
    fieldValues.wc_policy_number = wc.policy_number;
    fieldValues.wc_effective_date = wc.effective_date;
    fieldValues.wc_expiration_date = wc.expiration_date;
    if (wc.limits) {
      fieldValues.wc_el_each_accident = wc.limits.el_each_accident;
      fieldValues.wc_el_disease_employee = wc.limits.el_disease_employee;
      fieldValues.wc_el_disease_policy = wc.limits.el_disease_policy;
    }
  }

  return fieldValues;
}

function buildCoverageEntries(extractedData: ExtractedPolicy) {
  const entries: Array<{
    type: string;
    policyNumber: string;
    effectiveDate: string;
    expirationDate: string;
    limits: Record<string, string | undefined>;
  }> = [];

  if (extractedData.coverages?.general_liability?.policy_number) {
    const gl = extractedData.coverages.general_liability;
    entries.push({
      type: 'Commercial General Liability',
      policyNumber: gl.policy_number!,
      effectiveDate: gl.effective_date || '',
      expirationDate: gl.expiration_date || '',
      limits: gl.limits || {},
    });
  }

  if (extractedData.coverages?.automobile_liability?.policy_number) {
    const auto = extractedData.coverages.automobile_liability;
    entries.push({
      type: 'Automobile Liability',
      policyNumber: auto.policy_number!,
      effectiveDate: auto.effective_date || '',
      expirationDate: auto.expiration_date || '',
      limits: auto.limits || {},
    });
  }

  if (extractedData.coverages?.umbrella_liability?.policy_number) {
    const umbrella = extractedData.coverages.umbrella_liability;
    entries.push({
      type: 'Umbrella Liability',
      policyNumber: umbrella.policy_number!,
      effectiveDate: umbrella.effective_date || '',
      expirationDate: umbrella.expiration_date || '',
      limits: umbrella.limits || {},
    });
  }

  if (extractedData.coverages?.workers_compensation?.policy_number) {
    const wc = extractedData.coverages.workers_compensation;
    entries.push({
      type: 'Workers Compensation',
      policyNumber: wc.policy_number!,
      effectiveDate: wc.effective_date || '',
      expirationDate: wc.expiration_date || '',
      limits: wc.limits || {},
    });
  }

  return entries;
}

function buildDescriptionOfOperations(
  extractedData: ExtractedPolicy,
  certificateHolder?: { name?: string; is_additional_insured?: boolean }
): string {
  const lines: string[] = [];

  if (certificateHolder?.is_additional_insured && certificateHolder?.name) {
    lines.push(`${certificateHolder.name} is included as Additional Insured.`);
  }

  if (extractedData.special_provisions?.waiver_of_subrogation) {
    lines.push('Waiver of Subrogation applies in favor of Certificate Holder.');
  }

  if (extractedData.special_provisions?.primary_non_contributory) {
    lines.push('Coverage is Primary and Non-Contributory.');
  }

  return lines.join(' ');
}

function buildObservations(
  extractedData: ExtractedPolicy,
  effectiveDate: string,
  expirationDate: string
): string[] {
  const observations: string[] = [];

  // Check expiration
  if (expirationDate !== 'Unknown') {
    const expDate = parseDate(expirationDate);
    if (expDate) {
      const daysUntilExpiry = Math.ceil((expDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
      if (daysUntilExpiry <= 0) {
        observations.push('⚠️ This policy has expired.');
      } else if (daysUntilExpiry <= 30) {
        observations.push(`⏰ This policy expires in ${daysUntilExpiry} days.`);
      }
    }
  }

  // Check GL limits
  if (extractedData.coverages?.general_liability?.limits?.each_occurrence) {
    const limit = extractedData.coverages.general_liability.limits.each_occurrence;
    const numericLimit = parseFloat(limit.replace(/[$,]/g, ''));
    if (numericLimit < 1000000) {
      observations.push(`💡 The per-occurrence limit (${limit}) is below the typical $1M requirement.`);
    }
  }

  // Check for additional insured endorsements
  if (extractedData.special_provisions?.additional_insured_endorsements?.length) {
    const endorsements = extractedData.special_provisions.additional_insured_endorsements;
    if (endorsements.some(e => e.includes('CG 20 10'))) {
      observations.push('📋 Additional insured endorsement is CG 20 10 (ongoing operations only, not completed operations).');
    }
  }

  return observations;
}

// =============================================================================
// EXTRACTION PROMPT
// =============================================================================

const POLICY_EXTRACTION_PROMPT = `You are an insurance document analyst. Extract structured data from this insurance policy document.

Extract the following information and return as JSON:

{
  "insured": {
    "name": "Full legal name of the insured",
    "address": "Full address including city, state, zip",
    "dba": "DBA name if any, or null"
  },
  "producer": {
    "name": "Insurance agency/broker name",
    "address": "Agency address",
    "phone": "Phone number or null",
    "email": "Email or null"
  },
  "insurers": [
    {
      "name": "Insurance company name",
      "naic_code": "NAIC code if shown, or null",
      "role": "primary or excess"
    }
  ],
  "coverages": {
    "general_liability": {
      "policy_number": "Policy number",
      "effective_date": "MM/DD/YYYY",
      "expiration_date": "MM/DD/YYYY",
      "limits": {
        "each_occurrence": "$X,XXX,XXX",
        "general_aggregate": "$X,XXX,XXX",
        "products_completed_ops": "$X,XXX,XXX or null",
        "personal_adv_injury": "$X,XXX,XXX or null",
        "damage_to_rented_premises": "$X,XXX or null",
        "med_exp": "$X,XXX or null"
      },
      "form_type": "occurrence or claims-made"
    },
    "automobile_liability": {
      "policy_number": "Policy number or null if not present",
      "effective_date": "MM/DD/YYYY",
      "expiration_date": "MM/DD/YYYY",
      "limits": {
        "combined_single_limit": "$X,XXX,XXX"
      },
      "covered_autos": ["any_auto", "owned", "hired", "non_owned"]
    },
    "umbrella_liability": {
      "policy_number": "Policy number or null if not present",
      "effective_date": "MM/DD/YYYY",
      "expiration_date": "MM/DD/YYYY",
      "limits": {
        "each_occurrence": "$X,XXX,XXX",
        "aggregate": "$X,XXX,XXX"
      }
    },
    "workers_compensation": {
      "policy_number": "Policy number or null if not present",
      "effective_date": "MM/DD/YYYY",
      "expiration_date": "MM/DD/YYYY",
      "limits": {
        "el_each_accident": "$X,XXX,XXX",
        "el_disease_employee": "$X,XXX,XXX",
        "el_disease_policy": "$X,XXX,XXX"
      }
    }
  },
  "special_provisions": {
    "additional_insured_endorsements": ["List any additional insured endorsements found"],
    "waiver_of_subrogation": true/false,
    "primary_non_contributory": true/false
  },
  "missing_fields": ["List any fields you couldn't find in the document"],
  "confidence_notes": "Any notes about data quality or uncertainty"
}

Important:
- Set coverage sections to null if that coverage type is not present in the policy
- Use exact values from the document - don't estimate or assume
- Format dates as MM/DD/YYYY
- Format currency with dollar signs and commas
- If a field is unclear or missing, set to null and add to missing_fields
- Return ONLY the JSON object, no additional text`;

// =============================================================================
// LEGACY TOOL HANDLERS (for backward compatibility)
// =============================================================================

async function handleParsePolicyPdf(fileId: string, supabase: any, onProgress?: ProgressCallback) {
  // This is the legacy implementation - redirect to the new step-based one
  // but without step callbacks
  try {
    onProgress?.('Looking up file...', 0.1);
    const { data: file, error: fileError } = await supabase
      .from('gailgpt_files')
      .select('*')
      .eq('id', fileId)
      .single();

    if (fileError || !file) {
      return {
        data: { error: 'FILE_NOT_FOUND', message: `Could not find file with ID: ${fileId}` },
        summary: 'File not found',
      };
    }

    if (!file.content_type.includes('pdf')) {
      return {
        data: { error: 'INVALID_FILE_TYPE', message: `Expected PDF, got ${file.content_type}` },
        summary: 'Invalid file type',
      };
    }

    onProgress?.('Accessing document...', 0.2);
    const { data: signedUrlData } = await supabase.storage
      .from('gailgpt-files')
      .createSignedUrl(file.storage_path, 300);

    if (!signedUrlData?.signedUrl) {
      return {
        data: { error: 'STORAGE_ERROR', message: 'Unable to access file' },
        summary: 'Storage error',
      };
    }

    onProgress?.('Downloading document...', 0.3);
    const pdfResponse = await fetch(signedUrlData.signedUrl);
    const pdfBuffer = await pdfResponse.arrayBuffer();
    const pdfBytes = new Uint8Array(pdfBuffer);

    let binary = '';
    for (let i = 0; i < pdfBytes.length; i++) {
      binary += String.fromCharCode(pdfBytes[i]);
    }
    const base64 = btoa(binary);

    onProgress?.('Analyzing policy document...', 0.5);

    const anthropicApiKey = Deno.env.get('ANTHROPIC_API_KEY');
    const Anthropic = (await import('https://esm.sh/@anthropic-ai/sdk@0.39.0')).default;
    const anthropic = new Anthropic({ apiKey: anthropicApiKey });

    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 8000,
      messages: [{
        role: 'user',
        content: [
          { type: 'document', source: { type: 'base64', media_type: 'application/pdf', data: base64 } },
          { type: 'text', text: POLICY_EXTRACTION_PROMPT },
        ],
      }],
    });

    onProgress?.('Structuring extracted data...', 0.85);
    const responseText = response.content[0].type === 'text' ? response.content[0].text : '';

    let extractedData;
    try {
      let jsonText = responseText;
      if (jsonText.includes('```json')) {
        jsonText = jsonText.split('```json')[1].split('```')[0].trim();
      } else if (jsonText.includes('```')) {
        jsonText = jsonText.split('```')[1].split('```')[0].trim();
      }
      extractedData = JSON.parse(jsonText);
    } catch {
      return {
        data: { error: 'EXTRACTION_PARSE_ERROR', message: 'Failed to parse extraction response' },
        summary: 'Extraction parsing error',
      };
    }

    const coverageTypes = [];
    if (extractedData.coverages?.general_liability?.policy_number) coverageTypes.push('GL');
    if (extractedData.coverages?.automobile_liability?.policy_number) coverageTypes.push('Auto');
    if (extractedData.coverages?.umbrella_liability?.policy_number) coverageTypes.push('Umbrella');
    if (extractedData.coverages?.workers_compensation?.policy_number) coverageTypes.push('WC');

    return {
      data: extractedData,
      summary: `Extracted policy data for ${extractedData.insured?.name || 'insured'}: ${coverageTypes.join(', ')}`,
    };

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return {
      data: { error: 'EXTRACTION_FAILED', message: errorMessage },
      summary: 'Extraction failed',
    };
  }
}

async function handleGenerateCoi(
  formType: string,
  fieldValues: Record<string, any>,
  _supabase: any,
  _userId: string,
  _conversationId: string | null
) {
  // Legacy COI generation - builds the same content structure
  const coiContent = {
    formType,
    generatedAt: new Date().toISOString(),
    producer: {
      name: fieldValues.producer_name,
      address: fieldValues.producer_address,
      phone: fieldValues.producer_phone,
      email: fieldValues.producer_email,
    },
    insured: {
      name: fieldValues.insured_name,
      address: fieldValues.insured_address,
    },
    insurers: [
      { name: fieldValues.insurer_a_name, naic: fieldValues.insurer_a_naic },
      fieldValues.insurer_b_name ? { name: fieldValues.insurer_b_name, naic: fieldValues.insurer_b_naic } : null,
    ].filter(Boolean),
    coverages: [],
    certificateHolder: {
      name: fieldValues.holder_name,
      address: fieldValues.holder_address,
    },
    descriptionOfOperations: fieldValues.description,
  };

  return {
    data: coiContent,
    summary: `Generated ${formType.replace('_', ' ')} for ${fieldValues.insured_name}`,
    artifact: {
      id: `coi-${Date.now()}`,
      artifact_type: formType.toLowerCase(),
      title: `${formType.replace('_', ' ')} - ${fieldValues.insured_name}`,
      content: coiContent,
    },
  };
}

async function handleCreateArtifact(artifactType: string, title: string, content: any) {
  return {
    data: { success: true },
    summary: `Created artifact: ${title}`,
    artifact: {
      id: `artifact-${Date.now()}`,
      artifact_type: artifactType,
      title,
      content,
    },
  };
}
