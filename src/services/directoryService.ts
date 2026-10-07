import { Village, Contact, CsvImportResult, ApprovalRequest } from '../types';
import {
  db,
  rtdb,
  RTDB_URL,
  contactsCol,
  villagesCol,
  approvalsCol,
  settingsCol,
  rtdbContactsRef,
  rtdbVillagesRef,
  rtdbApprovalsRef,
  rtdbSettingsRef,
} from './firebaseService';
import { INITIAL_VILLAGES } from './sampleData';
import {
  getDocs,
  getDoc,
  doc,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  writeBatch
} from 'firebase/firestore';
import {
  ref,
  set,
  get,
  update,
  remove,
  onValue
} from 'firebase/database';

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
  hasBeenSeeded?: boolean;
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
  hasBeenSeeded: true
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
// REALTIME LISTENERS (FIREBASE REALTIME DATABASE)
// -------------------------------------------------------------
export function subscribeToRealtimeDirectory(
  onUpdate: (data: { contacts: Contact[]; villages: Village[] }) => void,
  onError?: (err: any) => void
) {
  let contacts: Contact[] = [];
  let villages: Village[] = [];
  let lastStateKey = '';

  const updateCombined = () => {
    // Only invoke callback when data actually changes (prevent unnecessary re-renders)
    const stateKey = `${contacts.length}_${villages.length}_${contacts[0]?.id || ''}_${contacts[contacts.length - 1]?.id || ''}`;
    if (stateKey !== lastStateKey) {
      lastStateKey = stateKey;
      onUpdate({ contacts, villages });
    }
  };

  // Immediate REST sync from Realtime Database for instant zero-delay data load on mount
  const syncFromRest = async () => {
    try {
      const res = await fetch(`${RTDB_URL}/.json`);
      if (res.ok) {
        const root = await res.json();
        if (root) {
          if (root.contacts) {
            contacts = Object.keys(root.contacts).map((k) => ({
              ...root.contacts[k],
              id: root.contacts[k].id || k,
            }));
          } else {
            contacts = [];
          }

          if (root.villages) {
            villages = Object.keys(root.villages).map((k) => ({
              ...root.villages[k],
              id: root.villages[k].id || k,
            }));
            villages.sort((a, b) => (a.name || '').localeCompare(b.name || '', 'hi'));
          } else {
            villages = [];
          }
          updateCombined();
        }
      }
    } catch {
      // transient network note
    }
  };

  // Initial immediate fetch
  syncFromRest();

  // Gentle background poll (every 30 seconds) as a fallback without thrashing UI
  const pollTimer = setInterval(syncFromRest, 30000);

  // Native Firebase SDK WebSocket listener (Instant Live Realtime Updates)
  const unsubContacts = onValue(
    rtdbContactsRef,
    (snapshot) => {
      const val = snapshot.val();
      if (val) {
        contacts = Object.keys(val).map((k) => ({
          ...val[k],
          id: val[k].id || k,
        }));
      } else {
        contacts = [];
      }
      updateCombined();
    },
    (err) => {
      console.warn('RTDB Contacts listener notice:', err);
      if (onError) onError(err);
    }
  );

  // Native Firebase SDK WebSocket listener for villages
  const unsubVillages = onValue(
    rtdbVillagesRef,
    (snapshot) => {
      const val = snapshot.val();
      if (val) {
        villages = Object.keys(val).map((k) => ({
          ...val[k],
          id: val[k].id || k,
        }));
      } else {
        villages = [];
      }
      villages.sort((a, b) => (a.name || '').localeCompare(b.name || '', 'hi'));
      updateCombined();
    },
    (err) => {
      console.warn('RTDB Villages listener notice:', err);
      if (onError) onError(err);
    }
  );

  return () => {
    clearInterval(pollTimer);
    unsubContacts();
    unsubVillages();
  };
}

