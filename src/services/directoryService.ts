import { Village, Contact, CsvImportResult, ApprovalRequest } from '../types';
import { db, contactsCol, villagesCol, approvalsCol, settingsCol } from './firebaseService';
import { INITIAL_VILLAGES } from './sampleData';
import {
  getDocs,
  getDoc,
  doc,
  setDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  onSnapshot,
  query,
  where,
  orderBy,
  serverTimestamp,
  writeBatch
} from 'firebase/firestore';

export interface AppSettings {
  otpMode: 'with_otp' | 'without_otp';
  adsMasterEnabled: boolean;
  bannerAdEnabled: boolean;
  interstitialAdEnabled: boolean;
  bannerAdUnit: string;
  interstitialAdUnit: string;
  sponsorTitle?: string;
  sponsorContact?: string;
  sponsorTagline?: string;
  sponsorAdEnabled?: boolean;
  bannerImageUrl?: string;
  bannerTargetUrl?: string;
  interstitialImageUrl?: string;
  interstitialTargetUrl?: string;
  googleSheetEmail?: string;
  googleSheetName?: string;
}

const DEFAULT_SETTINGS: AppSettings = {
  otpMode: 'with_otp',
  adsMasterEnabled: true,
  bannerAdEnabled: true,
  interstitialAdEnabled: true,
  bannerAdUnit: 'ca-app-pub-6423718618240244/6735134164',
  interstitialAdUnit: 'ca-app-pub-6423718618240244/1291235796',
  sponsorTitle: 'डॉ. बी. आर. अम्बेडकर यादव युवा संगठन वागड़ चौरासी',
  sponsorContact: '9982151938',
  sponsorTagline: 'ग्राम अनुसार मोबाइल डायरेक्टरी',
  sponsorAdEnabled: true,
  bannerImageUrl: '',
  bannerTargetUrl: '',
  interstitialImageUrl: '',
  interstitialTargetUrl: '',
  googleSheetEmail: 'yadavnagji@gmail.com',
  googleSheetName: 'YADAV SAMAJ MOBILE DAIRY',
};

// -------------------------------------------------------------
// MOBILE NUMBER HELPERS
// -------------------------------------------------------------
export function normalizeIndianMobile(raw: string): string {
  if (!raw) return '';
  let cleaned = raw.replace(/\D/g, '');
  if (cleaned.length === 12 && cleaned.startsWith('91')) {
    cleaned = cleaned.slice(2);
  } else if (cleaned.length === 11 && cleaned.startsWith('0')) {
    cleaned = cleaned.slice(1);
  }
  return cleaned;
}

export function isValidIndianMobile(raw: string): boolean {
  const norm = normalizeIndianMobile(raw);
  return /^[6-9]\d{9}$/.test(norm);
}

// -------------------------------------------------------------
// REALTIME LISTENERS
// -------------------------------------------------------------
export function subscribeToRealtimeDirectory(
  onUpdate: (data: { contacts: Contact[]; villages: Village[] }) => void,
  onError?: (err: any) => void
) {
  let contacts: Contact[] = [];
  let villages: Village[] = [];

  const updateCombined = () => {
    onUpdate({ contacts, villages });
  };

  const unsubContacts = onSnapshot(
    contactsCol,
    (snapshot) => {
      contacts = snapshot.docs.map((d) => {
        const data = d.data();
        return {
          id: d.id,
          villageId: data.villageId || '',
          villageName: data.villageName || '',
          name: data.name || '',
          fatherName: data.fatherName || '',
          mobile: data.mobile || '',
          alternateMobile: data.alternateMobile || '',
          category: data.category || 'सामान्य',
          address: data.address || '',
          remark: data.remark || '',
          createdAt: typeof data.createdAt === 'number' ? data.createdAt : Date.now(),
          updatedAt: typeof data.updatedAt === 'number' ? data.updatedAt : Date.now(),
          status: data.status || 'approved',
          addedWithOtp: data.addedWithOtp ?? true,
        } as Contact;
      });
      updateCombined();
    },
    (err) => {
      console.error('Contacts listener error:', err);
      if (onError) onError(err);
    }
  );

  const unsubVillages = onSnapshot(
    villagesCol,
    (snapshot) => {
      villages = snapshot.docs.map((d) => {
        const data = d.data();
        return {
          id: d.id,
          name: data.name || '',
          createdAt: typeof data.createdAt === 'number' ? data.createdAt : Date.now(),
        } as Village;
      });
      // Sort villages alphabetically or by name
      villages.sort((a, b) => a.name.localeCompare(b.name, 'hi'));
      updateCombined();
    },
    (err) => {
      console.error('Villages listener error:', err);
      if (onError) onError(err);
    }
  );

  return () => {
    unsubContacts();
    unsubVillages();
  };
}

