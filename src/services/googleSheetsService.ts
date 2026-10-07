import { Contact, Village } from '../types';

export const TARGET_GOOGLE_ACCOUNT = 'yadavnagji@gmail.com';
export const DEFAULT_SHEET_TITLE = 'YADAV SAMAJ MOBILE DAIRY';

const SHEETS_CONFIG_STORAGE_KEY = 'yadav_google_sheet_config_v3';

export interface GoogleSheetConfig {
  spreadsheetId: string;
  spreadsheetUrl: string;
  sheetName: string;
  accountEmail: string;
  lastSyncedAt?: number;
  autoSyncEnabled?: boolean;
}

export function getStoredSheetConfig(): GoogleSheetConfig {
  try {
    const raw = localStorage.getItem(SHEETS_CONFIG_STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  return {
    spreadsheetId: '',
    spreadsheetUrl: '',
    sheetName: DEFAULT_SHEET_TITLE,
    accountEmail: TARGET_GOOGLE_ACCOUNT,
    autoSyncEnabled: false,
  };
}

export function saveStoredSheetConfig(config: GoogleSheetConfig): void {
  try {
    localStorage.setItem(SHEETS_CONFIG_STORAGE_KEY, JSON.stringify(config));
  } catch {}
}

export function clearStoredSheetConfig(): void {
  try {
    localStorage.removeItem(SHEETS_CONFIG_STORAGE_KEY);
  } catch {}
}

export function getGoogleSheetCreateUrl(
  email: string = TARGET_GOOGLE_ACCOUNT,
  title: string = DEFAULT_SHEET_TITLE
): string {
  return `https://docs.google.com/spreadsheets/create?title=${encodeURIComponent(title)}&authuser=${encodeURIComponent(email)}`;
}

export function getGoogleSheetPortalUrl(email: string = TARGET_GOOGLE_ACCOUNT): string {
  return `https://docs.google.com/spreadsheets/u/${encodeURIComponent(email)}/`;
}

export function getGoogleDriveUrl(email: string = TARGET_GOOGLE_ACCOUNT): string {
  return `https://drive.google.com/drive/u/0/my-drive?authuser=${encodeURIComponent(email)}`;
}

/**
 * Creates tab-separated values (TSV) for direct Ctrl+V copy-paste into Google Sheets
 */
export function generateGoogleSheetTsv(contacts: Contact[]): string {
  const headers = [
    'क्र.सं.',
    'नाम',
    'पिता का नाम',
    'गाँव',
    'मोबाइल नंबर',
    'वैकल्पिक नंबर',
    'व्यवसाय / श्रेणी',
    'पता / मोहल्ला',
    'टिप्पणी / स्थिति'
  ];

  const rows = contacts.map((c, i) => [
    i + 1,
    (c.name || '').replace(/[\t\n\r]/g, ' '),
    (c.fatherName || '').replace(/[\t\n\r]/g, ' '),
    (c.villageName || '').replace(/[\t\n\r]/g, ' '),
    c.mobile || '',
    c.alternateMobile || '',
    (c.category || '').replace(/[\t\n\r]/g, ' '),
    (c.address || '').replace(/[\t\n\r]/g, ' '),
    (c.remark || 'सत्यापित').replace(/[\t\n\r]/g, ' ')
  ]);

  return [headers.join('\t'), ...rows.map((r) => r.join('\t'))].join('\n');
}

/**
 * Creates formatted CSV data for direct import into Google Sheets
 */
export function generateGoogleSheetCsv(contacts: Contact[]): string {
  const headers = [
    'क्र.सं. (S.No.)',
    'नाम (Name)',
    'पिता का नाम (Father Name)',
    'गाँव (Village)',
    'मोबाइल नंबर (Mobile)',
    'वैकल्पिक नंबर (Alt Mobile)',
    'व्यवसाय (Category)',
    'पता / मोहल्ला (Address)',
    'टिप्पणी / स्थिति (Status)'
  ];

  const rows = contacts.map((c, i) => [
    i + 1,
    `"${(c.name || '').replace(/"/g, '""')}"`,
    `"${(c.fatherName || '').replace(/"/g, '""')}"`,
    `"${(c.villageName || '').replace(/"/g, '""')}"`,
    `"${c.mobile || ''}"`,
    `"${c.alternateMobile || ''}"`,
    `"${(c.category || '').replace(/"/g, '""')}"`,
    `"${(c.address || '').replace(/"/g, '""')}"`,
    `"${(c.remark || 'सत्यापित').replace(/"/g, '""')}"`
  ]);

  // Return clean RFC 4180 CSV with CRLF line breaks (BOM added during Blob download)
  return [headers.join(','), ...rows.map((r) => r.join(','))].join('\r\n');
}

/**
 * Downloads the ready-to-import CSV file with UTF-8 BOM so Hindi/Devanagari text displays properly in Excel & Sheets
 */
export function downloadGoogleSheetCsv(contacts: Contact[]): void {
  const csvContent = generateGoogleSheetCsv(contacts);
  // Add single UTF-8 BOM (0xEF, 0xBB, 0xBF) so Excel & Sheets open Hindi/Devanagari text accurately
  const blob = new Blob([new Uint8Array([0xef, 0xbb, 0xbf]), csvContent], {
    type: 'text/csv;charset=utf-8;'
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `YADAV_SAMAJ_MOBILE_DAIRY_${new Date().toISOString().split('T')[0]}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Creates HTML Excel formatted table with UTF-8 encoding for direct MS Excel opening without language issues
 */
export function generateExcelHtmlTable(contacts: Contact[]): string {
  const escapeHtml = (str: string | undefined | null) =>
    (str || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');

  const rows = contacts
    .map(
      (c, i) => `
    <tr>
      <td style="text-align: center; mso-number-format:'\\@';">${i + 1}</td>
      <td style="font-weight: 600; mso-number-format:'\\@';">${escapeHtml(c.name)}</td>
      <td style="mso-number-format:'\\@';">${escapeHtml(c.fatherName)}</td>
      <td style="mso-number-format:'\\@';">${escapeHtml(c.villageName)}</td>
      <td style="mso-number-format:'\\@'; color: #0284c7; font-weight: 600;">${escapeHtml(c.mobile)}</td>
      <td style="mso-number-format:'\\@';">${escapeHtml(c.alternateMobile)}</td>
      <td style="mso-number-format:'\\@';">${escapeHtml(c.category)}</td>
      <td style="mso-number-format:'\\@';">${escapeHtml(c.address)}</td>
      <td style="mso-number-format:'\\@';">${escapeHtml(c.remark || 'सत्यापित')}</td>
    </tr>`
    )
    .join('');

  return `<!DOCTYPE html>
<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
<head>
  <meta http-equiv="Content-Type" content="text/html; charset=UTF-8">
  <!--[if gte mso 9]>
  <xml>
    <x:ExcelWorkbook>
      <x:ExcelWorksheets>
        <x:ExcelWorksheet>
          <x:Name>यादव समाज डायरेक्टरी</x:Name>
          <x:WorksheetOptions>
            <x:DisplayGridlines/>
          </x:WorksheetOptions>
        </x:ExcelWorksheet>
      </x:ExcelWorksheets>
    </x:ExcelWorkbook>
  </xml>
  <![endif]-->
  <style>
    body { font-family: 'Segoe UI', Nirmala UI, Mangal, Arial, sans-serif; }
    table { border-collapse: collapse; width: 100%; }
    th { background-color: #1e3a8a; color: #ffffff; font-weight: bold; padding: 10px; border: 1px solid #94a3b8; text-align: left; }
    td { padding: 8px 10px; border: 1px solid #cbd5e1; font-size: 13px; mso-number-format:"\\@"; }
    tr:nth-child(even) td { background-color: #f8fafc; }
  </style>
</head>
<body>
  <h2>यादव समाज मोबाइल डायरी (YADAV SAMAJ MOBILE DAIRY)</h2>
  <p>कुल संपर्क: ${contacts.length} | दिनांक: ${new Date().toLocaleDateString('hi-IN')}</p>
  <table>
    <thead>
      <tr>
        <th>क्र.सं. (S.No.)</th>
        <th>नाम (Name)</th>
        <th>पिता/पति का नाम (Father Name)</th>
        <th>गाँव (Village)</th>
        <th>मोबाइल नंबर (Mobile)</th>
        <th>वैकल्पिक नंबर (Alt Mobile)</th>
        <th>व्यवसाय (Category)</th>
        <th>पता / मोहल्ला (Address)</th>
        <th>टिप्पणी / स्थिति (Status)</th>
      </tr>
    </thead>
    <tbody>
      ${rows}
    </tbody>
  </table>
</body>
</html>`;
}

/**
 * Downloads directly as an Excel (.xls) file with UTF-8 encoding and clean Hindi/Devanagari rendering
 */
export function downloadExcelSpreadsheet(contacts: Contact[]): void {
  const htmlTable = generateExcelHtmlTable(contacts);
  const blob = new Blob([new Uint8Array([0xef, 0xbb, 0xbf]), htmlTable], {
    type: 'application/vnd.ms-excel;charset=utf-8;'
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `YADAV_SAMAJ_MOBILE_DAIRY_${new Date().toISOString().split('T')[0]}.xls`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Updates Google Sheet directly via API
 */
export async function updateGoogleSheet(contacts: Contact[], accessToken: string, spreadsheetId: string): Promise<void> {
  const values = [
    ['क्र.सं.', 'नाम', 'पिता का नाम', 'गाँव', 'मोबाइल नंबर', 'वैकल्पिक नंबर', 'व्यवसाय / श्रेणी', 'पता / मोहल्ला', 'टिप्पणी'],
    ...contacts.map((c, i) => [
      i + 1,
      c.name || '',
      c.fatherName || '',
      c.villageName || '',
      c.mobile || '',
      c.alternateMobile || '',
      c.category || '',
      c.address || '',
      c.remark || 'सत्यापित'
    ])
  ];

  const response = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/A1:I${values.length}?valueInputOption=RAW`, {
    method: 'PUT',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ values })
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error?.message || 'Google Sheet सिंक विफल रहा। कृपया अनुमति या ID जांचें।');
  }
}