export function subscribeToApprovalRequests(
  onUpdate: (requests: ApprovalRequest[]) => void,
  onError?: (err: any) => void
) {
  const syncApprovalsRest = async () => {
    try {
      const res = await fetch(`${RTDB_URL}/approvals.json`);
      if (res.ok) {
        const val = await res.json();
        if (val) {
          const list = Object.keys(val).map((k) => ({
            ...val[k],
            id: val[k].id || k,
          })) as ApprovalRequest[];
          onUpdate(list);
        } else {
          onUpdate([]);
        }
      }
    } catch {}
  };

  syncApprovalsRest();
  const pollTimer = setInterval(syncApprovalsRest, 3000);

  const unsub = onValue(
    rtdbApprovalsRef,
    (snapshot) => {
      const val = snapshot.val();
      if (val) {
        const requests = Object.keys(val).map((k) => ({
          ...val[k],
          id: val[k].id || k,
        })) as ApprovalRequest[];
        onUpdate(requests);
      } else {
        onUpdate([]);
      }
    },
    (err) => {
      console.warn('Approvals listener note:', err);
      if (onError) onError(err);
    }
  );

  return () => {
    clearInterval(pollTimer);
    unsub();
  };
}

// -------------------------------------------------------------
// INITIAL SEEDING
// -------------------------------------------------------------
export async function seedInitialDataIfEmpty(): Promise<void> {
  try {
    // Check if initial seeding was already completed in history
    const seededSnap = await get(ref(rtdb, 'settings/hasBeenSeeded'));
    if (seededSnap.exists() && seededSnap.val() === true) {
      // Already seeded previously! Do NOT re-seed even if all villages were deleted.
      return;
    }

    const snap = await get(rtdbVillagesRef);
    if (!snap.exists() || Object.keys(snap.val() || {}).length === 0) {
      const villagesObj: Record<string, any> = {};
      for (const v of INITIAL_VILLAGES) {
        villagesObj[v.id] = { id: v.id, name: v.name, createdAt: Date.now() };
      }
      await set(rtdbVillagesRef, villagesObj);
      await set(ref(rtdb, 'settings/hasBeenSeeded'), true);
    } else {
      await set(ref(rtdb, 'settings/hasBeenSeeded'), true);
    }
  } catch (err) {
    console.error('Error seeding initial data:', err);
  }
}

export async function bulkDeleteVillages(villageIds?: string[]): Promise<number> {
  // Mark as seeded so initial villages are never auto-re-added on page reload
  await set(ref(rtdb, 'settings/hasBeenSeeded'), true);

  const villagesSnap = await get(rtdbVillagesRef);
  const allVillages = villagesSnap.val() || {};
  const targetIds = villageIds && villageIds.length > 0 ? villageIds : Object.keys(allVillages);

  if (targetIds.length === 0) return 0;

  // 1. Remove from Firebase Realtime Database
  const updates: Record<string, any> = {};
  for (const vId of targetIds) {
    updates[`villages/${vId}`] = null;
  }

  // Also remove contacts belonging to these villages
  const contactsSnap = await get(rtdbContactsRef);
  const allContacts = contactsSnap.val() || {};
  for (const cId of Object.keys(allContacts)) {
    if (targetIds.includes(allContacts[cId].villageId)) {
      updates[`contacts/${cId}`] = null;
    }
  }

  await update(ref(rtdb), updates);

  // 2. Sync to Firestore
  try {
    const batch = writeBatch(db);
    for (const vId of targetIds) {
      batch.delete(doc(db, 'villages', vId));
    }
    const snap = await getDocs(contactsCol);
    snap.docs.forEach((d) => {
      if (targetIds.includes(d.data().villageId)) {
        batch.delete(doc(db, 'contacts', d.id));
      }
    });
    await batch.commit();
  } catch (err) {
    console.warn('Firestore bulk delete note:', err);
  }

  return targetIds.length;
}

// -------------------------------------------------------------
// CONTACTS CRUD
// -------------------------------------------------------------
export async function getContacts(): Promise<Contact[]> {
  try {
    const res = await fetch(`${RTDB_URL}/contacts.json`);
    if (res.ok) {
      const val = await res.json();
      if (val) {
        return Object.keys(val).map((k) => ({ ...val[k], id: val[k].id || k }));
      }
      return [];
    }
  } catch {}

  try {
    const snap = await get(rtdbContactsRef);
    const val = snap.val();
    if (val) {
      return Object.keys(val).map((k) => ({ ...val[k], id: val[k].id || k }));
    }
  } catch (err) {
    console.error('getContacts error:', err);
  }
  return [];
}

