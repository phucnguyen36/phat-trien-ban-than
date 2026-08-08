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
import { getAuth } from 'firebase/auth';
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
  db = getFirestore(app);
  auth = getAuth(app);
} catch (e) {
  console.warn("Firebase initialization failed. Operating in Pure Local Mode.", e);
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

// Helper to resolve Active Account User ID for Data Isolation
export function resolveActiveUserId(overrideUserId?: string): string {
  let raw = '';
  if (overrideUserId && overrideUserId.trim()) {
    raw = overrideUserId.trim().toLowerCase();
  } else {
    const savedUserStr = localStorage.getItem('df_os_active_user') || sessionStorage.getItem('df_os_active_user');
    if (savedUserStr) {
      try {
        const u = JSON.parse(savedUserStr);
        if (u && u.email) raw = String(u.email).trim().toLowerCase();
      } catch (e) {}
    }
  }
  if (!raw && auth?.currentUser?.email) {
    raw = auth.currentUser.email.trim().toLowerCase();
  }
  if (!raw) return 'default_user';
  return raw.replace(/[^a-zA-Z0-9_]/g, '_');
}

// ---------------- ACCOUNT-SCOPED LOCAL STORAGE HELPERS ----------------
export function loadFromLocalStorage(userId?: string) {
  const uid = resolveActiveUserId(userId);
  const savedGoals = localStorage.getItem(`df_goals_todo_${uid}`);
  const savedHabits = localStorage.getItem(`df_habits_data_${uid}`);
  const savedJournal = localStorage.getItem(`df_daily_journal_${uid}`);
  const savedExpenses = localStorage.getItem(`df_personal_expenses_${uid}`);
  const savedScratchpad = localStorage.getItem(`df_quick_scratchpad_${uid}`);

  const goals: GoalTodo[] = savedGoals ? JSON.parse(savedGoals) : [];
  const habits: HabitData[] = savedHabits ? JSON.parse(savedHabits) : [];
  const journal: DailyJournal[] = savedJournal ? JSON.parse(savedJournal) : [];
  const expenses: PersonalExpense[] = savedExpenses ? JSON.parse(savedExpenses) : [];
  const scratchpad: string = savedScratchpad || '# EXECUTIVE STRATEGY & BREAKTHROUGH SYSTEM\n\nStart typing notes for this account...';

  return { goals, habits, journal, expenses, scratchpad };
}

// ---------------- LOAD WORKSPACE DATA PER USER ----------------
export async function loadWorkspaceData(userId?: string) {
  const uid = resolveActiveUserId(userId);

  if (isLocalModeEnabled()) {
    return loadFromLocalStorage(uid);
  }

  try {
    return await withTimeout((async () => {
      // Load User Goals from subcollection: users/{uid}/goals_todo
      const goalsSnap = await getDocs(collection(db, 'users', uid, 'goals_todo'));
      const goals: GoalTodo[] = [];
      goalsSnap.forEach(d => goals.push({ id: d.id, ...d.data() } as GoalTodo));

      // Load User Habits from subcollection: users/{uid}/habits_data
      const habitsSnap = await getDocs(collection(db, 'users', uid, 'habits_data'));
      const habits: HabitData[] = [];
      habitsSnap.forEach(d => habits.push({ id: d.id, ...d.data() } as HabitData));

      // Load User Journal from subcollection: users/{uid}/daily_journal
      const journalSnap = await getDocs(collection(db, 'users', uid, 'daily_journal'));
      const journal: DailyJournal[] = [];
      journalSnap.forEach(d => journal.push({ id: d.id, ...d.data() } as DailyJournal));

      // Load User Expenses from subcollection: users/{uid}/personal_expenses
      const expensesSnap = await getDocs(collection(db, 'users', uid, 'personal_expenses'));
      const expenses: PersonalExpense[] = [];
      expensesSnap.forEach(d => expenses.push({ id: d.id, ...d.data() } as PersonalExpense));

      // Load User Scratchpad from: users/{uid}/quick_scratchpad/single_doc
      const padDoc = await getDoc(doc(db, 'users', uid, 'quick_scratchpad', 'single_doc'));
      let scratchpad = '# EXECUTIVE STRATEGY & BREAKTHROUGH SYSTEM\n\nStart typing notes for this account...';
      if (padDoc.exists()) {
        scratchpad = (padDoc.data() as any).text || '';
      }

      return { goals, habits, journal, expenses, scratchpad };
    })(), 2000);
  } catch (error) {
    console.warn('Failed to load Firestore data, falling back to account local storage cache.', error);
    return loadFromLocalStorage(uid);
  }
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
