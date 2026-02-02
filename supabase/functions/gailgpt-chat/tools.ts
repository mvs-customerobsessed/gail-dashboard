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

**parse_policy_pdf** - Extract data from uploaded policy PDFs
- Returns structured policy information

**generate_coi** - Generate a filled certificate document
- Requires form_type and field_values matching the form's schema
- Returns document_id for rendering

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

When a user requests a COI:

1. **Read the form index** - Call read_reference_doc("acord-forms/index.md") to understand form selection criteria

2. **Gather information** - Ask for or extract from uploaded documents:
   - Insured name and address
   - Certificate holder name and address
   - Coverage types needed
   - Policy numbers and dates
   - Coverage limits

3. **Select the form** - Based on coverage types, determine the appropriate ACORD form:
   - ACORD 25: General Liability, Auto, Umbrella, Workers Comp
   - ACORD 24: Property Insurance (standalone)
   - ACORD 27: Evidence of Property Insurance (for lenders)
   - ACORD 28: Evidence of Commercial Property Insurance

4. **Read form specs** - Call read_reference_doc for the selected form's field-schema.json

5. **Generate the certificate** - Call generate_coi with form_type and field_values

6. **Display the result** - Call create_artifact to render in the artifact panel

## Communication Style
- Professional but approachable
- Show your reasoning when analyzing policies and selecting forms
- Proactively flag missing information needed for complete certificates
- Mention if any required fields couldn't be filled
- Note any special provisions (additional insured, waiver of subrogation)

## Response Formatting
Use clean, tight markdown formatting:

**Headers:**
- Use ## for main sections, ### for subsections
- Headers should flow directly into content (no blank lines after)

**Lists:**
- Use bullet lists for related items
- Use **Bold Term:** followed by description for definition-style lists
- For nested/sub-items, indent with 2 spaces before the dash:
  - Parent item
    - Child item (2 spaces before dash)
    - Another child
- Keep list items concise

**Paragraphs:**
- Keep paragraphs short and scannable
- No excessive blank lines between sections

**Example of good formatting:**
## Coverage Summary
This policy includes the following coverages:
- **General Liability:** $1M per occurrence, $2M aggregate
- **Auto Liability:** $1M combined single limit
- **Umbrella:** $5M per occurrence

## Types of Coverage
- **Personal Lines:**
  - Auto insurance
  - Homeowners/renters insurance
  - Life insurance
- **Commercial Lines:**
  - General liability
  - Workers compensation
  - Commercial property

## Missing Information
I need the following to complete the certificate:
- Certificate holder's full legal name
- Certificate holder's mailing address