export async function createContact(
  contact: Omit<Contact, 'id' | 'createdAt' | 'updatedAt'> & { id?: string; createdAt?: number; updatedAt?: number }
): Promise<Contact> {
  const id = contact.id || `c_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
  const newContact: Contact = {
    ...contact,
    id,
    createdAt: contact.createdAt || Date.now(),
    updatedAt: contact.updatedAt || Date.now(),
    status: contact.status || 'approved',
  };

  // Direct fast REST call to Realtime Database (~50ms)
  const restPromise = fetch(`${RTDB_URL}/contacts/${id}.json`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(newContact),
  }).catch((e) => console.warn('RTDB REST note:', e));

  // SDK Realtime Database parallel sync
  const sdkPromise = set(ref(rtdb, `contacts/${id}`), newContact).catch((e) =>
    console.warn('RTDB SDK note:', e)
  );

  // Firestore background sync
  setDoc(doc(contactsCol, id), newContact).catch(() => {});

  // Wait for the fastest response (either REST or SDK)
  await Promise.race([restPromise, sdkPromise]);

  return newContact;
}

export async function updateContact(id: string, updates: Partial<Contact>): Promise<Contact> {
  const finalUpdates = {
    ...updates,
    updatedAt: Date.now(),
  };

  // Direct fast REST call to Realtime Database (~50ms)
  const restPromise = fetch(`${RTDB_URL}/contacts/${id}.json`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(finalUpdates),
  }).catch((e) => console.warn('RTDB REST note:', e));

  // SDK Realtime Database parallel sync
  const sdkPromise = update(ref(rtdb, `contacts/${id}`), finalUpdates).catch((e) =>
    console.warn('RTDB SDK note:', e)
  );

  updateDoc(doc(db, 'contacts', id), finalUpdates).catch(() => {});

  await Promise.race([restPromise, sdkPromise]);

  return { id, ...finalUpdates } as Contact;
}

export async function deleteContact(id: string): Promise<void> {
  // Direct fast REST DELETE to Realtime Database (~50ms)
  const restPromise = fetch(`${RTDB_URL}/contacts/${id}.json`, {
    method: 'DELETE',
  }).catch((e) => console.warn('RTDB REST note:', e));

  // SDK Realtime Database parallel sync
  const sdkPromise = remove(ref(rtdb, `contacts/${id}`)).catch((e) =>
    console.warn('RTDB SDK note:', e)
  );

  deleteDoc(doc(db, 'contacts', id)).catch(() => {});

  await Promise.race([restPromise, sdkPromise]);
}

// -------------------------------------------------------------
// VILLAGES CRUD
// -------------------------------------------------------------
export async function getVillages(): Promise<Village[]> {
  try {
    const res = await fetch(`${RTDB_URL}/villages.json`);
    if (res.ok) {
      const val = await res.json();
      if (val) {
        const list = Object.keys(val).map((k) => ({ ...val[k], id: val[k].id || k }));
        list.sort((a, b) => (a.name || '').localeCompare(b.name || '', 'hi'));
        return list;
      }
      return [];
    }
  } catch {}

  try {
    const snap = await get(rtdbVillagesRef);
    const val = snap.val();
    if (val) {
      const list = Object.keys(val).map((k) => ({ ...val[k], id: val[k].id || k }));
      list.sort((a, b) => (a.name || '').localeCompare(b.name || '', 'hi'));
      return list;
    }
  } catch (err) {
    console.error('getVillages error:', err);
  }
  return [];
}

export async function createVillage(name: string): Promise<Village> {
  const cleanName = name.trim();
  const id = `v_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
  const newVillage: Village = {
    id,
    name: cleanName,
    createdAt: Date.now(),
  };

  // 1. Firebase Realtime Database (SDK + REST)
  await set(ref(rtdb, `villages/${id}`), newVillage);
  try {
    await fetch(`${RTDB_URL}/villages/${id}.json`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newVillage),
    });
  } catch {}

  // 2. Sync to Firestore
  try {
    await setDoc(doc(villagesCol, id), newVillage);
  } catch (err) {
    console.warn('Firestore village note:', err);
  }

  return newVillage;
}