export function subscribeToApprovalRequests(
  onUpdate: (requests: ApprovalRequest[]) => void,
  onError?: (err: any) => void
) {
  return onSnapshot(
    approvalsCol,
    (snapshot) => {
      const requests = snapshot.docs.map((d) => {
        const data = d.data();
        return {
          id: d.id,
          type: data.type,
          status: data.status || 'pending',
          contactData: data.contactData || {},
          targetContactId: data.targetContactId,
          existingContactData: data.existingContactData,
          requesterName: data.requesterName,
          requesterPhone: data.requesterPhone,
          reason: data.reason,
          createdAt: typeof data.createdAt === 'number' ? data.createdAt : Date.now(),
        } as ApprovalRequest;
      });
      onUpdate(requests);
    },
    (err) => {
      console.error('Approvals listener error:', err);
      if (onError) onError(err);
    }
  );
}

// -------------------------------------------------------------
// INITIAL SEEDING
// -------------------------------------------------------------
export async function seedInitialDataIfEmpty(): Promise<void> {
  try {
    const docRef = doc(db, 'settings', 'global');
    const docSnap = await getDoc(docRef);
    if (docSnap.exists() && docSnap.data()?.hasBeenSeeded) {
      // Already seeded previously. Do not re-seed even if villages were deleted.
      return;
    }

    const villageSnap = await getDocs(villagesCol);
    if (villageSnap.empty) {
      console.log('Seeding initial villages into Firestore...');
      const batch = writeBatch(db);
      for (const v of INITIAL_VILLAGES) {
        const vRef = doc(villagesCol, v.id);
        batch.set(vRef, { name: v.name, createdAt: Date.now() });
      }
      batch.set(docRef, { hasBeenSeeded: true }, { merge: true });
      await batch.commit();
    } else {
      // Mark as seeded so future deletions don't trigger re-seed
      await setDoc(docRef, { hasBeenSeeded: true }, { merge: true });
    }
  } catch (err) {
    console.error('Error seeding initial data:', err);
  }
}

// -------------------------------------------------------------
// CONTACTS CRUD
// -------------------------------------------------------------
export async function getContacts(): Promise<Contact[]> {
  try {
    const snap = await getDocs(contactsCol);
    return snap.docs.map((d) => ({ id: d.id, ...d.data() } as Contact));
  } catch (err) {
    console.error('getContacts error:', err);
    return [];
  }
}

export async function createContact(
  contact: Omit<Contact, 'id' | 'createdAt' | 'updatedAt'>
): Promise<string> {
  const docRef = await addDoc(contactsCol, {
    ...contact,
    createdAt: Date.now(),
    updatedAt: Date.now(),
    status: contact.status || 'approved',
  });
  return docRef.id;
}

export async function updateContact(id: string, updates: Partial<Contact>): Promise<void> {
  const docRef = doc(db, 'contacts', id);
  await updateDoc(docRef, {
    ...updates,
    updatedAt: Date.now(),
  });
}

export async function deleteContact(id: string): Promise<void> {
  const docRef = doc(db, 'contacts', id);
  await deleteDoc(docRef);
}

// -------------------------------------------------------------
// VILLAGES CRUD
// -------------------------------------------------------------
export async function getVillages(): Promise<Village[]> {
  try {
    const snap = await getDocs(villagesCol);
    return snap.docs.map((d) => ({ id: d.id, ...d.data() } as Village));
  } catch (err) {
    console.error('getVillages error:', err);
    return [];
  }
}

export async function createVillage(name: string): Promise<Village> {
  const cleanName = name.trim();
  const docRef = await addDoc(villagesCol, {
    name: cleanName,
    createdAt: Date.now(),
  });
  return { id: docRef.id, name: cleanName, createdAt: Date.now() };
}

export async function updateVillage(id: string, name: string): Promise<void> {
  const cleanName = name.trim();
  const docRef = doc(db, 'villages', id);
  await updateDoc(docRef, { name: cleanName });

  // Update associated contacts' villageName
  const q = query(contactsCol, where('villageId', '==', id));
  const snap = await getDocs(q);
  const batch = writeBatch(db);
  snap.docs.forEach((d) => {
    batch.update(doc(db, 'contacts', d.id), { villageName: cleanName });
  });
  await batch.commit();
}

export async function deleteVillage(id: string): Promise<void> {
  const batch = writeBatch(db);
  
  // 1. Delete village doc
  const villageRef = doc(db, 'villages', id);
  batch.delete(villageRef);

  // 2. Delete associated contacts belonging to this village
  const q = query(contactsCol, where('villageId', '==', id));
  const snap = await getDocs(q);
  snap.docs.forEach((d) => {
    batch.delete(doc(db, 'contacts', d.id));
  });

  await batch.commit();
}

export async function getVillageContactsCount(villageId: string): Promise<number> {
  try {
    const q = query(contactsCol, where('villageId', '==', villageId));
    const snap = await getDocs(q);
    return snap.size;
  } catch {
    return 0;
  }
}

// -------------------------------------------------------------
// APPROVAL REQUESTS
// -------------------------------------------------------------
export async function submitApprovalRequest(
  request: Omit<ApprovalRequest, 'id' | 'createdAt' | 'status'>
): Promise<string> {
  const docRef = await addDoc(approvalsCol, {
    ...request,
    createdAt: Date.now(),
    status: 'pending',
  });
  return docRef.id;
}