## Important Rules
- Always consult reference docs before making form selection decisions
- Certificate dates cannot extend beyond policy expiration
- Certificate holder information must be exact as provided by user
- Note in Description of Operations: additional insureds, waivers, primary/non-contributory status`;

// Tool definitions
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
    name: 'parse_policy_pdf',
    description: 'Extract structured data from an uploaded insurance policy PDF. Returns policy details including coverages, limits, dates, and parties.',
    input_schema: {
      type: 'object',
      properties: {
        file_id: {
          type: 'string',
          description: 'The ID of the uploaded file to parse'
        }
      },
      required: ['file_id']
    }
  },
  {
    name: 'generate_coi',
    description: 'Generate a filled Certificate of Insurance using the specified ACORD form and field values.',
    input_schema: {
      type: 'object',
      properties: {
        form_type: {
          type: 'string',
          enum: ['ACORD_25', 'ACORD_24', 'ACORD_27', 'ACORD_28'],
          description: 'The ACORD form type to generate'
        },
        field_values: {
          type: 'object',
          description: 'Key-value pairs mapping field IDs from the form schema to their values',
          additionalProperties: true
        }
      },
      required: ['form_type', 'field_values']
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

// Reference documents content (embedded for Edge Function)
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

// Progress callback type for streaming tool progress to client
export type ProgressCallback = (step: string, progress?: number) => void;

// Tool handlers
export async function handleToolCall(
  name: string,
  input: Record<string, any>,
  supabase: any,
  userId: string,
  conversationId: string | null,
  onProgress?: ProgressCallback
): Promise<{ data?: any; summary?: string; artifact?: any }> {
  switch (name) {
    case 'read_reference_doc':
      return handleReadReferenceDoc(input.path);

    case 'parse_policy_pdf':
      return handleParsePolicyPdf(input.file_id, supabase, onProgress);

    case 'generate_coi':
      return handleGenerateCoi(input.form_type, input.field_values, supabase, userId, conversationId);

    case 'create_artifact':
      return handleCreateArtifact(input.artifact_type, input.title, input.content);

    default:
      throw new Error(`Unknown tool: ${name}`);
  }
}

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

// Extraction prompt for Claude to parse insurance policy PDFs
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

async function handleParsePolicyPdf(fileId: string, supabase: any, onProgress?: ProgressCallback) {
  try {
    // 1. Get file record from database
    onProgress?.('Looking up file...', 0.1);
    const { data: file, error: fileError } = await supabase
      .from('gailgpt_files')
      .select('*')
      .eq('id', fileId)
      .single();

    if (fileError || !file) {
      return {
        data: {
          error: 'FILE_NOT_FOUND',
          message: `Could not find file with ID: ${fileId}. Please ensure the file was uploaded successfully.`,
        },
        summary: 'File not found',
      };
    }

    // 2. Validate file type
    if (!file.content_type.includes('pdf')) {
      return {
        data: {
          error: 'INVALID_FILE_TYPE',
          message: `Expected a PDF file but got ${file.content_type}. Please upload a PDF policy document.`,
        },
        summary: 'Invalid file type - PDF required',
      };
    }

    // 3. Get signed URL for the file
    onProgress?.('Accessing document...', 0.2);
    const { data: signedUrlData, error: urlError } = await supabase.storage
      .from('gailgpt-files')
      .createSignedUrl(file.storage_path, 300); // 5 minute expiry

    if (urlError || !signedUrlData?.signedUrl) {
      return {
        data: {
          error: 'STORAGE_ERROR',
          message: 'Unable to access the file in storage. Please try uploading again.',
        },
        summary: 'Storage access error',
      };
    }

    // 4. Download the PDF
    onProgress?.('Downloading document...', 0.3);
    console.log('Downloading PDF from storage...');
    const pdfResponse = await fetch(signedUrlData.signedUrl);
    if (!pdfResponse.ok) {
      return {
        data: {
          error: 'DOWNLOAD_ERROR',
          message: 'Failed to download the PDF file.',
        },
        summary: 'Download failed',
      };
    }

    const pdfBuffer = await pdfResponse.arrayBuffer();
    const pdfBytes = new Uint8Array(pdfBuffer);

    // Convert to base64 (Deno-compatible approach)
    let binary = '';
    for (let i = 0; i < pdfBytes.length; i++) {
      binary += String.fromCharCode(pdfBytes[i]);
    }
    const base64 = btoa(binary);

    console.log(`PDF downloaded: ${Math.round(pdfBytes.length / 1024)}KB, calling Claude for extraction...`);
    onProgress?.('Analyzing policy document...', 0.5);

    // 5. Call Claude with PDF document using vision/document capabilities
    const anthropicApiKey = Deno.env.get('ANTHROPIC_API_KEY');
    const Anthropic = (await import('https://esm.sh/@anthropic-ai/sdk@0.39.0')).default;
    const anthropic = new Anthropic({ apiKey: anthropicApiKey });

    const response = await anthropic.messages.create({
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

    // 6. Parse Claude's response
    onProgress?.('Structuring extracted data...', 0.85);
    const responseText = response.content[0].type === 'text' ? response.content[0].text : '';

    // Try to parse as JSON
    let extractedData;
    try {
      // Handle case where Claude might wrap JSON in markdown code blocks
      let jsonText = responseText;
      if (jsonText.includes('```json')) {
        jsonText = jsonText.split('```json')[1].split('```')[0].trim();
      } else if (jsonText.includes('```')) {
        jsonText = jsonText.split('```')[1].split('```')[0].trim();
      }
      extractedData = JSON.parse(jsonText);
    } catch (parseError) {
      console.error('Failed to parse extraction response:', parseError);
      return {
        data: {
          error: 'EXTRACTION_PARSE_ERROR',
          message: 'Successfully read the PDF but had trouble structuring the data. The document may have an unusual format.',
          raw_response: responseText.substring(0, 1000), // Include partial response for debugging
        },
        summary: 'Extraction parsing error',
      };
    }

    // 7. Build summary for the tool result
    const coverageTypes = [];
    if (extractedData.coverages?.general_liability?.policy_number) coverageTypes.push('GL');
    if (extractedData.coverages?.automobile_liability?.policy_number) coverageTypes.push('Auto');
    if (extractedData.coverages?.umbrella_liability?.policy_number) coverageTypes.push('Umbrella');
    if (extractedData.coverages?.workers_compensation?.policy_number) coverageTypes.push('WC');

    const summary = `Extracted policy data for ${extractedData.insured?.name || 'insured'}: ${coverageTypes.join(', ') || 'No coverages found'}`;

    return {
      data: extractedData,
      summary,
    };

  } catch (error: unknown) {
    console.error('Policy parsing error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return {
      data: {
        error: 'EXTRACTION_FAILED',
        message: `Unable to extract policy data: ${errorMessage}. The document may be damaged, password-protected, or in an unsupported format.`,
      },
      summary: 'Extraction failed',
    };
  }
}

