/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { initializeApp } from 'firebase/app';
import { 
  getFirestore, 
  doc, 
  getDoc, 
  getDocs, 
  setDoc, 
  deleteDoc, 
  collection, 
  writeBatch,
  onSnapshot
} from 'firebase/firestore';
import { getAuth, signInAnonymously } from 'firebase/auth';
import firebaseConfigJson from '../firebase-applet-config.json';
import { 
  GoalTodo, 
  HabitData, 
  DailyJournal, 
  PersonalExpense, 
  QuickScratchpad 
} from './types';

// Standard Firebase config from environment or template fallback
const firebaseConfig = {
  apiKey: "AIzaSyAD7_8-bDvGEjfFO4jM5ejdMj0dgQvml1o",
  authDomain: "gen-lang-client-0696138502.firebaseapp.com",
  projectId: "gen-lang-client-0696138502",
  storageBucket: "gen-lang-client-0696138502.firebasestorage.app",
  messagingSenderId: "496717945327",
  appId: "1:496717945327:web:0e07107f9440aa1481be1a"
};

let app: any = null;
let db: any = null;
let auth: any = null;

try {
  app = initializeApp(firebaseConfig);
  const databaseId = (firebaseConfigJson as any)?.firestoreDatabaseId;
  db = databaseId ? getFirestore(app, databaseId) : getFirestore(app);
  auth = getAuth(app);
  // Pre-authenticate anonymously to pass Firestore security rules
  if (auth) {
    signInAnonymously(auth).catch((err) => {
      console.warn("Initial anonymous authentication notice:", err);
    });
  }
} catch (e) {
  console.warn("Firebase initialization failed. Operating in Pure Local Mode.", e);
}

export async function ensureFirebaseAuth(): Promise<boolean> {
  if (!auth) return false;
  if (auth.currentUser) return true;
  try {
    await signInAnonymously(auth);
    return true;
  } catch (e) {
    console.warn("ensureFirebaseAuth error:", e);
    return false;
  }
}

export { db, auth };

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
  EXECUTE = 'execute',
}

function handleFirestoreError(error: unknown, operationType: OperationType, path: string) {
  const errInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth?.currentUser?.uid,
      email: auth?.currentUser?.email,
      emailVerified: auth?.currentUser?.emailVerified,
      isAnonymous: auth?.currentUser?.isAnonymous,
    },
    operationType,
    path
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
}

export function isLocalModeEnabled(): boolean {
  if (!db || !auth) return false;
  const saved = localStorage.getItem('deep_focus_os_local_only');
  if (saved === 'true') return true;
  if (saved === 'false') return false;
  return false; // Default Cloud Sync ENABLED so Web and Desktop App sync for same account
}

export function setLocalModeEnabled(enabled: boolean) {
  localStorage.setItem('deep_focus_os_local_only', enabled ? 'true' : 'false');
}

function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      reject(new Error(`Firebase operation timed out after ${ms}ms`));
    }, ms);
    promise
      .then((res) => {
        clearTimeout(timer);
        resolve(res);
      })
      .catch((err) => {
        clearTimeout(timer);
        reject(err);
      });
  });
}

// Helper to get raw user email if available
export function getRawUserEmail(userId?: string): string {
  if (userId && userId.trim()) {
    return userId.trim().toLowerCase();
  }
  const savedUserStr = localStorage.getItem('df_os_active_user') || sessionStorage.getItem('df_os_active_user');
  if (savedUserStr) {
    try {
      const u = JSON.parse(savedUserStr);
      if (u && u.email) return String(u.email).trim().toLowerCase();
    } catch (e) {}
  }
  if (auth?.currentUser?.email) {
    return auth.currentUser.email.trim().toLowerCase();
  }
  return '';
}

// Helper to resolve Active Account User ID for Data Isolation
export function resolveActiveUserId(overrideUserId?: string): string {
  let raw = getRawUserEmail(overrideUserId);
  if (!raw) return 'default_user';
  return raw.replace(/[^a-zA-Z0-9_]/g, '_');
}

