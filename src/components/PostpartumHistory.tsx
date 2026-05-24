import React from "react";
import { format, parseISO } from "date-fns";

interface PostpartumLog {
  date: string;
  mood: string;
  symptoms: string[];
  feedCount: number;
  babySleepHours: number;
  notes?: string;
}

interface PostpartumHistoryProps {
  logs: PostpartumLog[];
}

const PostpartumHistory: React.FC<PostpartumHistoryProps> = ({ logs }) => {
  if (logs.length === 0) {
    return <p className="history-empty">No postpartum logs recorded yet.</p>;
  }

  return (
    <div className="history-container">
      {logs.map((log) => (
        <div key={log.date} className="history-item">
          <div className="history-header">
            <span className="history-date">
              {format(parseISO(log.date), "MMM d, yyyy")}
            </span>
            <span className="history-badge mood">{log.mood}</span>
          </div>
          <div className="history-details">
            <p>🍼 {log.feedCount} feeds today</p>
            <p>😴 Baby slept {log.babySleepHours} hours</p>
            {log.symptoms.length > 0 && (
              <p>⚠️ Symptoms: {log.symptoms.join(", ")}</p>
            )}
            {log.notes && <p className="history-notes">"{log.notes}"</p>}
          </div>
        </div>
      ))}
    </div>
  );
};

export default PostpartumHistory;
