import { initializeApp } from 'firebase/app';
import { getFirestore, collection } from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);

export const contactsCol = collection(db, 'contacts');
export const villagesCol = collection(db, 'villages');
export const approvalsCol = collection(db, 'approvals');
export const settingsCol = collection(db, 'settings');
