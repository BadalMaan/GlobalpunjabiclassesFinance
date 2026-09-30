"use client";

import {
  ArrowDownLeft,
  ArrowUpRight,
  ChevronLeft,
  ChevronRight,
  Receipt,
  Wallet,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { createClient } from "../lib/supabase/client";

type Entry = {
  id: string;
  description: string;
  amount: number;
  entry_date: string;
  created_at: string;
  created_by: string;
  type: "income" | "expense";
};

type Member = {
  id: string;
  name: string;
  share_percentage: number;
};

const money = (value: number) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  }).format(value);

const monthLabel = (date: Date) =>
  date.toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
  });

const getGreeting = () => {
  const hour = new Date().getHours();

  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  if (hour < 21) return "Good evening";

  return "Good night";
};

export default function Dashboard() {
  const [month, setMonth] = useState(
    () =>
      new Date(
        new Date().getFullYear(),
        new Date().getMonth(),
        1
      )
  );

  const [entries, setEntries] = useState<Entry[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [name, setName] = useState("there");
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function loadDashboard() {
      setLoading(true);
      setLoadError("");

      /*
       * IMPORTANT:
       * createClient() is intentionally called INSIDE the effect.
       * This guarantees that the local `supabase` variable is
       * narrowed after the null check and fixes:
       *
       * "client is possibly null"
       */

      const supabase = createClient();

      if (!supabase) {
        if (!cancelled) {
          setLoading(false);
          setLoadError(
            "Supabase is not configured. Please check the Render environment variables."
          );
        }

        return;
      }

      const year = month.getFullYear();
      const monthIndex = month.getMonth();

      const startDate = new Date(
        year,
        monthIndex,
        1
      );

      const endDate = new Date(
        year,
        monthIndex + 1,
        1
      );

      const startISO = startDate.toISOString();
      const endISO = endDate.toISOString();

      const startDay = startISO.slice(0, 10);
      const endDay = endISO.slice(0, 10);

      try {
        const [
          incomeResult,
          expenseResult,
          profileResult,
          userResult,
        ] = await Promise.all([
          supabase
            .from("income_entries")
            .select(
              "id,description,amount,entry_date,created_at,created_by"
            )
            .gte("entry_date", startISO)
            .lt("entry_date", endISO)
            .order("entry_date", {
              ascending: false,
            }),

          supabase
            .from("expense_entries")
            .select(
              "id,description,amount,expense_date,created_at,created_by"
            )
            .gte("expense_date", startDay)
            .lt("expense_date", endDay)
            .order("expense_date", {
              ascending: false,
            }),

          supabase
            .from("profiles")
            .select(
              "id,name,share_percentage"
            )
            .order("name", {
              ascending: true,
            }),

          supabase.auth.getUser(),
        ]);

        if (cancelled) return;

        if (incomeResult.error) {
          throw new Error(
            incomeResult.error.message
          );
        }

        if (expenseResult.error) {
          throw new Error(
            expenseResult.error.message
          );
        }

        if (profileResult.error) {
          throw new Error(
            profileResult.error.message
          );
        }

        if (userResult.error) {
          throw new Error(
            userResult.error.message
          );
        }

        const profiles =
          profileResult.data || [];

        const currentUserId =
          userResult.data.user?.id;

        const currentProfile =
          currentUserId
            ? profiles.find(
                (profile: {
                  id: string;
                  name: string;
                }) =>
                  profile.id ===
                  currentUserId
              )
            : null;

        setName(
          currentProfile?.name || "there"
        );

        setMembers(
          profiles as Member[]
        );

        const nameMap = new Map<
          string,
          string
        >(
          profiles.map(
            (profile: {
              id: string;
              name: string;
            }) => [
              profile.id,
              profile.name,
            ]
          )
        );

        const incomeEntries: Entry[] = (
          incomeResult.data || []
        ).map(
          (entry: {
            id: string;
            description: string;
            amount: number | string;
            entry_date: string;
            created_at: string;
            created_by: string;
          }) => ({
            id: entry.id,
            description:
              entry.description,
            amount: Number(
              entry.amount
            ),
            entry_date:
              entry.entry_date,
            created_at:
              entry.created_at,
            created_by:
              nameMap.get(
                entry.created_by
              ) || "Unknown",
            type: "income",
          })
        );

        const expenseEntries: Entry[] = (
          expenseResult.data || []
        ).map(
          (entry: {
            id: string;
            description: string;
            amount: number | string;
            expense_date: string;
            created_at: string;
            created_by: string;
          }) => ({
            id: entry.id,
            description:
              entry.description,
            amount: Number(
              entry.amount
            ),
            entry_date:
              entry.expense_date,
            created_at:
              entry.created_at,
            created_by:
              nameMap.get(
                entry.created_by
              ) || "Unknown",
            type: "expense",
          })
        );

        const combined =
          [
            ...incomeEntries,
            ...expenseEntries,
          ].sort(
            (a, b) =>
              new Date(
                b.entry_date
              ).getTime() -
              new Date(
                a.entry_date
              ).getTime()
          );

        setEntries(combined);
        setLoading(false);
      } catch (error) {
        if (cancelled) return;

        console.error(
          "Dashboard loading error:",
          error
        );

        setEntries([]);
        setLoading(false);

        setLoadError(
          error instanceof Error
            ? error.message
            : "Unable to load financial data."
        );
      }
    }

    loadDashboard();

    return () => {
      cancelled = true;
    };
  }, [month]);

  /* =========================================================
     CALCULATIONS
     ========================================================= */

  const income = useMemo(
    () =>
      entries
        .filter(
          (entry) =>
            entry.type === "income"
        )
        .reduce(
          (total, entry) =>
            total +
            Number(entry.amount),
          0
        ),
    [entries]
  );

  const expenses = useMemo(
    () =>
      entries
        .filter(
          (entry) =>
            entry.type === "expense"
        )
        .reduce(
          (total, entry) =>
            total +
            Number(entry.amount),
          0
        ),
    [entries]
  );

  const net = income - expenses;

  const transactionCount =
    entries.length;

  const recentEntries =
    entries.slice(0, 5);

  /* =========================================================
     MONTH NAVIGATION
     ========================================================= */

  function changeMonth(
    direction: number
  ) {
    setMonth(
      (current) =>
        new Date(
          current.getFullYear(),
          current.getMonth() +
            direction,
          1
        )
    );
  }

  /* =========================================================
     RENDER
     ========================================================= */

  return (
    <div className="content dashboard-content">

      {/* =====================================================
          HEADER
      ===================================================== */}

      <div className="dashboard-heading">

        <div className="dashboard-welcome">

          <div className="eyebrow">
            Finance workspace
          </div>

          <h1 className="page-title">
            {getGreeting()},{" "}
            {name}
            <span>👋</span>
          </h1>

          <p className="page-subtitle">
            {transactionCount === 0
              ? "Your financial workspace is ready."
              : `${transactionCount} ${
                  transactionCount ===
                  1
                    ? "transaction"
                    : "transactions"
                } recorded this month.`}
          </p>

        </div>

        <div className="month-control">

          <button
            type="button"
            onClick={() =>
              changeMonth(-1)
            }
            aria-label="Previous month"
          >
            <ChevronLeft
              size={17}
            />
          </button>

          <div className="month-label">
            {monthLabel(month)}
          </div>

          <button
            type="button"
            onClick={() =>
              changeMonth(1)
            }
            aria-label="Next month"
          >
            <ChevronRight
              size={17}
            />
          </button>

        </div>

      </div>


      {/* =====================================================
          ERROR
      ===================================================== */}

      {loadError && (
        <div
          className="notice"
          style={{
            marginTop: 18,
            borderColor: "#f3caca",
            background: "#fff8f8",
            color: "#a92828",
          }}
        >
          {loadError}
        </div>
      )}


      {/* =====================================================
          FINANCIAL SUMMARY
      ===================================================== */}

      <section className="cards">

        <Metric
          label="Total income"
          value={money(income)}
          foot={
            income === 0
              ? "No income recorded"
              : "Received this month"
          }
          icon={
            <ArrowDownLeft
              size={17}
            />
          }
        />

        <Metric
          label="Total expenses"
          value={money(expenses)}
          foot={
            expenses === 0
              ? "No expenses recorded"
              : "Recorded this month"
          }
          icon={
            <ArrowUpRight
              size={17}
            />
          }
          danger
        />

        <Metric
          label="Net amount"
          value={money(net)}
          foot="Income minus expenses"
          icon={
            <Wallet size={17} />
          }
        />

        <Metric
          label="Transactions"
          value={String(
            transactionCount
          )}
          foot={
            transactionCount === 0
              ? "Nothing recorded yet"
              : transactionCount ===
                1
              ? "1 transaction"
              : `${transactionCount} transactions`
          }
          icon={
            <Receipt size={17} />
          }
        />

      </section>


      {/* =====================================================
          OWNERSHIP + ACTIVITY
      ===================================================== */}

      <div className="dashboard-grid">

        {/* OWNERSHIP */}

        <section className="card clean-card">

          <div className="section-head">

            <div>
              <div className="section-title">
                Ownership
              </div>

              <div className="section-description">
                Fixed ownership split
              </div>
            </div>

          </div>

          {members.length >
          0 ? (

            <div className="ownership-grid">

              {members.map(
                (member) => {

                  const initials =
                    member.name
                      .split(" ")
                      .map(
                        (part) =>
                          part[0]
                      )
                      .join("")
                      .slice(0, 2)
                      .toUpperCase();

                  return (
                    <div
                      className="ownership-card"
                      key={member.id}
                    >

                      <div className="ownership-avatar">
                        {initials}
                      </div>

                      <div className="ownership-info">

                        <div className="ownership-name">
                          {member.name}
                        </div>

                        <div className="ownership-label">
                          Ownership
                        </div>

                      </div>

                      <div className="ownership-share">
                        {
                          member.share_percentage
                        }
                        %
                      </div>

                    </div>
                  );
                }
              )}

            </div>

          ) : (

            <EmptySmall
              text="No members available yet."
            />

          )}

        </section>


        {/* RECENT ACTIVITY */}

        <section className="card clean-card">

          <div className="section-head">

            <div>
              <div className="section-title">
                Recent activity
              </div>

              <div className="section-description">
                Latest financial activity
              </div>
            </div>

          </div>

          {loading ? (

            <LoadingRows />

          ) : recentEntries.length ===
            0 ? (

            <EmptyState
              compact
              title="No activity yet"
              text="Income and expenses will appear here after you add your first transaction."
            />

          ) : (

            <div className="activity">

              {recentEntries.map(
                (entry) => (

                  <div
                    className="activity-row"
                    key={`${entry.type}-${entry.id}`}
                  >

                    <div
                      className={`activity-icon ${entry.type}`}
                    >
                      {entry.type ===
                      "income" ? (
                        <ArrowDownLeft
                          size={15}
                        />
                      ) : (
                        <ArrowUpRight
                          size={15}
                        />
                      )}
                    </div>

                    <div className="activity-main">

                      <div className="activity-text">
                        {
                          entry.description
                        }
                      </div>

                      <div className="activity-time">

                        {entry.type ===
                        "income"
                          ? "Income"
                          : "Expense"}

                        {" · "}

                        {new Date(
                          entry.entry_date
                        ).toLocaleDateString(
                          "en-IN"
                        )}

                        {" · "}

                        {
                          entry.created_by
                        }

                      </div>

                    </div>

                    <strong
                      className={
                        entry.type
                      }
                    >
                      {entry.type ===
                      "income"
                        ? "+"
                        : "−"}

                      {money(
                        Number(
                          entry.amount
                        )
                      )}
                    </strong>

                  </div>

                )
              )}

            </div>

          )}

        </section>

      </div>


      {/* =====================================================
          TRANSACTIONS
      ===================================================== */}

      <section className="card clean-card transactions-card">

        <div className="section-head">

          <div>

            <div className="section-title">
              Transactions
            </div>

            <div className="section-description">
              {monthLabel(month)}
            </div>

          </div>

          <div className="count-chip">
            {transactionCount}
          </div>

        </div>

        {loading ? (

          <LoadingRows />

        ) : transactionCount ===
          0 ? (

          <EmptyState
            title="No transactions yet"
            text="Your income and expenses will appear here after you add them."
          />

        ) : (

          <div className="table-wrap">

            <table className="table">

              <thead>

                <tr>
                  <th>
                    Date
                  </th>

                  <th>
                    Description
                  </th>

                  <th>
                    Type
                  </th>

                  <th>
                    Added by
                  </th>

                  <th>
                    Amount
                  </th>
                </tr>

              </thead>

              <tbody>

                {entries.map(
                  (entry) => (

                    <tr
                      key={`${entry.type}-${entry.id}`}
                    >

                      <td>
                        {new Date(
                          entry.entry_date
                        ).toLocaleDateString(
                          "en-IN"
                        )}
                      </td>

                      <td className="table-strong">
                        {
                          entry.description
                        }
                      </td>

                      <td>

                        <span
                          className={`type-pill ${entry.type}`}
                        >
                          {
                            entry.type
                          }
                        </span>

                      </td>

                      <td>
                        {
                          entry.created_by
                        }
                      </td>

                      <td
                        className={`amount ${entry.type}`}
                      >

                        {entry.type ===
                        "income"
                          ? "+"
                          : "−"}

                        {money(
                          Number(
                            entry.amount
                          )
                        )}

                      </td>

                    </tr>

                  )
                )}

              </tbody>

            </table>

          </div>

        )}

      </section>

    </div>
  );
}