// ---------------- ACCOUNT-SCOPED LOCAL STORAGE HELPERS ----------------
export function loadFromLocalStorage(userId?: string) {
  const uid = resolveActiveUserId(userId);
  const rawEmail = getRawUserEmail(userId);

  // Fallback reader across sanitized key, raw email key, and legacy keys
  const getStorageItem = (baseKey: string) => {
    return localStorage.getItem(`${baseKey}_${uid}`) ||
           (rawEmail ? localStorage.getItem(`${baseKey}_${rawEmail}`) : null) ||
           localStorage.getItem(`${baseKey}_default_user`) ||
           localStorage.getItem(baseKey);
  };

  const savedGoals = getStorageItem('df_goals_todo');
  const savedHabits = getStorageItem('df_habits_data');
  const savedJournal = getStorageItem('df_daily_journal');
  const savedExpenses = getStorageItem('df_personal_expenses');
  const savedScratchpad = getStorageItem('df_quick_scratchpad');

  const goals: GoalTodo[] = savedGoals ? JSON.parse(savedGoals) : [];
  const habits: HabitData[] = savedHabits ? JSON.parse(savedHabits) : [];
  const journal: DailyJournal[] = savedJournal ? JSON.parse(savedJournal) : [];
  const expenses: PersonalExpense[] = savedExpenses ? JSON.parse(savedExpenses) : [];
  const scratchpad: string = savedScratchpad || '# EXECUTIVE STRATEGY & BREAKTHROUGH SYSTEM\n\nStart typing notes for this account...';

  // Automatically cache to standardized key
  if (savedGoals && !localStorage.getItem(`df_goals_todo_${uid}`)) {
    localStorage.setItem(`df_goals_todo_${uid}`, JSON.stringify(goals));
  }
  if (savedHabits && !localStorage.getItem(`df_habits_data_${uid}`)) {
    localStorage.setItem(`df_habits_data_${uid}`, JSON.stringify(habits));
  }
  if (savedJournal && !localStorage.getItem(`df_daily_journal_${uid}`)) {
    localStorage.setItem(`df_daily_journal_${uid}`, JSON.stringify(journal));
  }
  if (savedExpenses && !localStorage.getItem(`df_personal_expenses_${uid}`)) {
    localStorage.setItem(`df_personal_expenses_${uid}`, JSON.stringify(expenses));
  }
  if (savedScratchpad && !localStorage.getItem(`df_quick_scratchpad_${uid}`)) {
    localStorage.setItem(`df_quick_scratchpad_${uid}`, scratchpad);
  }

  return { goals, habits, journal, expenses, scratchpad };
}

