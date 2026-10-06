import {
  collection,
  doc,
  getDocs,
  getDoc,
  addDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  writeBatch,
  onSnapshot
} from 'firebase/firestore';
import { db } from '../firebase';
import { Village, Contact, CsvImportResult, ApprovalRequest } from '../types';
import { INITIAL_VILLAGES, INITIAL_CONTACTS } from './sampleData';
import {
  getStoredSheetConfig,
  getCachedSheetToken,
  appendContactToGoogleSheet
} from './googleSheetsService';

const VILLAGES_COLLECTION = 'villages';
const CONTACTS_COLLECTION = 'contacts';
export const APPROVAL_REQUESTS_COLLECTION = 'approval_requests';

const VILLAGES_CACHE_KEY = 'bhim_directory_cached_villages';
const CONTACTS_CACHE_KEY = 'bhim_directory_cached_contacts';

function getLocalCachedVillages(): Village[] {
  try {
    const raw = localStorage.getItem(VILLAGES_CACHE_KEY);
    if (raw) return JSON.parse(raw);
  } catch (e) {
    console.warn('Error reading cached villages:', e);
  }
  return INITIAL_VILLAGES.map((v) => ({ ...v, createdAt: 0 }));
}

function setLocalCachedVillages(villages: Village[]): void {
  try {
    if (villages && villages.length > 0) {
      localStorage.setItem(VILLAGES_CACHE_KEY, JSON.stringify(villages));
    }
  } catch (e) {
    console.warn('Error saving cached villages:', e);
  }
}

function getLocalCachedContacts(): Contact[] {
  try {
    const raw = localStorage.getItem(CONTACTS_CACHE_KEY);
    if (raw) return JSON.parse(raw);
  } catch (e) {
    console.warn('Error reading cached contacts:', e);
  }
  return INITIAL_CONTACTS.map((c, i) => ({
    ...c,
    id: `initial_${i}`,
    status: 'approved' as const,
    createdAt: 0,
    updatedAt: 0,
  }));
}

function setLocalCachedContacts(contacts: Contact[]): void {
  try {
    if (contacts && contacts.length > 0) {
      localStorage.setItem(CONTACTS_CACHE_KEY, JSON.stringify(contacts));
    }
  } catch (e) {
    console.warn('Error saving cached contacts:', e);
  }
}

/**
 * Normalizes Indian phone number to 10 digits
 */
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

/**
 * Validates 10 digit Indian mobile number starting with 6, 7, 8, or 9
 */
export function isValidIndianMobile(raw: string): boolean {
  const norm = normalizeIndianMobile(raw);
  return /^[6-9]\d{9}$/.test(norm);
}

/**
 * Initialize default villages and contacts if database is empty
 */
export async function seedInitialDataIfEmpty(): Promise<boolean> {
  try {
    const vSnap = await getDocs(query(collection(db, VILLAGES_COLLECTION), limit(1)));
    if (!vSnap.empty) {
      return false; // Already has data
    }

    const batch = writeBatch(db);

    // Seed villages
    for (const v of INITIAL_VILLAGES) {
      const vRef = doc(db, VILLAGES_COLLECTION, v.id);
      batch.set(vRef, {
        name: v.name,
        createdAt: Date.now(),
      });
    }

    // Seed contacts
    for (const c of INITIAL_CONTACTS) {
      const cRef = doc(collection(db, CONTACTS_COLLECTION));
      batch.set(cRef, {
        ...c,
        mobile: normalizeIndianMobile(c.mobile),
        alternateMobile: c.alternateMobile ? normalizeIndianMobile(c.alternateMobile) : '',
        createdAt: Date.now(),
        updatedAt: Date.now(),
      });
    }

    await batch.commit();
    return true;
  } catch (error) {
    console.warn('Auto-seed bypassed or rules restricted:', error);
    return false;
  }
}

/**
 * Fetch all villages sorted alphabetically
 */
export async function getVillages(): Promise<Village[]> {
  try {
    const snapshot = await getDocs(collection(db, VILLAGES_COLLECTION));
    const list: Village[] = [];
    snapshot.forEach((docSnap) => {
      const data = docSnap.data();
      list.push({
        id: docSnap.id,
        name: data.name || '',
        createdAt: data.createdAt || 0,
      });
    });

    list.sort((a, b) => a.name.localeCompare(b.name, 'hi'));
    if (list.length > 0) {
      setLocalCachedVillages(list);
      return list;
    }
    return getLocalCachedVillages();
  } catch (error) {
    console.warn('Error fetching villages from Firestore, using local cache:', error);
    return getLocalCachedVillages();
  }
}