/* =========================================================
   METRIC CARD
   ========================================================= */

function Metric({
  label,
  value,
  foot,
  icon,
  danger,
}: {
  label: string;
  value: string;
  foot: string;
  icon: React.ReactNode;
  danger?: boolean;
}) {
  return (
    <div className="card metric">

      <div className="metric-top">

        <span className="metric-label">
          {label}
        </span>

        <span
          className={`metric-icon ${
            danger ? "danger" : ""
          }`}
        >
          {icon}
        </span>

      </div>

      <div className="metric-value">
        {value}
      </div>

      <div className="metric-foot">
        {foot}
      </div>

    </div>
  );
}


/* =========================================================
   EMPTY STATE
   ========================================================= */

function EmptyState({
  title,
  text,
  compact,
}: {
  title: string;
  text: string;
  compact?: boolean;
}) {
  return (
    <div
      className={`empty-state ${
        compact
          ? "compact"
          : ""
      }`}
    >

      <div className="empty-icon">
        <Receipt size={18} />
      </div>

      <div className="empty-title">
        {title}
      </div>

      <div className="empty-text">
        {text}
      </div>

    </div>
  );
}


/* =========================================================
   SMALL EMPTY STATE
   ========================================================= */

function EmptySmall({
  text,
}: {
  text: string;
}) {
  return (
    <div className="empty-small">
      {text}
    </div>
  );
}


/* =========================================================
   LOADING SKELETON
   ========================================================= */

function LoadingRows() {
  return (
    <div className="loading-list">
      <span />
      <span />
      <span />
    </div>
  );
}
