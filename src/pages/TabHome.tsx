import { useContext, useEffect, useRef, useState } from "react";
import {
  IonContent,
  IonPage,
  IonLabel,
  useIonRouter,
  IonDatetime,
  IonButton,
  IonCol,
  IonIcon,
  IonButtons,
  IonModal,
  IonToolbar,
} from "@ionic/react";
import { App } from "@capacitor/app";
import { Capacitor } from "@capacitor/core";
import { useTranslation } from "react-i18next";
import {
  parseISO,
  startOfToday,
  formatISO,
  subMonths,
  min,
  startOfMonth,
  endOfMonth,
  addMonths,
  max,
  differenceInWeeks,
  differenceInDays,
  addDays,
  startOfDay,
} from "date-fns";
import { CyclesContext, SettingsContext, ThemeContext } from "../state/Context";

import { storage } from "../data/Storage";
import { configuration } from "../data/AppConfiguration";

import InfoModal from "../modals/InfoModal";

import {
  getPregnancyChance,
  getDaysBeforePeriod,
  getNewCyclesHistory,
  getPeriodDates,
  getActiveDates,
  getPeriodDatesWithNewElement,
  isPeriodToday,
  getForecastPeriodDates,
  getOvulationDates,
  getPeriodDatesOfLastCycle,
  getDayOfCycle,
  getAverageLengthOfCycle,
  getLengthOfLastPeriod,
  getCurrentCyclePhase,
} from "../state/CalculationLogics";
import { getDailyTip } from "../data/DailyTips";
import { getCurrentTranslation } from "../utils/translation";
import { format } from "../utils/datetime";

import { chevronForwardOutline } from "ionicons/icons";

interface InfoButtonProps {
  setIsInfoModal: (newIsOpen: boolean) => void;
}

const DailyTipBanner = () => {
  const { cycles } = useContext(CyclesContext);
  const theme = useContext(ThemeContext).theme;
  const maxNumberOfDisplayedCycles =
    useContext(SettingsContext).maxNumberOfDisplayedCycles;

  const phase = getCurrentCyclePhase(cycles, maxNumberOfDisplayedCycles);
  const dayOfCycle = getDayOfCycle(cycles);
  const periodLength = getLengthOfLastPeriod(cycles);
  const cycleLength = getAverageLengthOfCycle(
    cycles,
    maxNumberOfDisplayedCycles,
  );
  const tip = getDailyTip(phase, dayOfCycle, periodLength, cycleLength);

  return (
    <div
      className="anim-slide-in-left"
      style={{
        display: "flex",
        alignItems: "flex-start",
        gap: "10px",
        padding: "12px 14px",
        borderRadius: "16px",
        background:
          theme === "dark"
            ? "rgba(120, 93, 249, 0.12)"
            : "rgba(76, 59, 157, 0.07)",
        marginBottom: "16px",
      }}
    >
      <span
        className="anim-emoji-pulse"
        style={{ fontSize: "24px", lineHeight: 1.3, flexShrink: 0 }}
      >
        {tip.emoji}
      </span>
      <p
        style={{
          fontSize: "15px",
          lineHeight: "1.5",
          color: `var(--ion-color-text-${theme})`,
          opacity: 0.85,
          margin: 0,
        }}
      >
        {tip.message}
      </p>
    </div>
  );
};

