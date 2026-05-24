const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:5001/api";

/* ── Toast helper ── */
let toastTimeout: ReturnType<typeof setTimeout> | null = null;

function showToast(message: string, type: "error" | "success" = "error") {
  let container = document.getElementById("app-toast");
  if (!container) {
    container = document.createElement("div");
    container.id = "app-toast";
    container.style.cssText =
      "position:fixed;top:16px;left:50%;transform:translateX(-50%);z-index:99999;padding:12px 20px;border-radius:10px;font-size:14px;font-weight:500;color:#fff;pointer-events:none;opacity:0;transition:opacity 0.3s;max-width:90vw;text-align:center;";
    document.body.appendChild(container);
  }
  container.textContent = message;
  container.style.background = type === "error" ? "#ef4444" : "#22c55e";
  container.style.opacity = "1";
  if (toastTimeout) clearTimeout(toastTimeout);
  toastTimeout = setTimeout(() => {
    container!.style.opacity = "0";
  }, 4000);
}

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

  let res: Response;
  try {
    res = await fetch(`${API_BASE}${endpoint}`, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
    });
  } catch {
    showToast("Network error — check your connection");
    throw new Error("Network error");
  }

  const data: Record<string, unknown> = (await res.json()) as Record<
    string,
    unknown
  >;

  if (!res.ok) {
    const msg = (data.message as string | undefined) || "Something went wrong";
    showToast(msg);
    throw new Error(msg);
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
  preferences?: Record<string, unknown>;
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

export function apiPatchCycleProfile(
  token: string,
  data: { cycleLength?: number; periodLength?: number },
): Promise<{ cycleProfile: { cycleLength: number; periodLength: number } }> {
  return request<{ cycleProfile: { cycleLength: number; periodLength: number } }>("/cycle/profile", {
    method: "PATCH",
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

export function apiGetPredictions(
  token: string,
): Promise<{ predictions: any; cycles: any[] }> {
  return request<{ predictions: any; cycles: any[] }>("/cycle/predictions", { token });
}

/* ── AI ───────────────────────────────────────────────────────── */

export interface AiInsight {
  title: string;
  insight: string;
  why: string;
  nextAction: string;
  confidence: "low" | "medium" | "high";
  model?: string;
}

export interface AiInsightResponse extends AiInsight {}

export interface AiChatResponse {
  message: string;
  model?: string;
  provider?: string;
  apiBase?: string;
  modelName?: string;
}

export function apiGetAiInsight(
  token: string,
  mode: "cycle" | "pregnancy" | "postpartum",
): Promise<AiInsightResponse> {
  return request<AiInsightResponse>("/ai/insight", {
    method: "POST",
    body: { mode },
    token,
  });
}

export function apiSendAiChat(
  token: string,
  mode: "cycle" | "pregnancy" | "postpartum",
  message: string,
): Promise<AiChatResponse> {
  return request<AiChatResponse>("/ai/chat", {
    method: "POST",
    body: { mode, message },
    token,
  });
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

export function apiResetAllData(
  token: string,
): Promise<{ message: string }> {
  return request<{ message: string }>("/cycle/reset", {
    method: "DELETE",
    token,
  });
}

/* ── Settings / Account ───────────────────────────────────────────── */

export function apiChangeName(
  token: string,
  name: string,
): Promise<{ user: UserProfile }> {
  return request<{ user: UserProfile }>("/auth/name", {
    method: "PUT",
    body: { name },
    token,
  });
}

export function apiChangePassword(
  token: string,
  currentPassword: string,
  newPassword: string,
): Promise<{ message: string }> {
  return request<{ message: string }>("/auth/password", {
    method: "PUT",
    body: { currentPassword, newPassword },
    token,
  });
}

export function apiUpdatePreferences(
  token: string,
  prefs: Record<string, unknown>,
): Promise<{ user: UserProfile }> {
  return request<{ user: UserProfile }>("/auth/preferences", {
    method: "PUT",
    body: prefs,
    token,
  });
}

export function apiDeleteAccount(
  token: string,
): Promise<{ message: string }> {
  return request<{ message: string }>("/auth/account", {
    method: "DELETE",
    token,
  });
}

export function apiExportData(
  token: string,
): Promise<{ logs: CycleLog[]; pregnancyLogs: unknown[]; postpartumLogs: unknown[] }> {
  return request<{ logs: CycleLog[]; pregnancyLogs: unknown[]; postpartumLogs: unknown[] }>("/cycle/export", {
    token,
  });
}