export async function approveRequest(req: ApprovalRequest): Promise<void> {
  if (req.type === 'new_contact' && req.contactData) {
    await createContact({
      ...req.contactData,
      status: 'approved',
    });
  } else if (req.type === 'delete_contact' && req.targetContactId) {
    await deleteContact(req.targetContactId);
  } else if (req.type === 'edit_contact' && req.targetContactId && req.contactData) {
    await updateContact(req.targetContactId, req.contactData);
  }

  // Delete from approvals
  const docRef = doc(db, 'approvals', req.id);
  await deleteDoc(docRef);
}

export async function rejectRequest(reqId: string, _reason?: string): Promise<void> {
  const docRef = doc(db, 'approvals', reqId);
  await deleteDoc(docRef);
}

export async function approveAllPendingRequests(): Promise<number> {
  const snap = await getDocs(approvalsCol);
  let count = 0;
  for (const d of snap.docs) {
    const req = { id: d.id, ...d.data() } as ApprovalRequest;
    await approveRequest(req);
    count++;
  }
  return count;
}

export async function bulkVerifyBinaOtpContacts(): Promise<number> {
  const snap = await getDocs(contactsCol);
  const batch = writeBatch(db);
  let count = 0;
  snap.docs.forEach((d) => {
    const data = d.data();
    if (data.addedWithOtp === false || !data.remark?.includes('WhatsApp')) {
      count++;
      batch.update(doc(db, 'contacts', d.id), {
        addedWithOtp: true,
        remark: 'WhatsApp Verified (एडमिन सत्यापित)',
        updatedAt: Date.now(),
      });
    }
  });
  await batch.commit();
  return count;
}

// -------------------------------------------------------------
// APP SETTINGS
// -------------------------------------------------------------
export async function getAppSettings(): Promise<AppSettings> {
  try {
    const docRef = doc(db, 'settings', 'global');
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      return { ...DEFAULT_SETTINGS, ...docSnap.data() } as AppSettings;
    }
  } catch (err) {
    console.error('getAppSettings error:', err);
  }
  return DEFAULT_SETTINGS;
}

export function getLocalCachedSettings(): AppSettings {
  return DEFAULT_SETTINGS;
}

export async function updateAppSettings(settings: Partial<AppSettings>): Promise<AppSettings> {
  const docRef = doc(db, 'settings', 'global');
  await setDoc(docRef, settings, { merge: true });
  return getAppSettings();
}

// -------------------------------------------------------------
// CSV IMPORT / EXPORT HELPERS
// -------------------------------------------------------------
export function exportContactsToCsv(contacts: Contact[]): string {
  const headers = ['नाम', 'पिता का नाम', 'गाँव', 'मोबाइल नंबर', 'वैकल्पिक नंबर', 'व्यवसाय', 'पता', 'टिप्पणी'];
  const rows = contacts.map((c) => [
    `"${(c.name || '').replace(/"/g, '""')}"`,
    `"${(c.fatherName || '').replace(/"/g, '""')}"`,
    `"${(c.villageName || '').replace(/"/g, '""')}"`,
    `"${c.mobile || ''}"`,
    `"${c.alternateMobile || ''}"`,
    `"${(c.category || '').replace(/"/g, '""')}"`,
    `"${(c.address || '').replace(/"/g, '""')}"`,
    `"${(c.remark || 'सत्यापित').replace(/"/g, '""')}"`,
  ]);
  return '\uFEFF' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
}

export async function importContactsFromCsv(
  csvText: string,
  villages: Village[]
): Promise<CsvImportResult> {
  const lines = csvText.split(/\r?\n/).filter((l) => l.trim().length > 0);
  let successCount = 0;
  const failedRows: { rowNumber: number; reason: string; data: Partial<Contact> }[] = [];

  for (let i = 1; i < lines.length; i++) {
    const parts = lines[i].split(',').map((p) => p.replace(/^"|"$/g, '').trim());
    if (parts.length >= 4) {
      const [name, fatherName, villageName, mobile] = parts;
      const cleanMob = normalizeIndianMobile(mobile);
      if (cleanMob && isValidIndianMobile(cleanMob)) {
        const foundV = villages.find(
          (v) => v.name.toLowerCase().includes(villageName.toLowerCase()) || villageName.toLowerCase().includes(v.name.toLowerCase())
        );
        await createContact({
          name,
          fatherName: fatherName || '',
          villageId: foundV ? foundV.id : (villages[0]?.id || 'sakodara'),
          villageName: foundV ? foundV.name : (villageName || 'सकोदरा'),
          mobile: cleanMob,
          category: parts[5] || 'सामान्य',
          status: 'approved',
          addedWithOtp: true,
          remark: 'CSV/Google Sheet आयातित',
        });
        successCount++;
      } else {
        failedRows.push({
          rowNumber: i + 1,
          reason: `अमान्य मोबाइल नंबर (${mobile})`,
          data: { name, mobile },
        });
      }
    }
  }

  const total = lines.length > 1 ? lines.length - 1 : 0;
  return {
    total,
    successCount,
    failedCount: failedRows.length,
    failedRows,
  };
}
