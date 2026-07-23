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
  // Dynamically resolve database ID from config or fallback to remixed-firestore-database-id
  const dbId = firebaseConfigJson.firestoreDatabaseId || "remixed-firestore-database-id";
  db = getFirestore(app, dbId);
  auth = getAuth(app);
} catch (e) {
  console.warn("Firebase initialization failed. Operating in Pure Local Mode.", e);
}

export { db, auth };

// Error Handling Structures as per SKILL.md
export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
  }
}

function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
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
  throw new Error(JSON.stringify(errInfo));
}

// ---------------- LOCAL MODE TRACKER ----------------
export function isLocalModeEnabled(): boolean {
  if (!db || !auth) return true;
  const saved = localStorage.getItem('deep_focus_os_local_only');
  if (saved === 'true') return true;
  if (saved === 'false') return false;
  return true; // Default to true as user declined Firebase setup
}

export function setLocalModeEnabled(enabled: boolean) {
  localStorage.setItem('deep_focus_os_local_only', enabled ? 'true' : 'false');
}

// Timeout helper for Firebase operations to prevent hanging promises
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

// ---------------- LOCAL STORAGE CACHE HELPERS ----------------
export function loadFromLocalStorage() {
  const savedGoals = localStorage.getItem('df_goals_todo');
  const savedHabits = localStorage.getItem('df_habits_data');
  const savedJournal = localStorage.getItem('df_daily_journal');
  const savedExpenses = localStorage.getItem('df_personal_expenses');
  const savedScratchpad = localStorage.getItem('df_quick_scratchpad');

  const goals: GoalTodo[] = savedGoals ? JSON.parse(savedGoals) : [];
  const habits: HabitData[] = savedHabits ? JSON.parse(savedHabits) : [];
  const journal: DailyJournal[] = savedJournal ? JSON.parse(savedJournal) : [];
  const expenses: PersonalExpense[] = savedExpenses ? JSON.parse(savedExpenses) : [];
  const scratchpad: string = savedScratchpad || 'Type your breakthrough idea here...';

  return { goals, habits, journal, expenses, scratchpad };
}

// ---------------- LOAD ALL WORKSPACE DATA ----------------
export async function loadWorkspaceData() {
  if (isLocalModeEnabled()) {
    return loadFromLocalStorage();
  }

  try {
    return await withTimeout((async () => {
      // Load Goals
      const goalsSnap = await getDocs(collection(db, 'goals_todo'));
      const goals: GoalTodo[] = [];
      goalsSnap.forEach(d => goals.push({ id: d.id, ...d.data() } as GoalTodo));

      // Load Habits
      const habitsSnap = await getDocs(collection(db, 'habits_data'));
      const habits: HabitData[] = [];
      habitsSnap.forEach(d => habits.push({ id: d.id, ...d.data() } as HabitData));

      // Load Journal
      const journalSnap = await getDocs(collection(db, 'daily_journal'));
      const journal: DailyJournal[] = [];
      journalSnap.forEach(d => journal.push({ id: d.id, ...d.data() } as DailyJournal));

      // Load Expenses
      const expensesSnap = await getDocs(collection(db, 'personal_expenses'));
      const expenses: PersonalExpense[] = [];
      expensesSnap.forEach(d => expenses.push({ id: d.id, ...d.data() } as PersonalExpense));

      // Load Scratchpad
      const padDoc = await getDoc(doc(db, 'quick_scratchpad', 'single_doc'));
      let scratchpad = 'Type your breakthrough idea here...';
      if (padDoc.exists()) {
        scratchpad = (padDoc.data() as any).text || '';
      }

      return { goals, habits, journal, expenses, scratchpad };
    })(), 2000);
  } catch (error) {
    console.warn('Failed to load Firestore data, falling back to local storage cache.', error);
    return loadFromLocalStorage();
  }
}

// ---------------- ACTIONS & SYNCS ----------------

// Goals To-Do
export async function saveGoal(goal: GoalTodo) {
  // Always update local cache first
  const current = loadFromLocalStorage();
  const index = current.goals.findIndex(g => g.id === goal.id);
  if (index >= 0) current.goals[index] = goal;
  else current.goals.push(goal);
  localStorage.setItem('df_goals_todo', JSON.stringify(current.goals));

  if (isLocalModeEnabled()) return;
  try {
    await setDoc(doc(db, 'goals_todo', goal.id), goal);
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, `goals_todo/${goal.id}`);
  }
}

export async function deleteGoal(id: string) {
  const current = loadFromLocalStorage();
  current.goals = current.goals.filter(g => g.id !== id);
  localStorage.setItem('df_goals_todo', JSON.stringify(current.goals));

  if (isLocalModeEnabled()) return;
  try {
    await deleteDoc(doc(db, 'goals_todo', id));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, `goals_todo/${id}`);
  }
}

// Habits
export async function saveHabit(habit: HabitData) {
  const current = loadFromLocalStorage();
  const index = current.habits.findIndex(h => h.id === habit.id);
  if (index >= 0) current.habits[index] = habit;
  else current.habits.push(habit);
  localStorage.setItem('df_habits_data', JSON.stringify(current.habits));

  if (isLocalModeEnabled()) return;
  try {
    await setDoc(doc(db, 'habits_data', habit.id), habit);
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, `habits_data/${habit.id}`);
  }
}

