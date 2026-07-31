import { Session } from "../types";

const KEY = "pps-disc-internal-prototype:sessions";
const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:8787";
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || "";
const SUPABASE_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || "";
const SUPABASE_TABLE = "pps_app_state";
const SUPABASE_STATE_ID = "main";

function hasSupabaseConfig() {
  return Boolean(SUPABASE_URL && SUPABASE_KEY);
}

export function loadSessions(): Session[] {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    localStorage.removeItem(KEY);
    return [];
  }
}

export function saveSessions(sessions: Session[]): void {
  localStorage.setItem(KEY, JSON.stringify(sessions));
}

export async function loadSharedSessions(): Promise<Session[] | undefined> {
  const supabaseSessions = await loadSupabaseSessions();
  if (supabaseSessions) return supabaseSessions;

  try {
    const response = await fetch(`${API_BASE}/api/sessions`);
    if (!response.ok) return undefined;
    const parsed = await response.json();
    return Array.isArray(parsed) ? parsed : undefined;
  } catch {
    return undefined;
  }
}

export async function saveSharedSessions(sessions: Session[]): Promise<boolean> {
  saveSessions(sessions);
  const savedToSupabase = await saveSupabaseSessions(sessions);
  if (savedToSupabase) return true;

  try {
    const response = await fetch(`${API_BASE}/api/sessions`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(sessions)
    });
    return response.ok;
  } catch {
    return false;
  }
}

async function loadSupabaseSessions(): Promise<Session[] | undefined> {
  if (!hasSupabaseConfig()) return undefined;

  try {
    const response = await fetch(`${SUPABASE_URL}/rest/v1/${SUPABASE_TABLE}?id=eq.${SUPABASE_STATE_ID}&select=sessions`, {
      headers: {
        apikey: SUPABASE_KEY,
        Authorization: `Bearer ${SUPABASE_KEY}`
      }
    });

    if (!response.ok) return undefined;
    const rows = await response.json();
    const sessions = rows?.[0]?.sessions;
    return Array.isArray(sessions) ? sessions : [];
  } catch {
    return undefined;
  }
}

async function saveSupabaseSessions(sessions: Session[]): Promise<boolean> {
  if (!hasSupabaseConfig()) return false;

  try {
    const response = await fetch(`${SUPABASE_URL}/rest/v1/${SUPABASE_TABLE}`, {
      method: "POST",
      headers: {
        apikey: SUPABASE_KEY,
        Authorization: `Bearer ${SUPABASE_KEY}`,
        "Content-Type": "application/json",
        Prefer: "resolution=merge-duplicates"
      },
      body: JSON.stringify({
        id: SUPABASE_STATE_ID,
        sessions,
        updated_at: new Date().toISOString()
      })
    });

    return response.ok;
  } catch {
    return false;
  }
}

export function downloadText(filename: string, text: string, type = "text/plain;charset=utf-8"): void {
  const blob = new Blob([text], { type });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}
