import React, { useState, useMemo } from "react";
import { generateCyclePDF } from "../utils/pdfGenerator";
import type { CycleLog } from "../services/api";
import "./DoctorAlert.css";

/* ── Types ── */
interface AlertItem {
  text: string;
  tier: "urgent" | "schedule" | "info";
}

interface PersonalAlert {
  text: string;
  dismissed: boolean;
}

interface DoctorAlertCardProps {
  mode: "cycle" | "pregnancy" | "postpartum";
  logs?: CycleLog[];
  doctorNumber?: string;
  doctorMessage?: string;
  userName?: string;
  onAskOvi?: (question: string) => void;
}

/* ── Static warning signs per mode ── */
const SIGNS: Record<string, AlertItem[]> = {
  cycle: [
    { text: "Severe bleeding (soaking 1+ pad/hour)", tier: "urgent" },
    { text: "Sudden sharp pelvic pain", tier: "urgent" },
    { text: "Fainting or severe dizziness", tier: "urgent" },
    { text: "Cycles shorter than 21 or longer than 35 days", tier: "schedule" },
    { text: "Periods lasting more than 7 days", tier: "schedule" },
    { text: "Spotting between periods", tier: "schedule" },
    { text: "Severe cramps not relieved by OTC meds", tier: "schedule" },
    { text: "Missed period (not pregnant)", tier: "info" },
    { text: "Significant mood changes around period", tier: "info" },
  ],
  pregnancy: [
    { text: "Vaginal bleeding or fluid leaking", tier: "urgent" },
    { text: "Baby not moving for 2+ hours", tier: "urgent" },
    { text: "Severe headache or vision changes", tier: "urgent" },
    { text: "Sudden swelling in face or hands", tier: "urgent" },
    { text: "Fever above 38°C (100.4°F)", tier: "schedule" },
    { text: "Painful urination or burning", tier: "schedule" },
    { text: "Persistent nausea preventing eating/drinking", tier: "schedule" },
    { text: "Regular contractions before 37 weeks", tier: "urgent" },
    { text: "Significant weight gain in one week", tier: "info" },
  ],
  postpartum: [
    { text: "Heavy bleeding (soaking 1+ pad/hour)", tier: "urgent" },
    { text: "Fever above 38°C (100.4°F)", tier: "urgent" },
    { text: "Chest pain or difficulty breathing", tier: "urgent" },
    { text: "Thoughts of harming yourself or baby", tier: "urgent" },
    { text: "Signs of wound infection (redness, pus)", tier: "schedule" },
    { text: "Severe headache or vision changes", tier: "schedule" },
    { text: "Painful, red, or hot area on breast", tier: "schedule" },
    { text: "Persistent sadness lasting 2+ weeks", tier: "schedule" },
    { text: "Difficulty bonding with baby", tier: "info" },
    { text: "Pain during intercourse after 6 weeks", tier: "info" },
  ],
};

/* ── Personalized alert generation ── */
function generatePersonalAlerts(logs: CycleLog[]): PersonalAlert[] {
  const alerts: PersonalAlert[] = [];
  if (!logs || logs.length < 3) return alerts;

  // Check for irregular cycles (look at period start gaps)
  const periodDates = logs.filter((l) => l.isPeriod).map((l) => new Date(l.date).getTime()).sort((a, b) => b - a);
  if (periodDates.length >= 3) {
    const gaps: number[] = [];
    for (let i = 0; i < periodDates.length - 1; i++) {
      gaps.push(Math.round((periodDates[i] - periodDates[i + 1]) / (1000 * 60 * 60 * 24)));
    }
    const validGaps = gaps.filter((g) => g > 15 && g < 60);
    if (validGaps.length >= 2) {
      const avg = validGaps.reduce((a, b) => a + b, 0) / validGaps.length;
      const lastGap = validGaps[0];
      if (Math.abs(lastGap - avg) > 7) {
        alerts.push({ text: `Your last cycle was ${lastGap} days (avg: ${Math.round(avg)} days). Consider a check-up if this persists.`, dismissed: false });
      }
    }
  }

  // Check for heavy flow frequency
  const recentLogs = logs.slice(0, 14);
  const heavyDays = recentLogs.filter((l) => l.flow === "heavy").length;
  if (heavyDays >= 4) {
    alerts.push({ text: `You've logged heavy flow ${heavyDays} days recently. Discuss with your doctor if this is new.`, dismissed: false });
  }

  // Check for persistent low mood
  const lowMoodDays = recentLogs.filter((l) => l.mood === "low" || l.mood === "anxious").length;
  if (lowMoodDays >= 5) {
    alerts.push({ text: `You've felt low/anxious ${lowMoodDays} of the last ${recentLogs.length} days. Consider talking to someone.`, dismissed: false });
  }

  return alerts;
}

/* ── Icons ── */
const IconAlert = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
    <line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" />
  </svg>
);
const IconWhatsApp = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
  </svg>
);
const IconChevron = ({ open }: { open: boolean }) => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" style={{ transition: "transform 0.2s", transform: open ? "rotate(180deg)" : "rotate(0)" }}>
    <polyline points="6 9 12 15 18 9" />
  </svg>
);

