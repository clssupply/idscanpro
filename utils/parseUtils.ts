
import { ParsedField, AAMVAFieldDefinition } from '../types';

/**
 * parseDLData(rawData: string): ParsedField[]
 *
 * rawData is the entire ANSI/AAMVA payload (multiline).
 * We split on newlines, extract fieldCode (first 3 chars) -> fieldValue (rest).
 * Then map codes to human-readable labels & apply formatters.
 */
export function parseDLData(rawData: string): ParsedField[] {
  if (!rawData) return [];

  const lines = rawData.split('\n').map((l) => l.trim()).filter(Boolean);
  const fieldMap: { [key: string]: string } = {};

  // Skip the first line in AAMVA payload (e.g. "@", "ANSI....")
  // Some AAMVA versions might not have the @\n\nANSI prefix or it might be part of the first data line.
  // A common starting character for the actual data payload is often a record separator or a compliance indicator.
  // The original logic `for (let i = 1; i < lines.length; i++)` assumes first line is header.
  // Robust parsing might need to check for specific AAMVA headers like "ANSI".
  // For now, sticking to the provided logic but acknowledging this.

  let dataStartIndex = 0;
  if (lines.length > 0 && lines[0].startsWith('@')) { // AAMVA standard header
    dataStartIndex = 1; 
    // Check for "ANSI " line if present after "@"
    if (lines.length > 1 && lines[1].startsWith("ANSI")) {
        dataStartIndex = 2;
    }
  }


  for (let i = dataStartIndex; i < lines.length; i++) {
    const line = lines[i];
    if (line.length >= 3) {
      const code = line.substring(0, 3);
      const val = line.substring(3);
      fieldMap[code] = val;
    }
  }

  const fieldDefinitions: AAMVAFieldDefinition[] = [
    { code: 'DCS', name: 'Last Name' },
    { code: 'DCT', name: 'First Name (Full)' }, // Often preferred over DAC/DAD if available
    { code: 'DAC', name: 'First Name' },
    { code: 'DAD', name: 'Middle Name' },
    { code: 'DBB', name: 'Date of Birth', formatter: formatDate_mmddyyyy },
    { code: 'DBC', name: 'Gender', formatter: formatGender },
    { code: 'DAU', name: 'Height', formatter: formatHeight },
    { code: 'DAY', name: 'Eye Color' },
    { code: 'DAG', name: 'Street Address 1' },
    { code: 'DAH', name: 'Street Address 2' },
    { code: 'DAI', name: 'City' },
    { code: 'DAJ', name: 'State' },
    { code: 'DAK', name: 'ZIP Code', formatter: formatZIP },
    { code: 'DAQ', name: 'License Number' },
    { code: 'DCF', name: 'Document Discriminator' }, // Unique ID for the document version
    { code: 'DCG', name: 'Country Identification' },
    { code: 'DDE', name: 'Last Name Truncation' },
    { code: 'DDF', name: 'First Name Truncation' },
    { code: 'DDG', name: 'Middle Name Truncation' },
    // Dates
    { code: 'DBD', name: 'Issue Date', formatter: formatDate_mmddyyyy },
    { code: 'DBA', name: 'Expiration Date', formatter: formatDate_mmddyyyy },
    { code: 'DDH', name: 'Under 18 Until', formatter: formatDate_mmddyyyy },
    { code: 'DDI', name: 'Under 19 Until', formatter: formatDate_mmddyyyy },
    { code: 'DDJ', name: 'Under 21 Until', formatter: formatDate_mmddyyyy },
    // Physical Characteristics
    { code: 'DAW', name: 'Weight (lbs)' },
    { code: 'DAZ', name: 'Hair Color' },
    // License Classification / Endorsements / Restrictions
    { code: 'DCA', name: 'Jurisdiction-specific vehicle class' },
    { code: 'DCB', name: 'Jurisdiction-specific restriction codes' },
    { code: 'DCD', name: 'Jurisdiction-specific endorsement codes' },
    { code: 'DCH', name: 'Federal Commercial Vehicle Codes' },
    // Misc
    { code: 'DAZ', name: 'Hair Color'},
    { code: 'DCK', name: 'Customer ID Number (if different from DAQ)'},
    { code: 'DBN', name: 'Full Name'},
    { code: 'DCL', name: 'Race/Ethnicity'},
    { code: 'DCR', name: 'Compliance Type'},
    { code: 'DCS', name: 'Family Name / Last Name'}, // Duplicate of DCS, but common standard
    { code: 'DCT', name: 'Given Name / First Name'}, // Duplicate of DCT
  ];

  const parsedFields: ParsedField[] = [];

  fieldDefinitions.forEach((def) => {
    if (fieldMap[def.code]) {
      let val = fieldMap[def.code];
      if (def.formatter) {
        val = def.formatter(val);
      }
      // Avoid adding duplicate fields if DCT and DAC/DAD provide same info and DCS/DBN
      const existingField = parsedFields.find(f => f.field === def.name);
      if (!existingField || existingField.value !== val) {
         if (existingField && def.name === 'First Name' && parsedFields.find(f => f.field === 'First Name (Full)')) {
            // Skip if 'First Name (Full)' already exists
         } else if (existingField && def.name === 'Last Name' && parsedFields.find(f => f.field === 'Family Name / Last Name')) {
            // Skip
         }
         else {
            parsedFields.push({ field: def.name, value: val });
         }
      }
    }
  });

  Object.keys(fieldMap).forEach((code) => {
    const known = fieldDefinitions.some((d) => d.code === code);
    if (!known) {
      parsedFields.push({ field: `Raw Code: ${code}`, value: fieldMap[code] });
    }
  });
  
  // Consolidate Name fields if individual parts exist
  const firstName = parsedFields.find(f => f.field === 'First Name')?.value;
  const lastName = parsedFields.find(f => f.field === 'Last Name')?.value;
  const middleName = parsedFields.find(f => f.field === 'Middle Name')?.value;
  const fullNameFromParts = [firstName, middleName, lastName].filter(Boolean).join(' ');

  if(fullNameFromParts && !parsedFields.some(f => f.field === 'Full Name')) {
    parsedFields.unshift({ field: 'Full Name', value: fullNameFromParts });
  }


  return parsedFields;
}