// ---------------- LOAD WORKSPACE DATA PER USER WITH SMART MERGE ----------------
export async function loadWorkspaceData(userId?: string) {
  const uid = resolveActiveUserId(userId);
  const local = loadFromLocalStorage(uid);

  if (isLocalModeEnabled()) {
    return local;
  }

  try {
    return await withTimeout((async () => {
      // 1. Fetch Remote Firestore Data in Parallel for Fast Response
      const [goalsSnap, habitsSnap, journalSnap, expensesSnap, padDoc] = await Promise.all([
        getDocs(collection(db, 'users', uid, 'goals_todo')),
        getDocs(collection(db, 'users', uid, 'habits_data')),
        getDocs(collection(db, 'users', uid, 'daily_journal')),
        getDocs(collection(db, 'users', uid, 'personal_expenses')),
        getDoc(doc(db, 'users', uid, 'quick_scratchpad', 'single_doc'))
      ]);

      const remoteGoals: GoalTodo[] = [];
      goalsSnap.forEach(d => remoteGoals.push({ id: d.id, ...d.data() } as GoalTodo));

      const remoteHabits: HabitData[] = [];
      habitsSnap.forEach(d => remoteHabits.push({ id: d.id, ...d.data() } as HabitData));

      const remoteJournal: DailyJournal[] = [];
      journalSnap.forEach(d => remoteJournal.push({ id: d.id, ...d.data() } as DailyJournal));

      const remoteExpenses: PersonalExpense[] = [];
      expensesSnap.forEach(d => remoteExpenses.push({ id: d.id, ...d.data() } as PersonalExpense));

      const remoteScratchpad = padDoc.exists() ? (padDoc.data() as any).text || '' : '';

      // 2. SMART TWO-WAY MERGE BY UNIQUE ID (ZERO DATA LOSS)
      const mergedGoalsMap = new Map<string, GoalTodo>();
      local.goals.forEach(g => mergedGoalsMap.set(g.id, g));
      remoteGoals.forEach(g => mergedGoalsMap.set(g.id, g));
      const goals = Array.from(mergedGoalsMap.values());

      const mergedHabitsMap = new Map<string, HabitData>();
      local.habits.forEach(h => mergedHabitsMap.set(h.id, h));
      remoteHabits.forEach(h => mergedHabitsMap.set(h.id, h));
      const habits = Array.from(mergedHabitsMap.values());

      const mergedJournalMap = new Map<string, DailyJournal>();
      local.journal.forEach(j => mergedJournalMap.set(j.id, j));
      remoteJournal.forEach(j => mergedJournalMap.set(j.id, j));
      const journal = Array.from(mergedJournalMap.values());

      const mergedExpensesMap = new Map<string, PersonalExpense>();
      local.expenses.forEach(e => mergedExpensesMap.set(e.id, e));
      remoteExpenses.forEach(e => mergedExpensesMap.set(e.id, e));
      const expenses = Array.from(mergedExpensesMap.values());

      const scratchpad = remoteScratchpad || local.scratchpad;

      // 3. Update local storage cache INSTANTLY
      localStorage.setItem(`df_goals_todo_${uid}`, JSON.stringify(goals));
      localStorage.setItem(`df_habits_data_${uid}`, JSON.stringify(habits));
      localStorage.setItem(`df_daily_journal_${uid}`, JSON.stringify(journal));
      localStorage.setItem(`df_personal_expenses_${uid}`, JSON.stringify(expenses));
      localStorage.setItem(`df_quick_scratchpad_${uid}`, scratchpad);

      // 4. Background Non-Blocking Cloud Upload of Missing Local Items
      setTimeout(async () => {
        try {
          const missingGoals = local.goals.filter(g => !remoteGoals.some(rg => rg.id === g.id));
          const missingHabits = local.habits.filter(h => !remoteHabits.some(rh => rh.id === h.id));
          const missingJournal = local.journal.filter(j => !remoteJournal.some(rj => rj.id === j.id));
          const missingExpenses = local.expenses.filter(e => !remoteExpenses.some(re => re.id === e.id));

          await Promise.all([
            ...missingGoals.map(g => saveGoal(g, uid)),
            ...missingHabits.map(h => saveHabit(h, uid)),
            ...missingJournal.map(j => saveJournal(j, uid)),
            ...missingExpenses.map(e => saveExpense(e, uid)),
            local.scratchpad && !remoteScratchpad ? saveScratchpad(local.scratchpad, uid) : Promise.resolve()
          ]);
        } catch (err) {
          console.warn('Background sync warning:', err);
        }
      }, 100);

      return { goals, habits, journal, expenses, scratchpad };
    })(), 8000);
  } catch (error) {
    console.warn('Failed to load Firestore data, using account local storage cache.', error);
    return local;
  }
}

// ---------------- FAST & RELIABLE JSON BACKUP IMPORT ----------------
export async function importWorkspaceData(backupData: any, userId?: string) {
  const uid = resolveActiveUserId(userId);
  const goals: GoalTodo[] = Array.isArray(backupData.goals) ? backupData.goals : [];
  const habits: HabitData[] = Array.isArray(backupData.habits) ? backupData.habits : [];
  const journal: DailyJournal[] = Array.isArray(backupData.journalEntries) 
    ? backupData.journalEntries 
    : (Array.isArray(backupData.journal) ? backupData.journal : []);
  const expenses: PersonalExpense[] = Array.isArray(backupData.expenses) ? backupData.expenses : [];
  const scratchpad: string = backupData.scratchpadText || backupData.scratchpad || '';

  // 1. Save to LocalStorage INSTANTLY under standardized account key
  localStorage.setItem(`df_goals_todo_${uid}`, JSON.stringify(goals));
  localStorage.setItem(`df_habits_data_${uid}`, JSON.stringify(habits));
  localStorage.setItem(`df_daily_journal_${uid}`, JSON.stringify(journal));
  localStorage.setItem(`df_personal_expenses_${uid}`, JSON.stringify(expenses));
  if (scratchpad) {
    localStorage.setItem(`df_quick_scratchpad_${uid}`, scratchpad);
  }

  // 2. Parallel Cloud Firestore Sync (Fast non-blocking batch execution)
  if (!isLocalModeEnabled()) {
    try {
      await Promise.all([
        ...goals.map(g => saveGoal(g, uid)),
        ...habits.map(h => saveHabit(h, uid)),
        ...journal.map(j => saveJournal(j, uid)),
        ...expenses.map(e => saveExpense(e, uid)),
        scratchpad ? saveScratchpad(scratchpad, uid) : Promise.resolve()
      ]);
    } catch (err) {
      console.warn('Firestore import sync warning:', err);
    }
  }

  return { goals, habits, journal, expenses, scratchpad };
}

