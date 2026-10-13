"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useSyncExternalStore,
  type ReactNode,
} from "react";

export type User = { name: string };
export type SavedScore = { game: string; score: number; name: string; at: number };

const USER_KEY = "av_user";
const SCORES_KEY = "av_scores";
const NO_SCORES: SavedScore[] = [];

// Respaldo en memoria: si localStorage está bloqueado la sesión funciona, pero no persiste.
const memory = new Map<string, string>();
const listeners = new Set<() => void>();

function subscribe(cb: () => void) {
  listeners.add(cb);
  window.addEventListener("storage", cb);
  return () => {
    listeners.delete(cb);
    window.removeEventListener("storage", cb);
  };
}

function read(key: string): string | null {
  try {
    return localStorage.getItem(key);
  } catch {
    return memory.get(key) ?? null;
  }
}

function write(key: string, value: string | null) {
  if (value === null) memory.delete(key);
  else memory.set(key, value);
  try {
    if (value === null) localStorage.removeItem(key);
    else localStorage.setItem(key, value);
  } catch {}
  listeners.forEach((l) => l());
}

function parse<T>(raw: string | null, fallback: T): T {
  if (!raw) return fallback;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

type Session = {
  user: User | null;
  scores: SavedScore[];
  login: (user: User | null) => void;
  signOut: () => void;
  saveScore: (entry: Omit<SavedScore, "at">) => void;
};

const SessionContext = createContext<Session | null>(null);

export function SessionProvider({ children }: { children: ReactNode }) {
  // El snapshot del servidor es null: el primer render siempre es "invitado" y no desajusta la hidratación.
  const rawUser = useSyncExternalStore(subscribe, () => read(USER_KEY), () => null);
  const rawScores = useSyncExternalStore(subscribe, () => read(SCORES_KEY), () => null);
  const user = useMemo(() => parse<User | null>(rawUser, null), [rawUser]);
  const scores = useMemo(() => parse<SavedScore[]>(rawScores, NO_SCORES), [rawScores]);

  // Aquí se conectaría la API REST / Supabase
  const login = useCallback((u: User | null) => write(USER_KEY, u ? JSON.stringify(u) : null), []);
  const signOut = useCallback(() => write(USER_KEY, null), []);
  // Aquí se conectaría la API REST / Supabase
  const saveScore = useCallback((entry: Omit<SavedScore, "at">) => {
    const all = parse<SavedScore[]>(read(SCORES_KEY), []);
    write(SCORES_KEY, JSON.stringify([...all, { ...entry, at: Date.now() }]));
  }, []);

  const value = useMemo(
    () => ({ user, scores, login, signOut, saveScore }),
    [user, scores, login, signOut, saveScore],
  );
  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
}

export function useSession(): Session {
  const ctx = useContext(SessionContext);
  if (!ctx) throw new Error("useSession debe usarse dentro de <SessionProvider>");
  return ctx;
}