const PregnancyCareHero = () => {
  const { t } = useTranslation();
  const { cycles } = useContext(CyclesContext);
  const theme = useContext(ThemeContext).theme;

  if (cycles.length === 0) {
    return (
      <div className={`hero-card hero-card-${theme}`}>
        <div style={{ padding: "24px" }}>
          <p
            style={{
              color: `var(--ion-color-text-${theme})`,
              opacity: 0.8,
              fontSize: "16px",
            }}
          >
            {t(
              "No cycle data available. Please add your last menstrual period.",
            )}
          </p>
        </div>
      </div>
    );
  }

  const lmpDate = startOfDay(new Date(cycles[0].startDate));
  const today = startOfToday();
  const totalDays = differenceInDays(today, lmpDate);
  const weeksPregnant = Math.floor(totalDays / 7);
  const extraDays = totalDays % 7;
  const edd = addDays(lmpDate, 280);

  let trimester = "";
  if (weeksPregnant < 13) {
    trimester = t("1st Trimester");
  } else if (weeksPregnant < 27) {
    trimester = t("2nd Trimester");
  } else {
    trimester = t("3rd Trimester");
  }

  const eddFormatted = format(edd, "MMMM d, yyyy");
  const progressPercent = Math.min(totalDays / 280, 1);

  return (
    <div className={`hero-card hero-card-${theme}`}>
      <div style={{ paddingTop: "24px", marginBottom: "12px" }}>
        <p
          style={{
            fontSize: "14px",
            fontWeight: "500",
            color: `var(--ion-color-text-${theme})`,
            opacity: 0.7,
            letterSpacing: "0.05em",
            textTransform: "uppercase",
            marginBottom: "4px",
          }}
        >
          {t("Pregnancy Care")}
        </p>
        <p
          style={{
            fontSize: "22px",
            fontWeight: "500",
            color: `var(--ion-color-text-${theme})`,
            opacity: 0.8,
          }}
        >
          {trimester}
        </p>
      </div>
      <div>
        <p
          style={{
            fontWeight: "800",
            fontSize: "58px",
            lineHeight: "1.1",
            letterSpacing: "-0.02em",
            color: `var(--ion-color-dark-${theme})`,
            marginBottom: "4px",
          }}
        >
          {t("Week")} {weeksPregnant}
        </p>
        <p
          style={{
            fontSize: "16px",
            color: `var(--ion-color-text-${theme})`,
            opacity: 0.7,
            marginBottom: "16px",
          }}
        >
          {extraDays > 0
            ? `+${extraDays} ${t("Days", { postProcess: "interval", count: extraDays })}`
            : ""}
        </p>
      </div>
      <div style={{ marginBottom: "16px" }}>
        <p
          style={{
            fontSize: "14px",
            color: `var(--ion-color-text-${theme})`,
            opacity: 0.8,
            marginBottom: "6px",
          }}
        >
          {t("Progress")}: {Math.round(progressPercent * 100)}%
        </p>
        <div
          style={{
            height: "6px",
            borderRadius: "3px",
            background: `rgba(var(--ion-color-light-${theme}-rgb), 0.4)`,
            overflow: "hidden",
          }}
        >
          <div
            style={{
              height: "100%",
              width: `${progressPercent * 100}%`,
              background: `var(--ion-color-dark-${theme})`,
              borderRadius: "3px",
              transition: "width 0.3s ease",
            }}
          />
        </div>
      </div>
      <div style={{ marginBottom: "20px" }}>
        <p style={{ fontSize: "14px", color: `var(--ion-color-medium)` }}>
          {t("Estimated Due Date")}:{" "}
          <span style={{ color: `var(--ion-color-text-${theme})` }}>
            {eddFormatted}
          </span>
        </p>
      </div>
    </div>
  );
};

