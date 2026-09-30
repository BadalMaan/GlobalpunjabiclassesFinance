"use client";

import {
  ArrowDownLeft,
  ArrowUpRight,
  ChevronLeft,
  ChevronRight,
  CircleDollarSign,
  Receipt,
  Wallet,
} from "lucide-react";
import { demoMembers, demoTransactions } from "../lib/demo-data";

const money = (value: number) =>
  new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 2 }).format(value);

export default function Dashboard() {
  const income = demoTransactions.filter(x => x.type === "income").reduce((a, x) => a + x.amount, 0);
  const expenses = demoTransactions.filter(x => x.type === "expense").reduce((a, x) => a + x.amount, 0);
  const net = income - expenses;

  return (
    <div className="content">
      <div style={{ display: "flex", justifyContent: "space-between", gap: 16, alignItems: "flex-end", flexWrap: "wrap" }}>
        <div>
          <div className="page-title">Good evening, Ranjot 👋</div>
          <div className="page-subtitle">Here&apos;s your complete financial overview.</div>
        </div>
        <div className="month-control">
          <button aria-label="Previous month"><ChevronLeft size={17} /></button>
          <div className="month-label">October 2026</div>
          <button aria-label="Next month"><ChevronRight size={17} /></button>
        </div>
      </div>

      <section className="cards">
        <Metric label="Total income" value={money(income)} foot="Money received this month" icon={<ArrowDownLeft size={17} />} />
        <Metric label="Total expenses" value={money(expenses)} foot="All recorded expenses" icon={<ArrowUpRight size={17} />} danger />
        <Metric label="Net amount" value={money(net)} foot="Income minus expenses" icon={<Wallet size={17} />} />
        <Metric label="Transactions" value={String(demoTransactions.length)} foot="Income + expenses" icon={<Receipt size={17} />} />
      </section>

      <div className="grid-2">
        <section className="card section-card">
          <div className="section-head">
            <div>
              <div className="section-title">Partner share</div>
              <div className="section-description">Income and expense responsibility follows the fixed ownership split.</div>
            </div>
          </div>

          <div className="partner-list">
            {demoMembers.map(member => {
              const incomeShare = income * member.share_percentage / 100;
              const expenseShare = expenses * member.share_percentage / 100;
              return (
                <div className="partner-row" key={member.id}>
                  <div className="partner-top">
                    <span className="partner-name">{member.name}</span>
                    <span className="partner-value">{member.share_percentage}% · {money(incomeShare - expenseShare)}</span>
                  </div>
                  <div className="progress"><span style={{ width: `${member.share_percentage}%` }} /></div>
                  <div style={{ display: "flex", justifyContent: "space-between", color: "#98a2b3", fontSize: 10 }}>
                    <span>Income {money(incomeShare)}</span>
                    <span>Expenses {money(expenseShare)}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        <section className="card section-card">
          <div className="section-head">
            <div>
              <div className="section-title">Recent activity</div>
              <div className="section-description">Latest recorded changes.</div>
            </div>
          </div>
          <div className="activity">
            {demoTransactions.map(t => (
              <div className="activity-row" key={t.id}>
                <div className="activity-dot" />
                <div className="activity-main">
                  <div className="activity-text">{t.created_by} {t.type === "income" ? "added income" : "added expense"} · {t.description}</div>
                  <div className="activity-time">{t.date} · {money(t.amount)}</div>
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>

      <section className="card section-card" style={{ marginTop: 16 }}>
        <div className="section-head">
          <div>
            <div className="section-title">Recent transactions</div>
            <div className="section-description">October 2026</div>
          </div>
          <button className="ghost-btn">View all</button>
        </div>

        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr><th>Date</th><th>Description</th><th>Type</th><th>Added by</th><th>Amount</th></tr>
            </thead>
            <tbody>
              {demoTransactions.map(t => (
                <tr key={t.id}>
                  <td>{t.date}</td>
                  <td style={{ fontWeight: 700 }}>{t.description}</td>
                  <td className={t.type === "income" ? "income" : "expense"}>{t.type}</td>
                  <td>{t.created_by}</td>
                  <td className={`amount ${t.type === "income" ? "income" : "expense"}`}>
                    {t.type === "income" ? "+" : "-"}{money(t.amount)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

function Metric({ label, value, foot, icon, danger }: {
  label: string; value: string; foot: string; icon: React.ReactNode; danger?: boolean;
}) {
  return (
    <div className="card metric">
      <div className="metric-top">
        <span className="metric-label">{label}</span>
        <span className="metric-icon" style={danger ? { color: "#c43232", background: "#fff1f1" } : undefined}>{icon}</span>
      </div>
      <div className="metric-value">{value}</div>
      <div className="metric-foot">{foot}</div>
    </div>
  );
}