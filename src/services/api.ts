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

/* ── Pregnancy ─────────────────────────────────────────────────── */

export interface PregnancySetupPayload {
  lastMenstrualPeriod: string;
  confirmDate: string;
  type: "confirmed" | "maybe";
  doctorConfirmed: boolean;
  highRisk: boolean;
  dueDate: string;
}

export interface PregnancyProfile {
  lastMenstrualPeriod: string;
  confirmDate: string;
  type: "confirmed" | "maybe";
  doctorConfirmed: boolean;
  highRisk: boolean;
  dueDate: string;
}

export function apiPregnancySetup(
  token: string,
  data: PregnancySetupPayload,
): Promise<{ user: UserProfile }> {
  return request<{ user: UserProfile }>("/cycle/pregnancy/setup", {
    method: "PUT",
    body: data,
    token,
  });
}

export function apiGetPregnancyProfile(
  token: string,
): Promise<{ pregnancy: PregnancyProfile }> {
  return request<{ pregnancy: PregnancyProfile }>("/cycle/pregnancy/profile", { token });
}

export interface PregnancyLogPayload {
  date: string;
  waterGlasses?: number;
  vitaminsTaken?: boolean;
  symptoms?: string[];
  contractions?: Array<{ duration: number; time: string }>;
  nextAppointmentDate?: string;
  appointmentNotes?: string;
  checklistItems?: string[];
  notes?: string;
}

export interface PregnancyLog {
  _id: string;
  userId: string;
  date: string;
  waterGlasses: number;
  vitaminsTaken: boolean;
  symptoms: string[];
  contractions: Array<{ duration: number; time: string }>;
  nextAppointmentDate: string;
  appointmentNotes: string;
  checklistItems: string[];
  notes: string;
}

export function apiSavePregnancyLog(
  token: string,
  data: PregnancyLogPayload,
): Promise<{ log: PregnancyLog }> {
  return request<{ log: PregnancyLog }>("/cycle/pregnancy/log", {
    method: "POST",
    body: data,
    token,
  });
}

export function apiGetPregnancyLogs(
  token: string,
): Promise<{ logs: PregnancyLog[] }> {
  return request<{ logs: PregnancyLog[] }>("/cycle/pregnancy/logs", { token });
}

/* ── Postpartum ────────────────────────────────────────────────── */

export interface PostpartumSetupPayload {
  deliveryDate: string;
  deliveryMethod: "vaginal" | "csection";
  doctorFollowUp: boolean;
}

export interface PostpartumProfile {
  deliveryDate: string;
  deliveryMethod: "vaginal" | "csection";
  doctorFollowUp: boolean;
}

export function apiPostpartumSetup(
  token: string,
  data: PostpartumSetupPayload,
): Promise<{ user: UserProfile }> {
  return request<{ user: UserProfile }>("/cycle/postpartum/setup", {
    method: "PUT",
    body: data,
    token,
  });
}

export function apiGetPostpartumProfile(
  token: string,
): Promise<{ postpartum: PostpartumProfile }> {
  return request<{ postpartum: PostpartumProfile }>("/cycle/postpartum/profile", { token });
}

export interface PostpartumLogPayload {
  date: string;
  mood?: string;
  symptoms?: string[];
  energy?: number;
  pain?: number;
  sleep?: number;
  waterGlasses?: number;
  ironSupplementTaken?: boolean;
  vitaminsTaken?: boolean;
  motherChecklist?: string[];
  feeds?: Array<{ side: string; duration: number; time: string }>;
  feedCount?: number;
  babySleepHours?: number;
  nextAppointmentDate?: string;
  appointmentChecklist?: string[];
  notes?: string;
}

export interface PostpartumLog {
  _id: string;
  userId: string;
  date: string;
  mood: string;
  symptoms: string[];
  energy: number;
  pain: number;
  sleep: number;
  waterGlasses: number;
  ironSupplementTaken: boolean;
  vitaminsTaken: boolean;
  motherChecklist: string[];
  feeds: Array<{ side: string; duration: number; time: string }>;
  feedCount: number;
  babySleepHours: number;
  nextAppointmentDate: string;
  appointmentChecklist: string[];
  notes: string;
}

export function apiSavePostpartumLog(
  token: string,
  data: PostpartumLogPayload,
): Promise<{ log: PostpartumLog }> {
  return request<{ log: PostpartumLog }>("/cycle/postpartum/log", {
    method: "POST",
    body: data,
    token,
  });
}

export function apiGetPostpartumLogs(
  token: string,
): Promise<{ logs: PostpartumLog[] }> {
  return request<{ logs: PostpartumLog[] }>("/cycle/postpartum/logs", { token });
}

/* ── State Management ──────────────────────────────────────────── */

export function apiChangeUserState(
  token: string,
  newState: "cycle" | "pregnancy" | "postpartum",
): Promise<{ user: UserProfile }> {
  return request<{ user: UserProfile }>("/cycle/state", {
    method: "PUT",
    body: { newState },
    token,
  });
}
