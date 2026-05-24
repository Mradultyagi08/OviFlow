import React, { useContext, useEffect, useState } from "react";
import { useHistory } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { IonPage, IonContent } from "@ionic/react";
import { ThemeContext, SettingsContext, CyclesContext } from "../state/Context";
import { configuration } from "../data/AppConfiguration";
import { storage } from "../data/Storage";
import { useAuth } from "../state/AuthContext";
import {
  apiChangeName,
  apiChangePassword,
  apiUpdatePreferences,
  apiDeleteAccount,
  apiResetAllData,
  apiExportData,
  apiPatchCycleProfile,
} from "../services/api";
import {
  changeTranslation,
  getCurrentTranslation,
  supportedLanguages,
} from "../utils/translation";
import { changeDateTimeLocale } from "../utils/datetime";
import "./Settings.css";

/* ── SVG Icons ── */
const Icon = ({ d }: { d: string }) => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d={d} />
  </svg>
);
const ChevronLeftIcon = () => <Icon d="M15 18l-6-6 6-6" />;
const UserIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
    <circle cx="12" cy="7" r="4" />
  </svg>
);
const PaletteIcon = () => <Icon d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10c.9 0 1.7-.1 2.5-.3" />;
const HeartIcon = () => <Icon d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />;
const ActivityIcon = () => <Icon d="M22 12h-4l-3 9L9 3l-3 9H2" />;
const LockIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
  </svg>
);
const DatabaseIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <ellipse cx="12" cy="5" rx="9" ry="3" />
    <path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3" />
    <path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5" />
  </svg>
);
const GlobeIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10" />
    <line x1="2" y1="12" x2="22" y2="12" />
    <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
  </svg>
);
const InfoIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10" />
    <line x1="12" y1="16" x2="12" y2="12" />
    <line x1="12" y1="8" x2="12.01" y2="8" />
  </svg>
);
const LogOutIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
    <polyline points="16 17 21 12 16 7" />
    <line x1="21" y1="12" x2="9" y2="12" />
  </svg>
);