// Type for coverage entries in COI
interface CoverageEntry {
  type: string;
  policyNumber: string;
  effectiveDate: string;
  expirationDate: string;
  limits: Record<string, string | undefined>;
}

// Helper to parse date string (MM/DD/YYYY) to Date object
function parseDate(dateStr: string): Date | null {
  if (!dateStr) return null;
  const parts = dateStr.split('/');
  if (parts.length !== 3) return null;
  const [month, day, year] = parts.map(Number);
  return new Date(year, month - 1, day);
}

// Helper to parse currency string to number
function parseCurrency(currencyStr: string): number | null {
  if (!currencyStr) return null;
  const num = parseFloat(currencyStr.replace(/[$,]/g, ''));
  return isNaN(num) ? null : num;
}

// Validate COI field values
function validateCoiFields(fieldValues: Record<string, any>): { errors: string[]; warnings: string[] } {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Required field checks
  if (!fieldValues.insured_name) {
    errors.push('Missing required field: Insured name');
  }
  if (!fieldValues.insured_address) {
    errors.push('Missing required field: Insured address');
  }
  if (!fieldValues.insurer_a_name) {
    errors.push('Missing required field: Insurer A name');
  }

  // Check that at least one coverage is provided
  const hasCoverage = fieldValues.gl_policy_number ||
    fieldValues.auto_policy_number ||
    fieldValues.umbrella_policy_number ||
    fieldValues.wc_policy_number;

  if (!hasCoverage) {
    errors.push('At least one coverage type is required');
  }

  // Certificate holder warning
  if (!fieldValues.holder_name) {
    warnings.push('No certificate holder specified - typically required for COI requests');
  }

  // Date validation for each coverage
  const coverageTypes = [
    { prefix: 'gl', name: 'General Liability' },
    { prefix: 'auto', name: 'Auto Liability' },
    { prefix: 'umbrella', name: 'Umbrella Liability' },
    { prefix: 'wc', name: 'Workers Compensation' },
  ];

  for (const coverage of coverageTypes) {
    const policyNum = fieldValues[`${coverage.prefix}_policy_number`];
    if (policyNum) {
      const effective = fieldValues[`${coverage.prefix}_effective_date`];
      const expiration = fieldValues[`${coverage.prefix}_expiration_date`];

      if (!effective) {
        errors.push(`${coverage.name}: Missing effective date`);
      }
      if (!expiration) {
        errors.push(`${coverage.name}: Missing expiration date`);
      }

      if (effective && expiration) {
        const effectiveDate = parseDate(effective);
        const expirationDate = parseDate(expiration);

        if (effectiveDate && expirationDate && expirationDate <= effectiveDate) {
          errors.push(`${coverage.name}: Expiration date must be after effective date`);
        }
      }
    }
  }

  // GL-specific limit validation
  if (fieldValues.gl_policy_number) {
    const occurrence = parseCurrency(fieldValues.gl_each_occurrence);
    const aggregate = parseCurrency(fieldValues.gl_general_aggregate);

    if (!fieldValues.gl_each_occurrence) {
      errors.push('General Liability: Missing each occurrence limit');
    }
    if (!fieldValues.gl_general_aggregate) {
      errors.push('General Liability: Missing general aggregate limit');
    }

    if (occurrence && aggregate && aggregate < occurrence) {
      warnings.push('General Liability: Aggregate limit is less than each occurrence limit - please verify');
    }
  }

  return { errors, warnings };
}

