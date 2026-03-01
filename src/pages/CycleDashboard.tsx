import React, { useState, useEffect, useContext } from "react";
import { IonPage, IonContent } from "@ionic/react";
import {
  addDays,
  differenceInDays,
  startOfToday,
  parseISO,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  getDay,
  format,
  isSameDay,
  isToday,
} from "date-fns";
import { ThemeContext } from "../state/Context";
import { useAuth } from "../state/AuthContext";
import { apiSaveCycleLog, apiGetCycleLogs } from "../services/api";
import type { CycleLog } from "../services/api";
import "./CycleDashboard.css";

/* ─────────────────────────────────────────────────────
   Helpers
───────────────────────────────────────────────────── */
function calcNextPeriod(lastPeriodDate: string, cycleLength: number) {
  const start = parseISO(lastPeriodDate);
  const today = startOfToday();
  let next = addDays(start, cycleLength);
  while (next <= today) next = addDays(next, cycleLength);
  return next;
}

function calcOvulation(lastPeriodDate: string, cycleLength: number) {
  const start = parseISO(lastPeriodDate);
  const today = startOfToday();
  let next = addDays(start, cycleLength - 14);
  while (next <= today) next = addDays(next, cycleLength);
  return next;
}

function getCyclePhase(
  lastPeriodDate: string,
  cycleLength: number,
  periodLength: number,
): string {
  const start = parseISO(lastPeriodDate);
  const today = startOfToday();
  let segStart = start;
  while (addDays(segStart, cycleLength) <= today) {
    segStart = addDays(segStart, cycleLength);
  }
  const dayOfCycle = differenceInDays(today, segStart) + 1;
  const ovulDay = cycleLength - 14;
  if (dayOfCycle <= periodLength) return "Menstrual";
  if (dayOfCycle <= ovulDay - 2) return "Follicular";
  if (dayOfCycle <= ovulDay + 2) return "Ovulation";
  return "Luteal";
}

function getPhaseColor(phase: string) {
  switch (phase) {
    case "Menstrual":
      return "#e05c7a";
    case "Follicular":
      return "#7c3aed";
    case "Ovulation":
      return "#f59e0b";
    case "Luteal":
      return "#6366f1";
    default:
      return "#7c3aed";
  }
}

function calcProgressRing(lastPeriodDate: string, cycleLength: number) {
  const start = parseISO(lastPeriodDate);
  const today = startOfToday();
  let segStart = start;
  while (addDays(segStart, cycleLength) <= today) {
    segStart = addDays(segStart, cycleLength);
  }
  const dayOfCycle = differenceInDays(today, segStart) + 1;
  return Math.min((dayOfCycle / cycleLength) * 100, 100);
}

function calcHealthScore(logs: CycleLog[], cycleLength: number): number {
  let score = 70;
  if (cycleLength >= 25 && cycleLength <= 32) score += 15;
  else if (cycleLength >= 21 && cycleLength <= 35) score += 5;
  const recent = logs.slice(0, 7);
  const sympCount = recent.reduce((s, l) => s + l.symptoms.length, 0);
  score -= Math.min(sympCount * 2, 25);
  const happyCount = recent.filter(
    (l) => l.mood === "happy" || l.mood === "okay",
  ).length;
  score += happyCount;
  return Math.max(0, Math.min(100, Math.round(score)));
}

function getScoreColor(score: number) {
  if (score >= 75) return "#22c55e";
  if (score >= 50) return "#f59e0b";
  return "#ef4444";
}

function isPeriodDay(date: Date, logs: CycleLog[]) {
  const ds = format(date, "yyyy-MM-dd");
  return logs.some((l) => l.date === ds && l.isPeriod);
}

function isOvulationDay(
  date: Date,
  lastPeriodDate: string,
  cycleLength: number,
) {
  const ovul = calcOvulation(lastPeriodDate, cycleLength);
  return isSameDay(date, ovul);
}