/**
 * Fetch contacts, optionally filtered by village for high performance
 */
export async function getContacts(villageId?: string): Promise<Contact[]> {
  try {
    let q;
    if (villageId && villageId !== 'all') {
      q = query(
        collection(db, CONTACTS_COLLECTION),
        where('villageId', '==', villageId)
      );
    } else {
      q = query(collection(db, CONTACTS_COLLECTION), limit(250));
    }

    const snapshot = await getDocs(q);
    const list: Contact[] = [];
    snapshot.forEach((docSnap) => {
      const data = docSnap.data();
      if (data.status && data.status !== 'approved') {
        return; // Skip pending or rejected contacts
      }
      list.push({
        id: docSnap.id,
        villageId: data.villageId || '',
        villageName: data.villageName || '',
        name: data.name || '',
        fatherName: data.fatherName || '',
        mobile: data.mobile || '',
        alternateMobile: data.alternateMobile || '',
        category: data.category || 'सामान्य',
        address: data.address || '',
        remark: data.remark || '',
        status: data.status || 'approved',
        createdAt: data.createdAt || 0,
        updatedAt: data.updatedAt || 0,
      });
    });

    // Client-side sort by name
    list.sort((a, b) => a.name.localeCompare(b.name, 'hi'));
    if (list.length > 0) {
      if (!villageId || villageId === 'all') {
        setLocalCachedContacts(list);
      }
      return list;
    }
    const cached = getLocalCachedContacts();
    if (villageId && villageId !== 'all') {
      return cached.filter((c) => c.villageId === villageId);
    }
    return cached;
  } catch (error) {
    console.warn('Error fetching contacts from Firestore, using local cache:', error);
    const cached = getLocalCachedContacts();
    if (villageId && villageId !== 'all') {
      return cached.filter((c) => c.villageId === villageId);
    }
    return cached;
  }
}

/**
 * Check if mobile number already exists in contacts
 */
export async function checkDuplicateMobile(mobile: string, excludeContactId?: string): Promise<boolean> {
  const norm = normalizeIndianMobile(mobile);
  if (!norm) return false;

  try {
    const q = query(
      collection(db, CONTACTS_COLLECTION),
      where('mobile', '==', norm),
      limit(2)
    );
    const snapshot = await getDocs(q);
    if (snapshot.empty) return false;

    if (excludeContactId) {
      const match = snapshot.docs.find((d) => d.id !== excludeContactId);
      return Boolean(match);
    }
    return true;
  } catch (error) {
    console.error('Error checking duplicate mobile:', error);
    return false;
  }
}

/**
 * Add a new contact
 */
export async function createContact(contactData: Omit<Contact, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
  const normMobile = normalizeIndianMobile(contactData.mobile);
  if (!isValidIndianMobile(normMobile)) {
    throw new Error('कृपया सही 10 अंकों का भारतीय मोबाइल नंबर दर्ज करें (6, 7, 8 या 9 से शुरू)');
  }

  const isDuplicate = await checkDuplicateMobile(normMobile);
  if (isDuplicate) {
    throw new Error(`मोबाइल नंबर ${normMobile} डायरेक्टरी में पहले से मौजूद है!`);
  }

  const docRef = await addDoc(collection(db, CONTACTS_COLLECTION), {
    ...contactData,
    fatherName: contactData.fatherName ? contactData.fatherName.trim() : '',
    mobile: normMobile,
    alternateMobile: contactData.alternateMobile ? normalizeIndianMobile(contactData.alternateMobile) : '',
    createdAt: Date.now(),
    updatedAt: Date.now(),
  });

  // If Google Sheet storage is connected and active, sync contact directly to sheet
  try {
    const sheetCfg = getStoredSheetConfig();
    const token = getCachedSheetToken();
    if (sheetCfg && token) {
      appendContactToGoogleSheet(token, sheetCfg.spreadsheetId, {
        id: docRef.id,
        ...contactData,
        mobile: normMobile,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      }).catch((e) => console.warn('Background Google Sheet append error:', e));
    }
  } catch (err) {
    console.warn('Could not auto-append to Google Sheet:', err);
  }

  return docRef.id;
}

