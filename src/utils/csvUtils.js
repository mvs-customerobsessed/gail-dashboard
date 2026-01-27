/**
 * CSV Import/Export utilities for operational metrics
 */

/**
 * Export data to CSV file and trigger download
 * @param {Object[]} data - Array of row objects
 * @param {Object[]} columns - Column definitions [{id, label}]
 * @param {string} filename - Name for downloaded file
 */
export function exportToCsv(data, columns, filename) {
  // Build header row
  const headers = columns.map(c => c.label).join(',');

  // Build data rows
  const rows = data.map(row =>
    columns.map(c => {
      const value = row[c.id];
      // Handle values that might contain commas
      if (typeof value === 'string' && value.includes(',')) {
        return `"${value}"`;
      }
      return value ?? '';
    }).join(',')
  );

  const csv = [headers, ...rows].join('\n');

  // Create blob and download
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.style.display = 'none';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Parse CSV file into array of objects
 * @param {File} file - File object from input
 * @param {Object[]} columns - Column definitions [{id, label}]
 * @returns {Promise<Object[]>} Parsed data rows
 */
export function parseCsv(file, columns) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const text = e.target.result;
        const lines = text.split('\n').filter(line => line.trim());

        if (lines.length < 2) {
          resolve([]);
          return;
        }

        // Parse headers
        const headers = parseCSVLine(lines[0]);

        // Map headers to column IDs
        const headerToId = {};
        headers.forEach((header, idx) => {
          const col = columns.find(c =>
            c.label.toLowerCase() === header.toLowerCase().trim()
          );
          if (col) {
            headerToId[idx] = col.id;
          }
        });

        // Parse data rows
        const data = lines.slice(1).map(line => {
          const values = parseCSVLine(line);
          const row = {};

          values.forEach((value, idx) => {
            const colId = headerToId[idx];
            if (colId) {
              // Try to parse as number
              const numValue = parseFloat(value);
              row[colId] = isNaN(numValue) ? value : numValue;
            }
          });

          return row;
        }).filter(row => Object.keys(row).length > 0);

        resolve(data);
      } catch (err) {
        reject(err);
      }
    };

    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsText(file);
  });
}

/**
 * Parse a single CSV line, handling quoted values
 * @param {string} line - CSV line
 * @returns {string[]} Array of values
 */
function parseCSVLine(line) {
  const values = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];

    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === ',' && !inQuotes) {
      values.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }

  values.push(current.trim());
  return values;
}

/**
 * Format a date as month/year string (e.g., "January 2026")
 * @param {string} dateStr - ISO date string (YYYY-MM-DD)
 * @returns {string} Formatted date
 */
export function formatMonthYear(dateStr) {
  if (!dateStr) return '';
  // Parse as local date to avoid timezone shift
  // Adding T12:00:00 ensures we're in the middle of the day to avoid date boundary issues
  const date = new Date(dateStr + 'T12:00:00');
  return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
}

/**
 * Format a date as short month/year (e.g., "Jan 26")
 * @param {string} dateStr - ISO date string (YYYY-MM-DD)
 * @returns {string} Formatted date
 */
export function formatShortMonthYear(dateStr) {
  if (!dateStr) return '';
  // Parse as local date to avoid timezone shift
  const date = new Date(dateStr + 'T12:00:00');
  return date.toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
}

/**
 * Get all months for a given year as period start dates
 * @param {number} year - Year
 * @returns {string[]} Array of YYYY-MM-DD date strings
 */
export function getMonthsForYear(year) {
  const months = [];
  for (let month = 0; month < 12; month++) {
    // Use local date formatting to avoid timezone shift
    // toISOString() converts to UTC which can shift dates across timezone boundaries
    const y = year;
    const m = String(month + 1).padStart(2, '0');
    months.push(`${y}-${m}-01`);
  }
  return months;
}
