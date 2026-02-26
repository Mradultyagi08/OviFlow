import i18n from "i18next";

export type CyclePhase =
  | "menstrual"
  | "follicular"
  | "ovulation"
  | "luteal"
  | "delay"
  | "none";

interface DailyTip {
  emoji: string;
  message: string;
}

/**
 * Returns a contextual daily tip based on the current cycle phase
 * and the specific day within that phase.
 */
export function getDailyTip(
  phase: CyclePhase,
  dayOfCycle: number,
  periodLength: number,
  cycleLength: number,
): DailyTip {
  const lutealPhaseLength = 14;
  const ovulationDay = cycleLength - lutealPhaseLength;

  // ── Menstrual phase (Day 1 → periodLength) ──
  if (phase === "menstrual") {
    if (dayOfCycle === 1) {
      return {
        emoji: "🌙",
        message: i18n.t("Day 1 — Take it easy. Rest and stay warm."),
      };
    }
    if (dayOfCycle === 2) {
      return {
        emoji: "💧",
        message: i18n.t(
          "Stay hydrated and nourish your body with iron-rich foods.",
        ),
      };
    }
    if (dayOfCycle <= Math.ceil(periodLength / 2)) {
      return {
        emoji: "🫖",
        message: i18n.t(
          "A warm herbal tea can help ease cramps. Be gentle with yourself.",
        ),
      };
    }
    return {
      emoji: "🌿",
      message: i18n.t(
        "Your period is winding down. Light stretching may feel good.",
      ),
    };
  }

  // ── Follicular phase (after period → before ovulation) ──
  if (phase === "follicular") {
    const daysIntoPollicular = dayOfCycle - periodLength;

    if (daysIntoPollicular <= 2) {
      return {
        emoji: "🌱",
        message: i18n.t(
          "Energy is rising! Great time to start new projects or workouts.",
        ),
      };
    }
    if (daysIntoPollicular <= 5) {
      return {
        emoji: "💪",
        message: i18n.t(
          "Your body is building strength. High-intensity exercise works well now.",
        ),
      };
    }
    return {
      emoji: "✨",
      message: i18n.t(
        "Estrogen is climbing — you may feel more creative and social.",
      ),
    };
  }

  // ── Ovulation phase ──
  if (phase === "ovulation") {
    const daysFromOvulation = dayOfCycle - ovulationDay;

    if (daysFromOvulation <= 0) {
      return {
        emoji: "🔥",
        message: i18n.t(
          "Peak fertility window. Energy and confidence are at their highest.",
        ),
      };
    }
    return {
      emoji: "🌸",
      message: i18n.t(
        "Ovulation may be occurring. You might feel mild lower abdominal warmth.",
      ),
    };
  }

  // ── Luteal phase (after ovulation → before next period) ──
  if (phase === "luteal") {
    const daysIntoLuteal = dayOfCycle - (ovulationDay + 2);

    if (daysIntoLuteal <= 3) {
      return {
        emoji: "🧘",
        message: i18n.t(
          "Progesterone is rising. Opt for calming activities like yoga.",
        ),
      };
    }
    if (daysIntoLuteal <= 7) {
      return {
        emoji: "🍫",
        message: i18n.t(
          "Cravings may kick in — choose magnesium-rich snacks like dark chocolate.",
        ),
      };
    }
    if (cycleLength - dayOfCycle <= 3) {
      return {
        emoji: "🌜",
        message: i18n.t(
          "Your period is approaching. Prioritize sleep and self-care.",
        ),
      };
    }
    return {
      emoji: "🍵",
      message: i18n.t(
        "PMS symptoms may appear. Stay hydrated and reduce caffeine.",
      ),
    };
  }

  // ── Delay ──
  if (phase === "delay") {
    return {
      emoji: "📋",
      message: i18n.t(
        "Your period is late. This can be normal — stress and lifestyle affect cycles.",
      ),
    };
  }

  // ── No data ──
  return {
    emoji: "👋",
    message: i18n.t(
      "Welcome! Mark your period days to get personalized daily tips.",
    ),
  };
}
