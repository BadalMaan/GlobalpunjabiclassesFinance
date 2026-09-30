"use client";

import SimplePage from "../../components/simple-page";
import { createClient } from "../../lib/supabase/client";
import { useEffect, useState } from "react";
import {
  Plus,
  Pencil,
  Trash2,
  X,
  CalendarDays,
  Clock3,
} from "lucide-react";

type ExpenseEntry = {
  id: string;
  description: string;
  amount: number;
  expense_date: string;
  created_at: string;
  created_by: string;
};

type Profile = {
  id: string;
  name: string;
  share_percentage: number;
};

type FormState = {
  description: string;
  amount: string;
  date: string;
  time: string;
};

function getCurrentDateTime(): FormState {
  const now = new Date();

  const date = `${now.getFullYear()}-${String(
    now.getMonth() + 1
  ).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;

  const time = `${String(now.getHours()).padStart(2, "0")}:${String(
    now.getMinutes()
  ).padStart(2, "0")}`;

  return {
    description: "",
    amount: "",
    date,
    time,
  };
}

function formatDate(value: string) {
  return new Date(value).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function formatTime(value: string) {
  return new Date(value).toLocaleTimeString("en-IN", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function money(value: number) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

export default function ExpensesPage() {
  const [rows, setRows] = useState<ExpenseEntry[]>([]);
  const [profiles, setProfiles] = useState<Profile[]>([]);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const [form, setForm] = useState<FormState>(
    getCurrentDateTime()
  );

  async function loadExpenses() {
    const supabase = createClient();

    if (!supabase) {
      setError("Supabase is not configured.");
      setLoading(false);
      return;
    }

    setLoading(true);
    setError("");

    const [expenseResult, profileResult] = await Promise.all([
      supabase
        .from("expense_entries")
        .select(
          "id,description,amount,expense_date,created_at,created_by"
        )
        .order("expense_date", { ascending: false }),

      supabase
        .from("profiles")
        .select("id,name,share_percentage"),
    ]);

    if (expenseResult.error) {
      setError(expenseResult.error.message);
      setLoading(false);
      return;
    }

    if (profileResult.error) {
      setError(profileResult.error.message);
      setLoading(false);
      return;
    }

    setRows(
      (expenseResult.data || []).map((row: any) => ({
        id: row.id,
        description: row.description,
        amount: Number(row.amount),
        expense_date: row.expense_date,
        created_at: row.created_at,
        created_by: row.created_by,
      }))
    );

    setProfiles(profileResult.data || []);
    setLoading(false);
  }

  useEffect(() => {
    loadExpenses();
  }, []);

  function getProfileName(userId: string) {
    return (
      profiles.find((profile) => profile.id === userId)?.name ||
      "Unknown"
    );
  }

  function openAddModal() {
    setEditingId(null);
    setForm(getCurrentDateTime());
    setError("");
    setModalOpen(true);
  }

  function openEditModal(row: ExpenseEntry) {
    const date = new Date(row.expense_date);

    const localDate = `${date.getFullYear()}-${String(
      date.getMonth() + 1
    ).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;

    const localTime = `${String(date.getHours()).padStart(
      2,
      "0"
    )}:${String(date.getMinutes()).padStart(2, "0")}`;

    setEditingId(row.id);

    setForm({
      description: row.description,
      amount: String(row.amount),
      date: localDate,
      time: localTime,
    });

    setError("");
    setModalOpen(true);
  }

  function closeModal() {
    if (saving) return;

    setModalOpen(false);
    setEditingId(null);
    setError("");
  }

  async function saveExpense() {
    const supabase = createClient();

    if (!supabase) {
      setError("Supabase is not configured.");
      return;
    }

    const description = form.description.trim();
    const amount = Number(form.amount);

    if (!description) {
      setError("Please enter what the expense was for.");
      return;
    }

    if (!form.amount || !Number.isFinite(amount) || amount <= 0) {
      setError("Please enter a valid amount.");
      return;
    }

    if (!form.date || !form.time) {
      setError("Please select date and time.");
      return;
    }

    setSaving(true);
    setError("");

    const expenseDate = new Date(
      `${form.date}T${form.time}:00`
    ).toISOString();

    if (editingId) {
      const { error: updateError } = await supabase
        .from("expense_entries")
        .update({
          description,
          amount,
          expense_date: expenseDate,
        })
        .eq("id", editingId);

      if (updateError) {
        setError(updateError.message);
        setSaving(false);
        return;
      }
    } else {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        setError("Your session has expired. Please log in again.");
        setSaving(false);
        return;
      }

      const { error: insertError } = await supabase
        .from("expense_entries")
        .insert({
          description,
          amount,
          expense_date: expenseDate,
          created_by: user.id,
        });

      if (insertError) {
        setError(insertError.message);
        setSaving(false);
        return;
      }
    }

    setSaving(false);
    setModalOpen(false);
    setEditingId(null);
    setForm(getCurrentDateTime());

    await loadExpenses();
  }

  async function deleteExpense(id: string) {
    const row = rows.find((item) => item.id === id);

    if (!row) return;

    const confirmed = window.confirm(
      `Delete "${row.description}" for ${money(
        row.amount
      )}?\n\nThis action cannot be undone.`
    );

    if (!confirmed) return;

    const supabase = createClient();

    if (!supabase) {
      setError("Supabase is not configured.");
      return;
    }

    setError("");

    const { error: deleteError } = await supabase
      .from("expense_entries")
      .delete()
      .eq("id", id);

    if (deleteError) {
      setError(deleteError.message);
      return;
    }

    await loadExpenses();
  }

  const total = rows.reduce(
    (sum, row) => sum + Number(row.amount),
    0
  );

  const ownership = [
    {
      label: "Badal Maan",
      percentage: 25,
    },
    {
      label: "Jasnoor",
      percentage: 25,
    },
    {
      label: "Ranjot Singh",
      percentage: 50,
    },
  ];

  return (
    <>
      <SimplePage
        title="Expenses"
        subtitle="Record what each expense was made for. Responsibility is calculated separately using 25 / 25 / 50."
      >
        <div className="section-head">
          <div>
            <div className="section-title">
              October expenses
            </div>

            <div className="section-description">
              The person who enters an expense does not change
              ownership responsibility.
            </div>
          </div>

          <button
            type="button"
            className="action-btn"
            onClick={openAddModal}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 7,
              cursor: "pointer",
            }}
          >
            <Plus size={16} />
            Add expense
          </button>
        </div>

        {/* TOTAL + OWNERSHIP */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns:
              "minmax(220px, .8fr) minmax(320px, 1.2fr)",
            gap: 16,
            marginBottom: 18,
          }}
        >
          {/* TOTAL */}
          <div
            style={{
              padding: "17px 18px",
              border: "1px solid #e8edf5",
              borderRadius: 16,
              background: "#fff",
            }}
          >
            <div
              style={{
                fontSize: 11,
                fontWeight: 800,
                color: "#98a2b3",
                textTransform: "uppercase",
                letterSpacing: ".08em",
              }}
            >
              Total expenses
            </div>

            <div
              style={{
                marginTop: 5,
                fontSize: 24,
                fontWeight: 900,
                color: "#071f49",
              }}
            >
              {money(total)}
            </div>

            <div
              style={{
                marginTop: 4,
                fontSize: 12,
                color: "#64748b",
              }}
            >
              {rows.length}{" "}
              {rows.length === 1 ? "expense" : "expenses"}
            </div>
          </div>

          {/* OWNERSHIP */}
          <div
            style={{
              padding: "15px 17px",
              border: "1px solid #e8edf5",
              borderRadius: 16,
              background: "#fff",
            }}
          >
            <div
              style={{
                fontSize: 11,
                fontWeight: 800,
                color: "#98a2b3",
                textTransform: "uppercase",
                letterSpacing: ".08em",
                marginBottom: 10,
              }}
            >
              Expense responsibility
            </div>

            <div
              style={{
                display: "grid",
                gridTemplateColumns:
                  "repeat(3,minmax(0,1fr))",
                gap: 9,
              }}
            >
              {ownership.map((member) => (
                <div
                  key={member.label}
                  style={{
                    padding: "10px 11px",
                    borderRadius: 12,
                    background: "#f7f9fc",
                  }}
                >
                  <div
                    style={{
                      fontSize: 11,
                      fontWeight: 750,
                      color: "#64748b",
                    }}
                  >
                    {member.label}
                  </div>

                  <div
                    style={{
                      marginTop: 3,
                      fontSize: 16,
                      fontWeight: 900,
                      color: "#12203a",
                    }}
                  >
                    {member.percentage}%
                  </div>

                  <div
                    style={{
                      marginTop: 2,
                      fontSize: 11,
                      color: "#64748b",
                    }}
                  >
                    {money(
                      total * (member.percentage / 100)
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {error && (
          <div
            style={{
              marginBottom: 16,
              padding: "13px 15px",
              borderRadius: 13,
              background: "#fff1f2",
              border: "1px solid #fecdd3",
              color: "#be123c",
              fontSize: 13,
              fontWeight: 700,
            }}
          >
            {error}
          </div>
        )}

        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Expense for</th>
                <th>Added by</th>
                <th>Amount</th>
                <th style={{ textAlign: "right" }}>
                  Actions
                </th>
              </tr>
            </thead>

            <tbody>
              {loading ? (
                <tr>
                  <td
                    colSpan={5}
                    style={{
                      padding: 35,
                      textAlign: "center",
                      color: "#64748b",
                    }}
                  >
                    Loading expenses...
                  </td>
                </tr>
              ) : rows.length === 0 ? (
                <tr>
                  <td
                    colSpan={5}
                    style={{
                      padding: 45,
                      textAlign: "center",
                      color: "#64748b",
                    }}
                  >
                    <div
                      style={{
                        fontWeight: 800,
                        color: "#12203a",
                        marginBottom: 5,
                      }}
                    >
                      No expenses recorded yet
                    </div>

                    <div style={{ fontSize: 13 }}>
                      Click “Add expense” to create your
                      first expense.
                    </div>
                  </td>
                </tr>
              ) : (
                rows.map((row) => (
                  <tr key={row.id}>
                    <td>
                      <div style={{ fontWeight: 750 }}>
                        {formatDate(row.expense_date)}
                      </div>

                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 4,
                          marginTop: 4,
                          fontSize: 11,
                          color: "#98a2b3",
                        }}
                      >
                        <Clock3 size={11} />
                        {formatTime(row.expense_date)}
                      </div>
                    </td>

                    <td>
                      <div className="table-strong">
                        {row.description}
                      </div>
                    </td>

                    <td>
                      {getProfileName(row.created_by)}
                    </td>

                    <td className="amount expense">
                      -{money(Number(row.amount))}
                    </td>

                    <td>
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "flex-end",
                          gap: 7,
                        }}
                      >
                        <button
                          type="button"
                          onClick={() => openEditModal(row)}
                          title="Edit expense"
                          style={{
                            width: 34,
                            height: 34,
                            borderRadius: 10,
                            border: "1px solid #e2e8f0",
                            background: "#fff",
                            color: "#173f76",
                            display: "grid",
                            placeItems: "center",
                            cursor: "pointer",
                          }}
                        >
                          <Pencil size={14} />
                        </button>

                        <button
                          type="button"
                          onClick={() =>
                            deleteExpense(row.id)
                          }
                          title="Delete expense"
                          style={{
                            width: 34,
                            height: 34,
                            borderRadius: 10,
                            border: "1px solid #fecdd3",
                            background: "#fff7f8",
                            color: "#be123c",
                            display: "grid",
                            placeItems: "center",
                            cursor: "pointer",
                          }}
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </SimplePage>

      {/* ADD / EDIT MODAL */}
      {modalOpen && (
        <div
          className="modalBackdrop"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              closeModal();
            }
          }}
        >
          <div
            className="modal"
            style={{
              background: "#fff",
              borderRadius: 22,
              border: "1px solid #e6ebf3",
              boxShadow:
                "0 30px 80px rgba(16,35,65,.18)",
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "flex-start",
                gap: 15,
              }}
            >
              <div>
                <div
                  style={{
                    fontSize: 20,
                    fontWeight: 900,
                    color: "#12203a",
                  }}
                >
                  {editingId
                    ? "Edit expense"
                    : "Add expense"}
                </div>

                <div
                  style={{
                    marginTop: 5,
                    fontSize: 12,
                    color: "#64748b",
                  }}
                >
                  {editingId
                    ? "Update the expense details."
                    : "Record a new business expense."}
                </div>
              </div>

              <button
                type="button"
                onClick={closeModal}
                disabled={saving}
                style={{
                  width: 34,
                  height: 34,
                  borderRadius: 10,
                  border: "1px solid #e5eaf1",
                  background: "#fff",
                  display: "grid",
                  placeItems: "center",
                  cursor: saving
                    ? "not-allowed"
                    : "pointer",
                }}
              >
                <X size={17} />
              </button>
            </div>

            <div
              style={{
                display: "grid",
                gap: 15,
                marginTop: 24,
              }}
            >
              {/* DESCRIPTION */}
              <label>
                <span
                  style={{
                    display: "block",
                    marginBottom: 7,
                    fontSize: 12,
                    fontWeight: 800,
                    color: "#344054",
                  }}
                >
                  Expense for
                </span>

                <input
                  type="text"
                  value={form.description}
                  onChange={(event) =>
                    setForm({
                      ...form,
                      description: event.target.value,
                    })
                  }
                  placeholder="e.g. Office supplies"
                  style={{
                    width: "100%",
                    padding: "12px 13px",
                    border: "1px solid #dfe5ee",
                    borderRadius: 12,
                    outline: "none",
                  }}
                />
              </label>

              {/* AMOUNT */}
              <label>
                <span
                  style={{
                    display: "block",
                    marginBottom: 7,
                    fontSize: 12,
                    fontWeight: 800,
                    color: "#344054",
                  }}
                >
                  Amount
                </span>

                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={form.amount}
                  onChange={(event) =>
                    setForm({
                      ...form,
                      amount: event.target.value,
                    })
                  }
                  placeholder="10000"
                  style={{
                    width: "100%",
                    padding: "12px 13px",
                    border: "1px solid #dfe5ee",
                    borderRadius: 12,
                    outline: "none",
                  }}
                />
              </label>

              {/* DATE + TIME */}
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns:
                    "repeat(2,minmax(0,1fr))",
                  gap: 12,
                }}
              >
                <label>
                  <span
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 5,
                      marginBottom: 7,
                      fontSize: 12,
                      fontWeight: 800,
                      color: "#344054",
                    }}
                  >
                    <CalendarDays size={13} />
                    Date
                  </span>

                  <input
                    type="date"
                    value={form.date}
                    onChange={(event) =>
                      setForm({
                        ...form,
                        date: event.target.value,
                      })
                    }
                    style={{
                      width: "100%",
                      padding: "12px 13px",
                      border: "1px solid #dfe5ee",
                      borderRadius: 12,
                      outline: "none",
                    }}
                  />
                </label>

                <label>
                  <span
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 5,
                      marginBottom: 7,
                      fontSize: 12,
                      fontWeight: 800,
                      color: "#344054",
                    }}
                  >
                    <Clock3 size={13} />
                    Time
                  </span>

                  <input
                    type="time"
                    value={form.time}
                    onChange={(event) =>
                      setForm({
                        ...form,
                        time: event.target.value,
                      })
                    }
                    style={{
                      width: "100%",
                      padding: "12px 13px",
                      border: "1px solid #dfe5ee",
                      borderRadius: 12,
                      outline: "none",
                    }}
                  />
                </label>
              </div>

              {error && (
                <div
                  style={{
                    padding: "11px 13px",
                    borderRadius: 11,
                    background: "#fff1f2",
                    color: "#be123c",
                    fontSize: 12,
                    fontWeight: 700,
                  }}
                >
                  {error}
                </div>
              )}
            </div>

            <div
              style={{
                display: "flex",
                justifyContent: "flex-end",
                gap: 9,
                marginTop: 23,
              }}
            >
              <button
                type="button"
                onClick={closeModal}
                disabled={saving}
                className="btn btnGhost"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={saveExpense}
                disabled={saving}
                className="btn btnPrimary"
              >
                {saving
                  ? "Saving..."
                  : editingId
                  ? "Save changes"
                  : "Add expense"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