/* ─────────────────────────────────────────────────────
   SVG Icons
───────────────────────────────────────────────────── */
const IconSun = () => (
  <svg
    width="18"
    height="18"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <circle
      cx="12"
      cy="12"
      r="5"
    />
    <line
      x1="12"
      y1="1"
      x2="12"
      y2="3"
    />
    <line
      x1="12"
      y1="21"
      x2="12"
      y2="23"
    />
    <line
      x1="4.22"
      y1="4.22"
      x2="5.64"
      y2="5.64"
    />
    <line
      x1="18.36"
      y1="18.36"
      x2="19.78"
      y2="19.78"
    />
    <line
      x1="1"
      y1="12"
      x2="3"
      y2="12"
    />
    <line
      x1="21"
      y1="12"
      x2="23"
      y2="12"
    />
    <line
      x1="4.22"
      y1="19.78"
      x2="5.64"
      y2="18.36"
    />
    <line
      x1="18.36"
      y1="5.64"
      x2="19.78"
      y2="4.22"
    />
  </svg>
);
const IconChevronRight = () => (
  <svg
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2.5"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <polyline points="9 18 15 12 9 6" />
  </svg>
);
const IconChevronLeft = () => (
  <svg
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2.5"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <polyline points="15 18 9 12 15 6" />
  </svg>
);

/* ─────────────────────────────────────────────────────
   Mode Confirmation Modal
───────────────────────────────────────────────────── */
interface ModeModalProps {
  mode: "pregnant" | "postpartum";
  onConfirm: () => void;
  onCancel: () => void;
}
const ModeConfirmModal: React.FC<ModeModalProps> = ({
  mode,
  onConfirm,
  onCancel,
}) => (
  <div
    className="cd-overlay"
    onClick={onCancel}
  >
    <div
      className="cd-confirm-modal"
      onClick={(e) => e.stopPropagation()}
    >
      <h3 className="cd-confirm-title">
        Switch to {mode === "pregnant" ? "Pregnancy" : "Postpartum"} mode?
      </h3>
      <p className="cd-confirm-body">
        {mode === "pregnant"
          ? "This will switch your dashboard to Pregnancy Care. Are you sure?"
          : "This will switch your dashboard to Postpartum Tracking. Are you sure?"}
      </p>
      <div className="cd-confirm-footer">
        <button
          className="cd-confirm-cancel"
          onClick={onCancel}
        >
          Cancel
        </button>
        <button
          className="cd-confirm-ok"
          onClick={onConfirm}
        >
          Yes, switch
        </button>
      </div>
    </div>
  </div>
);