const PostpartumCareHero = () => {
  const { t } = useTranslation();
  const { cycles } = useContext(CyclesContext);
  const theme = useContext(ThemeContext).theme;

  if (cycles.length === 0) {
    return (
      <div className={`hero-card hero-card-${theme}`}>
        <div style={{ padding: "24px" }}>
          <p
            style={{
              color: `var(--ion-color-text-${theme})`,
              opacity: 0.8,
              fontSize: "16px",
            }}
          >
            {t("No data available. Please mark your delivery date.")}
          </p>
        </div>
      </div>
    );
  }

  const birthDate = startOfDay(new Date(cycles[0].startDate));
  const today = startOfToday();
  const totalDays = differenceInDays(today, birthDate);
  const weeksPostpartum = Math.floor(totalDays / 7);
  const extraDays = totalDays % 7;

  let recoveryPhase = "";
  let recoveryTip = "";
  if (weeksPostpartum < 2) {
    recoveryPhase = t("Early Recovery");
    recoveryTip = t("Focus on rest and skin-to-skin bonding.");
  } else if (weeksPostpartum < 6) {
    recoveryPhase = t("Recovery Phase");
    recoveryTip = t(
      "Gentle movement is beneficial. Attend your postpartum check-up.",
    );
  } else if (weeksPostpartum < 12) {
    recoveryPhase = t("Extended Recovery");
    recoveryTip = t("Most physical recovery is complete. Listen to your body.");
  } else {
    recoveryPhase = t("Postpartum");
    recoveryTip = t("Periods may return, especially if not breastfeeding.");
  }

  const periodReturnWeeks = 6;
  const periodSoonText =
    weeksPostpartum >= periodReturnWeeks
      ? t("Periods may have returned or will return soon.")
      : `${t("Periods may return around week")} ${periodReturnWeeks}.`;

  return (
    <div className={`hero-card hero-card-${theme}`}>
      <div style={{ paddingTop: "24px", marginBottom: "12px" }}>
        <p
          style={{
            fontSize: "14px",
            fontWeight: "500",
            color: `var(--ion-color-text-${theme})`,
            opacity: 0.7,
            letterSpacing: "0.05em",
            textTransform: "uppercase",
            marginBottom: "4px",
          }}
        >
          {t("Postpartum Care")}
        </p>
        <p
          style={{
            fontSize: "22px",
            fontWeight: "500",
            color: `var(--ion-color-text-${theme})`,
            opacity: 0.8,
          }}
        >
          {recoveryPhase}
        </p>
      </div>
      <div>
        <p
          style={{
            fontWeight: "800",
            fontSize: "58px",
            lineHeight: "1.1",
            letterSpacing: "-0.02em",
            color: `var(--ion-color-dark-${theme})`,
            marginBottom: "4px",
          }}
        >
          {t("Week")} {weeksPostpartum}
        </p>
        <p
          style={{
            fontSize: "16px",
            color: `var(--ion-color-text-${theme})`,
            opacity: 0.7,
            marginBottom: "16px",
          }}
        >
          {extraDays > 0
            ? `+${extraDays} ${t("Days", { postProcess: "interval", count: extraDays })}`
            : ""}
        </p>
      </div>
      <div style={{ marginBottom: "12px" }}>
        <p
          style={{
            fontSize: "14px",
            color: `var(--ion-color-text-${theme})`,
            opacity: 0.8,
          }}
        >
          {recoveryTip}
        </p>
      </div>
      <div style={{ marginBottom: "20px" }}>
        <p style={{ fontSize: "14px", color: "var(--ion-color-medium)" }}>
          {periodSoonText}
        </p>
      </div>
    </div>
  );
};

const InfoButton = (props: InfoButtonProps) => {
  const { t } = useTranslation();

  const cycles = useContext(CyclesContext).cycles;
  const theme = useContext(ThemeContext).theme;
  const maxNumberOfDisplayedCycles =
    useContext(SettingsContext).maxNumberOfDisplayedCycles;

  const pregnancyChance = getPregnancyChance(
    cycles,
    maxNumberOfDisplayedCycles,
  );
  if (cycles.length <= 1) {
    return <p style={{ marginBottom: "20px", height: "22px" }}></p>;
  }
  return (
    <IonLabel
      className="anim-fade-in-delay"
      onClick={() => props.setIsInfoModal(true)}
      mode="md"
      style={{
        display: "flex",
        alignItems: "center",
      }}
    >
      <p
        style={{
          fontSize: "16px",
          color: "var(--ion-color-medium)",
          marginBottom: "20px",
          display: "flex",
          alignItems: "center",
        }}
      >
        <span
          style={{
            color: `var(--ion-color-text-${theme})`,
            marginRight: "3px",
            fontWeight: "600",
          }}
        >
          {pregnancyChance}
        </span>
        - {t("Chance of getting pregnant")}
        <IonIcon
          color={`dark-${theme}`}
          style={{ fontSize: "22px", marginLeft: "5px" }}
          icon={chevronForwardOutline}
        />
      </p>
    </IonLabel>
  );
};

interface SelectCalendarProps {
  setIsEditCalendar: (newIsOpen: boolean) => void;
  showEditButton?: boolean;
}

