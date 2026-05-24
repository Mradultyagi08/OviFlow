import {
  addDays,
  differenceInDays,
  parseISO,
  startOfDay,
  startOfToday,
} from "date-fns";

/**
 * Converts a list of dates when period occurred into a cycle history.
 * Logic ported from src/state/CalculationLogics.ts -> getNewCyclesHistory
 */
export function getCyclesHistoryFromDates(periodDays) {
  if (!periodDays || periodDays.length === 0) {
    return [];
  }

  // Sort dates ascending
  const sortedDays = [...periodDays].sort((a, b) => new Date(a) - new Date(b));

  let newCycles = [
    {
      cycleLength: 28, // Default
      periodLength: 1,
      startDate: sortedDays[0],
    },
  ];

  for (let i = 1; i < sortedDays.length; i++) {
    const date = startOfDay(new Date(sortedDays[i]));
    const prevDate = startOfDay(new Date(sortedDays[i - 1]));
    const diffInDays = differenceInDays(date, prevDate);

    if (diffInDays <= 2) {
      newCycles[0].periodLength += diffInDays;
    } else {
      newCycles[0].cycleLength = diffInDays + newCycles[0].periodLength - 1;
      newCycles.unshift({
        cycleLength: 0,
        periodLength: 1,
        startDate: sortedDays[i],
      });
    }
  }

  // Filter out cycles that haven't started yet
  const today = startOfToday();
  return newCycles.filter((cycle) => startOfDay(new Date(cycle.startDate)) <= today);
}

export function getAverageLengthOfCycle(cycles, maxDisplayedCycles = 6) {
  const displayedCycles = cycles.slice(0, maxDisplayedCycles);
  const length = displayedCycles.length;

  if (length <= 1) {
    return length === 0 ? 0 : displayedCycles[0].cycleLength || 28;
  }

  const sum = displayedCycles.reduce((prev, current) => prev + (current.cycleLength || 0), 0);
  return Math.round(sum / (length - 1));
}

export function getAverageLengthOfPeriod(cycles, maxDisplayedCycles = 6) {
  const displayedCycles = cycles.slice(0, maxDisplayedCycles);
  const length = displayedCycles.length;

  if (length <= 1) {
    return length === 0 ? 0 : displayedCycles[0].periodLength;
  }

  const sum = displayedCycles.reduce((prev, current) => prev + current.periodLength, 0);
  return Math.round(sum / length);
}

export function getDayOfCycle(cycles) {
  if (!cycles || cycles.length === 0) return 0;
  const start = startOfDay(new Date(cycles[0].startDate));
  const currentDate = startOfToday();
  return differenceInDays(currentDate, start) + 1;
}

export function getPhaseKey(cycles, maxDisplayedCycles = 6) {
  if (!cycles || cycles.length === 0) return "none";

  const lengthOfCycle = getAverageLengthOfCycle(cycles, maxDisplayedCycles);
  const lengthOfPeriod = cycles[0].periodLength;
  const currentDay = getDayOfCycle(cycles);
  const lutealPhaseLength = 14;
  const ovulationOnError = 2;
  const ovulationDay = lengthOfCycle - lutealPhaseLength;

  if (currentDay > lengthOfCycle && cycles.length > 1) {
    return "delay";
  }
  if (currentDay <= lengthOfPeriod) {
    return "menstrual";
  }
  if (currentDay <= ovulationDay - ovulationOnError) {
    return "follicular";
  }
  if (currentDay <= ovulationDay + ovulationOnError) {
    return "ovulation";
  }
  return "luteal";
}

export function calculateHealthScore(logs, cycleLength) {
  let score = 70;
  if (cycleLength >= 25 && cycleLength <= 32) score += 15;
  else if (cycleLength >= 21 && cycleLength <= 35) score += 5;

  const recent = logs.slice(0, 7);
  const sympCount = recent.reduce((s, l) => s + (l.symptoms?.length || 0), 0);
  score -= Math.min(sympCount * 2, 25);

  const happyCount = recent.filter(
    (l) => l.mood === "happy" || l.mood === "okay",
  ).length;
  score += happyCount;

  return Math.max(0, Math.min(100, Math.round(score)));
}

export function getPredictions(cycles, maxDisplayedCycles = 6, recentLogs = []) {
  if (!cycles || cycles.length === 0) {
    return {
      phase: "none",
      daysBeforePeriod: { title: "Period in", days: "---" },
      ovulationStatus: "---",
      pregnancyChance: "Low",
      healthScore: 70,
    };
  }

  const cycleLength = getAverageLengthOfCycle(cycles, maxDisplayedCycles);
  const healthScore = calculateHealthScore(recentLogs, cycleLength);
  const dayOfCycle = getDayOfCycle(cycles);
  const periodLength = cycles[0].periodLength;
  const lutealPhaseLength = 14;
  const ovulationDay = cycleLength - lutealPhaseLength;
  const diffDay = ovulationDay - dayOfCycle;

  // Ovulation Status
  let ovulationStatus = "";
  if (diffDay < -2) ovulationStatus = "Finished";
  else if (diffDay >= -2 && diffDay <= -1) ovulationStatus = "Possible";
  else if (diffDay === 0) ovulationStatus = "Today";
  else if (diffDay === 1) ovulationStatus = "Tomorrow";
  else ovulationStatus = `In ${diffDay} Days`;

  // Pregnancy Chance
  const pregnancyChance = ["Tomorrow", "Today", "Possible"].some(s => ovulationStatus.includes(s)) ? "High" : "Low";

  // Days Before Period
  let daysBeforePeriod = { title: "Period in", days: "" };
  if (dayOfCycle <= periodLength) {
    daysBeforePeriod = { title: "Period", days: `${dayOfCycle}` }; // Frontend will handle "nth day"
  } else if (cycles.length === 1 && cycleLength >= 28) {
    daysBeforePeriod = { title: "Period is", days: "Possible today" };
  } else {
    const startDate = cycles[0].startDate;
    const dateOfFinish = addDays(startOfDay(new Date(startDate)), cycleLength);
    const dayBefore = differenceInDays(dateOfFinish, startOfToday());

    if (dayBefore > 0) {
      daysBeforePeriod = { title: "Period in", days: `${dayBefore}` };
    } else if (dayBefore === 0) {
      daysBeforePeriod = { title: "Period", days: "Today" };
    } else {
      daysBeforePeriod = { title: "Delay", days: `${Math.abs(dayBefore)}` };
    }
  }

  return {
    phase: getPhaseKey(cycles, maxDisplayedCycles),
    daysBeforePeriod,
    ovulationStatus,
    pregnancyChance,
    healthScore,
    cycleDay: dayOfCycle,
    averageCycleLength: cycleLength,
    averagePeriodLength: getAverageLengthOfPeriod(cycles, maxDisplayedCycles)
  };
}
