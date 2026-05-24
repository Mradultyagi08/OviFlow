import { useContext } from "react";
import { IonContent, IonModal, IonButton, IonCol } from "@ionic/react";
import { useTranslation } from "react-i18next";

import { CyclesContext, ThemeContext } from "../state/Context";

import "./InfoModal.css";

interface PropsInfoModal {
  isOpen: boolean;
  setIsOpen: (newIsOpen: boolean) => void;
}

const InfoModal = (props: PropsInfoModal) => {
  const { t } = useTranslation();
  const { cycles, predictions } = useContext(CyclesContext);
  const theme = useContext(ThemeContext).theme;

  if (!predictions) return null;

  const { cycleDay, averageCycleLength, phase, ovulationStatus, pregnancyChance } = predictions;

  // Map backend phase keys to display titles and symptoms
  const phaseMap: Record<string, { title: string; symptoms: string[] }> = {
    menstrual: {
      title: t("Menstrual phase"),
      symptoms: [t("Cramps"), t("Fatigue"), t("Back pain")],
    },
    follicular: {
      title: t("Follicular phase"),
      symptoms: [t("High energy"), t("Better mood"), t("Glowing skin")],
    },
    ovulation: {
      title: t("Ovulation phase"),
      symptoms: [t("Increased libido"), t("Mild cramps"), t("Clear discharge")],
    },
    luteal: {
      title: t("Luteal phase"),
      symptoms: [t("Bloating"), t("Mood swings"), t("Breast tenderness")],
    },
    delay: {
      title: t("Cycle delay"),
      symptoms: [t("Stress"), t("Hormonal imbalance")],
    },
  };

  const currentPhase = phaseMap[phase] || { title: t("Unknown"), symptoms: [] };

  return (
    <IonModal
      id="info-modal"
      backdropDismiss={false}
      isOpen={props.isOpen}
    >
      <IonContent color={`transparent-${theme}`}>
        <div className="info-screen">
          <p className={`info-title-${theme}`}>
            {`${t("Days", {
              postProcess: "interval",
              count: 1,
            })} `}
            {cycles.length === 1 ? (
              cycleDay
            ) : (
              <>
                {cycleDay}/{averageCycleLength}
              </>
            )}
          </p>
          <ul>
            <li className={`info-item-${theme}`}>
              <span className={`info-item-${theme}`}>{currentPhase.title}</span>
              <span> {t("Is current phase of cycle")}</span>
            </li>
            <li className={`info-item-${theme}`}>
              <span>{t("Ovulation")}</span>
              <span className={`info-item-${theme}`}>
                {` ${t(ovulationStatus)}`}
              </span>
            </li>
            <li className={`info-item-${theme}`}>
              <span className={`info-item-${theme}`}>{t(pregnancyChance)}</span>
              <span> {t("Chance of getting pregnant")}</span>
            </li>
          </ul>
          <p className={`info-title-${theme}`}>{t("Frequent symptoms")}</p>
          <ul>
            {currentPhase.symptoms.map((item, idx) => (
              <li
                className={`info-item-${theme}`}
                key={idx}
              >
                {item}
              </li>
            ))}
          </ul>
          <IonCol>
            <IonButton
              className="main"
              color={`dark-${theme}`}
              onClick={() => props.setIsOpen(false)}
            >
              OK
            </IonButton>
          </IonCol>
        </div>
      </IonContent>
    </IonModal>
  );
};

export default InfoModal;
