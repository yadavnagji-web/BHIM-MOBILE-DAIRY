import { GoogleAuthProvider, signInWithPopup, User } from 'firebase/auth';
import { auth } from '../firebase';
import { Contact, Village } from '../types';

export const GOOGLE_SHEETS_SCOPES = [
  'https://www.googleapis.com/auth/spreadsheets',
  'https://www.googleapis.com/auth/drive.file'
];

const SHEETS_CONFIG_STORAGE_KEY = 'bhim_google_sheet_config_v1';

export interface GoogleSheetConfig {
  spreadsheetId: string;
  spreadsheetUrl: string;
  sheetName: string;
  lastSyncedAt?: number;
  autoSyncEnabled?: boolean;
}

// In-memory token cache (never stored in localStorage/sessionStorage as mandated)
let cachedAccessToken: string | null = null;
let isSigningIn = false;

export function getCachedSheetToken(): string | null {
  return cachedAccessToken;
}

export function setCachedSheetToken(token: string | null): void {
  cachedAccessToken = token;
}

export function getStoredSheetConfig(): GoogleSheetConfig | null {
  try {
    const raw = localStorage.getItem(SHEETS_CONFIG_STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch (e) {
    console.warn('Error reading stored sheet config:', e);
  }
  return null;
}

export function saveStoredSheetConfig(config: GoogleSheetConfig): void {
  try {
    localStorage.setItem(SHEETS_CONFIG_STORAGE_KEY, JSON.stringify(config));
  } catch (e) {
    console.warn('Error saving stored sheet config:', e);
  }
}

export function clearStoredSheetConfig(): void {
  try {
    localStorage.removeItem(SHEETS_CONFIG_STORAGE_KEY);
  } catch (e) {
    console.warn('Error clearing stored sheet config:', e);
  }
}

/**
 * Authenticates user with Google and requests Google Sheets & Drive scopes
 */
export async function signInWithGoogleForSheets(): Promise<{ user: User; accessToken: string }> {
  try {
    isSigningIn = true;
    const provider = new GoogleAuthProvider();
    GOOGLE_SHEETS_SCOPES.forEach((scope) => provider.addScope(scope));

    const result = await signInWithPopup(auth, provider);
    const credential = GoogleAuthProvider.credentialFromResult(result);
    if (!credential?.accessToken) {
      throw new Error('Google Sheets एक्सेस टोकन प्राप्त नहीं हो सका। कृपया अनुमति दें।');
    }

    cachedAccessToken = credential.accessToken;
    return { user: result.user, accessToken: cachedAccessToken };
  } catch (error: any) {
    console.error('Google Sign-In Error:', error);
    throw error;
  } finally {
    isSigningIn = false;
  }
}

/**
 * Creates a brand new Google Sheet in the user's Google Drive formatted for Bhim Directory
 */
export async function createDirectoryGoogleSheet(
  accessToken: string,
  villages: Village[],
  contacts: Contact[]
): Promise<GoogleSheetConfig> {
  const title = `Bhim Directory - Yadav Yuva Sangathan (${new Date().toLocaleDateString('hi-IN')})`;

  const payload = {
    properties: {
      title,
      locale: 'hi_IN',
      autoRecalc: 'ON_CHANGE'
    },
    sheets: [
      {
        properties: {
          title: 'Contacts_Directory',
          gridProperties: {
            frozenRowCount: 1
          }
        },
        data: [
          {
            startRow: 0,
            startColumn: 0,
            rowData: [
              {
                values: [
                  { userEnteredValue: { stringValue: 'ID' } },
                  { userEnteredValue: { stringValue: 'Village' } },
                  { userEnteredValue: { stringValue: 'Name' } },
                  { userEnteredValue: { stringValue: 'Mobile' } },
                  { userEnteredValue: { stringValue: 'Alternate Mobile' } },
                  { userEnteredValue: { stringValue: 'Category' } },
                  { userEnteredValue: { stringValue: 'Address' } },
                  { userEnteredValue: { stringValue: 'Remark' } },
                  { userEnteredValue: { stringValue: 'Status' } },
                  { userEnteredValue: { stringValue: 'Updated At' } }
                ]
              },
              ...contacts.map((c) => ({
                values: [
                  { userEnteredValue: { stringValue: c.id } },
                  { userEnteredValue: { stringValue: c.villageName || '' } },
                  { userEnteredValue: { stringValue: c.name || '' } },
                  { userEnteredValue: { stringValue: c.mobile || '' } },
                  { userEnteredValue: { stringValue: c.alternateMobile || '' } },
                  { userEnteredValue: { stringValue: c.category || 'सामान्य' } },
                  { userEnteredValue: { stringValue: c.address || '' } },
                  { userEnteredValue: { stringValue: c.remark || '' } },
                  { userEnteredValue: { stringValue: c.status || 'approved' } },
                  { userEnteredValue: { stringValue: new Date(c.updatedAt || c.createdAt || Date.now()).toLocaleString('hi-IN') } }
                ]
              }))
            ]
          }
        ]
      },
      {
        properties: {
          title: 'Villages_List',
          gridProperties: {
            frozenRowCount: 1
          }
        },
        data: [
          {
            startRow: 0,
            startColumn: 0,
            rowData: [
              {
                values: [
                  { userEnteredValue: { stringValue: 'Village ID' } },
                  { userEnteredValue: { stringValue: 'Village Name' } }
                ]
              },
              ...villages.map((v) => ({
                values: [
                  { userEnteredValue: { stringValue: v.id } },
                  { userEnteredValue: { stringValue: v.name } }
                ]
              }))
            ]
          }
        ]
      }
    ]
  };

  const response = await fetch('https://sheets.googleapis.com/v4/spreadsheets', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(payload)
  });

  if (!response.ok) {
    const errText = await response.text();
    console.error('Google Sheets API Create Error:', errText);
    throw new Error('Google Sheet बनाने में त्रुटि। कृपया सुनिश्चित करें कि अनुमति दी गई है।');
  }

  const sheetData = await response.json();
  const spreadsheetId = sheetData.spreadsheetId;
  const spreadsheetUrl = sheetData.spreadsheetUrl || `https://docs.google.com/spreadsheets/d/${spreadsheetId}/edit`;

  const config: GoogleSheetConfig = {
    spreadsheetId,
    spreadsheetUrl,
    sheetName: 'Contacts_Directory',
    lastSyncedAt: Date.now(),
    autoSyncEnabled: true
  };

  saveStoredSheetConfig(config);
  return config;
}

/**
 * Fetches contacts and villages from an existing Google Sheet
 */
export async function fetchDirectoryFromGoogleSheet(
  accessToken: string,
  spreadsheetId: string
): Promise<{ contacts: Contact[]; villages: Village[] }> {
  // Read Contacts_Directory tab
  const range = 'Contacts_Directory!A2:J';
  const url = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodeURIComponent(range)}`;

  const response = await fetch(url, {
    headers: { Authorization: `Bearer ${accessToken}` }
  });

  if (!response.ok) {
    const err = await response.text();
    console.error('Fetch Google Sheet Error:', err);
    throw new Error('Google Sheet से डेटा पढ़ने में असमर्थ। कृपया फ़ाइल एक्सेस या शीट नाम जाँचें।');
  }

  const data = await response.json();
  const rows: string[][] = data.values || [];

  const villagesMap = new Map<string, Village>();
  const parsedContacts: Contact[] = [];

  rows.forEach((row, index) => {
    const id = row[0] || `sheet_c_${index + 1}`;
    const villageName = (row[1] || '').trim();
    const name = (row[2] || '').trim();
    const mobile = (row[3] || '').trim();
    const alternateMobile = (row[4] || '').trim();
    const category = (row[5] || 'सामान्य').trim();
    const address = (row[6] || '').trim();
    const remark = (row[7] || '').trim();
    const status = (row[8] === 'pending' || row[8] === 'rejected' ? row[8] : 'approved') as 'approved';

    if (!name || !mobile) return; // Skip invalid rows

    let villageId = villageName.toLowerCase().replace(/[^a-z0-9]/g, '_');
    if (!villageId) villageId = 'unknown_village';

    if (!villagesMap.has(villageName) && villageName) {
      villagesMap.set(villageName, {
        id: villageId,
        name: villageName,
        createdAt: Date.now()
      });
    }

    parsedContacts.push({
      id,
      villageId,
      villageName,
      name,
      mobile,
      alternateMobile,
      category,
      address,
      remark,
      status,
      createdAt: Date.now(),
      updatedAt: Date.now()
    });
  });

  return {
    contacts: parsedContacts,
    villages: Array.from(villagesMap.values())
  };
}

/**
 * Appends a new contact row directly to the linked Google Sheet
 */
export async function appendContactToGoogleSheet(
  accessToken: string,
  spreadsheetId: string,
  contact: Contact
): Promise<void> {
  const range = 'Contacts_Directory!A:J';
  const url = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodeURIComponent(range)}:append?valueInputOption=USER_ENTERED`;

  const newRow = [
    contact.id,
    contact.villageName,
    contact.name,
    contact.mobile,
    contact.alternateMobile || '',
    contact.category || 'सामान्य',
    contact.address || '',
    contact.remark || '',
    contact.status || 'approved',
    new Date(contact.updatedAt || contact.createdAt || Date.now()).toLocaleString('hi-IN')
  ];

  const res = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      values: [newRow]
    })
  });

  if (!res.ok) {
    const err = await res.text();
    console.warn('Failed to append to Google Sheet:', err);
    throw new Error('Google Sheet में संपर्क पंक्ति जोड़ने में त्रुटि।');
  }
}

