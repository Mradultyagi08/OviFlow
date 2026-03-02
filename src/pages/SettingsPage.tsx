import React, { useContext, useEffect, useState } from "react";
import { useHistory } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { IonPage, IonContent } from "@ionic/react";
import { ThemeContext, SettingsContext, CyclesContext } from "../state/Context";
import { configuration } from "../data/AppConfiguration";
import { exportConfig, importConfig } from "../data/Config";
import { storage } from "../data/Storage";
import {
  changeTranslation,
  getCurrentTranslation,
  supportedLanguages,
} from "../utils/translation";
import { changeDateTimeLocale } from "../utils/datetime";
import "./Settings.css";

/* ── SVG Icons ────────────────────────────────────────── */

const ChevronLeftIcon = () => (
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
    <polyline points="15 18 9 12 15 6" />
  </svg>
);

const GlobeIcon = () => (
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
    <circle
      cx="12"
      cy="12"
      r="10"
    />
    <line
      x1="2"
      y1="12"
      x2="22"
      y2="12"
    />
    <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
  </svg>
);

const HeartIcon = () => (
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
    <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
  </svg>
);

const BellIcon = () => (
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
    <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
    <path d="M13.73 21a2 2 0 0 1-3.46 0" />
  </svg>
);

const DatabaseIcon = () => (
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
    <ellipse
      cx="12"
      cy="5"
      rx="9"
      ry="3"
    />
    <path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3" />
    <path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5" />
  </svg>
);

const DownloadIcon = () => (
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
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
    <polyline points="7 10 12 15 17 10" />
    <line
      x1="12"
      y1="15"
      x2="12"
      y2="3"
    />
  </svg>
);

const UploadIcon = () => (
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
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
    <polyline points="17 8 12 3 7 8" />
    <line
      x1="12"
      y1="3"
      x2="12"
      y2="15"
    />
  </svg>
);

const InfoIcon = () => (
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
    <circle
      cx="12"
      cy="12"
      r="10"
    />
    <line
      x1="12"
      y1="16"
      x2="12"
      y2="12"
    />
    <line
      x1="12"
      y1="8"
      x2="12.01"
      y2="8"
    />
  </svg>
);

/* ── Component ────────────────────────────────────────── */

