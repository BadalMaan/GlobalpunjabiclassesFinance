import SimplePage from "../../components/simple-page";
import { demoTransactions } from "../../lib/demo-data";

export default function ExpensesPage() {
  const rows = demoTransactions.filter(t => t.type === "expense");
  return (
    <SimplePage title="Expenses" subtitle="Record what each expense was made for. Responsibility is calculated separately using 25 / 25 / 50.">
      <div className="section-head">
        <div><div className="section-title">October expenses</div><div className="section-description">The person who enters an expense does not change ownership responsibility.</div></div>
        <button className="action-btn">+ Add expense</button>
      </div>
      <div className="table-wrap">
        <table className="table">
          <thead><tr><th>Date</th><th>Expense for</th><th>Added by</th><th>Amount</th></tr></thead>
          <tbody>{rows.map(r => <tr key={r.id}><td>{r.date}</td><td>{r.description}</td><td>{r.created_by}</td><td className="amount expense">-₹{r.amount.toFixed(2)}</td></tr>)}</tbody>
        </table>
      </div>
    </SimplePage>
  );
}