export async function updateVillage(id: string, name: string): Promise<void> {
  const cleanName = name.trim();

  // 1. Realtime Database
  await update(ref(rtdb, `villages/${id}`), { name: cleanName });

  // Update associated contacts' villageName in RTDB
  const contactsSnap = await get(rtdbContactsRef);
  const allContacts = contactsSnap.val() || {};
  const updates: Record<string, any> = {};
  for (const cId of Object.keys(allContacts)) {
    if (allContacts[cId].villageId === id) {
      updates[`contacts/${cId}/villageName`] = cleanName;
    }
  }
  if (Object.keys(updates).length > 0) {
    await update(ref(rtdb), updates);
  }

  // 2. Sync to Firestore
  try {
    await updateDoc(doc(db, 'villages', id), { name: cleanName });
    const q = query(contactsCol, where('villageId', '==', id));
    const snap = await getDocs(q);
    const batch = writeBatch(db);
    snap.docs.forEach((d) => {
      batch.update(doc(db, 'contacts', d.id), { villageName: cleanName });
    });
    await batch.commit();
  } catch (err) {
    console.warn('Firestore updateVillage note:', err);
  }
}

export async function deleteVillage(id: string): Promise<void> {
  // 1. Remove village from Realtime Database
  await remove(ref(rtdb, `villages/${id}`));

  // Remove associated contacts from RTDB
  const contactsSnap = await get(rtdbContactsRef);
  const allContacts = contactsSnap.val() || {};
  for (const cId of Object.keys(allContacts)) {
    if (allContacts[cId].villageId === id) {
      await remove(ref(rtdb, `contacts/${cId}`));
    }
  }

  // 2. Sync to Firestore
  try {
    const batch = writeBatch(db);
    batch.delete(doc(db, 'villages', id));
    const q = query(contactsCol, where('villageId', '==', id));
    const snap = await getDocs(q);
    snap.docs.forEach((d) => {
      batch.delete(doc(db, 'contacts', d.id));
    });
    await batch.commit();
  } catch (err) {
    console.warn('Firestore deleteVillage note:', err);
  }
}

export async function getVillageContactsCount(villageId: string): Promise<number> {
  try {
    const snap = await get(rtdbContactsRef);
    const val = snap.val() || {};
    return Object.values(val).filter((c: any) => c.villageId === villageId).length;
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
  const id = `req_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
  const newReq: ApprovalRequest = {
    ...request,
    id,
    createdAt: Date.now(),
    status: 'pending',
  };

  await set(ref(rtdb, `approvals/${id}`), newReq);
  try {
    await setDoc(doc(approvalsCol, id), newReq);
  } catch {}
  return id;
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
  await remove(ref(rtdb, `approvals/${req.id}`));
  try {
    await deleteDoc(doc(db, 'approvals', req.id));
  } catch {}
}

export async function rejectRequest(reqId: string, _reason?: string): Promise<void> {
  await remove(ref(rtdb, `approvals/${reqId}`));
  try {
    await deleteDoc(doc(db, 'approvals', reqId));
  } catch {}
}

export async function approveAllPendingRequests(): Promise<number> {
  const snap = await get(rtdbApprovalsRef);
  const val = snap.val() || {};
  let count = 0;
  for (const id of Object.keys(val)) {
    const req = { id, ...val[id] } as ApprovalRequest;
    await approveRequest(req);
    count++;
  }
  return count;
}

export async function bulkVerifyBinaOtpContacts(): Promise<number> {
  const snap = await get(rtdbContactsRef);
  const allContacts = snap.val() || {};
  let count = 0;
  const updates: Record<string, any> = {};

  for (const id of Object.keys(allContacts)) {
    const c = allContacts[id];
    if (c.addedWithOtp === false || !c.remark?.includes('WhatsApp')) {
      count++;
      updates[`contacts/${id}/addedWithOtp`] = true;
      updates[`contacts/${id}/remark`] = 'WhatsApp Verified (एडमिन सत्यापित)';
      updates[`contacts/${id}/updatedAt`] = Date.now();
    }
  }

  if (count > 0) {
    await update(ref(rtdb), updates);
  }
  return count;
}

// -------------------------------------------------------------
// APP SETTINGS
// -------------------------------------------------------------
export async function getAppSettings(): Promise<AppSettings> {
  try {
    const snap = await get(rtdbSettingsRef);
    if (snap.exists()) {
      return { ...DEFAULT_SETTINGS, ...snap.val() } as AppSettings;
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
  await update(rtdbSettingsRef, settings);
  try {
    const docRef = doc(db, 'settings', 'global');
    await setDoc(docRef, settings, { merge: true });
  } catch {}
  return getAppSettings();
}

// -------------------------------------------------------------
// CSV IMPORT / EXPORT HELPERS
// -------------------------------------------------------------
export function exportContactsToCsv(contacts: Contact[]): string {
  const headers = ['गाँव', 'नाम', 'पिता का नाम', 'मोबाइल नंबर', 'वैकल्पिक नंबर', 'व्यवसाय', 'पता', 'टिप्पणी'];
  const rows = contacts.map((c) => [
    `"${(c.villageName || '').replace(/"/g, '""')}"`,
    `"${(c.name || '').replace(/"/g, '""')}"`,
    `"${(c.fatherName || '').replace(/"/g, '""')}"`,
    `"${c.mobile || ''}"`,
    `"${c.alternateMobile || ''}"`,
    `"${(c.category || '').replace(/"/g, '""')}"`,
    `"${(c.address || '').replace(/"/g, '""')}"`,
    `"${(c.remark || 'सत्यापित').replace(/"/g, '""')}"`,
  ]);
  // Return clean RFC 4180 CSV with CRLF without string BOM (BOM is applied as binary Uint8Array in Blob)
  return [headers.join(','), ...rows.map((r) => r.join(','))].join('\r\n');
}

