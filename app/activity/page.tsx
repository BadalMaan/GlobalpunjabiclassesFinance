import SimplePage from "../../components/simple-page";
import { demoTransactions } from "../../lib/demo-data";

export default function ActivityPage() {
  return (
    <SimplePage title="Activity & Audit History" subtitle="A complete trail of who added or changed financial information.">
      <div className="activity">
        {demoTransactions.map(t => (
          <div className="activity-row" key={t.id}>
            <div className="activity-dot" />
            <div className="activity-main">
              <div className="activity-text">{t.created_by} added {t.type}: {t.description}</div>
              <div className="activity-time">{t.date} · ₹{t.amount.toFixed(2)}</div>
            </div>
          </div>
        ))}
      </div>
    </SimplePage>
  );
}