// ---------------- ACCOUNT-SCOPED ACTIONS & SYNCS ----------------

// Goals To-Do
export async function saveGoal(goal: GoalTodo, userId?: string) {
  const uid = resolveActiveUserId(userId);
  const current = loadFromLocalStorage(uid);
  const index = current.goals.findIndex(g => g.id === goal.id);
  if (index >= 0) current.goals[index] = goal;
  else current.goals.push(goal);
  localStorage.setItem(`df_goals_todo_${uid}`, JSON.stringify(current.goals));

  if (isLocalModeEnabled()) return;
  try {
    await setDoc(doc(db, 'users', uid, 'goals_todo', goal.id), { ...goal, userId: uid });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, `users/${uid}/goals_todo/${goal.id}`);
  }
}

export async function deleteGoal(id: string, userId?: string) {
  const uid = resolveActiveUserId(userId);
  const current = loadFromLocalStorage(uid);
  current.goals = current.goals.filter(g => g.id !== id);
  localStorage.setItem(`df_goals_todo_${uid}`, JSON.stringify(current.goals));

  if (isLocalModeEnabled()) return;
  try {
    await deleteDoc(doc(db, 'users', uid, 'goals_todo', id));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, `users/${uid}/goals_todo/${id}`);
  }
}

// Habits
export async function saveHabit(habit: HabitData, userId?: string) {
  const uid = resolveActiveUserId(userId);
  const current = loadFromLocalStorage(uid);
  const index = current.habits.findIndex(h => h.id === habit.id);
  if (index >= 0) current.habits[index] = habit;
  else current.habits.push(habit);
  localStorage.setItem(`df_habits_data_${uid}`, JSON.stringify(current.habits));

  if (isLocalModeEnabled()) return;
  try {
    await setDoc(doc(db, 'users', uid, 'habits_data', habit.id), { ...habit, userId: uid });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, `users/${uid}/habits_data/${habit.id}`);
  }
}

export async function deleteHabit(id: string, userId?: string) {
  const uid = resolveActiveUserId(userId);
  const current = loadFromLocalStorage(uid);
  current.habits = current.habits.filter(h => h.id !== id);
  localStorage.setItem(`df_habits_data_${uid}`, JSON.stringify(current.habits));

  if (isLocalModeEnabled()) return;
  try {
    await deleteDoc(doc(db, 'users', uid, 'habits_data', id));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, `users/${uid}/habits_data/${id}`);
  }
}

// Daily Journal
export async function saveJournal(journal: DailyJournal, userId?: string) {
  const uid = resolveActiveUserId(userId);
  const current = loadFromLocalStorage(uid);
  const index = current.journal.findIndex(j => j.id === journal.id);
  if (index >= 0) current.journal[index] = journal;
  else current.journal.push(journal);
  localStorage.setItem(`df_daily_journal_${uid}`, JSON.stringify(current.journal));

  if (isLocalModeEnabled()) return;
  try {
    await setDoc(doc(db, 'users', uid, 'daily_journal', journal.id), { ...journal, userId: uid });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, `users/${uid}/daily_journal/${journal.id}`);
  }
}

export async function deleteJournal(id: string, userId?: string) {
  const uid = resolveActiveUserId(userId);
  const current = loadFromLocalStorage(uid);
  current.journal = current.journal.filter(j => j.id !== id);
  localStorage.setItem(`df_daily_journal_${uid}`, JSON.stringify(current.journal));

  if (isLocalModeEnabled()) return;
  try {
    await deleteDoc(doc(db, 'users', uid, 'daily_journal', id));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, `users/${uid}/daily_journal/${id}`);
  }
}