function parseCsvRow(line: string): string[] {
  const result: string[] = [];
  let cur = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        cur += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      result.push(cur.trim());
      cur = '';
    } else {
      cur += char;
    }
  }
  result.push(cur.trim());
  return result;
}

export async function importContactsFromCsv(
  csvText: string,
  villages: Village[]
): Promise<CsvImportResult> {
  const cleanCsv = csvText.replace(/^\uFEFF/, '').trim();
  const lines = cleanCsv.split(/\r?\n/).filter((l) => l.trim().length > 0);
  let successCount = 0;
  const failedRows: { rowNumber: number; reason: string; data: Partial<Contact> }[] = [];

  for (let i = 1; i < lines.length; i++) {
    const parts = parseCsvRow(lines[i]);
    if (parts.length >= 4) {
      // Handles both [गाँव, नाम, ...] and [नाम, पिता, गाँव, मोबाइल]
      let villageName = '';
      let name = '';
      let fatherName = '';
      let mobile = '';
      let altMobile = '';
      let category = '';
      let address = '';
      let remark = '';

      // Detection based on whether first or 3rd/4th field is a valid mobile
      if (isValidIndianMobile(normalizeIndianMobile(parts[3]))) {
        // [गाँव, नाम, पिता, मोबाइल, ...]
        villageName = parts[0];
        name = parts[1];
        fatherName = parts[2];
        mobile = parts[3];
        altMobile = parts[4] || '';
        category = parts[5] || 'सामान्य';
        address = parts[6] || '';
        remark = parts[7] || '';
      } else if (isValidIndianMobile(normalizeIndianMobile(parts[2]))) {
        // [गाँव, नाम, मोबाइल, ...]
        villageName = parts[0];
        name = parts[1];
        mobile = parts[2];
        altMobile = parts[3] || '';
        category = parts[4] || 'सामान्य';
        address = parts[5] || '';
        remark = parts[6] || '';
      } else {
        // [नाम, पिता, गाँव, मोबाइल, ...]
        name = parts[0];
        fatherName = parts[1];
        villageName = parts[2];
        mobile = parts[3] || '';
        altMobile = parts[4] || '';
        category = parts[5] || 'सामान्य';
        address = parts[6] || '';
        remark = parts[7] || '';
      }

      const cleanMob = normalizeIndianMobile(mobile);
      if (cleanMob && isValidIndianMobile(cleanMob)) {
        const foundV = villages.find(
          (v) =>
            v.name.toLowerCase().includes(villageName.toLowerCase()) ||
            villageName.toLowerCase().includes(v.name.toLowerCase())
        );
        await createContact({
          name: name || 'अनाम सदस्य',
          fatherName: fatherName || '',
          villageId: foundV ? foundV.id : (villages[0]?.id || 'sakodara'),
          villageName: foundV ? foundV.name : (villageName || 'सकोदरा'),
          mobile: cleanMob,
          alternateMobile: altMobile,
          category: category || 'सामान्य',
          address: address || '',
          status: 'approved',
          addedWithOtp: true,
          remark: remark || 'CSV/Google Sheet आयातित',
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
