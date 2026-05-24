import React, { useState } from "react";
import type { AiInsightResponse } from "../services/api";
import "./AiInsight.css";

/* ── Icons ── */
const IconSparkle = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2l2.4 7.2L22 12l-7.6 2.8L12 22l-2.4-7.2L2 12l7.6-2.8z"/></svg>
);
const IconRefresh = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M23 4v6h-6"/><path d="M1 20v-6h6"/><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/></svg>
);
const IconChevron = ({ open }: { open: boolean }) => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" style={{ transition: "transform 0.2s", transform: open ? "rotate(180deg)" : "rotate(0)" }}><polyline points="6 9 12 15 18 9"/></svg>
);
const IconThumbUp = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3zM7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3"/></svg>
);
const IconThumbDown = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10 15v4a3 3 0 0 0 3 3l4-9V2H5.72a2 2 0 0 0-2 1.7l-1.38 9a2 2 0 0 0 2 2.3zm7-13h2.67A2.31 2.31 0 0 1 22 4v7a2.31 2.31 0 0 1-2.33 2H17"/></svg>
);

const CATEGORY_COLORS: Record<string, string> = {
  nutrition: "#22c55e",
  exercise: "#3b82f6",
  emotional: "#f59e0b",
  medical: "#ef4444",
  sleep: "#8b5cf6",
  hydration: "#06b6d4",
  general: "#6b7280",
};

function guessCategories(insight: AiInsightResponse): string[] {
  const text = `${insight.insight} ${insight.why} ${insight.nextAction}`.toLowerCase();
  const cats: string[] = [];
  if (/food|eat|iron|vitamin|diet|nutriti/i.test(text)) cats.push("nutrition");
  if (/exercis|walk|yoga|stretch|move/i.test(text)) cats.push("exercise");
  if (/mood|stress|anxi|emotion|mental|feel/i.test(text)) cats.push("emotional");
  if (/doctor|medical|consult|symptom|pain/i.test(text)) cats.push("medical");
  if (/sleep|rest|fatigue|tired|energy/i.test(text)) cats.push("sleep");
  if (/water|hydrat|drink/i.test(text)) cats.push("hydration");
  if (cats.length === 0) cats.push("general");
  return cats;
}

function ConfidenceDots({ level }: { level: string }) {
  const filled = level === "high" ? 5 : level === "medium" ? 3 : 1;
  return (
    <span className="ai-confidence-dots">
      {Array.from({ length: 5 }).map((_, i) => (
        <span key={i} className={`ai-dot ${i < filled ? "filled" : ""}`} />
      ))}
      <span className="ai-confidence-label">{level}</span>
    </span>
  );
}

interface AiInsightCardProps {
  insight: AiInsightResponse | null;
  loading: boolean;
  error: string;
  onRefresh: () => void;
  onViewAll: () => void;
}

const AiInsightCard: React.FC<AiInsightCardProps> = ({ insight, loading, error, onRefresh, onViewAll }) => {
  const [expanded, setExpanded] = useState(false);
  const [feedback, setFeedback] = useState<"up" | "down" | null>(null);

  const categories = insight ? guessCategories(insight) : [];

  return (
    <div className="ai-card">
      {/* Header */}
      <div className="ai-card-header">
        <div className="ai-card-title-row">
          <span className="ai-card-icon"><IconSparkle /></span>
          <h2 className="ai-card-title">{insight?.title || "AI Insight"}</h2>
        </div>
        <div className="ai-card-actions">
          <button className={`ai-refresh-btn ${loading ? "spinning" : ""}`} onClick={onRefresh} disabled={loading} aria-label="Refresh insight">
            <IconRefresh />
          </button>
          <button className="ai-expand-btn" onClick={() => setExpanded(!expanded)} aria-label={expanded ? "Collapse" : "Expand"}>
            <IconChevron open={expanded} />
          </button>
        </div>
      </div>

      {/* Body */}
      {loading ? (
        <div className="ai-card-body">
          <div className="ai-skeleton" />
          <div className="ai-skeleton short" />
        </div>
      ) : error ? (
        <div className="ai-card-body">
          <p className="ai-error">{error}</p>
        </div>
      ) : insight ? (
        <>
          {/* Always visible: main insight */}
          <div className="ai-card-body">
            <p className="ai-insight-text">{insight.insight}</p>

            {/* Category badges */}
            <div className="ai-badges">
              {categories.map((cat) => (
                <span key={cat} className="ai-badge" style={{ background: `${CATEGORY_COLORS[cat]}20`, color: CATEGORY_COLORS[cat] }}>
                  {cat}
                </span>
              ))}
            </div>
          </div>

          {/* Expandable section */}
          <div className={`ai-card-expand ${expanded ? "open" : ""}`}>
            <div className="ai-expand-content">
              <div className="ai-detail-row">
                <span className="ai-detail-label">Why</span>
                <p className="ai-detail-text">{insight.why}</p>
              </div>
              <div className="ai-detail-row">
                <span className="ai-detail-label">💡 Next Step</span>
                <p className="ai-detail-text ai-next-action">{insight.nextAction}</p>
              </div>
              <div className="ai-footer">
                <ConfidenceDots level={insight.confidence} />
                <div className="ai-feedback">
                  <span className="ai-feedback-label">Helpful?</span>
                  <button className={`ai-fb-btn ${feedback === "up" ? "active" : ""}`} onClick={() => setFeedback("up")}><IconThumbUp /></button>
                  <button className={`ai-fb-btn ${feedback === "down" ? "active" : ""}`} onClick={() => setFeedback("down")}><IconThumbDown /></button>
                </div>
              </div>
            </div>
          </div>

          {/* View All button */}
          <button className="ai-view-all-btn" onClick={onViewAll}>
            View All Insights →
          </button>
        </>
      ) : (
        <div className="ai-card-body">
          <p className="ai-placeholder">Your AI insight will appear after logging data.</p>
        </div>
      )}
    </div>
  );
};

export default AiInsightCard;
