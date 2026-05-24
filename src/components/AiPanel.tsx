import React, { useState } from "react";
import type { AiInsightResponse } from "../services/api";
import "./AiInsight.css";

interface AiPanelProps {
  open: boolean;
  onClose: () => void;
  insight: AiInsightResponse | null;
  mode: "cycle" | "pregnancy" | "postpartum";
  onSendChat: (msg: string) => Promise<string>;
  chatHistory: string[];
}

const AiPanel: React.FC<AiPanelProps> = ({ open, onClose, insight, mode, onSendChat, chatHistory }) => {
  const [chatInput, setChatInput] = useState("");
  const [sending, setSending] = useState(false);

  const handleSend = async () => {
    const msg = chatInput.trim();
    if (!msg || sending) return;
    setChatInput("");
    setSending(true);
    try {
      await onSendChat(msg);
    } finally {
      setSending(false);
    }
  };

  return (
    <>
      {open && <div className="ai-panel-backdrop" onClick={onClose} />}
      <div className={`ai-panel ${open ? "open" : ""}`}>
        {/* Header */}
        <div className="ai-panel-header">
          <h2 className="ai-panel-title">✨ AI Insights</h2>
          <button className="ai-panel-close" onClick={onClose}>✕</button>
        </div>

        <div className="ai-panel-body">
          {/* Daily Insight */}
          <section className="ai-panel-section">
            <h3 className="ai-panel-section-title">Today's Insight</h3>
            {insight ? (
              <div className="ai-panel-insight-card">
                <p className="ai-panel-insight-title">{insight.title}</p>
                <p className="ai-panel-insight-text">{insight.insight}</p>
                <p className="ai-panel-insight-action">💡 {insight.nextAction}</p>
              </div>
            ) : (
              <p className="ai-panel-empty">No insight available yet. Log some data first!</p>
            )}
          </section>

          {/* Mode info */}
          <section className="ai-panel-section">
            <h3 className="ai-panel-section-title">Current Mode</h3>
            <div className="ai-panel-mode-badge">
              {mode === "cycle" ? "🔴 Cycle Tracking" : mode === "pregnancy" ? "🤰 Pregnancy" : "👶 Postpartum"}
            </div>
          </section>

          {/* Chat */}
          <section className="ai-panel-section ai-panel-chat-section">
            <h3 className="ai-panel-section-title">Chat with OVI</h3>
            <div className="ai-panel-chat">
              {chatHistory.map((msg, i) => (
                <div key={i} className={`ai-chat-msg ${msg.startsWith("OVI:") ? "ovi" : "user"}`}>
                  {msg.startsWith("OVI:") ? msg.slice(4).trim() : msg}
                </div>
              ))}
              {sending && <div className="ai-chat-msg ovi">Thinking…</div>}
            </div>
            <div className="ai-panel-chat-input">
              <input
                type="text"
                placeholder="Ask OVI anything…"
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") handleSend(); }}
              />
              <button onClick={handleSend} disabled={sending || !chatInput.trim()}>
                Send
              </button>
            </div>
          </section>
        </div>
      </div>
    </>
  );
};

export default AiPanel;