/**
 * Update contact (Admin only)
 */
export async function updateContact(id: string, contactData: Partial<Contact>): Promise<void> {
  if (contactData.mobile) {
    const normMobile = normalizeIndianMobile(contactData.mobile);
    if (!isValidIndianMobile(normMobile)) {
      throw new Error('कृपया सही 10 अंकों का भारतीय मोबाइल नंबर दर्ज करें');
    }
    const isDuplicate = await checkDuplicateMobile(normMobile, id);
    if (isDuplicate) {
      throw new Error(`मोबाइल नंबर ${normMobile} अन्य संपर्क में पहले से दर्ज है!`);
    }
    contactData.mobile = normMobile;
  }

  if (contactData.alternateMobile) {
    contactData.alternateMobile = normalizeIndianMobile(contactData.alternateMobile);
  }

  const docRef = doc(db, CONTACTS_COLLECTION, id);
  await updateDoc(docRef, {
    ...contactData,
    updatedAt: Date.now(),
  });
}

/**
 * Delete contact (Admin only)
 */
export async function deleteContact(id: string): Promise<void> {
  const docRef = doc(db, CONTACTS_COLLECTION, id);
  await deleteDoc(docRef);
}

/**
 * Add a new village (Admin only)
 */
export async function createVillage(name: string): Promise<string> {
  const trimmed = name.trim();
  if (!trimmed) {
    throw new Error('गाँव का नाम खाली नहीं हो सकता');
  }

  // Check if village already exists
  const q = query(
    collection(db, VILLAGES_COLLECTION),
    where('name', '==', trimmed),
    limit(1)
  );
  const existing = await getDocs(q);
  if (!existing.empty) {
    throw new Error(`गाँव "${trimmed}" पहले से मौजूद है!`);
  }

  const docRef = await addDoc(collection(db, VILLAGES_COLLECTION), {
    name: trimmed,
    createdAt: Date.now(),
  });

  return docRef.id;
}

/**
 * Rename village and update in all related contacts
 */
export async function updateVillage(id: string, newName: string): Promise<void> {
  const trimmed = newName.trim();
  if (!trimmed) {
    throw new Error('गाँव का नाम खाली नहीं हो सकता');
  }

  const vRef = doc(db, VILLAGES_COLLECTION, id);
  await updateDoc(vRef, { name: trimmed });

  // Update associated contacts
  try {
    const cQuery = query(collection(db, CONTACTS_COLLECTION), where('villageId', '==', id));
    const cSnap = await getDocs(cQuery);
    if (!cSnap.empty) {
      const batch = writeBatch(db);
      cSnap.forEach((cDoc) => {
        batch.update(cDoc.ref, { villageName: trimmed });
      });
      await batch.commit();
    }
  } catch (err) {
    console.warn('Could not batch update contacts for village rename:', err);
  }
}

/**
 * Check count of contacts in a village
 */
export async function getVillageContactsCount(villageId: string): Promise<number> {
  try {
    const q = query(collection(db, CONTACTS_COLLECTION), where('villageId', '==', villageId));
    const snap = await getDocs(q);
    return snap.size;
  } catch (error) {
    console.error('Error getting count:', error);
    return 0;
  }
}

/**
 * Delete village (Admin only) - checks associated contacts first
 */
export async function deleteVillage(id: string): Promise<void> {
  const count = await getVillageContactsCount(id);
  if (count > 0) {
    throw new Error(
      `इस गाँव में ${count} संपर्क मौजूद हैं। पहले इन संपर्कों को हटाएँ या दूसरे गाँव में स्थानांतरित करें।`
    );
  }

  const vRef = doc(db, VILLAGES_COLLECTION, id);
  await deleteDoc(vRef);
}

/**
 * Import contacts from CSV data
 */