/* ── Component ── */
const SettingsPage: React.FC = () => {
  const history = useHistory();
  const { t } = useTranslation();
  const { theme, updateTheme } = useContext(ThemeContext);
  const {
    maxNumberOfDisplayedCycles,
    updateMaxNumberOfDisplayedCycles,
    appMode,
    updateAppMode,
  } = useContext(SettingsContext);
  const { updateCycles } = useContext(CyclesContext);
  const { user, token, logout } = useAuth();

  const isDark = theme === "dark";
  const [currentLang, setCurrentLang] = useState(getCurrentTranslation());

  // Profile
  const [editingName, setEditingName] = useState(false);
  const [nameInput, setNameInput] = useState(user?.name || "");
  const [changingPassword, setChangingPassword] = useState(false);
  const [currentPw, setCurrentPw] = useState("");
  const [newPw, setNewPw] = useState("");

  // Appearance
  const [accentColor, setAccentColor] = useState("pink");

  // Cycle prefs
  const [cycleLength, setCycleLength] = useState(user?.cycleProfile?.cycleLength || 28);
  const [periodLength, setPeriodLength] = useState(user?.cycleProfile?.periodLength || 5);
  const [lutealPhase, setLutealPhase] = useState(14);
  const [ovulationReminder, setOvulationReminder] = useState(0);

  // Health
  const [waterGoal, setWaterGoal] = useState(8);
  const [tempUnit, setTempUnit] = useState<"C" | "F">("C");
  const [aiEnabled, setAiEnabled] = useState(true);

  // Privacy
  const [appLockEnabled, setAppLockEnabled] = useState(false);
  const [appLockPin, setAppLockPin] = useState("");

  useEffect(() => {
    setCurrentLang(getCurrentTranslation());
  }, []);

  // Load preferences from user
  useEffect(() => {
    if (user?.preferences) {
      const p = user.preferences as Record<string, unknown>;
      if (p.accentColor) setAccentColor(p.accentColor as string);
      if (p.waterGoal) setWaterGoal(p.waterGoal as number);
      if (p.temperatureUnit) setTempUnit(p.temperatureUnit as "C" | "F");
      if (p.aiInsightsEnabled !== undefined) setAiEnabled(p.aiInsightsEnabled as boolean);
      if (p.lutealPhaseLength) setLutealPhase(p.lutealPhaseLength as number);
      if (p.ovulationReminder !== undefined) setOvulationReminder(p.ovulationReminder as number);
      if (p.appLockEnabled !== undefined) setAppLockEnabled(p.appLockEnabled as boolean);
      if (p.appLockPin) setAppLockPin(p.appLockPin as string);
    }
  }, [user]);

  const savePreference = (prefs: Record<string, unknown>) => {
    if (token) apiUpdatePreferences(token, prefs).catch(console.error);
  };

  const handleLanguageChange = async (lang: string) => {
    setCurrentLang(lang);
    await changeTranslation(lang);
    changeDateTimeLocale(lang);
    await storage.set.language(lang);
  };

  const handleExportCSV = async () => {
    if (!token) return;
    try {
      const data = await apiExportData(token);
      const rows = [["date", "isPeriod", "flow", "mood", "symptoms", "notes"]];
      for (const log of data.logs) {
        rows.push([log.date, String(log.isPeriod), log.flow, log.mood, log.symptoms.join(";"), log.notes]);
      }
      const csv = rows.map(r => r.join(",")).join("\n");
      const blob = new Blob([csv], { type: "text/csv" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "oviflow-data.csv";
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Export failed:", err);
    }
  };

  const languageEntries = Array.from(supportedLanguages.entries());

  return (
    <IonPage>
      <IonContent color={`background-${theme}`}>
        <div className={`settings-page ${isDark ? "dark" : "light"}`}>
          {/* ── Header ── */}
          <div className="settings-header">
            <button className="settings-back-btn" onClick={() => history.goBack()} aria-label="Go back">
              <ChevronLeftIcon />
            </button>
            <h1 className="settings-title">{t("Settings")}</h1>
            <div style={{ width: 36 }} />
          </div>

          {/* ═══ PROFILE & ACCOUNT ═══ */}
          <section className="settings-section">
            <h2 className="settings-section-title"><UserIcon /><span>Profile & Account</span></h2>
            <div className="settings-card">
              {/* Name */}
              <div className="settings-toggle-row">
                <div>
                  <p className="settings-toggle-label">Name</p>
                  {editingName ? (
                    <input
                      className="settings-input"
                      value={nameInput}
                      onChange={(e) => setNameInput(e.target.value)}
                      onBlur={() => {
                        if (nameInput.trim() && token) {
                          apiChangeName(token, nameInput.trim()).catch(console.error);
                        }
                        setEditingName(false);
                      }}
                      onKeyDown={(e) => { if (e.key === "Enter") (e.target as HTMLInputElement).blur(); }}
                      autoFocus
                    />
                  ) : (
                    <p className="settings-toggle-desc" onClick={() => setEditingName(true)} style={{ cursor: "pointer" }}>
                      {user?.name || "Tap to set"} ✎
                    </p>
                  )}
                </div>
              </div>
              <div className="settings-divider" />
              {/* Email (read-only) */}
              <div className="settings-toggle-row">
                <div>
                  <p className="settings-toggle-label">Email</p>
                  <p className="settings-toggle-desc">{user?.email}</p>
                </div>
              </div>
              <div className="settings-divider" />
              {/* Change Password */}
              <div className="settings-toggle-row" style={{ flexDirection: "column", alignItems: "stretch" }}>
                {!changingPassword ? (
                  <button className="settings-text-btn" onClick={() => setChangingPassword(true)}>
                    Change Password
                  </button>
                ) : (
                  <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                    <input className="settings-input" type="password" placeholder="Current password" value={currentPw} onChange={(e) => setCurrentPw(e.target.value)} />
                    <input className="settings-input" type="password" placeholder="New password (min 6)" value={newPw} onChange={(e) => setNewPw(e.target.value)} />
                    <div style={{ display: "flex", gap: 8 }}>
                      <button className="settings-text-btn" onClick={() => setChangingPassword(false)}>Cancel</button>
                      <button className="settings-text-btn" style={{ color: "var(--cd-accent, #db2777)" }} onClick={() => {
                        if (token && currentPw && newPw.length >= 6) {
                          apiChangePassword(token, currentPw, newPw).then(() => {
                            setChangingPassword(false);
                            setCurrentPw("");
                            setNewPw("");
                          }).catch(console.error);
                        }
                      }}>Save</button>
                    </div>
                  </div>
                )}
              </div>
              <div className="settings-divider" />
              {/* Logout */}
              <button className="settings-action-row" onClick={() => { logout(); history.replace("/login"); }}>
                <LogOutIcon />
                <div className="settings-action-text">
                  <span className="settings-action-label">Logout</span>
                </div>
              </button>
            </div>
          </section>

          {/* ═══ LANGUAGE ═══ */}
          <section className="settings-section">
            <h2 className="settings-section-title"><GlobeIcon /><span>{t("Language")}</span></h2>
            <div className="settings-card">
              <div className="settings-select-group">
                {languageEntries.map(([code, label]) => (
                  <button key={code} className={`settings-lang-chip ${currentLang === code ? "active" : ""}`} onClick={() => { handleLanguageChange(code).catch(console.error); }}>
                    {label}
                  </button>
                ))}
              </div>
            </div>
          </section>

          {/* ═══ APPEARANCE ═══ */}
          <section className="settings-section">
            <h2 className="settings-section-title"><PaletteIcon /><span>Appearance</span></h2>
            <div className="settings-card">
              {/* Theme toggle */}
              <div className="settings-toggle-row">
                <div>
                  <p className="settings-toggle-label">Dark Mode</p>
                  <p className="settings-toggle-desc">Switch between light and dark theme</p>
                </div>
                <button
                  className={`settings-toggle ${isDark ? "on" : "off"}`}
                  onClick={() => { updateTheme(isDark ? "basic" : "dark"); savePreference({ theme: isDark ? "basic" : "dark" }); }}
                  aria-label="Toggle dark mode"
                >
                  <span className="settings-toggle-knob" />
                </button>
              </div>
              <div className="settings-divider" />
              {/* Accent color */}
              <div className="settings-toggle-row">
                <div>
                  <p className="settings-toggle-label">Accent Color</p>
                </div>
              </div>
              <div className="settings-color-row">
                {[
                  { id: "pink", color: "#db2777" },
                  { id: "purple", color: "#7c3aed" },
                  { id: "blue", color: "#2563eb" },
                  { id: "teal", color: "#0d9488" },
                ].map(({ id, color }) => (
                  <button
                    key={id}
                    className={`settings-color-dot ${accentColor === id ? "active" : ""}`}
                    style={{ background: color }}
                    onClick={() => { setAccentColor(id); savePreference({ accentColor: id }); }}
                    aria-label={id}
                  />
                ))}
              </div>
            </div>
          </section>

          {/* ═══ CYCLE PREFERENCES ═══ */}
          <section className="settings-section">
            <h2 className="settings-section-title"><HeartIcon /><span>Cycle Preferences</span></h2>
            <div className="settings-card">
              <div className="settings-toggle-row">
                <p className="settings-toggle-label">Default Cycle Length</p>
                <div className="settings-stepper">
                  <button onClick={() => { const v = Math.max(20, cycleLength - 1); setCycleLength(v); savePreference({ cycleLength: v }); if (token) apiPatchCycleProfile(token, { cycleLength: v }).catch(console.error); }}>-</button>
                  <span>{cycleLength} days</span>
                  <button onClick={() => { const v = Math.min(45, cycleLength + 1); setCycleLength(v); savePreference({ cycleLength: v }); if (token) apiPatchCycleProfile(token, { cycleLength: v }).catch(console.error); }}>+</button>
                </div>
              </div>
              <div className="settings-divider" />
              <div className="settings-toggle-row">
                <p className="settings-toggle-label">Default Period Length</p>
                <div className="settings-stepper">
                  <button onClick={() => { const v = Math.max(2, periodLength - 1); setPeriodLength(v); savePreference({ periodLength: v }); if (token) apiPatchCycleProfile(token, { periodLength: v }).catch(console.error); }}>-</button>
                  <span>{periodLength} days</span>
                  <button onClick={() => { const v = Math.min(10, periodLength + 1); setPeriodLength(v); savePreference({ periodLength: v }); if (token) apiPatchCycleProfile(token, { periodLength: v }).catch(console.error); }}>+</button>
                </div>
              </div>
              <div className="settings-divider" />
              <div className="settings-toggle-row">
                <p className="settings-toggle-label">Luteal Phase Length</p>
                <div className="settings-stepper">
                  <button onClick={() => { const v = Math.max(10, lutealPhase - 1); setLutealPhase(v); savePreference({ lutealPhaseLength: v }); }}>-</button>
                  <span>{lutealPhase} days</span>
                  <button onClick={() => { const v = Math.min(18, lutealPhase + 1); setLutealPhase(v); savePreference({ lutealPhaseLength: v }); }}>+</button>
                </div>
              </div>
              <div className="settings-divider" />
              <div className="settings-toggle-row">
                <div>
                  <p className="settings-toggle-label">Ovulation Reminder</p>
                  <p className="settings-toggle-desc">Days before expected ovulation</p>
                </div>
                <div className="settings-stepper">
                  <button onClick={() => { const v = Math.max(0, ovulationReminder - 1); setOvulationReminder(v); savePreference({ ovulationReminder: v }); }}>-</button>
                  <span>{ovulationReminder}</span>
                  <button onClick={() => { const v = Math.min(5, ovulationReminder + 1); setOvulationReminder(v); savePreference({ ovulationReminder: v }); }}>+</button>
                </div>
              </div>
              <div className="settings-divider" />
              {/* App Mode */}
              <div className="settings-toggle-row" style={{ flexDirection: "column", alignItems: "stretch" }}>
                <p className="settings-toggle-label" style={{ marginBottom: 8 }}>App Mode</p>
                <div className="settings-chip-row">
                  {[
                    { value: "regular", label: "Regular" },
                    { value: "pregnancy", label: "Pregnancy" },
                    { value: "postpartum", label: "Postpartum" },
                  ].map((opt) => (
                    <button key={opt.value} className={`settings-count-chip ${appMode === opt.value ? "active" : ""}`} onClick={() => updateAppMode(opt.value)}>
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </section>

          {/* ═══ HEALTH & LOGGING ═══ */}
          <section className="settings-section">
            <h2 className="settings-section-title"><ActivityIcon /><span>Health & Logging</span></h2>
            <div className="settings-card">
              <div className="settings-toggle-row">
                <p className="settings-toggle-label">Daily Water Goal</p>
                <div className="settings-stepper">
                  <button onClick={() => { const v = Math.max(4, waterGoal - 1); setWaterGoal(v); savePreference({ waterGoal: v }); }}>-</button>
                  <span>{waterGoal} glasses</span>
                  <button onClick={() => { const v = Math.min(16, waterGoal + 1); setWaterGoal(v); savePreference({ waterGoal: v }); }}>+</button>
                </div>
              </div>
              <div className="settings-divider" />
              <div className="settings-toggle-row">
                <p className="settings-toggle-label">Temperature Unit</p>
                <div className="settings-chip-row">
                  {(["C", "F"] as const).map((u) => (
                    <button key={u} className={`settings-count-chip ${tempUnit === u ? "active" : ""}`} onClick={() => { setTempUnit(u); savePreference({ temperatureUnit: u }); }}>
                      °{u}
                    </button>
                  ))}
                </div>
              </div>
              <div className="settings-divider" />
              <div className="settings-toggle-row">
                <div>
                  <p className="settings-toggle-label">AI Insights</p>
                  <p className="settings-toggle-desc">Get AI-powered health insights</p>
                </div>
                <button
                  className={`settings-toggle ${aiEnabled ? "on" : "off"}`}
                  onClick={() => { setAiEnabled(!aiEnabled); savePreference({ aiInsightsEnabled: !aiEnabled }); }}
                  aria-label="Toggle AI insights"
                >
                  <span className="settings-toggle-knob" />
                </button>
              </div>
            </div>
          </section>

          {/* ═══ PRIVACY & SECURITY ═══ */}
          <section className="settings-section">
            <h2 className="settings-section-title"><LockIcon /><span>Privacy & Security</span></h2>
            <div className="settings-card">
              <div className="settings-toggle-row">
                <div>
                  <p className="settings-toggle-label">App Lock</p>
                  <p className="settings-toggle-desc">Require PIN to open app</p>
                </div>
                <button
                  className={`settings-toggle ${appLockEnabled ? "on" : "off"}`}
                  onClick={() => { setAppLockEnabled(!appLockEnabled); savePreference({ appLockEnabled: !appLockEnabled }); }}
                  aria-label="Toggle app lock"
                >
                  <span className="settings-toggle-knob" />
                </button>
              </div>
              {appLockEnabled && (
                <>
                  <div className="settings-divider" />
                  <div className="settings-toggle-row">
                    <p className="settings-toggle-label">PIN</p>
                    <input
                      className="settings-input"
                      type="password"
                      maxLength={6}
                      placeholder="4-6 digits"
                      value={appLockPin}
                      onChange={(e) => setAppLockPin(e.target.value.replace(/\D/g, ""))}
                      onBlur={() => { if (appLockPin.length >= 4) savePreference({ appLockPin }); }}
                      style={{ width: 100, textAlign: "center" }}
                    />
                  </div>
                </>
              )}
            </div>
          </section>

          {/* ═══ DATA ═══ */}
          <section className="settings-section">
            <h2 className="settings-section-title"><DatabaseIcon /><span>Data</span></h2>
            <div className="settings-card">
              <button className="settings-action-row" onClick={handleExportCSV}>
                <DatabaseIcon />
                <div className="settings-action-text">
                  <span className="settings-action-label">Export Data (CSV)</span>
                  <span className="settings-action-desc">Download your cycle history</span>
                </div>
              </button>
              <div className="settings-divider" />
              <button
                className="settings-action-row"
                style={{ color: "#f59e0b" }}
                onClick={() => {
                  if (window.confirm("Reset all data? This cannot be undone.")) {
                    if (token) apiResetAllData(token).catch(console.error);
                    localStorage.clear();
                    sessionStorage.clear();
                    window.location.reload();
                  }
                }}
              >
                <DatabaseIcon />
                <div className="settings-action-text">
                  <span className="settings-action-label" style={{ color: "#f59e0b" }}>Reset All Data</span>
                  <span className="settings-action-desc">Clear all logs and start fresh</span>
                </div>
              </button>
              <div className="settings-divider" />
              <button
                className="settings-action-row"
                style={{ color: "#ef4444" }}
                onClick={() => {
                  if (window.confirm("Permanently delete your account and all data? This cannot be undone.")) {
                    if (token) {
                      apiDeleteAccount(token).then(() => {
                        localStorage.clear();
                        sessionStorage.clear();
                        window.location.reload();
                      }).catch(console.error);
                    }
                  }
                }}
              >
                <DatabaseIcon />
                <div className="settings-action-text">
                  <span className="settings-action-label" style={{ color: "#ef4444" }}>Delete Account</span>
                  <span className="settings-action-desc">Permanently remove your account and data</span>
                </div>
              </button>
            </div>
          </section>

          {/* ═══ ABOUT ═══ */}
          <section className="settings-section">
            <h2 className="settings-section-title"><InfoIcon /><span>{t("About")}</span></h2>
            <div className="settings-card">
              <div className="settings-about-row">
                <span className="settings-about-label">App</span>
                <span className="settings-about-value">OVIFLOW – Period Tracker</span>
              </div>
              <div className="settings-divider" />
              <div className="settings-about-row">
                <span className="settings-about-label">{t("Version")}</span>
                <span className="settings-about-value">{configuration.app.version || "dev"}</span>
              </div>
            </div>
          </section>

          <div style={{ height: 40 }} />
        </div>
      </IonContent>
    </IonPage>
  );
};

export default SettingsPage;
