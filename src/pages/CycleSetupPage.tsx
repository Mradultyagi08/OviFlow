import React, { useState, useContext } from "react";
import { useHistory } from "react-router-dom";
import { formatISO, startOfToday, subMonths, startOfMonth } from "date-fns";
import { ThemeContext } from "../state/Context";
import { useAuth } from "../state/AuthContext";
import { apiCycleSetup } from "../services/api";
import "./CycleSetup.css";

/* ── SVG icon components ───────────────────────────── */
const IconCalendar = () => (
  <svg
    width="20"
    height="20"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <rect
      x="3"
      y="4"
      width="18"
      height="18"
      rx="3"
    />
    <line
      x1="16"
      y1="2"
      x2="16"
      y2="6"
    />
    <line
      x1="8"
      y1="2"
      x2="8"
      y2="6"
    />
    <line
      x1="3"
      y1="10"
      x2="21"
      y2="10"
    />
  </svg>
);

const IconX = () => (
  <svg
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2.5"
    strokeLinecap="round"
  >
    <line
      x1="18"
      y1="6"
      x2="6"
      y2="18"
    />
    <line
      x1="6"
      y1="6"
      x2="18"
      y2="18"
    />
  </svg>
);

const IconChevronRight = () => (
  <svg
    width="14"
    height="14"
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

const IconPlus = () => (
  <svg
    width="14"
    height="14"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2.5"
    strokeLinecap="round"
  >
    <line
      x1="12"
      y1="5"
      x2="12"
      y2="19"
    />
    <line
      x1="5"
      y1="12"
      x2="19"
      y2="12"
    />
  </svg>
);

const IconArrowRight = () => (
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
    <line
      x1="5"
      y1="12"
      x2="19"
      y2="12"
    />
    <polyline points="12 5 19 12 12 19" />
  </svg>
);

/* ── Symptom icons ─────────────────────────────────── */
const IconCramps = () => (
  <svg
    width="18"
    height="18"
    viewBox="0 0 24 24"
    fill="none"
    stroke="#e05c7a"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path
      d="M12 2C8 2 5 6 5 10c0 5 7 12 7 12s7-7 7-12c0-4-3-8-7-8z"
      fill="#fca5a5"
      stroke="#e05c7a"
    />
  </svg>
);

const IconMoodSwings = () => (
  <svg
    width="18"
    height="18"
    viewBox="0 0 24 24"
    fill="none"
    stroke="#f59e42"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <circle
      cx="12"
      cy="12"
      r="9"
      fill="#fde68a"
    />
    <path
      d="M8 15s1.5-2 4-2 4 2 4 2"
      stroke="#d97706"
    />
    <line
      x1="9"
      y1="9"
      x2="9.01"
      y2="9"
      strokeWidth="3"
    />
    <line
      x1="15"
      y1="9"
      x2="15.01"
      y2="9"
      strokeWidth="3"
    />
  </svg>
);

const IconFatigue = () => (
  <svg
    width="18"
    height="18"
    viewBox="0 0 24 24"
    fill="none"
    stroke="#7c6fcd"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M3 12h18" />
    <path d="M3 6c0 0 2 2 9 2s9-2 9-2" />
    <path d="M3 18c0 0 2-2 9-2s9 2 9 2" />
    <rect
      x="2"
      y="6"
      width="20"
      height="12"
      rx="3"
      fill="#ddd6fe"
      stroke="#7c6fcd"
    />
    <circle
      cx="12"
      cy="12"
      r="2"
      fill="#7c6fcd"
    />
  </svg>
);

const IconHeadache = () => (
  <svg
    width="18"
    height="18"
    viewBox="0 0 24 24"
    fill="none"
    stroke="#f59e0b"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <polygon
      points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"
      fill="#fde68a"
      stroke="#f59e0b"
    />
  </svg>
);

const IconBloating = () => (
  <svg
    width="18"
    height="18"
    viewBox="0 0 24 24"
    fill="none"
    stroke="#3b9edd"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path
      d="M12 2C8 2 5 8 5 13a7 7 0 0 0 14 0c0-5-3-11-7-11z"
      fill="#bfdbfe"
      stroke="#3b9edd"
    />
  </svg>
);

const IconBackPain = () => (
  <svg
    width="18"
    height="18"
    viewBox="0 0 24 24"
    fill="none"
    stroke="#ef4444"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path
      d="M12 2c1.5 3 3 5 3 8a3 3 0 0 1-6 0c0-3 1.5-5 3-8z"
      fill="#fca5a5"
      stroke="#ef4444"
    />
    <path
      d="M9 14c-2 2-2 5 0 6"
      stroke="#ef4444"
    />
    <path
      d="M15 14c2 2 2 5 0 6"
      stroke="#ef4444"
    />
  </svg>
);

const SYMPTOM_ICONS: Record<string, React.ReactNode> = {
  cramps: <IconCramps />,
  mood_swings: <IconMoodSwings />,
  fatigue: <IconFatigue />,
  headache: <IconHeadache />,
  bloating: <IconBloating />,
  back_pain: <IconBackPain />,
};

const ALL_SYMPTOMS = [
  { id: "cramps", label: "Cramps" },
  { id: "mood_swings", label: "Mood Swings" },
  { id: "fatigue", label: "Fatigue" },
  { id: "headache", label: "Headache" },
  { id: "bloating", label: "Bloating" },
  { id: "back_pain", label: "Back Pain" },
];

const CycleSetupPage: React.FC = () => {
  const history = useHistory();
  const { token, setUser } = useAuth();
  const theme = useContext(ThemeContext).theme;
  const isDark = theme === "dark";

  const todayISO = formatISO(startOfToday(), { representation: "date" });
  const minDate = formatISO(startOfMonth(subMonths(startOfToday(), 6)), {
    representation: "date",
  });

  const [lastPeriodDate, setLastPeriodDate] = useState(todayISO);
  const [cycleLength, setCycleLength] = useState(28);
  const [periodLength, setPeriodLength] = useState(5);
  const [cycleLengthEnabled, setCycleLengthEnabled] = useState(true);
  const [selectedSymptoms, setSelectedSymptoms] = useState<string[]>([
    "cramps",
    "mood_swings",
  ]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const toggleSymptom = (id: string) => {
    setSelectedSymptoms((prev) =>
      prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id],
    );
  };

  const handleSubmit = async () => {
    setError("");
    if (!lastPeriodDate) {
      setError("Please pick your last period start date.");
      return;
    }
    if (cycleLength < 21 || cycleLength > 40) {
      setError("Cycle length should be between 21 and 40 days.");
      return;
    }
    if (periodLength < 1 || periodLength > 10) {
      setError("Period length should be between 1 and 10 days.");
      return;
    }
    setLoading(true);
    try {
      const { user } = await apiCycleSetup(token!, {
        lastPeriodDate,
        cycleLength,
        periodLength,
      });
      setUser(user);
      history.replace("/OVIFLOW/");
    } catch (err: unknown) {
      setError((err as Error).message || "Failed to save cycle info");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={`cs-backdrop ${isDark ? "dark" : ""}`}>
      <div className="cs-modal">
        {/* ── Header ── */}
        <div className="cs-header">
          <span className="cs-header-icon">
            <IconCalendar />
          </span>
          <h2 className="cs-title">Cycle Tracking</h2>
          <button
            className="cs-close-btn"
            type="button"
            onClick={() => history.replace("/OVIFLOW/")}
            aria-label="Close"
          >
            <IconX />
          </button>
        </div>

        {error && <div className="cs-error">{error}</div>}

        {/* ── Date picker ── */}
        <p className="cs-question">When did your last period start?</p>
        <div className="cs-date-row">
          <span className="cs-date-icon">
            <IconCalendar />
          </span>
          <input
            type="date"
            className="cs-date-input"
            min={minDate}
            max={todayISO}
            value={lastPeriodDate}
            onChange={(e) => setLastPeriodDate(e.target.value)}
          />
        </div>

        {/* ── Cycle length ── */}
        <div className="cs-cycle-row">
          <label className="cs-cycle-check-label">
            <input
              type="checkbox"
              checked={cycleLengthEnabled}
              onChange={(e) => setCycleLengthEnabled(e.target.checked)}
            />
            <span>Average Cycle Length</span>
          </label>
          <div className="cs-stepper">
            <button
              type="button"
              className="cs-step-btn"
              onClick={() => setCycleLength((v) => Math.max(21, v - 1))}
              disabled={!cycleLengthEnabled}
            >
              −
            </button>
            <span className="cs-step-val">{cycleLength}</span>
            <button
              type="button"
              className="cs-step-btn"
              onClick={() => setCycleLength((v) => Math.min(40, v + 1))}
              disabled={!cycleLengthEnabled}
            >
              +
            </button>
            <span className="cs-step-unit">days</span>
          </div>
        </div>
        <p className="cs-hint">Helps us estimate your next period.</p>

        {/* ── Symptoms ── */}
        <div className="cs-symptoms-header">
          <span className="cs-symptoms-title">Symptoms</span>
          <button
            type="button"
            className="cs-add-btn"
            aria-label="Add symptom"
          >
            <IconPlus />
          </button>
        </div>
        <div className="cs-symptoms-grid">
          {ALL_SYMPTOMS.map((s) => (
            <button
              key={s.id}
              type="button"
              className={`cs-symptom-chip ${selectedSymptoms.includes(s.id) ? "active" : ""}`}
              onClick={() => toggleSymptom(s.id)}
            >
              <span className="cs-symptom-icon">{SYMPTOM_ICONS[s.id]}</span>
              <span className="cs-symptom-label">{s.label}</span>
              <span className="cs-symptom-arrow">
                <IconChevronRight />
              </span>
            </button>
          ))}
        </div>

        {/* ── Footer ── */}
        <div className="cs-footer">
          <button
            type="button"
            className="cs-cancel-btn"
            onClick={() => history.replace("/OVIFLOW/")}
          >
            Cancel
          </button>
          <button
            type="button"
            className="cs-save-btn"
            disabled={loading}
            onClick={() => {
              handleSubmit().catch(console.error);
            }}
          >
            {loading ? "Saving…" : "Save"}
            {!loading && (
              <span className="cs-save-arrow">
                <IconArrowRight />
              </span>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default CycleSetupPage;