export async function importContactsFromCsv(
  csvContent: string,
  villages: Village[]
): Promise<CsvImportResult> {
  const lines = csvContent
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => l.length > 0);

  if (lines.length < 2) {
    throw new Error('CSV फ़ाइल में डेटा पंक्तियाँ नहीं हैं।');
  }

  // Header verification
  const header = lines[0].toLowerCase();
  const rows = lines.slice(1);

  const result: CsvImportResult = {
    total: rows.length,
    successCount: 0,
    failedCount: 0,
    failedRows: [],
  };

  const villageMapByName = new Map<string, Village>();
  villages.forEach((v) => villageMapByName.set(v.name.toLowerCase().trim(), v));

  // Get existing mobile numbers to prevent duplicates during batch
  const existingContacts = await getContacts();
  const knownMobiles = new Set<string>();
  existingContacts.forEach((c) => knownMobiles.add(c.mobile));

  for (let i = 0; i < rows.length; i++) {
    const rowNum = i + 2;
    const cols = rows[i].split(',').map((c) => c.trim().replace(/^["']|["']$/g, ''));
    
    // Expected CSV columns: Village, Name, Mobile, Alternate Mobile, Category, Address, Remark
    const [villageName, name, mobile, alternateMobile, category, address, remark] = cols;

    if (!villageName || !name || !mobile) {
      result.failedCount++;
      result.failedRows.push({
        rowNumber: rowNum,
        reason: 'गाँव, नाम या मोबाइल नंबर रिक्त है।',
        data: { villageName, name, mobile },
      });
      continue;
    }

    const normMobile = normalizeIndianMobile(mobile);
    if (!isValidIndianMobile(normMobile)) {
      result.failedCount++;
      result.failedRows.push({
        rowNumber: rowNum,
        reason: 'अमान्य भारतीय मोबाइल नंबर (10 अंक होने चाहिए)',
        data: { villageName, name, mobile },
      });
      continue;
    }

    if (knownMobiles.has(normMobile)) {
      result.failedCount++;
      result.failedRows.push({
        rowNumber: rowNum,
        reason: `मोबाइल नंबर ${normMobile} पहले से डायरेक्टरी में मौजूद है`,
        data: { villageName, name, mobile },
      });
      continue;
    }

    // Find or link village
    let village = villageMapByName.get(villageName.toLowerCase().trim());
    let villageId = village ? village.id : '';
    let finalVillageName = village ? village.name : villageName.trim();

    if (!village) {
      // Auto-create village if does not exist
      try {
        villageId = await createVillage(finalVillageName);
        const newV: Village = { id: villageId, name: finalVillageName, createdAt: Date.now() };
        villages.push(newV);
        villageMapByName.set(finalVillageName.toLowerCase(), newV);
      } catch (err: any) {
        // If couldn't create, fail row
        result.failedCount++;
        result.failedRows.push({
          rowNumber: rowNum,
          reason: `गाँव निर्माण विफल: ${err.message}`,
          data: { villageName, name, mobile },
        });
        continue;
      }
    }

    try {
      await addDoc(collection(db, CONTACTS_COLLECTION), {
        villageId,
        villageName: finalVillageName,
        name: name.trim(),
        mobile: normMobile,
        alternateMobile: alternateMobile ? normalizeIndianMobile(alternateMobile) : '',
        category: category?.trim() || 'सामान्य',
        address: address?.trim() || '',
        remark: remark?.trim() || '',
        createdAt: Date.now(),
        updatedAt: Date.now(),
      });
      knownMobiles.add(normMobile);
      result.successCount++;
    } catch (err: any) {
      result.failedCount++;
      result.failedRows.push({
        rowNumber: rowNum,
        reason: `डेटाबेस त्रुटि: ${err.message}`,
        data: { villageName, name, mobile },
      });
    }
  }

  return result;
}

/**
 * Generate CSV text for all contacts
 */
export function exportContactsToCsv(contacts: Contact[]): string {
  const headers = ['Village', 'Name', 'Mobile', 'Alternate Mobile', 'Category', 'Address', 'Remark'];
  const escapeCsv = (val?: string) => `"${(val || '').replace(/"/g, '""')}"`;

  const rows = contacts.map((c) => [
    escapeCsv(c.villageName),
    escapeCsv(c.name),
    escapeCsv(c.mobile),
    escapeCsv(c.alternateMobile),
    escapeCsv(c.category),
    escapeCsv(c.address),
    escapeCsv(c.remark),
  ].join(','));

  return [headers.join(','), ...rows].join('\n');
}

/**
 * Real-time continuous listener for villages and contacts
 * Triggers automatic updates whenever any user or admin modifies data
 */
export function subscribeToRealtimeDirectory(
  onUpdate: (data: { villages: Village[]; contacts: Contact[] }) => void,
  onError?: (error: any) => void
): () => void {
  let cachedVillages: Village[] = getLocalCachedVillages();
  let cachedContacts: Contact[] = getLocalCachedContacts();
  let villagesLoaded = cachedVillages.length > 0;
  let contactsLoaded = cachedContacts.length > 0;

  // Immediately broadcast local cached state so user sees data without any delay
  if (villagesLoaded || contactsLoaded) {
    onUpdate({ villages: cachedVillages, contacts: cachedContacts });
  }

  const unsubVillages = onSnapshot(
    collection(db, VILLAGES_COLLECTION),
    (snap) => {
      const list: Village[] = [];
      snap.forEach((docSnap) => {
        const data = docSnap.data();
        list.push({
          id: docSnap.id,
          name: data.name || '',
          createdAt: data.createdAt || 0,
        });
      });
      list.sort((a, b) => a.name.localeCompare(b.name, 'hi'));
      if (list.length > 0) {
        cachedVillages = list;
        setLocalCachedVillages(list);
      }
      villagesLoaded = true;
      if (contactsLoaded) {
        onUpdate({ villages: cachedVillages, contacts: cachedContacts });
      }
    },
    (err) => {
      console.warn('Realtime villages listener notice (operating in offline/cached mode):', err);
      if (onError) onError(err);
    }
  );

  const unsubContacts = onSnapshot(
    collection(db, CONTACTS_COLLECTION),
    (snap) => {
      const list: Contact[] = [];
      snap.forEach((docSnap) => {
        const data = docSnap.data();
        if (data.status && data.status !== 'approved') {
          return; // Skip pending or rejected contacts
        }
        list.push({
          id: docSnap.id,
          villageId: data.villageId || '',
          villageName: data.villageName || '',
          name: data.name || '',
          fatherName: data.fatherName || '',
          mobile: data.mobile || '',
          alternateMobile: data.alternateMobile || '',
          category: data.category || 'सामान्य',
          address: data.address || '',
          remark: data.remark || '',
          status: data.status || 'approved',
          createdAt: data.createdAt || 0,
          updatedAt: data.updatedAt || 0,
        });
      });
      list.sort((a, b) => a.name.localeCompare(b.name, 'hi'));
      if (list.length > 0) {
        cachedContacts = list;
        setLocalCachedContacts(list);
      }
      contactsLoaded = true;
      if (villagesLoaded) {
        onUpdate({ villages: cachedVillages, contacts: cachedContacts });
      }
    },
    (err) => {
      console.warn('Realtime contacts listener notice (operating in offline/cached mode):', err);
      if (onError) onError(err);
    }
  );

  return () => {
    unsubVillages();
    unsubContacts();
  };
}

/**
 * Submit an approval request (from public user to add, edit, or delete contact)
 */
export async function submitApprovalRequest(
  request: Omit<ApprovalRequest, 'id' | 'createdAt' | 'status'>
): Promise<string> {
  const normMobile = normalizeIndianMobile(request.contactData.mobile);
  if (!isValidIndianMobile(normMobile)) {
    throw new Error('कृपया सही 10 अंकों का भारतीय मोबाइल नंबर दर्ज करें (6, 7, 8 या 9 से शुरू)');
  }

  // If new contact, check if mobile already exists in active directory
  if (request.type === 'new_contact') {
    const isDuplicate = await checkDuplicateMobile(normMobile);
    if (isDuplicate) {
      throw new Error(`मोबाइल नंबर ${normMobile} डायरेक्टरी में पहले से मौजूद है! यदि यह आपका नंबर है तो सुधार का अनुरोध भेजें।`);
    }
  }

  const docRef = await addDoc(collection(db, APPROVAL_REQUESTS_COLLECTION), {
    ...request,
    contactData: {
      ...request.contactData,
      fatherName: request.contactData.fatherName ? request.contactData.fatherName.trim() : '',
      mobile: normMobile,
      alternateMobile: request.contactData.alternateMobile ? normalizeIndianMobile(request.contactData.alternateMobile) : '',
    },
    status: 'pending',
    createdAt: Date.now(),
  });

  return docRef.id;
}

/**
 * Fetch pending approval requests
 */
export async function getPendingApprovalRequests(): Promise<ApprovalRequest[]> {
  try {
    const fallbackSnap = await getDocs(collection(db, APPROVAL_REQUESTS_COLLECTION));
    const list: ApprovalRequest[] = [];
    fallbackSnap.forEach((d) => {
      const data = d.data();
      if (data.status === 'pending') {
        list.push({
          id: d.id,
          type: data.type || 'new_contact',
          status: data.status || 'pending',
          contactData: data.contactData || {},
          targetContactId: data.targetContactId,
          existingContactData: data.existingContactData,
          requesterName: data.requesterName,
          requesterPhone: data.requesterPhone,
          reason: data.reason,
          createdAt: data.createdAt || 0,
          reviewedAt: data.reviewedAt,
          reviewedBy: data.reviewedBy,
        });
      }
    });
    list.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
    return list;
  } catch (err) {
    console.warn('Error fetching approval requests:', err);
    return [];
  }
}

/**
 * Real-time listener for pending approval requests (for Admin live badge & queue)
 */
export function subscribeToApprovalRequests(
  onUpdate: (requests: ApprovalRequest[]) => void,
  onError?: (error: any) => void
): () => void {
  const q = query(collection(db, APPROVAL_REQUESTS_COLLECTION));

  return onSnapshot(
    q,
    (snap) => {
      const list: ApprovalRequest[] = [];
      snap.forEach((d) => {
        const data = d.data();
        if (data.status === 'pending') {
          list.push({
            id: d.id,
            type: data.type || 'new_contact',
            status: data.status || 'pending',
            contactData: data.contactData || {},
            targetContactId: data.targetContactId,
            existingContactData: data.existingContactData,
            requesterName: data.requesterName,
            requesterPhone: data.requesterPhone,
            reason: data.reason,
            createdAt: data.createdAt || 0,
            reviewedAt: data.reviewedAt,
            reviewedBy: data.reviewedBy,
          });
        }
      });
      list.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
      onUpdate(list);
    },
    (err) => {
      console.warn('Error subscribing to approval requests:', err);
      if (onError) onError(err);
    }
  );
}

/**
 * Approve a pending request (Admin only)
 */
export async function approveRequest(request: ApprovalRequest, adminEmail?: string): Promise<void> {
  const reqRef = doc(db, APPROVAL_REQUESTS_COLLECTION, request.id);

  if (request.type === 'new_contact') {
    // Add to contacts collection with status 'approved'
    await createContact({
      villageId: request.contactData.villageId,
      villageName: request.contactData.villageName,
      name: request.contactData.name,
      fatherName: request.contactData.fatherName || '',
      mobile: request.contactData.mobile,
      alternateMobile: request.contactData.alternateMobile,
      category: request.contactData.category,
      address: request.contactData.address || '',
      remark: request.contactData.remark || '',
      status: 'approved',
    });
  } else if (request.type === 'edit_contact' && request.targetContactId) {
    // Update target contact
    await updateContact(request.targetContactId, {
      ...request.contactData,
      status: 'approved',
    });
  } else if (request.type === 'delete_contact' && request.targetContactId) {
    // Delete target contact
    await deleteContact(request.targetContactId);
  }

  // Update request status to 'approved'
  await updateDoc(reqRef, {
    status: 'approved',
    reviewedAt: Date.now(),
    reviewedBy: adminEmail || 'Admin',
  });
}

/**
 * Reject a pending request (Admin only)
 */
export async function rejectRequest(requestId: string, adminEmail?: string, reason?: string): Promise<void> {
  const reqRef = doc(db, APPROVAL_REQUESTS_COLLECTION, requestId);
  await updateDoc(reqRef, {
    status: 'rejected',
    reviewedAt: Date.now(),
    reviewedBy: adminEmail || 'Admin',
    adminRemark: reason || 'अस्वीकृत किया गया',
  });
}

/**
 * Batch approve all pending requests (Admin convenience)
 */
export async function approveAllPendingRequests(requests?: ApprovalRequest[], adminEmail?: string): Promise<number> {
  const reqList = requests && requests.length > 0 ? requests : await getPendingApprovalRequests();
  let success = 0;
  for (const req of reqList) {
    try {
      await approveRequest(req, adminEmail);
      success++;
    } catch (e) {
      console.error('Failed to approve request:', req.id, e);
    }
  }
  return success;
}


