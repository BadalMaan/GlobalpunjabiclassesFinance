import SimplePage from "../../components/simple-page";
import { demoTransactions } from "../../lib/demo-data";

export default function IncomePage() {
  const rows = demoTransactions.filter(t => t.type === "income");
  return (
    <SimplePage title="Income" subtitle="Record every payment received with date, time and description.">
      <div className="section-head">
        <div><div className="section-title">October income</div><div className="section-description">Every entry will carry creator and audit history.</div></div>
        <button className="action-btn">+ Add income</button>
      </div>
      <div className="table-wrap">
        <table className="table">
          <thead><tr><th>Date</th><th>Description</th><th>Added by</th><th>Amount</th></tr></thead>
          <tbody>{rows.map(r => <tr key={r.id}><td>{r.date}</td><td>{r.description}</td><td>{r.created_by}</td><td className="amount income">+₹{r.amount.toFixed(2)}</td></tr>)}</tbody>
        </table>
      </div>
    </SimplePage>
  );
}