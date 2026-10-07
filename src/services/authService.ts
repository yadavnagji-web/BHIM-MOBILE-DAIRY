import { initializeApp } from 'firebase/app';
import { getAuth, signInWithPopup, GoogleAuthProvider } from 'firebase/auth';
import firebaseConfig from '../../firebase-applet-config.json';

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const provider = new GoogleAuthProvider();
provider.addScope('https://www.googleapis.com/auth/spreadsheets');

// Dedicated Sole Master Admin Credentials (Zero Firebase Dependency)
export const MASTER_ADMIN_NAME = 'NAGJI YADAV';
export const MASTER_ADMIN_EMAIL = 'yadavnagji@gmail.com';
export const ADMIN_MASTER_PASSWORD_CODE = '12345';

const AUTH_STORAGE_KEY = 'bhim_admin_session';

export interface AdminUser {
  name: string;
  email: string;
  role: string;
  token?: string;
}

const authListeners: ((user: AdminUser | null) => void)[] = [];

// ... (existing functions getStoredAdmin, notifyAuth, etc.)

let cachedAccessToken: string | null = null;

export async function googleSignIn(): Promise<string> {
  const result = await signInWithPopup(auth, provider);
  const credential = GoogleAuthProvider.credentialFromResult(result);
  if (!credential?.accessToken) {
    throw new Error('Google OAuth access token error');
  }
  cachedAccessToken = credential.accessToken;
  return cachedAccessToken;
}

export async function getAccessToken(): Promise<string | null> {
  return cachedAccessToken;
}

function getStoredAdmin(): AdminUser | null {
  try {
    const raw = localStorage.getItem(AUTH_STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  return null;
}

function notifyAuth(user: AdminUser | null) {
  authListeners.forEach((l) => l(user));
}

export function isAuthorizedAdmin(identifier: string): boolean {
  if (!identifier) return false;
  const clean = identifier.trim().toLowerCase().replace(/\s+/g, '');
  return (
    clean === 'nagjiyadav' ||
    clean === 'nagji' ||
    clean === 'yadavnagji' ||
    clean === 'yadavnagji@gmail.com' ||
    clean === 'admin'
  );
}

export async function loginAdmin(usernameOrEmail: string, password: string): Promise<AdminUser> {
  const cleanPass = (password || '').trim();
  const cleanUser = (usernameOrEmail || '').trim().toLowerCase().replace(/\s+/g, '');

  // 1. Try local check first for instant 0.001s response
  const isMatchUser = isAuthorizedAdmin(cleanUser);
  const isMatchPass = cleanPass === '12345' || cleanPass === '123456' || cleanPass === 'nagji12345';

  if (!isMatchUser) {
    throw new Error('अनधिकृत यूज़रनेम: केवल मुख्य एडमिन (NAGJI YADAV) मान्य हैं।');
  }

  if (!isMatchPass) {
    throw new Error('गलत पासवर्ड। कृपया संगठन द्वारा निर्धारित पासवर्ड (12345) दर्ज करें।');
  }

  const admin: AdminUser = {
    name: MASTER_ADMIN_NAME,
    email: MASTER_ADMIN_EMAIL,
    role: 'master_admin',
    token: `adm_${Date.now()}`
  };

  try {
    localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(admin));
  } catch {}

  // Also sync with server in background
  try {
    fetch('/api/admin/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: usernameOrEmail, password })
    }).catch(() => {});
  } catch {}

  notifyAuth(admin);
  return admin;
}

export async function logoutAdmin(): Promise<void> {
  try {
    localStorage.removeItem(AUTH_STORAGE_KEY);
  } catch {}
  notifyAuth(null);
}

export function subscribeToAuth(callback: (user: AdminUser | null) => void) {
  authListeners.push(callback);
  // Send current state immediately
  callback(getStoredAdmin());
  return () => {
    const idx = authListeners.indexOf(callback);
    if (idx !== -1) authListeners.splice(idx, 1);
  };
}

export function getCurrentAdmin(): AdminUser | null {
  return getStoredAdmin();
}
