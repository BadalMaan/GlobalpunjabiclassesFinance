"use client";

import { useEffect, useMemo, useState } from "react";
import { createClient } from "../../lib/supabase/client";
import { SimplePage } from "../../components/app-shell";

type Profile = {
  id: string;
  name: string;
  email: string;
  share_percentage: number;
};

type IncomeEntry = {
  amount: number;
  entry_date: string;
};

type ExpenseEntry = {
  amount: number;
  expense_date: string;
};

export default function SettlementsPage() {
  const supabase = createClient();

  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [income, setIncome] = useState<IncomeEntry[]>([]);
  const [expenses, setExpenses] = useState<ExpenseEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [currentMonth, setCurrentMonth] = useState(() => {
    const now = new Date();

    return `${now.getFullYear()}-${String(
      now.getMonth() + 1
    ).padStart(2, "0")}`;
  });

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    setLoading(true);
    setError("");

    const [
      { data: profileData, error: profileError },
      { data: incomeData, error: incomeError },
      { data: expenseData, error: expenseError },
    ] = await Promise.all([
      supabase
        .from("profiles")
        .select("id, name, email, share_percentage")
        .order("name", { ascending: true }),

      supabase
        .from("income_entries")
        .select("amount, entry_date")
        .order("entry_date", { ascending: false }),

      supabase
        .from("expense_entries")
        .select("amount, expense_date")
        .order("expense_date", { ascending: false }),
    ]);

    if (profileError || incomeError || expenseError) {
      setError(
        profileError?.message ||
          incomeError?.message ||
          expenseError?.message ||
          "Unable to load settlement data."
      );

      setLoading(false);
      return;
    }

    setProfiles(profileData || []);
    setIncome(incomeData || []);
    setExpenses(expenseData || []);

    setLoading(false);
  }

  const monthIncome = useMemo(() => {
    return income
      .filter((item) => {
        if (!item.entry_date) return false;

        return item.entry_date.startsWith(currentMonth);
      })
      .reduce((total, item) => {
        return total + Number(item.amount || 0);
      }, 0);
  }, [income, currentMonth]);

  const monthExpenses = useMemo(() => {
    return expenses
      .filter((item) => {
        if (!item.expense_date) return false;

        return item.expense_date.startsWith(currentMonth);
      })
      .reduce((total, item) => {
        return total + Number(item.amount || 0);
      }, 0);
  }, [expenses, currentMonth]);

  const netAmount = monthIncome - monthExpenses;

  const monthLabel = useMemo(() => {
    const [year, month] = currentMonth.split("-");

    return new Date(
      Number(year),
      Number(month) - 1,
      1
    ).toLocaleDateString("en-US", {
      month: "long",
      year: "numeric",
    });
  }, [currentMonth]);

  function previousMonth() {
    const [year, month] = currentMonth.split("-").map(Number);

    const date = new Date(year, month - 2, 1);

    setCurrentMonth(
      `${date.getFullYear()}-${String(
        date.getMonth() + 1
      ).padStart(2, "0")}`
    );
  }

  function nextMonth() {
    const [year, month] = currentMonth.split("-").map(Number);

    const date = new Date(year, month, 1);

    setCurrentMonth(
      `${date.getFullYear()}-${String(
        date.getMonth() + 1
      ).padStart(2, "0")}`
    );
  }

  function formatMoney(value: number) {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 2,
    }).format(value);
  }

  return (
    <SimplePage
      title="Settlements"
      description="Monthly income, expenses and ownership settlement."
    >
      <div className="page-toolbar">
        <button
          type="button"
          className="secondary-button"
          onClick={previousMonth}
        >
          ←
        </button>

        <div className="month-selector">
          <strong>{monthLabel}</strong>
        </div>

        <button
          type="button"
          className="secondary-button"
          onClick={nextMonth}
        >
          →
        </button>
      </div>

      {loading ? (
        <div className="empty-state">
          <h3>Loading settlements...</h3>
          <p>
            Please wait while we load your financial data.
          </p>
        </div>
      ) : error ? (
        <div className="empty-state">
          <h3>Unable to load settlements</h3>

          <p>{error}</p>

          <button
            type="button"
            className="primary-button"
            onClick={loadData}
          >
            Try Again
          </button>
        </div>
      ) : (
        <>
          <div className="stats-grid">
            <div className="stat-card">
              <span>Total Income</span>

              <strong>
                {formatMoney(monthIncome)}
              </strong>

              <small>{monthLabel}</small>
            </div>

            <div className="stat-card">
              <span>Total Expenses</span>

              <strong>
                {formatMoney(monthExpenses)}
              </strong>

              <small>{monthLabel}</small>
            </div>

            <div className="stat-card">
              <span>Net Amount</span>

              <strong>
                {formatMoney(netAmount)}
              </strong>

              <small>Income − Expenses</small>
            </div>
          </div>

          <div className="section-heading">
            <div>
              <h2>Ownership Settlement</h2>

              <p>
                Settlement is calculated automatically according
                to ownership percentage.
              </p>
            </div>
          </div>

          <div className="ownership-grid">
            {profiles.map((member) => {
              const percentage = Number(
                member.share_percentage || 0
              );

              const incomeShare =
                (monthIncome * percentage) / 100;

              const expenseShare =
                (monthExpenses * percentage) / 100;

              const settlement =
                incomeShare - expenseShare;

              return (
                <div
                  className="ownership-card"
                  key={member.id}
                >
                  <div className="ownership-card-top">
                    <div>
                      <h3>{member.name}</h3>

                      <span>{member.email}</span>
                    </div>

                    <strong>
                      {percentage}%
                    </strong>
                  </div>

                  <div className="ownership-amount">
                    <span>Settlement</span>

                    <strong>
                      {formatMoney(settlement)}
                    </strong>
                  </div>

                  <div className="ownership-breakdown">
                    <div>
                      <span>Income Share</span>

                      <strong>
                        {formatMoney(incomeShare)}
                      </strong>
                    </div>

                    <div>
                      <span>Expense Share</span>

                      <strong>
                        {formatMoney(expenseShare)}
                      </strong>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {profiles.length === 0 && (
            <div className="empty-state">
              <h3>No members found</h3>

              <p>
                Profiles have not been added yet.
              </p>
            </div>
          )}
        </>
      )}
    </SimplePage>
  );
}
