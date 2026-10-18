import fs from 'node:fs';

export function parseCSV(filePath: string): Record<string, string>[] {
  if (!fs.existsSync(filePath)) {
    console.warn(`CSV file not found: ${filePath}`);
    return [];
  }

  const content = fs.readFileSync(filePath, 'utf-8').replace(/^\uFEFF/, ''); // remove BOM
  const lines: string[] = [];
  let currentLine = '';
  let inQuotes = false;

  for (let i = 0; i < content.length; i++) {
    const char = content[i];
    if (char === '"') {
      inQuotes = !inQuotes;
      currentLine += char;
    } else if ((char === '\r' || char === '\n') && !inQuotes) {
      if (char === '\r' && content[i + 1] === '\n') i++;
      if (currentLine.trim()) lines.push(currentLine);
      currentLine = '';
    } else {
      currentLine += char;
    }
  }
  if (currentLine.trim()) lines.push(currentLine);

  if (lines.length === 0) return [];

  const splitCSVLine = (line: string): string[] => {
    const values: string[] = [];
    let current = '';
    let insideQuotes = false;

    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      if (char === '"') {
        if (insideQuotes && line[i + 1] === '"') {
          current += '"';
          i++;
        } else {
          insideQuotes = !insideQuotes;
        }
      } else if (char === ',' && !insideQuotes) {
        values.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }
    values.push(current.trim());
    return values;
  };

  const headers = splitCSVLine(lines[0]).map(h => h.trim().replace(/^"|"$/g, ''));
  const results: Record<string, string>[] = [];

  for (let j = 1; j < lines.length; j++) {
    const values = splitCSVLine(lines[j]);
    if (values.length === 0 || (values.length === 1 && values[0] === '')) continue;
    const row: Record<string, string> = {};
    for (let k = 0; k < headers.length; k++) {
      let val = values[k] !== undefined ? values[k] : '';
      if (val.startsWith('"') && val.endsWith('"')) {
        val = val.slice(1, -1);
      }
      row[headers[k]] = val;
    }
    results.push(row);
  }

  return results;
}
