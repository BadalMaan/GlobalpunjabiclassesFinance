import SimplePage from "../../components/simple-page";
import { demoMembers, demoTransactions } from "../../lib/demo-data";

export default function SettlementsPage() {
  const income = demoTransactions.filter(x => x.type === "income").reduce((a,x) => a+x.amount, 0);
  const expense = demoTransactions.filter(x => x.type === "expense").reduce((a,x) => a+x.amount, 0);
  const net = income - expense;
  return (
    <SimplePage title="Settlements" subtitle="Final monthly position after income and shared expense responsibility.">
      <div className="table-wrap">
        <table className="table">
          <thead><tr><th>Member</th><th>Share</th><th>Income share</th><th>Expense share</th><th>Net position</th></tr></thead>
          <tbody>{demoMembers.map(m => {
            const inc = income*m.share_percentage/100;
            const exp = expense*m.share_percentage/100;
            return <tr key={m.id}><td style={{fontWeight:750}}>{m.name}</td><td>{m.share_percentage}%</td><td className="income">₹{inc.toFixed(2)}</td><td className="expense">₹{exp.toFixed(2)}</td><td className="amount">₹{(net*m.share_percentage/100).toFixed(2)}</td></tr>;
          })}</tbody>
        </table>
      </div>
    </SimplePage>
  );
}