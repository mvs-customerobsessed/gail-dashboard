/**
 * PDF Field Discovery Utility
 *
 * Run this script to discover all form fields in an ACORD PDF template.
 * This helps build the field mapping schema for each form type.
 *
 * Usage:
 *   npx tsx scripts/discover-pdf-fields.ts <path-to-pdf>
 *
 * Example:
 *   npx tsx scripts/discover-pdf-fields.ts ./templates/acord-25.pdf
 *
 * Prerequisites:
 *   npm install pdf-lib
 */

import { PDFDocument } from 'pdf-lib';
import * as fs from 'fs/promises';
import * as path from 'path';

interface FieldInfo {
  name: string;
  type: string;
  isReadOnly: boolean;
  isRequired: boolean;
  options?: string[]; // For dropdown/radio fields
  maxLength?: number; // For text fields
}

async function discoverFieldNames(pdfPath: string): Promise<FieldInfo[]> {
  const absolutePath = path.resolve(pdfPath);
  console.log(`\nReading PDF: ${absolutePath}\n`);

  const fileBuffer = await fs.readFile(absolutePath);
  const pdfDoc = await PDFDocument.load(fileBuffer);
  const form = pdfDoc.getForm();

  const fields: FieldInfo[] = [];
  const allFields = form.getFields();

  console.log(`Found ${allFields.length} fields:\n`);
  console.log('='.repeat(80));

  for (const field of allFields) {
    const fieldName = field.getName();
    const fieldType = field.constructor.name;

    const fieldInfo: FieldInfo = {
      name: fieldName,
      type: fieldType,
      isReadOnly: field.isReadOnly(),
      isRequired: false, // pdf-lib doesn't expose this directly
    };

    // Get additional info based on field type
    try {
      if (fieldType === 'PDFTextField') {
        const textField = form.getTextField(fieldName);
        fieldInfo.maxLength = textField.getMaxLength();
      } else if (fieldType === 'PDFDropdown') {
        const dropdown = form.getDropdown(fieldName);
        fieldInfo.options = dropdown.getOptions();
      } else if (fieldType === 'PDFRadioGroup') {
        const radioGroup = form.getRadioGroup(fieldName);
        fieldInfo.options = radioGroup.getOptions();
      }
    } catch (e) {
      // Some fields may not support these operations
    }

    fields.push(fieldInfo);

    // Print field info
    let extraInfo = '';
    if (fieldInfo.options?.length) {
      extraInfo = ` [options: ${fieldInfo.options.slice(0, 3).join(', ')}${fieldInfo.options.length > 3 ? '...' : ''}]`;
    }
    if (fieldInfo.maxLength) {
      extraInfo += ` [maxLength: ${fieldInfo.maxLength}]`;
    }
    if (fieldInfo.isReadOnly) {
      extraInfo += ' [readonly]';
    }

    console.log(`${fieldType.padEnd(20)} | ${fieldName}${extraInfo}`);
  }

  console.log('='.repeat(80));
  console.log(`\nTotal: ${fields.length} fields`);

  return fields;
}

async function generateFieldSchema(fields: FieldInfo[]): Promise<Record<string, any>> {
  const schema: Record<string, any> = {};

  // Group fields by prefix (e.g., "GL_", "AUTO_", "WC_")
  const prefixGroups: Record<string, FieldInfo[]> = {};

  for (const field of fields) {
    const parts = field.name.split('_');
    const prefix = parts.length > 1 ? parts[0] : 'other';

    if (!prefixGroups[prefix]) {
      prefixGroups[prefix] = [];
    }
    prefixGroups[prefix].push(field);
  }

  // Build schema sections
  for (const [prefix, groupFields] of Object.entries(prefixGroups)) {
    schema[prefix.toLowerCase()] = {
      label: formatLabel(prefix),
      fields: groupFields.map(f => ({
        id: f.name.toLowerCase().replace(/\s+/g, '_'),
        fieldName: f.name,
        type: mapFieldType(f.type),
        required: !f.isReadOnly,
        ...(f.maxLength && { maxLength: f.maxLength }),
        ...(f.options && { options: f.options }),
      })),
    };
  }

  return schema;
}

function formatLabel(prefix: string): string {
  const labels: Record<string, string> = {
    GL: 'General Liability',
    AUTO: 'Automobile Liability',
    WC: 'Workers Compensation',
    UMB: 'Umbrella Liability',
    PRODUCER: 'Producer',
    INSURED: 'Insured',
    INSURER: 'Insurers',
    CERT: 'Certificate Holder',
    DESC: 'Description of Operations',
  };
  return labels[prefix] || prefix;
}

function mapFieldType(pdfType: string): string {
  const typeMap: Record<string, string> = {
    PDFTextField: 'text',
    PDFCheckBox: 'checkbox',
    PDFDropdown: 'select',
    PDFRadioGroup: 'radio',
    PDFButton: 'button',
    PDFSignature: 'signature',
  };
  return typeMap[pdfType] || 'text';
}

async function main() {
  const args = process.argv.slice(2);

  if (args.length === 0) {
    console.log(`
PDF Field Discovery Utility

Usage:
  npx tsx scripts/discover-pdf-fields.ts <path-to-pdf> [--schema]

Options:
  --schema    Also output a JSON schema file for the fields

Examples:
  npx tsx scripts/discover-pdf-fields.ts ./templates/acord-25.pdf
  npx tsx scripts/discover-pdf-fields.ts ./templates/acord-25.pdf --schema
`);
    process.exit(1);
  }

  const pdfPath = args[0];
  const generateSchema = args.includes('--schema');

  try {
    const fields = await discoverFieldNames(pdfPath);

    if (generateSchema) {
      const schema = await generateFieldSchema(fields);
      const schemaPath = pdfPath.replace('.pdf', '-field-schema.json');
      await fs.writeFile(schemaPath, JSON.stringify(schema, null, 2));
      console.log(`\nSchema written to: ${schemaPath}`);
    }
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
      console.error(`\nError: File not found: ${pdfPath}`);
    } else {
      console.error('\nError:', error);
    }
    process.exit(1);
  }
}

main();