/**
 * Overwrites all contacts in the linked Google Sheet with updated data
 */
export async function syncAllContactsToGoogleSheet(
  accessToken: string,
  spreadsheetId: string,
  contacts: Contact[]
): Promise<void> {
  // Clear existing values in sheet first
  const clearUrl = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/Contacts_Directory!A2:J:clear`;
  await fetch(clearUrl, {
    method: 'POST',
    headers: { Authorization: `Bearer ${accessToken}` }
  });

  // Re-write all rows
  const updateUrl = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/Contacts_Directory!A2:J?valueInputOption=USER_ENTERED`;
  const rows = contacts.map((c) => [
    c.id,
    c.villageName || '',
    c.name || '',
    c.mobile || '',
    c.alternateMobile || '',
    c.category || 'सामान्य',
    c.address || '',
    c.remark || '',
    c.status || 'approved',
    new Date(c.updatedAt || c.createdAt || Date.now()).toLocaleString('hi-IN')
  ]);

  const res = await fetch(updateUrl, {
    method: 'PUT',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      range: 'Contacts_Directory!A2:J',
      values: rows
    })
  });

  if (!res.ok) {
    const err = await res.text();
    console.error('Failed to sync to Google Sheet:', err);
    throw new Error('Google Sheet सिंक करने में त्रुटि।');
  }
}
