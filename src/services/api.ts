const API_BASE = "http://localhost:5001/api";

interface ApiOptions {
  method?: string;
  body?: unknown;
  token?: string;
}

async function request<T>(endpoint: string, opts: ApiOptions = {}): Promise<T> {
  const { method = "GET", body, token } = opts;

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const res = await fetch(`${API_BASE}${endpoint}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  const data: Record<string, unknown> = (await res.json()) as Record<
    string,
    unknown
  >;

  if (!res.ok) {
    throw new Error(
      (data.message as string | undefined) || "Something went wrong",
    );
  }

  return data as unknown as T;
}

/* ── Auth types ─────────────────────────────────────────── */

export interface UserProfile {
  _id: string;
  name: string;
  email: string;
  userState: string;
  isOnboarded: boolean;
  cycleProfile: {
    lastPeriodDate: string;
    cycleLength: number;
    periodLength: number;
  };
  pregnancy: Record<string, unknown>;
  postpartum: Record<string, unknown>;
}

export interface AuthResponse {
  token: string;
  user: UserProfile;
}

/* ── Auth ─────────────────────────────────────────────── */

export function apiRegister(
  name: string,
  email: string,
  password: string,
): Promise<AuthResponse> {
  return request<AuthResponse>("/auth/register", {
    method: "POST",
    body: { name, email, password },
  });
}

export function apiLogin(
  email: string,
  password: string,
): Promise<AuthResponse> {
  return request<AuthResponse>("/auth/login", {
    method: "POST",
    body: { email, password },
  });
}

export function apiGetMe(token: string): Promise<{ user: UserProfile }> {
  return request<{ user: UserProfile }>("/auth/me", { token });
}

/* ── Cycle ────────────────────────────────────────────── */

export interface CycleSetupPayload {
  lastPeriodDate: string;
  cycleLength: number;
  periodLength: number;
}

export function apiCycleSetup(
  token: string,
  data: CycleSetupPayload,
): Promise<{ user: UserProfile }> {
  return request<{ user: UserProfile }>("/cycle/setup", {
    method: "PUT",
    body: data,
    token,
  });
}

/* ── Cycle Logs ──────────────────────────────────────────────────── */

export interface CycleLogPayload {
  date: string;
  isPeriod: boolean;
  flow: string;
  mood: string;
  symptoms: string[];
  notes: string;
}

export interface CycleLog {
  _id: string;
  userId: string;
  date: string;
  isPeriod: boolean;
  flow: string;
  mood: string;
  symptoms: string[];
  notes: string;
}

export function apiSaveCycleLog(
  token: string,
  data: CycleLogPayload,
): Promise<{ log: CycleLog }> {
  return request<{ log: CycleLog }>("/cycle/log", {
    method: "POST",
    body: data,
    token,
  });
}

export function apiGetCycleLogs(
  token: string,
): Promise<{ logs: CycleLog[] }> {
  return request<{ logs: CycleLog[] }>("/cycle/logs", { token });
}
