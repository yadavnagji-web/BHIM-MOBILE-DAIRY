import { initializeApp } from 'firebase/app';
import { getFirestore, collection } from 'firebase/firestore';
import { getDatabase, ref } from 'firebase/database';
import firebaseConfig from '../../firebase-applet-config.json';

export const RTDB_URL = 'https://bhim-dairy-default-rtdb.firebaseio.com';

export const app = initializeApp(firebaseConfig);
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);
export const rtdb = getDatabase(app, RTDB_URL);

export const contactsCol = collection(db, 'contacts');
export const villagesCol = collection(db, 'villages');
export const approvalsCol = collection(db, 'approvals');
export const settingsCol = collection(db, 'settings');

export const rtdbContactsRef = ref(rtdb, 'contacts');
export const rtdbVillagesRef = ref(rtdb, 'villages');
export const rtdbApprovalsRef = ref(rtdb, 'approvals');
export const rtdbSettingsRef = ref(rtdb, 'settings');