/* ── Component ── */
const DoctorAlertCard: React.FC<DoctorAlertCardProps> = ({ mode, logs, doctorNumber, doctorMessage, userName, onAskOvi }) => {
  const [expanded, setExpanded] = useState(false);
  const [dismissedAlerts, setDismissedAlerts] = useState<Set<number>>(new Set());

  const personalAlerts = useMemo(() => generatePersonalAlerts(logs || []), [logs]);
  const signs = SIGNS[mode] || SIGNS.cycle;
  const urgentSigns = signs.filter((s) => s.tier === "urgent");
  const scheduleSigns = signs.filter((s) => s.tier === "schedule");
  const infoSigns = signs.filter((s) => s.tier === "info");

  const visiblePersonalAlerts = personalAlerts.filter((_, i) => !dismissedAlerts.has(i));

  const handleContactDoctor = async () => {
    const pdfBlob = generateCyclePDF({ userName, mode, logs: logs || [] });
    const file = new File([pdfBlob], "oviflow-summary.pdf", { type: "application/pdf" });
    const message = doctorMessage || `Hi Doctor, I'm sharing my cycle health summary from OVIFLOW. Please review the attached PDF.`;

    // Try Web Share API first (supports file attachment on mobile)
    if (navigator.share && navigator.canShare?.({ files: [file] })) {
      try {
        await navigator.share({ files: [file], title: "Cycle Summary", text: message });
        return;
      } catch { /* user cancelled or failed, fall through */ }
    }

    // Fallback: download PDF + open WhatsApp
    const url = URL.createObjectURL(pdfBlob);
    const a = document.createElement("a");
    a.href = url; a.download = "oviflow-summary.pdf"; a.click();
    URL.revokeObjectURL(url);

    const number = (doctorNumber || "").replace(/\D/g, "");
    if (number) {
      window.open(`https://wa.me/${number}?text=${encodeURIComponent(message)}`, "_blank");
    } else {
      window.open(`https://wa.me/?text=${encodeURIComponent(message)}`, "_blank");
    }
  };

  return (
    <div className="doc-alert-card">
      {/* Header */}
      <div className="doc-alert-header">
        <div className="doc-alert-title-row">
          <span className="doc-alert-icon"><IconAlert /></span>
          <h2 className="doc-alert-title">When to See a Doctor</h2>
        </div>
        <button className="doc-alert-expand" onClick={() => setExpanded(!expanded)} aria-label={expanded ? "Collapse" : "Expand"}>
          <IconChevron open={expanded} />
        </button>
      </div>

      {/* Personal alerts */}
      {visiblePersonalAlerts.length > 0 && (
        <div className="doc-alert-personal">
          <span className="doc-alert-personal-label">⚠️ Based on your logs:</span>
          {visiblePersonalAlerts.map((alert, i) => (
            <div key={i} className="doc-alert-personal-item">
              <p>{alert.text}</p>
              <button className="doc-alert-dismiss" onClick={() => setDismissedAlerts((s) => new Set(s).add(personalAlerts.indexOf(alert)))}>
                ✓ Noted
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Urgent signs (always visible) */}
      <div className="doc-alert-tier">
        <span className="doc-alert-tier-label urgent">🔴 Seek immediate care</span>
        <div className="doc-alert-list">
          {urgentSigns.slice(0, expanded ? undefined : 3).map((s) => (
            <div key={s.text} className="doc-alert-item urgent">
              <span className="doc-alert-dot urgent" />
              <span>{s.text}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Expandable section */}
      <div className={`doc-alert-expandable ${expanded ? "open" : ""}`}>
        {/* Schedule signs */}
        <div className="doc-alert-tier">
          <span className="doc-alert-tier-label schedule">🟡 Schedule an appointment</span>
          <div className="doc-alert-list">
            {scheduleSigns.map((s) => (
              <div key={s.text} className="doc-alert-item schedule">
                <span className="doc-alert-dot schedule" />
                <span>{s.text}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Info signs */}
        {infoSigns.length > 0 && (
          <div className="doc-alert-tier">
            <span className="doc-alert-tier-label info">ℹ️ Worth mentioning at next visit</span>
            <div className="doc-alert-list">
              {infoSigns.map((s) => (
                <div key={s.text} className="doc-alert-item info">
                  <span className="doc-alert-dot info" />
                  <span>{s.text}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Quick actions */}
      <div className="doc-alert-actions">
        <button className="doc-alert-btn contact-doctor" onClick={handleContactDoctor}>
          <IconWhatsApp /> Contact Doctor
        </button>
        {onAskOvi && (
          <button className="doc-alert-btn ask-ovi" onClick={() => onAskOvi("I'm concerned about a symptom. Can you help?")}>
            💬 Ask OVI
          </button>
        )}
      </div>
    </div>
  );
};

export default DoctorAlertCard;
