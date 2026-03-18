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
import { ThemeContext, SettingsContext } from "../state/Context";
import { useAuth } from "../state/AuthContext";
import {
  apiSaveCycleLog,
  apiGetCycleLogs,
  apiPregnancySetup,
  apiSavePregnancyLog,
  apiGetPregnancyLogs,
  apiPostpartumSetup,
  apiSavePostpartumLog,
  apiGetPostpartumLogs,
  apiChangeUserState,
} from "../services/api";
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

function _getPhaseColor(phase: string) {
  switch (phase) {
    case "Menstrual":
      return "#ec4899";
    case "Follicular":
      return "#a855f7";
    case "Ovulation":
      return "#f59e0b";
    case "Luteal":
      return "#8b5cf6";
    default:
      return "#a855f7";
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
  if (score >= 75) return "#db2777";
  if (score >= 50) return "#f472b6";
  return "#fda4af";
}

function getPregnancyWeek(lastPeriodDate: string) {
  const days = Math.max(
    0,
    differenceInDays(startOfToday(), parseISO(lastPeriodDate)),
  );
  return Math.max(1, Math.floor(days / 7) + 1);
}

function getTrimester(week: number) {
  if (week <= 13) return "1st Trimester";
  if (week <= 27) return "2nd Trimester";
  return "3rd Trimester";
}

interface BabyData {
  fruit: string;
  emoji: string;
  weight: string;
  length: string;
  tip: string;
  development: string;
}
function getBabyData(week: number): BabyData {
  if (week <= 4)
    return {
      fruit: "Poppy seed",
      emoji: "🌱",
      weight: "< 1g",
      length: "0.1 cm",
      tip: "Folic acid is crucial now.",
      development: "Neural tube forming.",
    };
  if (week <= 6)
    return {
      fruit: "Pea",
      emoji: "🫛",
      weight: "< 1g",
      length: "0.6 cm",
      tip: "Avoid alcohol and raw fish.",
      development: "Heart starts beating.",
    };
  if (week <= 8)
    return {
      fruit: "Raspberry",
      emoji: "🫐",
      weight: "1g",
      length: "1.6 cm",
      tip: "Stay hydrated, 8–10 glasses/day.",
      development: "Fingers and toes forming.",
    };
  if (week <= 10)
    return {
      fruit: "Strawberry",
      emoji: "🍓",
      weight: "4g",
      length: "3.1 cm",
      tip: "First prenatal visit if not done.",
      development: "All organs present.",
    };
  if (week <= 12)
    return {
      fruit: "Lime",
      emoji: "🍋",
      weight: "14g",
      length: "5.4 cm",
      tip: "Nausea may ease soon.",
      development: "Baby can make facial expressions.",
    };
  if (week <= 14)
    return {
      fruit: "Lemon",
      emoji: "🍋",
      weight: "43g",
      length: "8.7 cm",
      tip: "Start gentle prenatal exercises.",
      development: "Sucking reflex developing.",
    };
  if (week <= 16)
    return {
      fruit: "Avocado",
      emoji: "🥑",
      weight: "100g",
      length: "11.6 cm",
      tip: "You may feel first flutters soon.",
      development: "Skeleton hardening.",
    };
  if (week <= 18)
    return {
      fruit: "Sweet potato",
      emoji: "🍠",
      weight: "190g",
      length: "14.2 cm",
      tip: "Schedule anatomy scan (18–20 wks).",
      development: "Baby can yawn and hiccup.",
    };
  if (week <= 20)
    return {
      fruit: "Banana",
      emoji: "🍌",
      weight: "300g",
      length: "16.4 cm",
      tip: "Halfway there! Sleep on your side.",
      development: "Swallowing amniotic fluid.",
    };
  if (week <= 22)
    return {
      fruit: "Papaya",
      emoji: "🍈",
      weight: "430g",
      length: "19.0 cm",
      tip: "Kick counts: aim for 10 kicks in 2 hrs.",
      development: "Brain developing rapidly.",
    };
  if (week <= 24)
    return {
      fruit: "Corn",
      emoji: "🌽",
      weight: "600g",
      length: "21.0 cm",
      tip: "Glucose test coming up at 24–28 wks.",
      development: "Lungs forming air sacs.",
    };
  if (week <= 26)
    return {
      fruit: "Lettuce",
      emoji: "🥬",
      weight: "760g",
      length: "23.0 cm",
      tip: "Baby responds to your voice now.",
      development: "Eyes opening for first time.",
    };
  if (week <= 28)
    return {
      fruit: "Eggplant",
      emoji: "🍆",
      weight: "1 kg",
      length: "25.0 cm",
      tip: "Third trimester — rest is essential.",
      development: "REM sleep cycles beginning.",
    };
  if (week <= 30)
    return {
      fruit: "Cabbage",
      emoji: "🥦",
      weight: "1.3 kg",
      length: "27.0 cm",
      tip: "Pelvic floor exercises help recovery.",
      development: "Bone marrow producing blood.",
    };
  if (week <= 32)
    return {
      fruit: "Squash",
      emoji: "🎃",
      weight: "1.7 kg",
      length: "28.7 cm",
      tip: "Hospital bag — pack by week 34.",
      development: "Baby settling head-down.",
    };
  if (week <= 34)
    return {
      fruit: "Cantaloupe",
      emoji: "🍈",
      weight: "2.1 kg",
      length: "30.2 cm",
      tip: "Watch for swelling, headaches, flashes.",
      development: "Central nervous system maturing.",
    };
  if (week <= 36)
    return {
      fruit: "Honeydew",
      emoji: "🍈",
      weight: "2.6 kg",
      length: "32.0 cm",
      tip: "Group B Strep test this week.",
      development: "Fat layers building for warmth.",
    };
  if (week <= 38)
    return {
      fruit: "Watermelon",
      emoji: "🍉",
      weight: "3.0 kg",
      length: "33.5 cm",
      tip: "Full term — any day now!",
      development: "Lungs fully mature.",
    };
  return {
    fruit: "Pumpkin",
    emoji: "🎃",
    weight: "3.4+ kg",
    length: "35+ cm",
    tip: "Consult doctor if past due date.",
    development: "Baby ready for the world!",
  };
}

function formatTimer(totalSeconds: number) {
  const h = Math.floor(totalSeconds / 3600)
    .toString()
    .padStart(2, "0");
  const m = Math.floor((totalSeconds % 3600) / 60)
    .toString()
    .padStart(2, "0");
  const s = Math.floor(totalSeconds % 60)
    .toString()
    .padStart(2, "0");
  return `${h}:${m}:${s}`;
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
  // Find the cycle start that covers this date's cycle, then compute ovulation
  const lmp = parseISO(lastPeriodDate);
  // Walk forward from LMP in cycle-length steps until we find the cycle that
  // contains or is just before the given date
  let cycleStart = lmp;
  let next = addDays(cycleStart, cycleLength);
  while (next <= date) {
    cycleStart = next;
    next = addDays(cycleStart, cycleLength);
  }
  const ovulInCycle = addDays(cycleStart, cycleLength - 14);
  return isSameDay(date, ovulInCycle);
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

const IconMoodHappy = () => (
  <svg
    width="22"
    height="22"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.8"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <circle
      cx="12"
      cy="12"
      r="10"
    />
    <path d="M8 14s1.5 2 4 2 4-2 4-2" />
    <circle
      cx="9"
      cy="9"
      r="0.8"
      fill="currentColor"
      stroke="none"
    />
    <circle
      cx="15"
      cy="9"
      r="0.8"
      fill="currentColor"
      stroke="none"
    />
  </svg>
);
const IconMoodOkay = () => (
  <svg
    width="22"
    height="22"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.8"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <circle
      cx="12"
      cy="12"
      r="10"
    />
    <line
      x1="8.5"
      y1="15"
      x2="15.5"
      y2="15"
    />
    <circle
      cx="9"
      cy="9"
      r="0.8"
      fill="currentColor"
      stroke="none"
    />
    <circle
      cx="15"
      cy="9"
      r="0.8"
      fill="currentColor"
      stroke="none"
    />
  </svg>
);
const IconMoodLow = () => (
  <svg
    width="22"
    height="22"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.8"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <circle
      cx="12"
      cy="12"
      r="10"
    />
    <path d="M8 16s1.5-2 4-2 4 2 4 2" />
    <circle
      cx="9"
      cy="9"
      r="0.8"
      fill="currentColor"
      stroke="none"
    />
    <circle
      cx="15"
      cy="9"
      r="0.8"
      fill="currentColor"
      stroke="none"
    />
  </svg>
);
const IconMoodAnxious = () => (
  <svg
    width="22"
    height="22"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.8"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <circle
      cx="12"
      cy="12"
      r="10"
    />
    <path d="M8 15q2-2 4 0t4 0" />
    <circle
      cx="9"
      cy="9"
      r="0.8"
      fill="currentColor"
      stroke="none"
    />
    <circle
      cx="15"
      cy="9"
      r="0.8"
      fill="currentColor"
      stroke="none"
    />
    <line
      x1="16.5"
      y1="4.5"
      x2="18"
      y2="3"
      strokeWidth="1.5"
      opacity="0.45"
    />
  </svg>
);

/* Symptom icons */
const IconCramps = () => (
  <svg
    width="14"
    height="14"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M13 2 9 13h5l-4 9" />
  </svg>
);
const IconHeadache = () => (
  <svg
    width="14"
    height="14"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M9 4a6 6 0 0 0 0 12h6a4 4 0 0 0 0-8 4 4 0 0 0-4-4z" />
    <line
      x1="12"
      y1="12"
      x2="12"
      y2="20"
    />
    <line
      x1="8"
      y1="20"
      x2="16"
      y2="20"
    />
  </svg>
);
const IconBloating = () => (
  <svg
    width="14"
    height="14"
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
      r="8"
    />
    <path
      d="M8 12c0-2.2 1.8-4 4-4"
      opacity="0.5"
    />
    <path
      d="M12 8c2.2 0 4 1.8 4 4"
      opacity="0.5"
    />
  </svg>
);
const IconFatigue = () => (
  <svg
    width="14"
    height="14"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M12 3a9 9 0 0 0 0 18 9 9 0 0 0 9-9H12V3z" />
  </svg>
);
const IconNausea = () => (
  <svg
    width="14"
    height="14"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M2 12c2-4 4-6 6-4s3 6 5 6 4-4 6-4" />
    <path
      d="M2 18c2-2 4-3 6-2s3 3 5 3 4-2 6-2"
      opacity="0.4"
    />
  </svg>
);
const IconBackPain = () => (
  <svg
    width="14"
    height="14"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M12 3c0 0-4 4-4 9s4 9 4 9" />
    <path
      d="M12 3c0 0 4 4 4 9s-4 9-4 9"
      opacity="0.4"
    />
    <line
      x1="8"
      y1="9"
      x2="16"
      y2="9"
    />
    <line
      x1="8"
      y1="15"
      x2="16"
      y2="15"
    />
  </svg>
);

/* Pregnancy panel icons */
const IconLightbulb = () => (
  <svg
    width="14"
    height="14"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M9 18h6M10 22h4M12 2a7 7 0 0 1 4 12.5V17a1 1 0 0 1-1 1H9a1 1 0 0 1-1-1v-2.5A7 7 0 0 1 12 2z" />
  </svg>
);
const IconBaby = () => (
  <svg
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <circle
      cx="12"
      cy="5"
      r="3"
    />
    <path d="M6 20v-5a6 6 0 0 1 12 0v5" />
    <path d="M6 20h12" />
  </svg>
);
const IconTimer = () => (
  <svg
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <circle
      cx="12"
      cy="13"
      r="8"
    />
    <path d="M12 9v4l2.5 2.5" />
    <path d="M9 3h6" />
    <path d="M12 3v2" />
  </svg>
);
const IconDroplet = ({ size = 16 }: { size?: number }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M12 2C6 9 4 13 4 16a8 8 0 0 0 16 0c0-3-2-7-8-14z" />
  </svg>
);
const IconPill = () => (
  <svg
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <rect
      x="3"
      y="10"
      width="18"
      height="4"
      rx="2"
    />
    <path d="M3 12h18" />
    <path d="M7 10V7a5 5 0 0 1 10 0v3" />
    <path d="M7 14v3a5 5 0 0 0 10 0v-3" />
  </svg>
);
const IconHeartPulse = () => (
  <svg
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" />
    <path d="M3.22 12H9.5l1.5-3 2 5 1.5-3 1 1.5h5.28" />
  </svg>
);
const IconAlertTriangle = () => (
  <svg
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
    <line
      x1="12"
      y1="9"
      x2="12"
      y2="13"
    />
    <line
      x1="12"
      y1="17"
      x2="12.01"
      y2="17"
    />
  </svg>
);
const IconCalendar = () => (
  <svg
    width="16"
    height="16"
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
      rx="2"
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
const IconCheckCircle = () => (
  <svg
    width="14"
    height="14"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2.2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <circle
      cx="12"
      cy="12"
      r="10"
    />
    <polyline points="9 12 11 14 15 10" />
  </svg>
);

const IconMilk = () => (
  <svg
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M8 2h8l2 5H6z" />
    <path d="M6 7v12a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2V7" />
    <path d="M10 12h4" />
    <path d="M10 16h4" />
  </svg>
);

const IconMoon = () => (
  <svg
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
  </svg>
);

const IconScale = () => (
  <svg
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M12 2v20" />
    <path d="M4 12h16" />
    <circle
      cx="6"
      cy="8"
      r="2"
    />
    <circle
      cx="18"
      cy="8"
      r="2"
    />
    <path d="M5 20h14" />
  </svg>
);

const IconShield = () => (
  <svg
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
  </svg>
);

const IconSettings = () => (
  <svg
    width="15"
    height="15"
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
      r="3"
    />
    <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
  </svg>
);

const SYMPTOM_LIST = [
  { label: "Cramps", Icon: IconCramps, color: "#db2777" },
  { label: "Headache", Icon: IconHeadache, color: "#e11d48" },
  { label: "Bloating", Icon: IconBloating, color: "#c026d3" },
  { label: "Fatigue", Icon: IconFatigue, color: "#7c3aed" },
  { label: "Nausea", Icon: IconNausea, color: "#be185d" },
  { label: "Back pain", Icon: IconBackPain, color: "#9333ea" },
];

/* ─────────────────────────────────────────────────────
   Pregnancy Setup Modal
───────────────────────────────────────────────────── */
interface PregnancySetupData {
  type: "confirmed" | "maybe";
  confirmDate: string;
  doctorConfirmed: boolean;
  highRisk: boolean;
}
interface PregnancySetupModalProps {
  onConfirm: (data: PregnancySetupData) => void;
  onCancel: () => void;
  initialDate?: string;
  initialSelection?: "confirmed" | "maybe";
}
const PregnancySetupModal: React.FC<PregnancySetupModalProps> = ({
  onConfirm,
  onCancel,
  initialDate,
  initialSelection,
}) => {
  const [selection, setSelection] = useState<"confirmed" | "maybe" | null>(
    initialSelection ?? null,
  );
  const [confirmDate, setConfirmDate] = useState(
    initialDate ?? format(startOfToday(), "yyyy-MM-dd"),
  );
  const [doctorConfirmed, setDoctorConfirmed] = useState(false);
  const [highRisk, setHighRisk] = useState(false);

  return (
    <div
      className="cd-overlay"
      onClick={onCancel}
    >
      <div
        className="cd-preg-setup"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="cd-preg-setup-title">Are you pregnant?</h2>

        <div className="cd-preg-setup-options">
          <button
            className={`cd-preg-option${
              selection === "confirmed" ? " active" : ""
            }`}
            onClick={() => setSelection("confirmed")}
          >
            <span className="cd-preg-option-icon">
              {selection === "confirmed" ? "✓" : "○"}
            </span>
            <span className="cd-preg-option-label">Yes, confirmed</span>
            <span className="cd-preg-option-arrow">›</span>
          </button>
          <button
            className={`cd-preg-option${
              selection === "maybe" ? " active" : ""
            }`}
            onClick={() => setSelection("maybe")}
          >
            <span className="cd-preg-option-icon">?</span>
            <span className="cd-preg-option-label">I think I might be</span>
            <span className="cd-preg-option-arrow">›</span>
          </button>
        </div>

        {selection === "confirmed" && (
          <div className="cd-preg-setup-details">
            <h3 className="cd-preg-details-title">
              When was your last menstrual period?
            </h3>
            <label className="cd-preg-field-label">
              Last Period Date (LMP)
            </label>
            <div className="cd-preg-date-row">
              <input
                type="date"
                className="cd-preg-date-input"
                value={confirmDate}
                max={format(startOfToday(), "yyyy-MM-dd")}
                onChange={(e) => setConfirmDate(e.target.value)}
              />
              <span className="cd-preg-date-icon">
                <IconCalendar />
              </span>
            </div>
            <p className="cd-preg-date-hint">
              Your due date and week will be estimated from this date.
            </p>

            <label className="cd-preg-check-row">
              <input
                type="checkbox"
                className="cd-preg-check"
                checked={doctorConfirmed}
                onChange={(e) => setDoctorConfirmed(e.target.checked)}
              />
              <span>Doctor confirmed my pregnancy</span>
            </label>

            <label className="cd-preg-check-row">
              <input
                type="checkbox"
                className="cd-preg-check"
                checked={highRisk}
                onChange={(e) => setHighRisk(e.target.checked)}
              />
              <div>
                <span className="cd-preg-check-title">High-risk pregnancy</span>
                <p className="cd-preg-check-desc">
                  We&apos;ll provide extra guidance to help you monitor and
                  manage your pregnancy.
                </p>
              </div>
            </label>
          </div>
        )}

        <div
          className="cd-confirm-footer"
          style={{ marginTop: 20 }}
        >
          <button
            className="cd-confirm-cancel"
            onClick={onCancel}
          >
            Cancel
          </button>
          <button
            className="cd-confirm-ok"
            style={{ opacity: selection ? 1 : 0.5 }}
            disabled={!selection}
            onClick={() => {
              if (selection)
                onConfirm({
                  type: selection,
                  confirmDate,
                  doctorConfirmed,
                  highRisk,
                });
            }}
          >
            Confirm ›
          </button>
        </div>

        <p className="cd-preg-disclaimer">
          OVIFLOW is not a medical diagnosis tool.
        </p>
      </div>
    </div>
  );
};

/* ─────────────────────────────────────────────────────
   Postpartum Setup Modal
───────────────────────────────────────────────────── */
interface PostpartumSetupData {
  type: "delivered" | "mishappening" | "stillPregnant";
  deliveryDate: string;
  cSection: boolean;
  doctorFollowUp: boolean;
}
interface PostpartumSetupModalProps {
  onConfirm: (data: PostpartumSetupData) => void;
  onCancel: () => void;
  initialDate?: string;
  initialSelection?: "delivered" | "mishappening" | "stillPregnant";
}
const PostpartumSetupModal: React.FC<PostpartumSetupModalProps> = ({
  onConfirm,
  onCancel,
  initialDate,
  initialSelection,
}) => {
  const [selection, setSelection] = useState<
    "delivered" | "mishappening" | "stillPregnant" | null
  >(initialSelection ?? null);
  const [deliveryDate, setDeliveryDate] = useState(
    initialDate ?? format(startOfToday(), "yyyy-MM-dd"),
  );
  const [cSection, setCSection] = useState(false);
  const [doctorFollowUp, setDoctorFollowUp] = useState(false);

  const options: {
    key: "delivered" | "mishappening" | "stillPregnant";
    label: string;
    Icon: React.FC;
  }[] = [
    { key: "delivered", label: "Yes, delivered", Icon: IconCheckCircle },
    {
      key: "mishappening",
      label: "Mishappening occurred",
      Icon: IconAlertTriangle,
    },
    { key: "stillPregnant", label: "Still pregnant", Icon: IconBaby },
  ];

  return (
    <div
      className="cd-overlay"
      onClick={onCancel}
    >
      <div
        className="cd-preg-setup"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="cd-preg-setup-title">Have you delivered your baby?</h2>

        <div className="cd-preg-setup-options">
          {options.map(({ key, label, Icon }) => (
            <button
              key={key}
              className={`cd-preg-option${selection === key ? " active" : ""}`}
              onClick={() => setSelection(key)}
            >
              <span className="cd-preg-option-icon">
                <Icon />
              </span>
              <span className="cd-preg-option-label">{label}</span>
              <span className="cd-preg-option-arrow">›</span>
            </button>
          ))}
        </div>

        {selection === "delivered" && (
          <div className="cd-preg-setup-details">
            <h3 className="cd-preg-details-title">When did you deliver?</h3>
            <label className="cd-preg-field-label">Delivery Date</label>
            <div className="cd-preg-date-row">
              <input
                type="date"
                className="cd-preg-date-input"
                value={deliveryDate}
                max={format(startOfToday(), "yyyy-MM-dd")}
                onChange={(e) => setDeliveryDate(e.target.value)}
              />
              <span className="cd-preg-date-icon">
                <IconCalendar />
              </span>
            </div>
            <p className="cd-preg-date-hint">
              Your postpartum tracking will begin from this date.
            </p>
            <label className="cd-preg-check-row">
              <input
                type="checkbox"
                className="cd-preg-check"
                checked={cSection}
                onChange={(e) => setCSection(e.target.checked)}
              />
              <div>
                <span className="cd-preg-check-title">C-section delivery</span>
                <p className="cd-preg-check-desc">
                  We&apos;ll tailor recovery guidance for surgical birth.
                </p>
              </div>
            </label>
            <label className="cd-preg-check-row">
              <input
                type="checkbox"
                className="cd-preg-check"
                checked={doctorFollowUp}
                onChange={(e) => setDoctorFollowUp(e.target.checked)}
              />
              <span>Postpartum check-up scheduled with doctor</span>
            </label>
          </div>
        )}

        {selection === "mishappening" && (
          <div className="cd-preg-setup-details">
            <p
              className="cd-preg-date-hint"
              style={{ lineHeight: 1.6 }}
            >
              We&apos;re deeply sorry for your loss. Please reach out to your
              healthcare provider for support and guidance during this time.
            </p>
          </div>
        )}

        <p
          className="cd-confirm-body"
          style={{ marginTop: 16, fontSize: 13 }}
        >
          If you have any concerns,
          <br />
          reach out to a gynecologist.
        </p>

        <div
          className="cd-confirm-footer"
          style={{ marginTop: 16 }}
        >
          <button
            className="cd-confirm-cancel"
            onClick={onCancel}
          >
            Cancel
          </button>
          <button
            className="cd-confirm-ok"
            style={{ opacity: selection ? 1 : 0.5 }}
            disabled={!selection}
            onClick={() => {
              if (selection)
                onConfirm({
                  type: selection,
                  deliveryDate,
                  cSection,
                  doctorFollowUp,
                });
            }}
          >
            Confirm ›
          </button>
        </div>

        <p className="cd-preg-disclaimer">
          OVIFLOW is not a medical diagnosis tool.
        </p>
      </div>
    </div>
  );
};

/* ─────────────────────────────────────────────────────
   Main Dashboard
───────────────────────────────────────────────────── */
const CycleDashboard: React.FC = () => {
  const { user, token } = useAuth();
  const { theme } = useContext(ThemeContext);
  const { appMode, updateAppMode } = useContext(SettingsContext);
  const isDark = theme === "dark";

  const cp = user?.cycleProfile;
  const lastPeriodDate =
    cp?.lastPeriodDate || format(startOfToday(), "yyyy-MM-dd");
  const cycleLength = cp?.cycleLength ?? 28;
  const periodLength = cp?.periodLength ?? 5;

  /* ── Mode ── */
  const [activeMode, setActiveMode] = useState<
    "cycle" | "pregnant" | "postpartum"
  >(
    appMode === "pregnancy"
      ? "pregnant"
      : appMode === "postpartum"
        ? "postpartum"
        : "cycle",
  );
  const [pendingMode, setPendingMode] = useState<
    "pregnant" | "postpartum" | null
  >(null);
  /* ── Re-open setup modals to edit existing configuration ── */
  const [editingSetup, setEditingSetup] = useState<
    "pregnant" | "postpartum" | null
  >(null);
  /* ── Track whether each mode has been set up already ── */
  const [pregnantSetupDone, setPregnantSetupDone] = useState(
    appMode === "pregnancy",
  );
  const [postpartumSetupDone, setPostpartumSetupDone] = useState(
    appMode === "postpartum",
  );

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

  /* ── Pregnancy/Postpartum states ── */
  const [kickCount, setKickCount] = useState(0);
  const [contractionSeconds, setContractionSeconds] = useState(0);
  const [isContractionRunning, setIsContractionRunning] = useState(false);
  /* ── Pregnancy enriched state ── */
  const [waterGlasses, setWaterGlasses] = useState(0);
  const [vitaminTaken, setVitaminTaken] = useState(false);
  const [nextApptDate, setNextApptDate] = useState("");
  const [pregSymptoms, setPregSymptoms] = useState<string[]>([]);
  const [contractionLog, setContractionLog] = useState<
    { duration: number; time: string }[]
  >([]);
  const [lastFeedAt, setLastFeedAt] = useState<Date | null>(null);
  const [recoveryEnergy, setRecoveryEnergy] = useState(60);
  const [recoveryPain, setRecoveryPain] = useState(35);
  const [recoverySleep, setRecoverySleep] = useState(55);
  /* ── Postpartum enriched state ── */
  const [ppFeedSide, setPPFeedSide] = useState<"left" | "right" | "both" | "">(
    "",
  );
  const [ppFeedSeconds, setPPFeedSeconds] = useState(0);
  const [isPPFeedRunning, setIsPPFeedRunning] = useState(false);
  const [ppFeedLog, setPPFeedLog] = useState<
    { side: string; duration: number; time: string }[]
  >([]);
  const [ppMood, setPPMood] = useState("");
  const [ppSymptoms, setPPSymptoms] = useState<string[]>([]);
  const [ppWaterGlasses, setPPWaterGlasses] = useState(0);
  const [ppChecklist, setPPChecklist] = useState<string[]>([]);
  const [babyFeedCount, setBabyFeedCount] = useState(0);
  const [babySleepHours, setBabySleepHours] = useState(0);
  const [ppNextApptDate, setPPNextApptDate] = useState("");
  /* ── Cycle extra state ── */
  const [cycleWaterGlasses, setCycleWaterGlasses] = useState(0);
  /* ── Setup modal data ── */
  const [pregnancyConfirmDate, setPregnancyConfirmDate] =
    useState(lastPeriodDate);
  const [deliveryDate, setDeliveryDate] = useState(
    format(startOfToday(), "yyyy-MM-dd"),
  );
  const [_isCSection, setIsCSection] = useState(false);
  /* ── Pregnant controlled checklists ── */
  const [pregChecklist, setPregChecklist] = useState<string[]>([]);
  const [apptChecklist, setApptChecklist] = useState<string[]>([]);
  /* ── Postpartum appt checklist ── */
  const [ppApptChecklist, setPPApptChecklist] = useState<string[]>([]);

  /* ── OVI Assistant ── */
  const [assistantOpen, setAssistantOpen] = useState(false);
  const [assistantInput, setAssistantInput] = useState("");
  const [assistantMessages, setAssistantMessages] = useState<string[]>([
    "Hi, I’m OVI. I can help with cycle, pregnancy and postpartum guidance.",
  ]);

  useEffect(() => {
    if (appMode === "pregnancy") {
      setActiveMode("pregnant");
      return;
    }
    if (appMode === "postpartum") {
      setActiveMode("postpartum");
      return;
    }
    setActiveMode("cycle");
  }, [appMode]);

  useEffect(() => {
    if (!token) return;
    apiGetCycleLogs(token)
      .then(({ logs: l }) => setLogs(l))
      .catch(console.error);
  }, [token]);

  /* Load pregnancy logs */
  useEffect(() => {
    if (!token || activeMode !== "pregnant") return;
    apiGetPregnancyLogs(token).catch(console.error);
  }, [token, activeMode]);

  /* Load postpartum logs */
  useEffect(() => {
    if (!token || activeMode !== "postpartum") return;
    apiGetPostpartumLogs(token).catch(console.error);
  }, [token, activeMode]);

  useEffect(() => {
    if (!isContractionRunning) {
      return;
    }
    const intervalId = window.setInterval(() => {
      setContractionSeconds((prev) => prev + 1);
    }, 1000);
    return () => window.clearInterval(intervalId);
  }, [isContractionRunning]);

  useEffect(() => {
    if (!isPPFeedRunning) return;
    const intervalId = window.setInterval(() => {
      setPPFeedSeconds((prev) => prev + 1);
    }, 1000);
    return () => window.clearInterval(intervalId);
  }, [isPPFeedRunning]);

  /* ── Derived ── */
  const PP_CHECKLIST_ITEMS = [
    "Iron supplement taken",
    "Prenatal vitamin taken",
    "Pelvic floor exercises",
    "Incision / stitch check",
    "Drank enough water",
  ];
  const nextPeriod = calcNextPeriod(lastPeriodDate, cycleLength);
  const daysUntil = differenceInDays(nextPeriod, startOfToday());
  const ovulationDate = calcOvulation(lastPeriodDate, cycleLength);
  const phase = getCyclePhase(lastPeriodDate, cycleLength, periodLength);
  const progress = calcProgressRing(lastPeriodDate, cycleLength);
  const healthScore = calcHealthScore(logs, cycleLength);
  const scoreColor = getScoreColor(healthScore);
  const dueDate = addDays(parseISO(pregnancyConfirmDate), 280);
  const daysUntilDue = Math.max(0, differenceInDays(dueDate, startOfToday()));
  const pregnancyWeek = Math.min(
    40,
    Math.max(1, 40 - Math.floor(daysUntilDue / 7)),
  );
  const trimester = getTrimester(pregnancyWeek);
  const postpartumDay = Math.max(
    1,
    differenceInDays(startOfToday(), parseISO(deliveryDate)),
  );
  const babyData = getBabyData(pregnancyWeek);
  const pregnancyMonth =
    pregnancyWeek <= 4
      ? 1
      : pregnancyWeek <= 8
        ? 2
        : pregnancyWeek <= 13
          ? 3
          : pregnancyWeek <= 17
            ? 4
            : pregnancyWeek <= 21
              ? 5
              : pregnancyWeek <= 26
                ? 6
                : pregnancyWeek <= 30
                  ? 7
                  : pregnancyWeek <= 35
                    ? 8
                    : 9;
  const embryoImages = [
    "",
    "/assets/EmbryoMonthStages/1-Month-Cherry.png",
    "/assets/EmbryoMonthStages/2-Month-Peach.png",
    "/assets/EmbryoMonthStages/3-Month-Plum.png",
    "/assets/EmbryoMonthStages/4-Month-Pear.png",
    "/assets/EmbryoMonthStages/5-Month-Orange.png",
    "/assets/EmbryoMonthStages/6-Month-Avocado.png",
    "/assets/EmbryoMonthStages/7-Month-Pineapple.png",
    "/assets/EmbryoMonthStages/8-Month-MuskMelon.png",
    "/assets/EmbryoMonthStages/9-Month-WaterMelon.png",
  ];
  const PREG_SYMPTOM_LIST = [
    "Nausea",
    "Fatigue",
    "Back pain",
    "Heartburn",
    "Swelling",
    "Headache",
    "Insomnia",
    "Mood swings",
  ];
  const togglePregSymptom = (s: string) =>
    setPregSymptoms((prev) =>
      prev.includes(s) ? prev.filter((x) => x !== s) : [...prev, s],
    );

  const POSTPARTUM_SYMPTOM_LIST = [
    "Bleeding",
    "Soreness",
    "Cramps",
    "Fatigue",
    "Swelling",
    "Headache",
    "Tenderness",
    "Night sweats",
  ];
  const PP_MOOD_LIST = [
    { label: "Joyful", msg: "Wonderful! Cherish these moments." },
    {
      label: "Overwhelmed",
      msg: "It's okay to ask for help. You're not alone.",
    },
    { label: "Anxious", msg: "Take slow breaths. Baby steps every day." },
    {
      label: "Tearful",
      msg: "Baby blues are normal. Talk to someone you trust.",
    },
  ];
  const togglePPSymptom = (s: string) =>
    setPPSymptoms((prev) =>
      prev.includes(s) ? prev.filter((x) => x !== s) : [...prev, s],
    );
  const togglePPChecklist = (s: string) =>
    setPPChecklist((prev) =>
      prev.includes(s) ? prev.filter((x) => x !== s) : [...prev, s],
    );
  const ppFeedMins = Math.floor(ppFeedSeconds / 60);
  const ppFeedSecs = ppFeedSeconds % 60;

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

    // Route to appropriate save function based on active mode
    if (activeMode === "pregnant") {
      return savePregnancyLog();
    }
    if (activeMode === "postpartum") {
      return savePostpartumLog();
    }

    // Default to cycle log
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
    } catch (_err) {
      setSaveMsg("Error saving. Try again.");
    } finally {
      setSaving(false);
    }
  };

  /* ── Save pregnancy log ── */
  const savePregnancyLog = async () => {
    if (!token) return;
    setSaving(true);
    setSaveMsg("");
    try {
      await apiSavePregnancyLog(token, {
        date: todayStr,
        waterGlasses,
        vitaminsTaken: vitaminTaken,
        symptoms: pregSymptoms,
        contractions: contractionLog,
        nextAppointmentDate: nextApptDate,
        checklistItems: pregChecklist,
        notes,
      });
      setSaveMsg("Saved!");
      setTimeout(() => setSaveMsg(""), 2500);
    } catch (_err) {
      setSaveMsg("Error saving pregnancy log. Try again.");
    } finally {
      setSaving(false);
    }
  };

  /* ── Save postpartum log ── */
  const savePostpartumLog = async () => {
    if (!token) return;
    setSaving(true);
    setSaveMsg("");
    try {
      await apiSavePostpartumLog(token, {
        date: todayStr,
        mood: ppMood,
        symptoms: ppSymptoms,
        energy: recoveryEnergy,
        pain: recoveryPain,
        sleep: recoverySleep,
        waterGlasses: ppWaterGlasses,
        ironSupplementTaken: false,
        vitaminsTaken: false,
        motherChecklist: ppChecklist,
        feeds: ppFeedLog,
        feedCount: babyFeedCount,
        babySleepHours,
        nextAppointmentDate: ppNextApptDate,
        appointmentChecklist: ppApptChecklist,
        notes,
      });
      setSaveMsg("Saved!");
      setTimeout(() => setSaveMsg(""), 2500);
    } catch (_err) {
      setSaveMsg("Error saving postpartum log. Try again.");
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
    if (m === activeMode) return; // guard: no-op if already in this mode
    setIsContractionRunning(false);
    setIsPPFeedRunning(false);
    if (m === "cycle") {
      if (token) {
        apiChangeUserState(token, "cycle").catch((err) =>
          console.error("Failed to change state:", err),
        );
      }
      setActiveMode("cycle");
      updateAppMode("regular");
      return;
    }
    // Only show the setup modal the very first time
    if (m === "pregnant" && pregnantSetupDone) {
      if (token) {
        apiChangeUserState(token, "pregnancy").catch((err) =>
          console.error("Failed to change state:", err),
        );
      }
      setActiveMode("pregnant");
      updateAppMode("pregnancy");
      return;
    }
    if (m === "postpartum" && postpartumSetupDone) {
      if (token) {
        apiChangeUserState(token, "postpartum").catch((err) =>
          console.error("Failed to change state:", err),
        );
      }
      setActiveMode("postpartum");
      updateAppMode("postpartum");
      return;
    }
    setPendingMode(m);
  };

  const handleSendAssistantMessage = () => {
    const msg = assistantInput.trim();
    if (!msg) return;

    const modeReply =
      activeMode === "pregnant"
        ? "Pregnancy tip: stay hydrated, track contractions, and call your doctor for persistent pain."
        : activeMode === "postpartum"
          ? "Postpartum tip: prioritize rest, hydration, and monitor recovery symptoms daily."
          : "Cycle tip: consistent logging improves prediction accuracy and health insights.";

    setAssistantMessages((prev) => [
      ...prev,
      `You: ${msg}`,
      `OVI: ${modeReply}`,
    ]);
    setAssistantInput("");
  };

  const modeClass =
    activeMode === "pregnant"
      ? "mode-pregnancy"
      : activeMode === "postpartum"
        ? "mode-postpartum"
        : "mode-cycle";

  return (
    <IonPage>
      <IonContent
        className="ion-padding"
        scrollY={true}
      >
        <div className={`cd-root ${modeClass} ${isDark ? "dark" : ""}`}>
          {/* ── Mode confirm modal ── */}
          {pendingMode === "pregnant" && (
            <PregnancySetupModal
              onConfirm={(data) => {
                // Save pregnancy setup to backend
                if (token) {
                  const dueDate = addDays(parseISO(data.confirmDate), 280);
                  apiPregnancySetup(token, {
                    lastMenstrualPeriod: lastPeriodDate,
                    confirmDate: data.confirmDate,
                    type: data.type,
                    doctorConfirmed: data.doctorConfirmed,
                    highRisk: data.highRisk,
                    dueDate: format(dueDate, "yyyy-MM-dd"),
                  }).catch((err) =>
                    console.error("Failed to save pregnancy setup:", err),
                  );
                }
                setPregnantSetupDone(true);
                if (data.confirmDate) setPregnancyConfirmDate(data.confirmDate);
                setActiveMode("pregnant");
                updateAppMode("pregnancy");
                setPendingMode(null);
              }}
              onCancel={() => setPendingMode(null)}
            />
          )}
          {pendingMode === "postpartum" && (
            <PostpartumSetupModal
              onConfirm={(data) => {
                if (data.type === "stillPregnant") {
                  // User is still pregnant — stay in current mode
                  setPendingMode(null);
                  return;
                }
                if (data.type === "mishappening") {
                  // Compassionate handling — return to cycle mode
                  if (token) {
                    apiChangeUserState(token, "cycle").catch((err) =>
                      console.error("Failed to change state:", err),
                    );
                  }
                  setPendingMode(null);
                  setActiveMode("cycle");
                  updateAppMode("regular");
                  return;
                }
                // Normal postpartum transition — save delivery data
                if (token) {
                  apiPostpartumSetup(token, {
                    deliveryDate: data.deliveryDate,
                    deliveryMethod: data.cSection ? "csection" : "vaginal",
                    doctorFollowUp: data.doctorFollowUp,
                  }).catch((err) =>
                    console.error("Failed to save postpartum setup:", err),
                  );
                }
                if (data.deliveryDate) setDeliveryDate(data.deliveryDate);
                setIsCSection(!!data.cSection);
                setPostpartumSetupDone(true);
                setActiveMode("postpartum");
                updateAppMode("postpartum");
                setPendingMode(null);
              }}
              onCancel={() => setPendingMode(null)}
            />
          )}

          {/* Edit-setup modals (don't switch mode, just update stored data) */}
          {editingSetup === "pregnant" && (
            <PregnancySetupModal
              initialDate={pregnancyConfirmDate}
              initialSelection="confirmed"
              onConfirm={(data) => {
                if (data.confirmDate) setPregnancyConfirmDate(data.confirmDate);
                setEditingSetup(null);
              }}
              onCancel={() => setEditingSetup(null)}
            />
          )}
          {editingSetup === "postpartum" && (
            <PostpartumSetupModal
              initialDate={deliveryDate}
              initialSelection="delivered"
              onConfirm={(data) => {
                if (data.type === "stillPregnant") {
                  setEditingSetup(null);
                  return;
                }
                if (data.type === "mishappening") {
                  setEditingSetup(null);
                  return;
                }
                if (data.deliveryDate) setDeliveryDate(data.deliveryDate);
                setIsCSection(!!data.cSection);
                setEditingSetup(null);
              }}
              onCancel={() => setEditingSetup(null)}
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
                    Welcome, {user?.name?.split(" ")[0] ?? "there"}
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
              {/* Edit Setup button — only visible when a configured mode is active */}
              {activeMode !== "cycle" && (
                <button
                  className="cd-edit-setup-btn"
                  onClick={() => setEditingSetup(activeMode)}
                  title={`Edit ${activeMode === "pregnant" ? "pregnancy" : "postpartum"} setup`}
                >
                  <IconSettings />
                  Edit Setup
                </button>
              )}
            </div>

            {/* ═══════════════════════════════════════════
            BODY GRID — 2 COLUMNS ON DESKTOP
        ═══════════════════════════════════════════ */}
            {activeMode === "cycle" && (
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

                  {/* ── When to See a Doctor ── */}
                  <div className="cd-card cd-warning-soft">
                    <h2 className="cd-card-title">
                      <span className="cd-title-icon">
                        <IconAlertTriangle />
                      </span>
                      When to See a Doctor
                    </h2>
                    <div className="cd-alert-grid">
                      {[
                        "Cycles shorter than 21 days",
                        "Cycles longer than 35 days",
                        "Bleeding lasting over 7 days",
                        "Severe pain affecting daily life",
                        "Spotting between periods",
                        "Sudden change in cycle pattern",
                      ].map((item) => (
                        <div
                          key={item}
                          className="cd-alert-item"
                        >
                          <span className="cd-alert-dot" />
                          {item}
                        </div>
                      ))}
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
                          { id: "happy", Icon: IconMoodHappy, label: "Happy" },
                          { id: "okay", Icon: IconMoodOkay, label: "Okay" },
                          { id: "low", Icon: IconMoodLow, label: "Low" },
                          {
                            id: "anxious",
                            Icon: IconMoodAnxious,
                            label: "Anxious",
                          },
                        ] as {
                          id: "happy" | "okay" | "low" | "anxious";
                          Icon: React.FC;
                          label: string;
                        }[]
                      ).map(({ id, Icon, label }) => (
                        <button
                          key={id}
                          data-mood={id}
                          className={`cd-mood-btn ${mood === id ? "active" : ""}`}
                          onClick={() => setMood(mood === id ? "" : id)}
                        >
                          <span className="cd-mood-icon">
                            <Icon />
                          </span>
                          <span className="cd-mood-label">{label}</span>
                        </button>
                      ))}
                    </div>
                    <p className="cd-log-section-label">Symptoms</p>
                    <div className="cd-symptom-group">
                      {SYMPTOM_LIST.map(({ label, Icon, color }) => (
                        <button
                          key={label}
                          className={`cd-chip ${symptoms.includes(label) ? "active" : ""}`}
                          style={
                            {
                              "--chip-icon-color": color,
                            } as React.CSSProperties
                          }
                          onClick={() => toggleSymptom(label)}
                        >
                          <span className="cd-chip-icon">
                            <Icon />
                          </span>
                          {label}
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
                        style={{ margin: 0, color: "var(--cd-accent)" }}
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

                  {/* ── AI Insight ── */}
                  <div className="cd-card cd-insight-card">
                    <h2 className="cd-card-title">AI Insight</h2>
                    <p className="cd-score-desc">
                      {phase === "Ovulation"
                        ? "You’re in a high-fertility window. Prioritize hydration and balanced meals."
                        : "Your cycle is trending stable. Continue daily logs for better prediction accuracy."}
                    </p>
                  </div>

                  {/* ── Stay Hydrated ── */}
                  <div className="cd-card">
                    <h2 className="cd-card-title">
                      <span className="cd-title-icon">
                        <IconDroplet />
                      </span>
                      Stay Hydrated
                    </h2>
                    <div className="cd-water-grid">
                      {Array.from({ length: 8 }).map((_, i) => (
                        <button
                          key={i}
                          className={`cd-water-glass${i < cycleWaterGlasses ? " filled" : ""}`}
                          onClick={() =>
                            setCycleWaterGlasses(
                              cycleWaterGlasses === i + 1 ? i : i + 1,
                            )
                          }
                          aria-label={`Glass ${i + 1}`}
                        >
                          <IconDroplet />
                        </button>
                      ))}
                    </div>
                    <p className="cd-score-desc">
                      {cycleWaterGlasses >= 8 ? (
                        <span className="cd-goal-met">
                          <IconCheckCircle /> 8 glasses done — great hydration!
                        </span>
                      ) : (
                        `${cycleWaterGlasses}/8 glasses — hydration eases cramps and bloating`
                      )}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {activeMode === "pregnant" && (
              <div className="cd-mode-stack">
                {/* ── Hero: Week + Baby Info ── */}
                <div className="cd-hero cd-preg-hero">
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
                        stroke="rgba(255,255,255,0.2)"
                        strokeWidth="10"
                      />
                      <circle
                        cx="70"
                        cy="70"
                        r={R}
                        fill="none"
                        stroke="#fff"
                        strokeWidth="10"
                        strokeDasharray={`${Math.min((pregnancyWeek / 40) * C, C)} ${C}`}
                        strokeLinecap="round"
                        transform="rotate(-90 70 70)"
                      />
                      <text
                        x="70"
                        y="56"
                        textAnchor="middle"
                        fill="rgba(255,255,255,0.75)"
                        fontSize="11"
                        fontWeight="600"
                      >
                        Week
                      </text>
                      <text
                        x="70"
                        y="79"
                        textAnchor="middle"
                        fill="#fff"
                        fontSize="26"
                        fontWeight="800"
                      >
                        {pregnancyWeek}
                      </text>
                    </svg>
                  </div>
                  <div
                    className="cd-hero-info"
                    style={{ flex: 1 }}
                  >
                    <div style={{ marginBottom: 8 }}>
                      <p className="cd-hero-label">Due Date</p>
                      <p className="cd-hero-date">
                        {format(dueDate, "MMM d, yyyy")}
                      </p>
                      <p className="cd-hero-sub">{daysUntilDue} days to go</p>
                    </div>
                    <div className="cd-hero-mini-stats">
                      <div className="cd-hero-mini-stat">
                        <span className="cd-hero-mini-label">Size</span>
                        <span className="cd-hero-mini-value">
                          {babyData.fruit}
                        </span>
                      </div>
                      <div className="cd-hero-mini-stat">
                        <span className="cd-hero-mini-label">Weight</span>
                        <span className="cd-hero-mini-value">
                          {babyData.weight}
                        </span>
                      </div>
                      <div className="cd-hero-mini-stat">
                        <span className="cd-hero-mini-label">Length</span>
                        <span className="cd-hero-mini-value">
                          {babyData.length}
                        </span>
                      </div>
                      <div className="cd-hero-mini-stat">
                        <span className="cd-hero-mini-label">Trimester</span>
                        <span className="cd-hero-mini-value">
                          {trimester.split(" ")[0]}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="cd-embryo-img-wrap">
                    <img
                      src={embryoImages[pregnancyMonth]}
                      alt={`Month ${pregnancyMonth} embryo`}
                      className="cd-embryo-img"
                    />
                  </div>
                </div>

                {/* ── Pregnancy Tips ── */}
                <div className="cd-card cd-baby-dev-card">
                  <h2 className="cd-card-title">
                    <span className="cd-title-icon">
                      <IconLightbulb />
                    </span>
                    Pregnancy Wellness Tips
                  </h2>
                  <div className="cd-alert-grid">
                    {(trimester === "1st Trimester"
                      ? [
                          "Take folic acid daily to support neural tube development.",
                          "Eat small, frequent meals to manage nausea.",
                          "Stay hydrated — at least 8–10 glasses of water a day.",
                          "Avoid raw fish, soft cheeses, and deli meats.",
                          "Schedule your first prenatal appointment if you haven't.",
                          "Get extra sleep — fatigue is normal in the first trimester.",
                        ]
                      : trimester === "2nd Trimester"
                        ? [
                            "Begin gentle pregnancy-safe exercise like walking or swimming.",
                            "Sleep on your left side to improve blood flow to the baby.",
                            "Track baby's movements — they should start soon.",
                            "Eat calcium-rich foods to support baby's bone development.",
                            "Consider a prenatal class to prepare for labour.",
                            "Apply moisturiser to prevent stretch marks.",
                          ]
                        : [
                            "Pack your hospital bag — you're in the home stretch!",
                            "Practice breathing and relaxation techniques for labour.",
                            "Reduce sodium intake to ease swelling.",
                            "Rest as much as possible and accept help from others.",
                            "Discuss your birth plan with your doctor.",
                            "Monitor movements — call your doctor if baby is less active.",
                          ]
                    ).map((tip) => (
                      <div
                        key={tip}
                        className="cd-alert-item"
                      >
                        <span className="cd-alert-dot" />
                        {tip}
                      </div>
                    ))}
                  </div>
                </div>

                <div className="cd-mode-grid">
                  {/* ── Kick Counter ── */}
                  <div className="cd-card">
                    <h2 className="cd-card-title">
                      <span className="cd-title-icon">
                        <IconBaby />
                      </span>
                      Kick Counter
                    </h2>
                    <p
                      className="cd-score-desc"
                      style={{ marginBottom: 4 }}
                    >
                      Goal: 10 kicks in 2 hours
                    </p>
                    <p className="cd-metric-value">
                      {kickCount}
                      <span
                        style={{
                          fontSize: 16,
                          fontWeight: 500,
                          color: "#9ca3af",
                        }}
                      >
                        {" "}
                        kicks
                      </span>
                    </p>
                    <div className="cd-kick-progress">
                      <div
                        className="cd-kick-bar"
                        style={{
                          width: `${Math.min((kickCount / 10) * 100, 100)}%`,
                        }}
                      />
                    </div>
                    <p
                      className="cd-score-desc"
                      style={{ marginBottom: 10 }}
                    >
                      {kickCount >= 10 ? (
                        <span className="cd-goal-met">
                          <IconCheckCircle /> Goal reached! Baby is active.
                        </span>
                      ) : (
                        `${10 - kickCount} more to reach today's goal`
                      )}
                    </p>
                    <div className="cd-action-row">
                      <button
                        className="cd-save-btn"
                        style={{ flex: 2 }}
                        onClick={() => setKickCount((k) => k + 1)}
                      >
                        + Kick
                      </button>
                      <button
                        className="cd-secondary-btn"
                        onClick={() => setKickCount(0)}
                      >
                        Reset
                      </button>
                    </div>
                  </div>

                  {/* ── Contraction Timer ── */}
                  <div className="cd-card">
                    <h2 className="cd-card-title">
                      <span className="cd-title-icon">
                        <IconTimer />
                      </span>
                      Contraction Timer
                    </h2>
                    <p
                      className="cd-score-desc"
                      style={{ marginBottom: 4 }}
                    >
                      Time each contraction
                    </p>
                    <p className="cd-metric-value">
                      {formatTimer(contractionSeconds)}
                    </p>
                    <div className="cd-action-row">
                      <button
                        className="cd-save-btn"
                        style={{ flex: 1 }}
                        onClick={() => {
                          setContractionSeconds(0);
                          setIsContractionRunning(true);
                        }}
                        disabled={isContractionRunning}
                      >
                        Start
                      </button>
                      <button
                        className="cd-secondary-btn"
                        onClick={() => setIsContractionRunning(false)}
                      >
                        Stop
                      </button>
                      <button
                        className="cd-secondary-btn"
                        onClick={() => {
                          if (contractionSeconds > 0) {
                            setContractionLog((prev) => [
                              {
                                duration: contractionSeconds,
                                time: format(new Date(), "h:mm a"),
                              },
                              ...prev.slice(0, 4),
                            ]);
                          }
                          setContractionSeconds(0);
                          setIsContractionRunning(false);
                        }}
                      >
                        Log
                      </button>
                    </div>
                    {contractionLog.length > 0 && (
                      <div className="cd-contraction-log">
                        {contractionLog.map((c, i) => (
                          <div
                            key={i}
                            className="cd-contraction-entry"
                          >
                            <span>{c.time}</span>
                            <span>{formatTimer(c.duration)}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* ── Hydration ── */}
                  <div className="cd-card cd-soft-tint">
                    <h2 className="cd-card-title">
                      <span className="cd-title-icon">
                        <IconDroplet />
                      </span>
                      Hydration
                    </h2>
                    <p
                      className="cd-score-desc"
                      style={{ marginBottom: 8 }}
                    >
                      Target: 8–10 glasses/day
                    </p>
                    <div className="cd-water-grid">
                      {Array.from({ length: 10 }).map((_, i) => (
                        <button
                          key={i}
                          className={`cd-water-glass${i < waterGlasses ? " filled" : ""}`}
                          onClick={() =>
                            setWaterGlasses(waterGlasses === i + 1 ? i : i + 1)
                          }
                          title={`${i + 1} glass${i > 0 ? "es" : ""}`}
                        >
                          <IconDroplet />
                        </button>
                      ))}
                    </div>
                    <p
                      className="cd-score-desc"
                      style={{ marginTop: 8 }}
                    >
                      {waterGlasses >= 8 ? (
                        <span className="cd-goal-met">
                          <IconCheckCircle /> Great hydration today!
                        </span>
                      ) : (
                        `${waterGlasses}/8 glasses logged`
                      )}
                    </p>
                  </div>

                  {/* ── Vitamins & Checklist ── */}
                  <div className="cd-card">
                    <h2 className="cd-card-title">
                      <span className="cd-title-icon">
                        <IconPill />
                      </span>
                      Daily Checklist
                    </h2>
                    <div className="cd-checklist">
                      <label className="cd-check-item">
                        <input
                          type="checkbox"
                          checked={vitaminTaken}
                          onChange={(e) => setVitaminTaken(e.target.checked)}
                        />
                        <span>Prenatal vitamin taken</span>
                      </label>
                      <label className="cd-check-item">
                        <input
                          type="checkbox"
                          checked={waterGlasses >= 8}
                          readOnly
                        />
                        <span>Hydration goal (8 glasses)</span>
                      </label>
                      <label className="cd-check-item">
                        <input
                          type="checkbox"
                          checked={pregChecklist.includes("movement")}
                          onChange={() =>
                            setPregChecklist((prev) =>
                              prev.includes("movement")
                                ? prev.filter((x) => x !== "movement")
                                : [...prev, "movement"],
                            )
                          }
                        />
                        <span>30 min gentle movement</span>
                      </label>
                      <label className="cd-check-item">
                        <input
                          type="checkbox"
                          checked={pregChecklist.includes("iron")}
                          onChange={() =>
                            setPregChecklist((prev) =>
                              prev.includes("iron")
                                ? prev.filter((x) => x !== "iron")
                                : [...prev, "iron"],
                            )
                          }
                        />
                        <span>Took iron-rich meal</span>
                      </label>
                      <label className="cd-check-item">
                        <input
                          type="checkbox"
                          checked={pregChecklist.includes("pelvic")}
                          onChange={() =>
                            setPregChecklist((prev) =>
                              prev.includes("pelvic")
                                ? prev.filter((x) => x !== "pelvic")
                                : [...prev, "pelvic"],
                            )
                          }
                        />
                        <span>Pelvic floor exercises</span>
                      </label>
                    </div>
                  </div>

                  {/* ── Symptoms today ── */}
                  <div className="cd-card">
                    <h2 className="cd-card-title">
                      <span className="cd-title-icon">
                        <IconHeartPulse />
                      </span>
                      Symptoms Today
                    </h2>
                    <div className="cd-preg-symptom-grid">
                      {PREG_SYMPTOM_LIST.map((s) => (
                        <button
                          key={s}
                          className={`cd-preg-symptom-chip${pregSymptoms.includes(s) ? " active" : ""}`}
                          onClick={() => togglePregSymptom(s)}
                        >
                          {s}
                        </button>
                      ))}
                    </div>
                    {pregSymptoms.length > 0 &&
                      pregSymptoms.includes("Swelling") && (
                        <p className="cd-preg-alert">
                          <span className="cd-alert-icon">
                            <IconAlertTriangle />
                          </span>
                          Swelling can indicate preeclampsia — mention to your
                          doctor.
                        </p>
                      )}
                  </div>

                  {/* ── Next Appointment ── */}
                  <div className="cd-card cd-soft-tint">
                    <h2 className="cd-card-title">
                      <span className="cd-title-icon">
                        <IconCalendar />
                      </span>
                      Next Appointment
                    </h2>
                    <input
                      type="date"
                      className="cd-preg-date-input"
                      value={nextApptDate}
                      min={format(startOfToday(), "yyyy-MM-dd")}
                      onChange={(e) => setNextApptDate(e.target.value)}
                      style={{ marginBottom: 10 }}
                    />
                    {nextApptDate && (
                      <p className="cd-score-desc">
                        {differenceInDays(
                          parseISO(nextApptDate),
                          startOfToday(),
                        ) <= 0
                          ? "Appointment is today or past — did you go?"
                          : `In ${differenceInDays(parseISO(nextApptDate), startOfToday())} days`}
                      </p>
                    )}
                    <div className="cd-appt-checklist">
                      <p
                        className="cd-score-desc"
                        style={{ fontWeight: 600, marginBottom: 6 }}
                      >
                        Questions to ask:
                      </p>
                      {[
                        { key: "growth", label: "Baby's growth on track?" },
                        { key: "bp", label: "Blood pressure normal?" },
                        { key: "birthplan", label: "Birth plan discussion" },
                      ].map(({ key, label }) => (
                        <label
                          key={key}
                          className="cd-check-item"
                        >
                          <input
                            type="checkbox"
                            checked={apptChecklist.includes(key)}
                            onChange={() =>
                              setApptChecklist((prev) =>
                                prev.includes(key)
                                  ? prev.filter((x) => x !== key)
                                  : [...prev, key],
                              )
                            }
                          />
                          <span>{label}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  {/* ── Risk Alert ── */}
                  <div
                    className="cd-card cd-warning-soft"
                    style={{ gridColumn: "1 / -1" }}
                  >
                    <h2 className="cd-card-title">
                      <span className="cd-title-icon">
                        <IconAlertTriangle />
                      </span>
                      When to Call Your Doctor
                    </h2>
                    <div className="cd-alert-grid">
                      {[
                        "Severe headache or vision changes",
                        "Sudden swelling in face/hands",
                        "Baby not moving for 2+ hours",
                        "Vaginal bleeding",
                        "Fever above 38°C (100.4°F)",
                        "Painful urination",
                      ].map((item) => (
                        <div
                          key={item}
                          className="cd-alert-item"
                        >
                          <span className="cd-alert-dot" />
                          <span>{item}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeMode === "postpartum" && (
              <div className="cd-mode-stack">
                {/* ── Hero ── */}
                <div className="cd-hero cd-post-hero">
                  <div className="cd-hero-info">
                    <p className="cd-hero-label">Recovery Journey</p>
                    <p className="cd-hero-date">
                      Day {postpartumDay} Postpartum
                    </p>
                    <p className="cd-hero-sub">
                      Week {Math.ceil(postpartumDay / 7)} of healing
                    </p>
                    <span className="cd-phase-badge cd-soft-badge">
                      Healing Progress
                    </span>
                  </div>
                </div>

                <div className="cd-mode-grid">
                  {/* ── Breastfeeding Tracker ── */}
                  <div className="cd-card">
                    <h2 className="cd-card-title">
                      <span className="cd-title-icon">
                        <IconMilk />
                      </span>
                      Breastfeeding Tracker
                    </h2>
                    <p className="cd-score-desc">
                      Last feed:{" "}
                      {lastFeedAt
                        ? format(lastFeedAt, "h:mm a")
                        : "Not logged yet"}
                    </p>
                    <div className="cd-action-row">
                      {(["left", "right", "both"] as const).map((s) => (
                        <button
                          key={s}
                          className={`cd-secondary-btn${ppFeedSide === s ? " cd-btn-active" : ""}`}
                          onClick={() => setPPFeedSide(s)}
                        >
                          {s.charAt(0).toUpperCase() + s.slice(1)}
                        </button>
                      ))}
                    </div>
                    <div className="cd-pp-timer-row">
                      <span className="cd-pp-timer-display">
                        {String(ppFeedMins).padStart(2, "0")}:
                        {String(ppFeedSecs).padStart(2, "0")}
                      </span>
                      {!isPPFeedRunning ? (
                        <button
                          className="cd-save-btn"
                          disabled={!ppFeedSide}
                          title={
                            !ppFeedSide ? "Select a side first" : undefined
                          }
                          onClick={() => {
                            setIsPPFeedRunning(true);
                            setLastFeedAt(new Date());
                          }}
                        >
                          Start Feed
                        </button>
                      ) : (
                        <button
                          className="cd-secondary-btn"
                          onClick={() => {
                            setIsPPFeedRunning(false);
                            if (ppFeedSide) {
                              setPPFeedLog((prev) =>
                                [
                                  {
                                    side: ppFeedSide,
                                    duration: ppFeedSeconds,
                                    time: format(new Date(), "h:mm a"),
                                  },
                                  ...prev,
                                ].slice(0, 5),
                              );
                            }
                            setPPFeedSeconds(0);
                          }}
                        >
                          Stop & Log
                        </button>
                      )}
                    </div>
                    {ppFeedLog.length > 0 && (
                      <div className="cd-contraction-log">
                        {ppFeedLog.slice(0, 3).map((l, i) => (
                          <div
                            key={i}
                            className="cd-contraction-entry"
                          >
                            <span>
                              {l.side.charAt(0).toUpperCase() + l.side.slice(1)}{" "}
                              · {Math.floor(l.duration / 60)}m {l.duration % 60}
                              s
                            </span>
                            <span>{l.time}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* ── Baby Daily Log ── */}
                  <div className="cd-card">
                    <h2 className="cd-card-title">
                      <span className="cd-title-icon">
                        <IconScale />
                      </span>
                      Baby's Day
                    </h2>
                    <div className="cd-pp-log-row">
                      <span className="cd-pp-log-label">Feeds today</span>
                      <div className="cd-pp-counter">
                        <button
                          className="cd-pp-counter-btn"
                          onClick={() =>
                            setBabyFeedCount(Math.max(0, babyFeedCount - 1))
                          }
                        >
                          −
                        </button>
                        <span className="cd-pp-counter-val">
                          {babyFeedCount}
                        </span>
                        <button
                          className="cd-pp-counter-btn"
                          onClick={() => setBabyFeedCount(babyFeedCount + 1)}
                        >
                          +
                        </button>
                      </div>
                    </div>
                    <div className="cd-pp-log-row">
                      <span className="cd-pp-log-label">Baby sleep</span>
                      <div className="cd-pp-counter">
                        <button
                          className="cd-pp-counter-btn"
                          onClick={() =>
                            setBabySleepHours(
                              Math.max(
                                0,
                                parseFloat((babySleepHours - 0.5).toFixed(1)),
                              ),
                            )
                          }
                        >
                          −
                        </button>
                        <span className="cd-pp-counter-val">
                          {babySleepHours}h
                        </span>
                        <button
                          className="cd-pp-counter-btn"
                          onClick={() =>
                            setBabySleepHours(
                              parseFloat((babySleepHours + 0.5).toFixed(1)),
                            )
                          }
                        >
                          +
                        </button>
                      </div>
                    </div>
                    <p className="cd-score-desc">
                      {babyFeedCount >= 8 ? (
                        <span className="cd-goal-met">
                          <IconCheckCircle /> Great feeding count for a newborn!
                        </span>
                      ) : babyFeedCount > 0 ? (
                        "Newborns typically feed 8–12 times/day"
                      ) : (
                        "Log your baby's feeds to track intake"
                      )}
                    </p>
                    <p
                      className="cd-preg-tip"
                      style={{ marginTop: 6 }}
                    >
                      <span className="cd-tip-icon">
                        <IconMoon />
                      </span>
                      Newborns sleep 14–17 hours/day in short bursts.
                    </p>
                  </div>

                  {/* ── Mother Recovery ── */}
                  <div className="cd-card">
                    <h2 className="cd-card-title">
                      <span className="cd-title-icon">
                        <IconShield />
                      </span>
                      Your Recovery
                    </h2>
                    <div className="cd-slider-row">
                      <span>Energy</span>
                      <input
                        type="range"
                        min="0"
                        max="100"
                        value={recoveryEnergy}
                        onChange={(e) =>
                          setRecoveryEnergy(Number(e.target.value))
                        }
                      />
                    </div>
                    <div className="cd-slider-row">
                      <span>Pain</span>
                      <input
                        type="range"
                        min="0"
                        max="100"
                        value={recoveryPain}
                        onChange={(e) =>
                          setRecoveryPain(Number(e.target.value))
                        }
                      />
                    </div>
                    <div className="cd-slider-row">
                      <span>Sleep quality</span>
                      <input
                        type="range"
                        min="0"
                        max="100"
                        value={recoverySleep}
                        onChange={(e) =>
                          setRecoverySleep(Number(e.target.value))
                        }
                      />
                    </div>
                    <div className="cd-pp-recovery-summary">
                      <span>Energy {recoveryEnergy}%</span>
                      <span>Pain {recoveryPain}%</span>
                      <span>Rest {recoverySleep}%</span>
                    </div>
                  </div>

                  {/* ── Emotional Wellness ── */}
                  <div className="cd-card">
                    <h2 className="cd-card-title">
                      <span className="cd-title-icon">
                        <IconHeartPulse />
                      </span>
                      How Are You Feeling?
                    </h2>
                    <div className="cd-pp-mood-grid">
                      {PP_MOOD_LIST.map(({ label }) => (
                        <button
                          key={label}
                          className={`cd-pp-mood-btn${ppMood === label ? " active" : ""}`}
                          onClick={() =>
                            setPPMood(ppMood === label ? "" : label)
                          }
                        >
                          {label}
                        </button>
                      ))}
                    </div>
                    {ppMood && (
                      <p
                        className="cd-preg-alert"
                        style={{ marginTop: 10 }}
                      >
                        <span className="cd-alert-icon">
                          <IconLightbulb />
                        </span>
                        {PP_MOOD_LIST.find((x) => x.label === ppMood)?.msg}
                      </p>
                    )}
                  </div>

                  {/* ── Symptoms Today ── */}
                  <div className="cd-card">
                    <h2 className="cd-card-title">
                      <span className="cd-title-icon">
                        <IconHeartPulse />
                      </span>
                      Symptoms Today
                    </h2>
                    <div className="cd-preg-symptom-grid">
                      {POSTPARTUM_SYMPTOM_LIST.map((s) => (
                        <button
                          key={s}
                          className={`cd-preg-symptom-chip${ppSymptoms.includes(s) ? " active" : ""}`}
                          onClick={() => togglePPSymptom(s)}
                        >
                          {s}
                        </button>
                      ))}
                    </div>
                    {ppSymptoms.includes("Bleeding") && (
                      <p className="cd-preg-alert">
                        <span className="cd-alert-icon">
                          <IconAlertTriangle />
                        </span>
                        Monitor closely — soaking more than 1 pad per hour is a
                        warning sign.
                      </p>
                    )}
                    {ppSymptoms.includes("Swelling") && (
                      <p className="cd-preg-alert">
                        <span className="cd-alert-icon">
                          <IconAlertTriangle />
                        </span>
                        Sudden or severe swelling can indicate a blood clot —
                        contact your doctor if it worsens.
                      </p>
                    )}
                  </div>

                  {/* ── Recovery Checklist ── */}
                  <div className="cd-card">
                    <h2 className="cd-card-title">
                      <span className="cd-title-icon">
                        <IconCheckCircle />
                      </span>
                      Recovery Checklist
                    </h2>
                    <div className="cd-checklist">
                      {[
                        "Iron supplement taken",
                        "Prenatal vitamin taken",
                        "Pelvic floor exercises",
                        "Incision / stitch check",
                        "Drank enough water",
                      ].map((item) => (
                        <label
                          key={item}
                          className="cd-check-item"
                        >
                          <input
                            type="checkbox"
                            checked={ppChecklist.includes(item)}
                            onChange={() => togglePPChecklist(item)}
                          />
                          {item}
                        </label>
                      ))}
                    </div>
                    {ppChecklist.length === PP_CHECKLIST_ITEMS.length && (
                      <p
                        className="cd-goal-met"
                        style={{ marginTop: 10 }}
                      >
                        <IconCheckCircle /> All recovery tasks done today!
                      </p>
                    )}
                  </div>

                  {/* ── Hydration ── */}
                  <div className="cd-card">
                    <h2 className="cd-card-title">
                      <span className="cd-title-icon">
                        <IconDroplet />
                      </span>
                      Stay Hydrated
                    </h2>
                    <div className="cd-water-grid">
                      {Array.from({ length: 10 }).map((_, i) => (
                        <button
                          key={i}
                          className={`cd-water-glass${i < ppWaterGlasses ? " filled" : ""}`}
                          onClick={() =>
                            setPPWaterGlasses(
                              ppWaterGlasses === i + 1 ? i : i + 1,
                            )
                          }
                          aria-label={`Glass ${i + 1}`}
                        >
                          <IconDroplet />
                        </button>
                      ))}
                    </div>
                    <p className="cd-score-desc">
                      {ppWaterGlasses >= 10 ? (
                        <span className="cd-goal-met">
                          <IconCheckCircle /> Excellent! Breastfeeding moms need
                          extra water.
                        </span>
                      ) : (
                        `${ppWaterGlasses}/10 glasses — stay hydrated to support milk supply`
                      )}
                    </p>
                  </div>

                  {/* ── Next Appointment ── */}
                  <div className="cd-card">
                    <h2 className="cd-card-title">
                      <span className="cd-title-icon">
                        <IconCalendar />
                      </span>
                      Postpartum Check-Up
                    </h2>
                    <label className="cd-preg-field-label">
                      Next appointment
                    </label>
                    <input
                      type="date"
                      className="cd-preg-date-input"
                      value={ppNextApptDate}
                      min={format(startOfToday(), "yyyy-MM-dd")}
                      onChange={(e) => setPPNextApptDate(e.target.value)}
                    />
                    {ppNextApptDate && (
                      <p className="cd-preg-date-hint">
                        {differenceInDays(
                          parseISO(ppNextApptDate),
                          startOfToday(),
                        ) <= 0
                          ? "Appointment is today or past — did you go?"
                          : `${differenceInDays(parseISO(ppNextApptDate), startOfToday())} days until your check-up`}
                      </p>
                    )}
                    <div className="cd-appt-checklist">
                      {[
                        { key: "recovery", label: "Discuss recovery progress" },
                        {
                          key: "contraception",
                          label: "Contraception options",
                        },
                        {
                          key: "mentalhealth",
                          label: "Mental health check-in",
                        },
                        {
                          key: "breastfeeding",
                          label: "Breastfeeding support",
                        },
                      ].map(({ key, label }) => (
                        <label
                          key={key}
                          className="cd-check-item"
                        >
                          <input
                            type="checkbox"
                            checked={ppApptChecklist.includes(key)}
                            onChange={() =>
                              setPPApptChecklist((prev) =>
                                prev.includes(key)
                                  ? prev.filter((x) => x !== key)
                                  : [...prev, key],
                              )
                            }
                          />
                          {label}
                        </label>
                      ))}
                    </div>
                  </div>

                  {/* ── Warning Signs ── */}
                  <div className="cd-card cd-warning-soft">
                    <h2 className="cd-card-title">
                      <span className="cd-title-icon">
                        <IconAlertTriangle />
                      </span>
                      When to Call Your Doctor
                    </h2>
                    <div className="cd-alert-grid">
                      {[
                        "Heavy bleeding (1+ pad/hour)",
                        "Fever above 38°C (100.4°F)",
                        "Severe headache or vision changes",
                        "Chest pain or difficulty breathing",
                        "Signs of wound infection",
                        "Thoughts of harming self or baby",
                      ].map((item) => (
                        <div
                          key={item}
                          className="cd-alert-item"
                        >
                          <span className="cd-alert-dot" />
                          {item}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}
            {/* end cd-body-grid */}

            <button
              className="cd-assistant-fab"
              onClick={() => setAssistantOpen(true)}
              aria-label="Open OVI Assistant"
            >
              OVI
            </button>

            {assistantOpen && (
              <div className="cd-assistant-drawer-wrap">
                <div
                  className="cd-assistant-backdrop"
                  onClick={() => setAssistantOpen(false)}
                />
                <div className="cd-assistant-drawer">
                  <div className="cd-assistant-header">
                    <h3>OVI Assistant</h3>
                    <button onClick={() => setAssistantOpen(false)}>
                      Close
                    </button>
                  </div>
                  <div className="cd-assistant-body">
                    {assistantMessages.map((msg, index) => (
                      <p key={`${msg}-${index}`}>{msg}</p>
                    ))}
                  </div>
                  <div className="cd-assistant-input-row">
                    <input
                      value={assistantInput}
                      onChange={(e) => setAssistantInput(e.target.value)}
                      placeholder="Ask OVI..."
                    />
                    <button onClick={handleSendAssistantMessage}>Send</button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </IonContent>
    </IonPage>
  );
};

export default CycleDashboard;