const SettingsPage: React.FC = () => {
  const history = useHistory();
  const { t } = useTranslation();
  const { theme, updateTheme } = useContext(ThemeContext);
  const {
    notificationEnabled,
    updateNotificationEnabled,
    maxNumberOfDisplayedCycles,
    updateMaxNumberOfDisplayedCycles,
    appMode,
    updateAppMode,
  } = useContext(SettingsContext);
  const { updateCycles } = useContext(CyclesContext);

  const isDark = theme === "dark";

  const [currentLang, setCurrentLang] = useState(getCurrentTranslation());
  const [showCycleConfirm, setShowCycleConfirm] = useState(false);
  const [pendingCycleCount, setPendingCycleCount] = useState<number | null>(
    null,
  );
  const [importSuccess, setImportSuccess] = useState(false);

  useEffect(() => {
    setCurrentLang(getCurrentTranslation());
  }, []);

  /* ── Handlers ── */

  const handleLanguageChange = async (lang: string) => {
    setCurrentLang(lang);
    await changeTranslation(lang);
    changeDateTimeLocale(lang);
    await storage.set.language(lang);
  };

  const handleModeChange = (mode: string) => {
    updateAppMode(mode);
  };

  const handleCycleCountChange = (count: number) => {
    if (count < maxNumberOfDisplayedCycles) {
      setPendingCycleCount(count);
      setShowCycleConfirm(true);
    } else {
      updateMaxNumberOfDisplayedCycles(count);
    }
  };

  const confirmCycleCount = () => {
    if (pendingCycleCount !== null) {
      updateMaxNumberOfDisplayedCycles(pendingCycleCount);
    }
    setShowCycleConfirm(false);
    setPendingCycleCount(null);
  };

  const handleImport = async () => {
    try {
      const config = await importConfig();
      await storage.set.cycles(config.cycles);
      await storage.set.theme(config.theme);
      await storage.set.language(config.language);
      updateCycles(config.cycles);
      updateTheme(config.theme);
      changeDateTimeLocale(config.language);
      await changeTranslation(config.language);
      setImportSuccess(true);
      setTimeout(() => setImportSuccess(false), 3000);
    } catch (err) {
      console.error("Import failed:", err);
    }
  };

  const handleExport = async () => {
    try {
      const cycles = await storage.get.cycles();
      const language = await storage.get.language();
      const savedTheme = await storage.get.theme();
      const isNotificationEnabled = await storage.get.isNotificationEnabled();
      const lastNotificationId = await storage.get.lastNotificationId();
      const maxCycles = await storage.get.maxNumberOfDisplayedCycles();
      const savedAppMode = await storage.get.appMode().catch(() => "regular");
      await exportConfig({
        cycles,
        language,
        theme: savedTheme,
        isNotificationEnabled,
        lastNotificationId,
        maxNumberOfDisplayedCycles: maxCycles,
        appMode: savedAppMode,
      });
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
            <button
              className="settings-back-btn"
              onClick={() => history.goBack()}
              aria-label="Go back"
            >
              <ChevronLeftIcon />
            </button>
            <h1 className="settings-title">{t("Settings")}</h1>
            <div style={{ width: 36 }} />
          </div>

          {/* ── Language ── */}
          <section className="settings-section">
            <h2 className="settings-section-title">
              <GlobeIcon />
              <span>{t("Language")}</span>
            </h2>
            <div className="settings-card">
              <div className="settings-select-group">
                {languageEntries.map(([code, label]) => (
                  <button
                    key={code}
                    className={`settings-lang-chip ${currentLang === code ? "active" : ""}`}
                    onClick={() => {
                      handleLanguageChange(code).catch(console.error);
                    }}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>
          </section>

          {/* ── App Mode ── */}
          <section className="settings-section">
            <h2 className="settings-section-title">
              <HeartIcon />
              <span>{t("Mode")}</span>
            </h2>
            <div className="settings-card">
              <div className="settings-radio-group">
                {[
                  { value: "regular", label: t("Regular") },
                  { value: "pregnancy", label: t("Pregnancy Care") },
                  { value: "postpartum", label: t("Postpartum Care") },
                ].map((option) => (
                  <label
                    key={option.value}
                    className={`settings-radio-item ${appMode === option.value ? "active" : ""}`}
                  >
                    <span className="settings-radio-dot" />
                    <span>{option.label}</span>
                    <input
                      type="radio"
                      name="appMode"
                      value={option.value}
                      checked={appMode === option.value}
                      onChange={() => handleModeChange(option.value)}
                    />
                  </label>
                ))}
              </div>
            </div>
          </section>

          {/* ── Notifications ── */}
          {configuration.features.notifications && (
            <section className="settings-section">
              <h2 className="settings-section-title">
                <BellIcon />
                <span>{t("Notifications")}</span>
              </h2>
              <div className="settings-card">
                <div className="settings-toggle-row">
                  <div>
                    <p className="settings-toggle-label">
                      {t("Notifications")}
                    </p>
                    <p className="settings-toggle-desc">
                      {t("Get reminders for your upcoming periods")}
                    </p>
                  </div>
                  <button
                    className={`settings-toggle ${notificationEnabled ? "on" : "off"}`}
                    onClick={() =>
                      updateNotificationEnabled(!notificationEnabled)
                    }
                    aria-label="Toggle notifications"
                  >
                    <span className="settings-toggle-knob" />
                  </button>
                </div>
              </div>
            </section>
          )}

          {/* ── Stored Cycles Count ── */}
          <section className="settings-section">
            <h2 className="settings-section-title">
              <DatabaseIcon />
              <span>{`${t("Stored cycles count")}`}</span>
            </h2>
            <div className="settings-card">
              <div className="settings-chip-row">
                {[6, 12, 24].map((count) => (
                  <button
                    key={count}
                    className={`settings-count-chip ${maxNumberOfDisplayedCycles === count ? "active" : ""}`}
                    onClick={() => handleCycleCountChange(count)}
                  >
                    {count}
                  </button>
                ))}
              </div>
              <p className="settings-hint">
                {t("Reducing the number will permanently remove some cycles.")}
              </p>
            </div>
          </section>

          {/* ── Cycle count confirmation dialog ── */}
          {showCycleConfirm && (
            <div className="settings-confirm-overlay">
              <div
                className={`settings-confirm-dialog ${isDark ? "dark" : "light"}`}
              >
                <h3>{t("Confirm selection")}</h3>
                <p>
                  {t(
                    "Are you sure you want to change the number of stored cycles?",
                  )}
                </p>
                <p className="settings-confirm-warning">
                  {t(
                    "Reducing the number will permanently remove some cycles.",
                  )}
                </p>
                <div className="settings-confirm-actions">
                  <button
                    className="settings-confirm-btn cancel"
                    onClick={() => {
                      setShowCycleConfirm(false);
                      setPendingCycleCount(null);
                    }}
                  >
                    {t("Cancel")}
                  </button>
                  <button
                    className="settings-confirm-btn confirm"
                    onClick={confirmCycleCount}
                  >
                    OK
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* ── Import / Export ── */}
          <section className="settings-section">
            <h2 className="settings-section-title">
              <DatabaseIcon />
              <span>{t("Data")}</span>
            </h2>
            <div className="settings-card">
              <button
                className="settings-action-row"
                onClick={() => {
                  handleImport().catch(console.error);
                }}
              >
                <DownloadIcon />
                <div className="settings-action-text">
                  <span className="settings-action-label">
                    {t("Import config")}
                  </span>
                  <span className="settings-action-desc">
                    {t("Restore settings from a file")}
                  </span>
                </div>
              </button>

              {importSuccess && (
                <div className="settings-import-success">
                  {t("Configuration has been imported")}
                </div>
              )}

              <div className="settings-divider" />

              <button
                className="settings-action-row"
                onClick={() => {
                  handleExport().catch(console.error);
                }}
              >
                <UploadIcon />
                <div className="settings-action-text">
                  <span className="settings-action-label">
                    {t("Export config")}
                  </span>
                  <span className="settings-action-desc">
                    {t("Save your settings to a file")}
                  </span>
                </div>
              </button>
            </div>
          </section>

          {/* ── About ── */}
          <section className="settings-section">
            <h2 className="settings-section-title">
              <InfoIcon />
              <span>{t("About")}</span>
            </h2>
            <div className="settings-card">
              <div className="settings-about-row">
                <span className="settings-about-label">App</span>
                <span className="settings-about-value">
                  OVIFLOW – Period Tracker
                </span>
              </div>
              <div className="settings-divider" />
              <div className="settings-about-row">
                <span className="settings-about-label">{t("Version")}</span>
                <span className="settings-about-value">
                  {configuration.app.version || "dev"}
                </span>
              </div>
            </div>
          </section>

          {/* spacer for bottom safe area */}
          <div style={{ height: 40 }} />
        </div>
      </IonContent>
    </IonPage>
  );
};

export default SettingsPage;