const ViewCalendar = (props: SelectCalendarProps) => {
  const showEdit = props.showEditButton !== false;
  const { t } = useTranslation();
  const { cycles } = useContext(CyclesContext);
  const theme = useContext(ThemeContext).theme;
  const maxNumberOfDisplayedCycles =
    useContext(SettingsContext).maxNumberOfDisplayedCycles;

  const periodDates = getPeriodDates(cycles, maxNumberOfDisplayedCycles);
  const forecastPeriodDates = getForecastPeriodDates(
    cycles,
    maxNumberOfDisplayedCycles,
  );
  const ovulationDates = getOvulationDates(cycles, maxNumberOfDisplayedCycles);

  const firstPeriodDay = periodDates
    .sort((left, right) => {
      const leftDate = new Date(left);
      const rightDate = new Date(right);
      return leftDate.getTime() - rightDate.getTime();
    })
    .at(0);

  const firstPeriodDayDate = firstPeriodDay
    ? parseISO(firstPeriodDay)
    : startOfToday();

  const minDate = formatISO(startOfMonth(firstPeriodDayDate));

  const lastForecastPeriodDay = forecastPeriodDates
    .sort((left, right) => {
      const leftDate = new Date(left);
      const rightDate = new Date(right);
      return leftDate.getTime() - rightDate.getTime();
    })
    .at(-1);

  const lastForecastPeriodDayDate = lastForecastPeriodDay
    ? endOfMonth(parseISO(lastForecastPeriodDay))
    : endOfMonth(startOfToday());

  const maxDate = formatISO(
    endOfMonth(max([lastForecastPeriodDayDate, addMonths(startOfToday(), 6)])),
  );

  return (
    <IonDatetime
      className={
        ovulationDates.includes(format(startOfToday(), "yyyy-MM-dd"))
          ? `view-calendar-today-ovulation-${theme}`
          : `view-calendar-${theme}`
      }
      presentation="date"
      locale={getCurrentTranslation()}
      size="cover"
      mode="md"
      min={minDate}
      max={maxDate}
      firstDayOfWeek={1}
      highlightedDates={(isoDateString) => {
        if (cycles.length === 0) {
          return undefined;
        }
        if (forecastPeriodDates.includes(isoDateString)) {
          if (theme === "dark") {
            return {
              textColor: `#ffffff`,
              backgroundColor: `rgba(var(--ion-color-light-${theme}-rgb), 0.3)`,
            };
          }
          return {
            textColor: `var(--ion-color-dark-${theme})`,
            backgroundColor: `rgba(var(--ion-color-light-${theme}-rgb), 0.3)`,
          };
        } else if (periodDates.includes(isoDateString)) {
          return theme === "dark"
            ? {
                textColor: `#ffffff`,
                backgroundColor: `rgba(var(--ion-color-dark-${theme}-rgb), 0.6)`,
              }
            : {
                textColor: `var(--ion-color-dark-${theme})`,
                backgroundColor: `rgba(var(--ion-color-light-${theme}-rgb), 0.8)`,
              };
        } else if (ovulationDates.includes(isoDateString)) {
          return {
            textColor: `var(--ion-color-ovulation-${theme})`,
            backgroundColor: `var(--ion-color-calendar-${theme})`,
            fontWeight: "bold",
          };
        }

        return undefined;
      }}
    >
      {showEdit && (
        <IonButtons slot="buttons">
          <IonButton
            color={`dark-${theme}`}
            onClick={() => {
              props.setIsEditCalendar(true);
            }}
          >
            {t("Edit")}
          </IonButton>
        </IonButtons>
      )}
    </IonDatetime>
  );
};

