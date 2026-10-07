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
    `"${c.remark || 'सत्यापित'}"`
  ]);

  return '\uFEFF' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
}

/**
 * Downloads the ready-to-import CSV file for yadavnagji@gmail.com
 */
export function downloadGoogleSheetCsv(contacts: Contact[]): void {
  const csvContent = generateGoogleSheetCsv(contacts);
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
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
