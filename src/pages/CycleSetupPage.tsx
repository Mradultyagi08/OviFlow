import React, { useState, useContext } from "react";
import { useHistory } from "react-router-dom";
import { formatISO, startOfToday, subMonths, startOfMonth } from "date-fns";
import { ThemeContext } from "../state/Context";
import { useAuth } from "../state/AuthContext";
import { apiCycleSetup } from "../services/api";
import "./Auth.css";

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
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
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
    <div className={`cycle-setup-page ${isDark ? "dark" : ""}`}>
      <div className="cycle-card">
        <div className="auth-logo">
          <img
            src="/assets/icon/LOGO.png"
            alt="OVIFLOW"
            className="auth-logo-img"
          />
        </div>
        <h1 className="auth-title">Let&apos;s understand your cycle</h1>
        <p className="auth-subtitle">
          This helps us give you accurate predictions
        </p>

        <form
          className="auth-form"
          onSubmit={(e) => {
            handleSubmit(e).catch((err) => console.error(err));
          }}
        >
          {error && <div className="auth-error">{error}</div>}

          {/* ── Last Period Start Date ── */}
          <div className="auth-field">
            <label htmlFor="setup-date">Last Period Start Date</label>
            <input
              id="setup-date"
              type="date"
              min={minDate}
              max={todayISO}
              value={lastPeriodDate}
              onChange={(e) => setLastPeriodDate(e.target.value)}
            />
          </div>

          {/* ── Average Cycle Length ── */}
          <div className="auth-field">
            <label>Average Cycle Length</label>
            <div className="cycle-number-row">
              <input
                type="number"
                min={21}
                max={40}
                value={cycleLength}
                onChange={(e) => setCycleLength(Number(e.target.value))}
              />
              <span className="cycle-unit">days</span>
            </div>
          </div>

          {/* ── Average Period Length ── */}
          <div className="auth-field">
            <label>Average Period Length</label>
            <div className="cycle-number-row">
              <input
                type="number"
                min={1}
                max={10}
                value={periodLength}
                onChange={(e) => setPeriodLength(Number(e.target.value))}
              />
              <span className="cycle-unit">days</span>
            </div>
          </div>

          <button
            type="submit"
            className="auth-btn auth-btn-primary"
            disabled={loading}
          >
            {loading ? "Saving…" : "Continue"}
          </button>
        </form>
      </div>
    </div>
  );
};

export default CycleSetupPage;