/* ─────────────────────────────────────────────────────
   Main Dashboard
───────────────────────────────────────────────────── */
const CycleDashboard: React.FC = () => {
  const { user, token } = useAuth();
  const { theme } = useContext(ThemeContext);
  const isDark = theme === "dark";

  const cp = user?.cycleProfile;
  const lastPeriodDate =
    cp?.lastPeriodDate || format(startOfToday(), "yyyy-MM-dd");
  const cycleLength = cp?.cycleLength ?? 28;
  const periodLength = cp?.periodLength ?? 5;

  /* ── Mode ── */
  const [activeMode, setActiveMode] = useState<
    "cycle" | "pregnant" | "postpartum"
  >("cycle");
  const [pendingMode, setPendingMode] = useState<
    "pregnant" | "postpartum" | null
  >(null);

  /* ── Quick Log ── */
  const todayStr = format(startOfToday(), "yyyy-MM-dd");
  const [isPeriod, setIsPeriod] = useState(false);
  const [flow, setFlow] = useState<"" | "light" | "medium" | "heavy">("");
  const [mood, setMood] = useState<"" | "happy" | "okay" | "low" | "anxious">(
    "",
  );
  const [symptoms, setSymptoms] = useState<string[]>([]);
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState("");

  /* ── Logs ── */
  const [logs, setLogs] = useState<CycleLog[]>([]);

  /* ── Calendar ── */
  const [calMonth, setCalMonth] = useState(startOfToday());

  useEffect(() => {
    if (!token) return;
    apiGetCycleLogs(token)
      .then(({ logs: l }) => setLogs(l))
      .catch(console.error);
  }, [token]);

  /* ── Derived ── */
  const nextPeriod = calcNextPeriod(lastPeriodDate, cycleLength);
  const daysUntil = differenceInDays(nextPeriod, startOfToday());
  const ovulationDate = calcOvulation(lastPeriodDate, cycleLength);
  const phase = getCyclePhase(lastPeriodDate, cycleLength, periodLength);
  const phaseColor = getPhaseColor(phase);
  const progress = calcProgressRing(lastPeriodDate, cycleLength);
  const healthScore = calcHealthScore(logs, cycleLength);
  const scoreColor = getScoreColor(healthScore);

  /* ── Ring math ── */
  const R = 58;
  const C = 2 * Math.PI * R;
  const dash = (progress / 100) * C;

  /* ── Symptom toggle ── */
  const toggleSymptom = (s: string) =>
    setSymptoms((prev) =>
      prev.includes(s) ? prev.filter((x) => x !== s) : [...prev, s],
    );

  /* ── Save log ── */
  const saveLog = async () => {
    if (!token) return;
    setSaving(true);
    setSaveMsg("");
    try {
      const { log } = await apiSaveCycleLog(token, {
        date: todayStr,
        isPeriod,
        flow: isPeriod ? flow : "",
        mood,
        symptoms,
        notes,
      });
      setLogs((prev) => {
        const filtered = prev.filter((l) => l.date !== todayStr);
        return [log, ...filtered];
      });
      setSaveMsg("Saved!");
      setTimeout(() => setSaveMsg(""), 2500);
    } catch (err) {
      setSaveMsg("Error saving. Try again.");
    } finally {
      setSaving(false);
    }
  };

  /* ── Calendar data ── */
  const monthStart = startOfMonth(calMonth);
  const monthEnd = endOfMonth(calMonth);
  const calDays = eachDayOfInterval({ start: monthStart, end: monthEnd });
  const startPad = getDay(monthStart); // 0=Sun

  /* ── Mode switch ── */
  const handleModeClick = (m: "cycle" | "pregnant" | "postpartum") => {
    if (m === "cycle") {
      setActiveMode("cycle");
      return;
    }
    setPendingMode(m);
  };

  return (
    <IonPage>
      <IonContent
        className="ion-padding"
        scrollY={true}
      >
        <div className={`cd-root ${isDark ? "dark" : ""}`}>
          {/* ── Mode confirm modal ── */}
          {pendingMode && (
            <ModeConfirmModal
              mode={pendingMode}
              onConfirm={() => {
                setActiveMode(pendingMode);
                setPendingMode(null);
              }}
              onCancel={() => setPendingMode(null)}
            />
          )}

          <div className="cd-container">
            {/* ═══════════════════════════════════════════
            TOP BAR — WELCOME + MODE SWITCHER
        ═══════════════════════════════════════════ */}
            <div className="cd-topbar">
              <div className="cd-welcome">
                <div>
                  <p className="cd-welcome-sub">Today's Overview</p>
                  <h1 className="cd-welcome-name">
                    Welcome, {user?.name?.split(" ")[0] ?? "there"} 👋
                  </h1>
                </div>
                <div className="cd-welcome-date">
                  <span className="cd-welcome-date-icon">
                    <IconSun />
                  </span>
                  <span>{format(startOfToday(), "MMM d")}</span>
                </div>
              </div>

              <div className="cd-mode-switcher">
                {(["cycle", "pregnant", "postpartum"] as const).map((m) => (
                  <button
                    key={m}
                    className={`cd-mode-btn ${activeMode === m ? "active" : ""}`}
                    onClick={() => handleModeClick(m)}
                  >
                    {m === "cycle"
                      ? "Cycle"
                      : m === "pregnant"
                        ? "Pregnant"
                        : "Postpartum"}
                  </button>
                ))}
              </div>
            </div>

            {/* ═══════════════════════════════════════════
            BODY GRID — 2 COLUMNS ON DESKTOP
        ═══════════════════════════════════════════ */}
            <div className="cd-body-grid">
              {/* ── LEFT COLUMN ── */}
              <div className="cd-col-left">
                {/* ── HERO CARD ── */}
                <div className="cd-hero">
                  <div className="cd-ring-wrap">
                    <svg
                      width="140"
                      height="140"
                      viewBox="0 0 140 140"
                    >
                      <circle
                        cx="70"
                        cy="70"
                        r={R}
                        fill="none"
                        stroke="rgba(255,255,255,0.15)"
                        strokeWidth="10"
                      />
                      <circle
                        cx="70"
                        cy="70"
                        r={R}
                        fill="none"
                        stroke="#fff"
                        strokeWidth="10"
                        strokeDasharray={`${dash} ${C}`}
                        strokeLinecap="round"
                        transform="rotate(-90 70 70)"
                        style={{ transition: "stroke-dasharray 0.6s ease" }}
                      />
                      <text
                        x="70"
                        y="65"
                        textAnchor="middle"
                        dy="0.3em"
                        fill="#fff"
                        fontSize="28"
                        fontWeight="800"
                      >
                        {daysUntil}
                      </text>
                      <text
                        x="70"
                        y="88"
                        textAnchor="middle"
                        fill="rgba(255,255,255,0.75)"
                        fontSize="10"
                      >
                        days left
                      </text>
                    </svg>
                  </div>
                  <div className="cd-hero-info">
                    <p className="cd-hero-label">Next Period</p>
                    <p className="cd-hero-date">
                      {format(nextPeriod, "MMM d")}
                    </p>
                    <div className="cd-hero-divider" />
                    <p className="cd-hero-label">Ovulation</p>
                    <p className="cd-hero-date cd-hero-date-sm">
                      {format(ovulationDate, "MMM d")}
                    </p>
                    <div className="cd-hero-divider" />
                    <span
                      className="cd-phase-badge"
                      style={{ background: "rgba(255,255,255,0.22)" }}
                    >
                      <span
                        className="cd-phase-dot"
                        style={{ background: "#fff" }}
                      />
                      {phase}
                    </span>
                  </div>
                </div>

                {/* ── CALENDAR ── */}
                <div className="cd-card">
                  <div className="cd-cal-header">
                    <button
                      className="cd-cal-nav"
                      onClick={() =>
                        setCalMonth((m) => addDays(startOfMonth(m), -1))
                      }
                    >
                      <IconChevronLeft />
                    </button>
                    <h2
                      className="cd-card-title"
                      style={{ margin: 0 }}
                    >
                      {format(calMonth, "MMMM yyyy")}
                    </h2>
                    <button
                      className="cd-cal-nav"
                      onClick={() =>
                        setCalMonth((m) => addDays(endOfMonth(m), 1))
                      }
                    >
                      <IconChevronRight />
                    </button>
                  </div>
                  <div className="cd-cal-grid">
                    {["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"].map((d) => (
                      <div
                        key={d}
                        className="cd-cal-dow"
                      >
                        {d}
                      </div>
                    ))}
                    {Array.from({ length: startPad }).map((_, i) => (
                      <div
                        key={`pad-${i}`}
                        className="cd-cal-day empty"
                      />
                    ))}
                    {calDays.map((day) => {
                      const period = isPeriodDay(day, logs);
                      const ovul = isOvulationDay(
                        day,
                        lastPeriodDate,
                        cycleLength,
                      );
                      const today = isToday(day);
                      return (
                        <div
                          key={day.toISOString()}
                          className={[
                            "cd-cal-day",
                            period ? "period" : "",
                            ovul ? "ovulation" : "",
                            today ? "today" : "",
                          ]
                            .filter(Boolean)
                            .join(" ")}
                        >
                          {format(day, "d")}
                        </div>
                      );
                    })}
                  </div>
                  <div className="cd-cal-legend">
                    <span className="cd-legend-item">
                      <span className="cd-legend-dot period" /> Period
                    </span>
                    <span className="cd-legend-item">
                      <span className="cd-legend-dot ovulation" /> Ovulation
                    </span>
                    <span className="cd-legend-item">
                      <span className="cd-legend-dot today" /> Today
                    </span>
                  </div>
                </div>
              </div>
              {/* end cd-col-left */}

              {/* ── RIGHT COLUMN ── */}
              <div className="cd-col-right">
                {/* ── QUICK LOG ── */}
                <div className="cd-card">
                  <h2 className="cd-card-title">Log Today's Cycle</h2>
                  <div className="cd-log-row">
                    <span className="cd-log-label">On period today?</span>
                    <button
                      className={`cd-toggle ${isPeriod ? "on" : ""}`}
                      onClick={() => {
                        setIsPeriod((v) => !v);
                        if (!isPeriod) {
                          setFlow("");
                        }
                      }}
                    >
                      <span className="cd-toggle-knob" />
                    </button>
                  </div>
                  {isPeriod && (
                    <div className="cd-chip-group">
                      {(["light", "medium", "heavy"] as const).map((f) => (
                        <button
                          key={f}
                          className={`cd-chip ${flow === f ? "active" : ""}`}
                          onClick={() => setFlow(f)}
                        >
                          {f.charAt(0).toUpperCase() + f.slice(1)}
                        </button>
                      ))}
                    </div>
                  )}
                  <p className="cd-log-section-label">Mood</p>
                  <div className="cd-mood-group">
                    {(
                      [
                        { id: "happy", icon: "😊", label: "Happy" },
                        { id: "okay", icon: "😐", label: "Okay" },
                        { id: "low", icon: "😞", label: "Low" },
                        { id: "anxious", icon: "😰", label: "Anxious" },
                      ] as const
                    ).map(({ id, icon, label }) => (
                      <button
                        key={id}
                        className={`cd-mood-btn ${mood === id ? "active" : ""}`}
                        onClick={() => setMood(mood === id ? "" : id)}
                      >
                        <span className="cd-mood-icon">{icon}</span>
                        <span className="cd-mood-label">{label}</span>
                      </button>
                    ))}
                  </div>
                  <p className="cd-log-section-label">Symptoms</p>
                  <div className="cd-symptom-group">
                    {[
                      "Cramps",
                      "Headache",
                      "Bloating",
                      "Fatigue",
                      "Nausea",
                      "Back pain",
                    ].map((s) => (
                      <button
                        key={s}
                        className={`cd-chip ${symptoms.includes(s) ? "active" : ""}`}
                        onClick={() => toggleSymptom(s)}
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                  <p className="cd-log-section-label">
                    Notes <span className="cd-optional">(optional)</span>
                  </p>
                  <textarea
                    className="cd-notes"
                    placeholder="How are you feeling today?"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    rows={3}
                  />
                  {saveMsg && (
                    <p
                      className={`cd-save-msg ${saveMsg === "Saved!" ? "success" : "error"}`}
                    >
                      {saveMsg}
                    </p>
                  )}
                  <button
                    className="cd-save-btn"
                    disabled={saving}
                    onClick={() => {
                      saveLog().catch(console.error);
                    }}
                  >
                    {saving ? "Saving…" : "Save Today's Log"}
                  </button>
                </div>

                {/* ── HEALTH SCORE ── */}
                <div className="cd-card">
                  <div className="cd-score-header">
                    <h2
                      className="cd-card-title"
                      style={{ margin: 0 }}
                    >
                      Cycle Health Score
                    </h2>
                    <span
                      className="cd-score-value"
                      style={{ color: scoreColor }}
                    >
                      {healthScore}
                    </span>
                  </div>
                  <div className="cd-score-track">
                    <div
                      className="cd-score-fill"
                      style={{
                        width: `${healthScore}%`,
                        background: scoreColor,
                      }}
                    />
                  </div>
                  <div className="cd-score-labels">
                    <span>0</span>
                    <span style={{ color: scoreColor, fontWeight: 700 }}>
                      {healthScore}/100
                    </span>
                    <span>100</span>
                  </div>
                  <p className="cd-score-desc">
                    {healthScore >= 75
                      ? "Your cycle looks healthy! Keep logging daily."
                      : healthScore >= 50
                        ? "Moderate score — try tracking symptoms consistently."
                        : "Several symptoms detected. Consider consulting a doctor."}
                  </p>
                </div>
              </div>
              {/* end cd-col-right */}
            </div>
            {/* end cd-body-grid */}
          </div>
        </div>
      </IonContent>
    </IonPage>
  );
};

export default CycleDashboard;