function formatDate_mmddyyyy(dateStr: string): string {
  if (!dateStr) return dateStr;
  // AAMVA format is often MMDDYYYY or CCYYMMDD. We need to check.
  // The prompt example used YYYYMMDD for input. Sticking to that.
  const cleanedDateStr = dateStr.replace(/[^0-9]/g, ""); // Remove non-numeric chars

  if (cleanedDateStr.length === 8) {
    // Try parsing as CCYYMMDD first (common in AAMVA)
    const year = cleanedDateStr.substring(0, 4);
    const month = cleanedDateStr.substring(4, 6);
    const day = cleanedDateStr.substring(6, 8);
    if (parseInt(year,10) > 1900 && parseInt(month,10) >=1 && parseInt(month,10) <=12 && parseInt(day,10) >=1 && parseInt(day,10) <=31) {
         return `${month}/${day}/${year}`;
    }
    // Try parsing as MMDDCCYY (another common AAMVA format)
    const month2 = cleanedDateStr.substring(0, 2);
    const day2 = cleanedDateStr.substring(2, 4);
    const year2 = cleanedDateStr.substring(4, 8);
     if (parseInt(year2,10) > 1900 && parseInt(month2,10) >=1 && parseInt(month2,10) <=12 && parseInt(day2,10) >=1 && parseInt(day2,10) <=31) {
         return `${month2}/${day2}/${year2}`;
    }
  }
  return dateStr; // Return original if not in expected format
}

function formatGender(code: string): string {
  switch (code) {
    case '1': return 'Male';
    case 'M': return 'Male';
    case '2': return 'Female';
    case 'F': return 'Female';
    case '0': return 'Not Specified'; // Or 'Non-binary' if AAMVA standard supports
    case '9': return 'Not Specified';
    default: return code;
  }
}

function formatHeight(htStr: string): string {
  if (!htStr || htStr.length === 0) return htStr;

  // Format: NNN (total inches) OR NNNN (first digit feet, next two inches e.g. 509 -> 5'9")
  // AAMVA standard is typically total inches. e.g. "069" is 69 inches.
  const num = parseInt(htStr, 10);
  if (!isNaN(num)) {
    if (htStr.length <= 3) { // Assume total inches if 3 digits or less (e.g., 069)
      const feet = Math.floor(num / 12);
      const inches = num % 12;
      return `${feet}'${inches}"`;
    } else if (htStr.length === 4 && htStr.endsWith('cm')) { // e.g. 175cm
        return htStr;
    } else if (htStr.length >= 3 && !isNaN(parseInt(htStr.charAt(0),10)) && htStr.includes(' ') == false) { // e.g. 509 for 5ft 9in or 600 for 6ft 0in
        const feet = parseInt(htStr.charAt(0), 10);
        const inches = parseInt(htStr.substring(1), 10);
        if (!isNaN(feet) && !isNaN(inches) && inches < 12) {
            return `${feet}'${inches}"`;
        }
    }
  }
  return htStr; // Return original if format is unexpected
}


function formatZIP(zip: string): string {
  if (!zip) return zip;
  const digits = zip.replace(/\D/g, '');
  if (digits.length === 9) {
    return `${digits.slice(0, 5)}-${digits.slice(5)}`;
  }
  if (digits.length > 5 && digits.length < 9) { // Canadian postal code M#M#M# or similar
     return zip; // Don't reformat if it's not a 5 or 9 digit US ZIP
  }
  if (digits.length === 5) {
    return digits;
  }
  return zip; // Return original if not a standard US ZIP format
}