export async function deleteHabit(id: string) {
  const current = loadFromLocalStorage();
  current.habits = current.habits.filter(h => h.id !== id);
  localStorage.setItem('df_habits_data', JSON.stringify(current.habits));

  if (isLocalModeEnabled()) return;
  try {
    await deleteDoc(doc(db, 'habits_data', id));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, `habits_data/${id}`);
  }
}

// Daily Journal
export async function saveJournal(journal: DailyJournal) {
  const current = loadFromLocalStorage();
  const index = current.journal.findIndex(j => j.id === journal.id);
  if (index >= 0) current.journal[index] = journal;
  else current.journal.push(journal);
  localStorage.setItem('df_daily_journal', JSON.stringify(current.journal));

  if (isLocalModeEnabled()) return;
  try {
    await setDoc(doc(db, 'daily_journal', journal.id), journal);
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, `daily_journal/${journal.id}`);
  }
}

// Expenses Ledger
export async function saveExpense(expense: PersonalExpense) {
  const current = loadFromLocalStorage();
  const index = current.expenses.findIndex(e => e.id === expense.id);
  if (index >= 0) current.expenses[index] = expense;
  else current.expenses.push(expense);
  localStorage.setItem('df_personal_expenses', JSON.stringify(current.expenses));

  if (isLocalModeEnabled()) return;
  try {
    await setDoc(doc(db, 'personal_expenses', expense.id), expense);
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, `personal_expenses/${expense.id}`);
  }
}

export async function deleteExpense(id: string) {
  const current = loadFromLocalStorage();
  current.expenses = current.expenses.filter(e => e.id !== id);
  localStorage.setItem('df_personal_expenses', JSON.stringify(current.expenses));

  if (isLocalModeEnabled()) return;
  try {
    await deleteDoc(doc(db, 'personal_expenses', id));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, `personal_expenses/${id}`);
  }
}

// Quick Scratchpad
export async function saveScratchpad(text: string) {
  localStorage.setItem('df_quick_scratchpad', text);

  if (isLocalModeEnabled()) return;
  try {
    await setDoc(doc(db, 'quick_scratchpad', 'single_doc'), {
      id: 'single_doc',
      text,
      lastUpdated: Date.now()
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, 'quick_scratchpad/single_doc');
  }
}

// ---------------- PURGE DATA ----------------
export async function purgeAllWorkspaceData() {
  // Clear local storage keys
  localStorage.removeItem('df_goals_todo');
  localStorage.removeItem('df_habits_data');
  localStorage.removeItem('df_daily_journal');
  localStorage.removeItem('df_personal_expenses');
  localStorage.removeItem('df_quick_scratchpad');
  localStorage.removeItem('df_scratchpad_archive');
  localStorage.removeItem('df_user_profile');
  localStorage.removeItem('df_active_theme_id');
  localStorage.removeItem('df_custom_accent_color');
  localStorage.removeItem('df_is_light_mode');

  if (isLocalModeEnabled()) return;

  try {
    // Delete goals
    const goalsSnap = await getDocs(collection(db, 'goals_todo'));
    for (const d of goalsSnap.docs) {
      await deleteDoc(doc(db, 'goals_todo', d.id));
    }
    // Delete habits
    const habitsSnap = await getDocs(collection(db, 'habits_data'));
    for (const d of habitsSnap.docs) {
      await deleteDoc(doc(db, 'habits_data', d.id));
    }
    // Delete journal
    const journalSnap = await getDocs(collection(db, 'daily_journal'));
    for (const d of journalSnap.docs) {
      await deleteDoc(doc(db, 'daily_journal', d.id));
    }
    // Delete expenses
    const expensesSnap = await getDocs(collection(db, 'personal_expenses'));
    for (const d of expensesSnap.docs) {
      await deleteDoc(doc(db, 'personal_expenses', d.id));
    }
    // Delete scratchpad
    await deleteDoc(doc(db, 'quick_scratchpad', 'single_doc'));
  } catch (error) {
    console.error('Failed purging Firestore data', error);
  }
}

// ---------------- REALTIME SNAPSHOT LISTENERS ----------------
export function syncScratchpadRealtime(callback: (text: string) => void) {
  if (isLocalModeEnabled()) return () => {};
  
  return onSnapshot(doc(db, 'quick_scratchpad', 'single_doc'), (snap) => {
    if (snap.exists()) {
      callback((snap.data() as any).text || '');
    }
  }, (error) => {
    handleFirestoreError(error, OperationType.GET, 'quick_scratchpad/single_doc');
  });
}

export function syncCollectionRealtime(collectionName: string, callback: (data: any[]) => void) {
  if (isLocalModeEnabled()) return () => {};

  return onSnapshot(collection(db, collectionName), (snap) => {
    const list: any[] = [];
    snap.forEach(d => list.push({ id: d.id, ...d.data() }));
    callback(list);
  }, (error) => {
    handleFirestoreError(error, OperationType.GET, collectionName);
  });
}
