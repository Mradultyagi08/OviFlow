import React, { useContext, useRef } from "react";
import {
  IonButton,
  IonContent,
  IonModal,
  useIonAlert,
  IonDatetime,
} from "@ionic/react";
import { useTranslation } from "react-i18next";
import {
  formatISO,
  parseISO,
  startOfDay,
  startOfMonth,
  startOfToday,
  subMonths,
} from "date-fns";

import { CyclesContext, ThemeContext } from "../state/Context";
import { getNewCyclesHistory } from "../state/CalculationLogics";
import { getCurrentTranslation } from "../utils/translation";

interface PropsWelcomeModal {
  isOpen: boolean;
  setIsOpen: (newIsOpen: boolean) => void;
}

const Welcome = (props: PropsWelcomeModal) => {
  const datetimeRef = useRef<null | HTMLIonDatetimeElement>(null);
  const [confirmAlert] = useIonAlert();
  const updateCycles = useContext(CyclesContext).updateCycles;
  const theme = useContext(ThemeContext).theme;

  const { t } = useTranslation();

  const isDark = theme === "dark";

  const styles = {
    overlay: {
      display: "flex",
      flexDirection: "column" as const,
      minHeight: "100%",
      background: isDark
        ? "linear-gradient(160deg, #1a1a2e 0%, #16213e 60%, #0f3460 100%)"
        : "linear-gradient(160deg, #f3f2ff 0%, #e8e3ff 60%, #ddd5ff 100%)",
    },
    header: {
      padding: "48px 28px 24px",
      textAlign: "center" as const,
    },
    logoWrap: {
      width: "72px",
      height: "72px",
      borderRadius: "22px",
      background: isDark
        ? "linear-gradient(135deg, #785df9 0%, #4c3b9d 100%)"
        : "linear-gradient(135deg, #7565c5 0%, #4c3b9d 100%)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      margin: "0 auto 20px",
      boxShadow: isDark
        ? "0 8px 32px rgba(120,93,249,0.45)"
        : "0 8px 32px rgba(76,59,157,0.28)",
    },
    logoText: {
      fontSize: "34px",
      lineHeight: 1,
    },
    appName: {
      fontSize: "26px",
      fontWeight: "800" as const,
      letterSpacing: "-0.02em",
      color: isDark
        ? "var(--ion-color-dark-dark)"
        : "var(--ion-color-dark-basic)",
      marginBottom: "8px",
    },
    tagline: {
      fontSize: "15px",
      color: isDark
        ? "var(--ion-color-text-dark)"
        : "var(--ion-color-text-basic)",
      opacity: 0.7,
      lineHeight: 1.5,
    },
    divider: {
      height: "1px",
      margin: "0 28px",
      background: isDark ? "rgba(255,255,255,0.08)" : "rgba(76,59,157,0.12)",
    },
    calendarSection: {
      padding: "24px 20px 8px",
    },
    sectionLabel: {
      fontSize: "13px",
      fontWeight: "700" as const,
      letterSpacing: "0.06em",
      textTransform: "uppercase" as const,
      color: isDark
        ? "var(--ion-color-dark-dark)"
        : "var(--ion-color-dark-basic)",
      marginBottom: "6px",
      paddingLeft: "4px",
    },
    sectionHint: {
      fontSize: "13px",
      color: isDark
        ? "var(--ion-color-text-dark)"
        : "var(--ion-color-text-basic)",
      opacity: 0.6,
      marginBottom: "14px",
      paddingLeft: "4px",
    },
    calendarCard: {
      borderRadius: "20px",
      overflow: "hidden" as const,
      boxShadow: isDark
        ? "0 4px 24px rgba(0,0,0,0.4)"
        : "0 4px 24px rgba(76,59,157,0.1)",
      border: isDark
        ? "1px solid rgba(255,255,255,0.06)"
        : "1px solid rgba(76,59,157,0.08)",
    },
    footer: {
      padding: "20px 24px 36px",
      display: "flex",
      flexDirection: "column" as const,
      gap: "10px",
    },
    continueBtn: {
      "--border-radius": "14px",
      "--padding-top": "18px",
      "--padding-bottom": "18px",
      fontWeight: "700",
      fontSize: "16px",
      letterSpacing: "0.01em",
    } as React.CSSProperties,
    skipBtn: {
      "--border-radius": "14px",
      "--padding-top": "14px",
      "--padding-bottom": "14px",
      fontSize: "14px",
      fontWeight: "500",
      opacity: 0.6,
    } as React.CSSProperties,
  };

  const handleContinue = () => {
    if (datetimeRef.current?.value) {
      const periodDaysString = (datetimeRef.current.value as string[]).map(
        (isoDateString) => {
          return parseISO(isoDateString).toString();
        },
      );
      updateCycles(getNewCyclesHistory(periodDaysString));
      props.setIsOpen(false);
    } else {
      confirmAlert({
        header: `${t("Continue")}?`,
        cssClass: `${theme}`,
        message: t("Forecast will not be generated."),
        buttons: [
          {
            text: t("Cancel"),
            role: "cancel",
            cssClass: `${theme}`,
          },
          {
            text: "OK",
            role: "confirm",
            cssClass: `${theme}`,
            handler: () => {
              props.setIsOpen(false);
            },
          },
        ],
      }).catch((err) => console.error(err));
    }
  };

  return (
    <IonModal
      isOpen={props.isOpen}
      backdropDismiss={false}
    >
      <IonContent
        scrollY={true}
        color={isDark ? "transparent-dark" : "transparent-basic"}
      >
        <div style={styles.overlay}>
          {/* ── Header ── */}
          <div style={styles.header}>
            <div style={styles.logoWrap}>
              <img
                src="/assets/icon/LOGO.png"
                alt="OVIFLOW"
                style={{
                  width: "100%",
                  height: "100%",
                  objectFit: "contain",
                  borderRadius: "22px",
                }}
              />
            </div>
            <p style={styles.appName}>{t("Welcome to OVIFLOW")}</p>
            <p style={styles.tagline}>
              {t("Your personal period & cycle tracker")}
            </p>
          </div>

          <div style={styles.divider} />

          {/* ── Calendar section ── */}
          <div style={styles.calendarSection}>
            <p style={styles.sectionLabel}>{t("Set up your cycle")}</p>
            <p style={styles.sectionHint}>
              {t("Tap the days of your last period to get started")}
            </p>
            <div style={styles.calendarCard}>
              <IonDatetime
                className={`welcome-calendar-${theme}`}
                ref={datetimeRef}
                presentation="date"
                locale={getCurrentTranslation()}
                size="cover"
                mode="md"
                min={formatISO(startOfMonth(subMonths(startOfToday(), 6)))}
                max={formatISO(startOfToday())}
                multiple
                firstDayOfWeek={1}
                isDateEnabled={(isoDateString) => {
                  return startOfDay(parseISO(isoDateString)) <= startOfToday();
                }}
              />
            </div>
          </div>

          {/* ── Footer ── */}
          <div style={styles.footer}>
            <IonButton
              expand="block"
              mode="md"
              color={`dark-${theme}`}
              style={styles.continueBtn}
              onClick={handleContinue}
            >
              {t("Continue")}
            </IonButton>
            <IonButton
              expand="block"
              mode="md"
              fill="clear"
              color={`dark-${theme}`}
              style={styles.skipBtn}
              onClick={() => {
                confirmAlert({
                  header: `${t("Continue")}?`,
                  cssClass: `${theme}`,
                  message: t("Forecast will not be generated."),
                  buttons: [
                    {
                      text: t("Cancel"),
                      role: "cancel",
                      cssClass: `${theme}`,
                    },
                    {
                      text: "OK",
                      role: "confirm",
                      cssClass: `${theme}`,
                      handler: () => {
                        props.setIsOpen(false);
                      },
                    },
                  ],
                }).catch((err) => console.error(err));
              }}
            >
              {t("Skip for now")}
            </IonButton>
          </div>
        </div>
      </IonContent>
    </IonModal>
  );
};

export default Welcome;