// Expenses Ledger
export async function saveExpense(expense: PersonalExpense, userId?: string) {
  const uid = resolveActiveUserId(userId);
  const current = loadFromLocalStorage(uid);
  const index = current.expenses.findIndex(e => e.id === expense.id);
  if (index >= 0) current.expenses[index] = expense;
  else current.expenses.push(expense);
  localStorage.setItem(`df_personal_expenses_${uid}`, JSON.stringify(current.expenses));

  if (isLocalModeEnabled()) return;
  try {
    await setDoc(doc(db, 'users', uid, 'personal_expenses', expense.id), { ...expense, userId: uid });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, `users/${uid}/personal_expenses/${expense.id}`);
  }
}

export async function deleteExpense(id: string, userId?: string) {
  const uid = resolveActiveUserId(userId);
  const current = loadFromLocalStorage(uid);
  current.expenses = current.expenses.filter(e => e.id !== id);
  localStorage.setItem(`df_personal_expenses_${uid}`, JSON.stringify(current.expenses));

  if (isLocalModeEnabled()) return;
  try {
    await deleteDoc(doc(db, 'users', uid, 'personal_expenses', id));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, `users/${uid}/personal_expenses/${id}`);
  }
}

// Quick Scratchpad
export async function saveScratchpad(text: string, userId?: string) {
  const uid = resolveActiveUserId(userId);
  localStorage.setItem(`df_quick_scratchpad_${uid}`, text);

  if (isLocalModeEnabled()) return;
  try {
    await setDoc(doc(db, 'users', uid, 'quick_scratchpad', 'single_doc'), {
      id: 'single_doc',
      text,
      userId: uid,
      lastUpdated: Date.now()
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, `users/${uid}/quick_scratchpad/single_doc`);
  }
}

// ---------------- PURGE USER DATA ----------------
export async function purgeAllWorkspaceData(userId?: string) {
  const uid = resolveActiveUserId(userId);

  localStorage.removeItem(`df_goals_todo_${uid}`);
  localStorage.removeItem(`df_habits_data_${uid}`);
  localStorage.removeItem(`df_daily_journal_${uid}`);
  localStorage.removeItem(`df_personal_expenses_${uid}`);
  localStorage.removeItem(`df_quick_scratchpad_${uid}`);

  if (isLocalModeEnabled()) return;

  try {
    const goalsSnap = await getDocs(collection(db, 'users', uid, 'goals_todo'));
    for (const d of goalsSnap.docs) {
      await deleteDoc(doc(db, 'users', uid, 'goals_todo', d.id));
    }
    const habitsSnap = await getDocs(collection(db, 'users', uid, 'habits_data'));
    for (const d of habitsSnap.docs) {
      await deleteDoc(doc(db, 'users', uid, 'habits_data', d.id));
    }
    const journalSnap = await getDocs(collection(db, 'users', uid, 'daily_journal'));
    for (const d of journalSnap.docs) {
      await deleteDoc(doc(db, 'users', uid, 'daily_journal', d.id));
    }
    const expensesSnap = await getDocs(collection(db, 'users', uid, 'personal_expenses'));
    for (const d of expensesSnap.docs) {
      await deleteDoc(doc(db, 'users', uid, 'personal_expenses', d.id));
    }
    await deleteDoc(doc(db, 'users', uid, 'quick_scratchpad', 'single_doc'));
  } catch (error) {
    console.error('Failed purging Firestore data', error);
  }
}

// ---------------- REALTIME SNAPSHOT LISTENERS PER USER ----------------
export function syncScratchpadRealtime(callback: (text: string) => void, userId?: string) {
  if (isLocalModeEnabled()) return () => {};
  const uid = resolveActiveUserId(userId);

  return onSnapshot(doc(db, 'users', uid, 'quick_scratchpad', 'single_doc'), (snap) => {
    if (snap.exists()) {
      callback((snap.data() as any).text || '');
    }
  }, (error) => {
    handleFirestoreError(error, OperationType.GET, `users/${uid}/quick_scratchpad/single_doc`);
  });
}

export function syncCollectionRealtime(collectionName: string, callback: (data: any[]) => void, userId?: string) {
  if (isLocalModeEnabled()) return () => {};
  const uid = resolveActiveUserId(userId);

  return onSnapshot(collection(db, 'users', uid, collectionName), (snap) => {
    const list: any[] = [];
    snap.forEach(d => list.push({ id: d.id, ...d.data() }));
    callback(list);
  }, (error) => {
    handleFirestoreError(error, OperationType.GET, `users/${uid}/` + collectionName);
  });
}