async function handleGenerateCoi(
  formType: string,
  fieldValues: Record<string, any>,
  _supabase: any,
  _userId: string,
  _conversationId: string | null
) {
  // Validate field values
  const { errors, warnings } = validateCoiFields(fieldValues);

  // If there are validation errors, return them (don't generate COI)
  if (errors.length > 0) {
    return {
      data: {
        success: false,
        validation_errors: errors,
        validation_warnings: warnings,
        message: 'Cannot generate COI due to validation errors. Please provide the missing or corrected information.',
      },
      summary: `Validation failed: ${errors.length} error(s)`,
    };
  }

  // Generate the COI content structure
  const coiContent: {
    formType: string;
    generatedAt: string;
    producer: { name: string; address: string; phone: string; email: string };
    insured: { name: string; address: string };
    insurers: Array<{ name: string; naic: string }>;
    coverages: CoverageEntry[];
    certificateHolder: { name: string; address: string };
    descriptionOfOperations: string;
  } = {
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
    ].filter(Boolean) as Array<{ name: string; naic: string }>,
    coverages: [],
    certificateHolder: {
      name: fieldValues.holder_name,
      address: fieldValues.holder_address,
    },
    descriptionOfOperations: fieldValues.description,
  };

  // Add GL coverage if present
  if (fieldValues.gl_policy_number) {
    coiContent.coverages.push({
      type: 'Commercial General Liability',
      policyNumber: fieldValues.gl_policy_number,
      effectiveDate: fieldValues.gl_effective_date,
      expirationDate: fieldValues.gl_expiration_date,
      limits: {
        'Each Occurrence': fieldValues.gl_each_occurrence,
        'General Aggregate': fieldValues.gl_general_aggregate,
        'Products-Comp/Op Agg': fieldValues.gl_products_comp_op,
        'Personal & Adv Injury': fieldValues.gl_personal_adv_injury,
        'Damage to Rented Premises': fieldValues.gl_damage_to_rented,
        'Med Exp (Any One Person)': fieldValues.gl_med_exp,
      },
    });
  }

  // Add Auto coverage if present
  if (fieldValues.auto_policy_number) {
    coiContent.coverages.push({
      type: 'Automobile Liability',
      policyNumber: fieldValues.auto_policy_number,
      effectiveDate: fieldValues.auto_effective_date,
      expirationDate: fieldValues.auto_expiration_date,
      limits: {
        'Combined Single Limit': fieldValues.auto_combined_single_limit,
      },
    });
  }

  // Add Umbrella coverage if present
  if (fieldValues.umbrella_policy_number) {
    coiContent.coverages.push({
      type: 'Umbrella Liability',
      policyNumber: fieldValues.umbrella_policy_number,
      effectiveDate: fieldValues.umbrella_effective_date,
      expirationDate: fieldValues.umbrella_expiration_date,
      limits: {
        'Each Occurrence': fieldValues.umbrella_each_occurrence,
        'Aggregate': fieldValues.umbrella_aggregate,
      },
    });
  }

  // Add Workers Comp coverage if present
  if (fieldValues.wc_policy_number) {
    coiContent.coverages.push({
      type: 'Workers Compensation',
      policyNumber: fieldValues.wc_policy_number,
      effectiveDate: fieldValues.wc_effective_date,
      expirationDate: fieldValues.wc_expiration_date,
      limits: {
        'E.L. Each Accident': fieldValues.wc_el_each_accident,
        'E.L. Disease - Ea Employee': fieldValues.wc_el_disease_employee,
        'E.L. Disease - Policy Limit': fieldValues.wc_el_disease_policy,
      },
    });
  }

  // Build the successful response with optional warnings
  const response: {
    data: typeof coiContent & { validation_warnings?: string[] };
    summary: string;
    artifact: {
      id: string;
      artifact_type: string;
      title: string;
      content: typeof coiContent;
    };
  } = {
    data: {
      ...coiContent,
      ...(warnings.length > 0 ? { validation_warnings: warnings } : {}),
    },
    summary: `Generated ${formType.replace('_', ' ')} for ${fieldValues.insured_name}${warnings.length > 0 ? ` (${warnings.length} warning${warnings.length > 1 ? 's' : ''})` : ''}`,
    artifact: {
      id: `coi-${Date.now()}`,
      artifact_type: formType.toLowerCase(),
      title: `${formType.replace('_', ' ')} - ${fieldValues.insured_name}`,
      content: coiContent,
    },
  };

  return response;
}

async function handleCreateArtifact(
  artifactType: string,
  title: string,
  content: any
) {
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