const EditCalendar = (props: SelectCalendarProps) => {
  const datetimeRef = useRef<null | HTMLIonDatetimeElement>(null);

  const { t } = useTranslation();
  const { cycles, updateCycles } = useContext(CyclesContext);
  const theme = useContext(ThemeContext).theme;
  const maxNumberOfDisplayedCycles =
    useContext(SettingsContext).maxNumberOfDisplayedCycles;

  // NOTE: This is a hack. I fixed the bug: when opening the editing calendar,
  // a month not related to the specified dates opened (May 2021).
  // I found several similar bugs (for example ionic-team/ionic-framework#29094)
  // I fixed it like this: I specified one date at initialization (today)
  const [datesValue, setDatesValue] = useState([startOfToday().toISOString()]);

  // and then in the useEffect I update this value to the required ones
  useEffect(() => {
    setDatesValue(getPeriodDates(cycles, maxNumberOfDisplayedCycles));
  }, [cycles, maxNumberOfDisplayedCycles]);

  const periodDays = getPeriodDates(cycles, maxNumberOfDisplayedCycles);
  const lastPeriodDays = getPeriodDatesOfLastCycle(cycles);

  const sortedPeriodDays = periodDays.sort((left, right) => {
    const leftDate = new Date(left);
    const rightDate = new Date(right);
    return leftDate.getTime() - rightDate.getTime();
  });

  const firstPeriodDay = sortedPeriodDays.at(0);
  const lastPeriodDay = sortedPeriodDays.at(-1);

  const firstPeriodDayDate = firstPeriodDay
    ? parseISO(firstPeriodDay)
    : startOfToday();

  const lastPeriodDayDate = lastPeriodDay
    ? parseISO(lastPeriodDay)
    : startOfToday();

  const minDate = formatISO(
    startOfMonth(
      min([
        firstPeriodDayDate,
        subMonths(startOfToday(), maxNumberOfDisplayedCycles),
      ]),
    ),
  );

  const maxDate = formatISO(max([startOfToday(), lastPeriodDayDate]));

  return (
    <IonDatetime
      className={`edit-calendar-${theme}`}
      ref={datetimeRef}
      presentation="date"
      locale={getCurrentTranslation()}
      mode="md"
      size="cover"
      min={minDate}
      max={maxDate}
      multiple
      firstDayOfWeek={1}
      value={datesValue}
      isDateEnabled={(isoDateString) => {
        return getActiveDates(parseISO(isoDateString), cycles);
      }}
    >
      <IonButtons slot="buttons">
        <IonButton
          color={`blackout-${theme}`}
          onClick={() => {
            props.setIsEditCalendar(false);
          }}
        >
          {t("Cancel")}
        </IonButton>
        <IonButton
          color={`blackout-${theme}`}
          onClick={() => {
            // NOTE: `confirm` should be called to update values in `datetimeRef`
            datetimeRef.current?.confirm().catch((err) => console.error(err));

            let markedDays = (datetimeRef.current?.value as string[]) ?? [];
            const todayFormatted = format(startOfToday(), "yyyy-MM-dd");

            // NOTE: If "lastPeriodDays" includes today, but the marked days don't,
            //       it means that the user has unmarked the first day of a new period
            //       that started today
            //       In this case we thinking that user marked first day of cycle by error
            //       and remove the last period from the cycles array
            if (
              lastPeriodDays.includes(todayFormatted) &&
              !markedDays.includes(todayFormatted)
            ) {
              markedDays = markedDays.filter((isoDateString) => {
                return !lastPeriodDays.includes(isoDateString);
              });
            }

            const periodDaysString = markedDays.map((isoDateString) => {
              return parseISO(isoDateString).toString();
            });

            updateCycles(getNewCyclesHistory(periodDaysString));
            props.setIsEditCalendar(false);
          }}
        >
          {t("Save")}
        </IonButton>
      </IonButtons>
    </IonDatetime>
  );
};

const DemoAlert = () => {
  const [isOpen, setIsOpen] = useState(true);
  const { t } = useTranslation();

  return (
    <IonModal
      id="alert-demo-modal"
      isOpen={isOpen}
    >
      <div className="wrapper">
        <h1>{t("This is just a demo")}</h1>
        <p>
          <span>{t("You can download the application ")}</span>
          <a href="https://github.com/IraSoro/peri/releases/latest">
            {t("Here")}
          </a>
        </p>
        <IonCol>
          <IonToolbar>
            <IonButtons slot="primary">
              <IonButton
                onClick={() => setIsOpen(false)}
                color="dark-basic"
              >
                OK
              </IonButton>
            </IonButtons>
          </IonToolbar>
        </IonCol>
      </div>
    </IonModal>
  );
};

const TabHome = () => {
  const theme = useContext(ThemeContext).theme;

  const [isInfoModal, setIsInfoModal] = useState(false);
  const [isEditCalendar, setIsEditCalendar] = useState(false);

  const router = useIonRouter();

  useEffect(() => {
    storage.get.cycles().catch((err) => {
      console.error(`Can't get cycles ${(err as Error).message}`);
    });
  }, []);

  useEffect(() => {
    const backButtonHandler = () => {
      if (isInfoModal) {
        setIsInfoModal(false);
        router.push("/home");
        return;
      }
      if (!Capacitor.isPluginAvailable("App")) {
        return;
      }
      App.exitApp?.().catch((err) => console.error(err));
    };

    document.addEventListener("ionBackButton", backButtonHandler);

    return () => {
      document.removeEventListener("ionBackButton", backButtonHandler);
    };
  }, [router, isInfoModal]);

  const { t } = useTranslation();
  const { cycles, updateCycles } = useContext(CyclesContext);
  const maxNumberOfDisplayedCycles =
    useContext(SettingsContext).maxNumberOfDisplayedCycles;
  const { appMode } = useContext(SettingsContext);

  return (
    <IonPage
      style={{ backgroundColor: `var(--ion-color-background-${theme})` }}
    >
      {configuration.features.demoMode && <DemoAlert />}
      <div
        id="wide-screen"
        className={theme}
      >
        <IonContent
          className="ion-padding"
          color={`transparent-${theme}`}
        >
          <div
            id="context-size"
            className="page-content-animated"
          >
            {appMode === "pregnancy" ? (
              <>
                <PregnancyCareHero />
                <div className={`calendar-card calendar-card-${theme}`}>
                  <IonCol style={{ padding: 0 }}>
                    <ViewCalendar
                      setIsEditCalendar={setIsEditCalendar}
                      showEditButton={false}
                    />
                  </IonCol>
                </div>
              </>
            ) : appMode === "postpartum" ? (
              <>
                <PostpartumCareHero />
                <div className={`calendar-card calendar-card-${theme}`}>
                  <IonCol style={{ padding: 0 }}>
                    <ViewCalendar
                      setIsEditCalendar={setIsEditCalendar}
                      showEditButton={false}
                    />
                  </IonCol>
                </div>
              </>
            ) : (
              <>
                <div className={`hero-card hero-card-${theme}`}>
                  <div
                    className="anim-fade-in-down"
                    style={{ paddingTop: "24px", marginBottom: "12px" }}
                  >
                    <IonLabel mode="md">
                      <p
                        style={{
                          fontSize: "14px",
                          fontWeight: "500",
                          letterSpacing: "0.05em",
                          textTransform: "uppercase" as const,
                          color: `var(--ion-color-text-${theme})`,
                          opacity: 0.7,
                          marginBottom: "4px",
                        }}
                      >
                        {
                          getDaysBeforePeriod(
                            cycles,
                            maxNumberOfDisplayedCycles,
                          ).title
                        }
                      </p>
                    </IonLabel>
                  </div>
                  <div className="anim-fade-in-up-slow">
                    <IonLabel mode="md">
                      <p
                        style={{
                          fontWeight: "800",
                          fontSize: /^\d/.test(
                            getDaysBeforePeriod(
                              cycles,
                              maxNumberOfDisplayedCycles,
                            ).days,
                          )
                            ? "58px"
                            : "32px",
                          lineHeight: "1.1",
                          letterSpacing: "-0.02em",
                          color: `var(--ion-color-dark-${theme})`,
                          marginBottom: "16px",
                        }}
                      >
                        {
                          getDaysBeforePeriod(
                            cycles,
                            maxNumberOfDisplayedCycles,
                          ).days
                        }
                      </p>
                    </IonLabel>
                  </div>
                  <DailyTipBanner />
                  <InfoButton setIsInfoModal={setIsInfoModal} />
                  <InfoModal
                    isOpen={isInfoModal}
                    setIsOpen={setIsInfoModal}
                  />
                  <IonCol
                    className="anim-scale-in"
                    style={{ marginBottom: "10px" }}
                  >
                    <IonButton
                      className="main"
                      mode="md"
                      color={`dark-${theme}`}
                      disabled={isPeriodToday(cycles)}
                      onClick={() => {
                        const newCycles = getNewCyclesHistory(
                          getPeriodDatesWithNewElement(
                            cycles,
                            maxNumberOfDisplayedCycles,
                          ),
                        );
                        updateCycles(newCycles);
                      }}
                    >
                      {t("Mark")}
                    </IonButton>
                  </IonCol>
                </div>
                <div className={`calendar-card calendar-card-${theme}`}>
                  <IonCol style={{ padding: 0 }}>
                    {isEditCalendar ? (
                      <EditCalendar setIsEditCalendar={setIsEditCalendar} />
                    ) : (
                      <ViewCalendar setIsEditCalendar={setIsEditCalendar} />
                    )}
                  </IonCol>
                </div>
              </>
            )}
          </div>
        </IonContent>
      </div>
    </IonPage>
  );
};

export default TabHome;
