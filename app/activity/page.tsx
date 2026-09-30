"use client";

import { useEffect, useMemo, useState } from "react";
import { createClient } from "../../lib/supabase/client";

type AuditLog = {
  id: string;
  user_id: string | null;
  action: string | null;
  table_name: string | null;
  record_id: string | null;
  old_data: unknown;
  new_data: unknown;
  created_at: string;
};

type Profile = {
  id: string;
  name: string;
  email: string;
};

export default function ActivityPage() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    loadActivity();
  }, []);

  async function loadActivity() {
    setLoading(true);
    setError("");

    const supabase = createClient();

    if (!supabase) {
      setError(
        "Supabase is not configured. Please check the Supabase environment variables."
      );
      setLoading(false);
      return;
    }

    const [
      { data: auditData, error: auditError },
      { data: profileData, error: profileError },
    ] = await Promise.all([
      supabase
        .from("audit_logs")
        .select("*")
        .order("created_at", { ascending: false }),

      supabase
        .from("profiles")
        .select("id, name, email"),
    ]);

    if (auditError) {
      setError(auditError.message);
      setLoading(false);
      return;
    }

    if (profileError) {
      setError(profileError.message);
      setLoading(false);
      return;
    }

    setLogs((auditData || []) as AuditLog[]);
    setProfiles(profileData || []);
    setLoading(false);
  }

  const profileMap = useMemo(() => {
    const map: Record<string, Profile> = {};

    profiles.forEach((profile) => {
      map[profile.id] = profile;
    });

    return map;
  }, [profiles]);

  function getUserName(userId: string | null) {
    if (!userId) {
      return "System";
    }

    return profileMap[userId]?.name || "Unknown User";
  }

  function formatDate(date: string) {
    return new Date(date).toLocaleString("en-IN", {
      dateStyle: "medium",
      timeStyle: "short",
    });
  }

  function formatAction(action: string | null) {
    if (!action) {
      return "Activity";
    }

    return action
      .replace(/_/g, " ")
      .replace(/\b\w/g, (letter) => letter.toUpperCase());
  }

  function getActionClass(action: string | null) {
    const value = (action || "").toLowerCase();

    if (value.includes("delete")) {
      return "activity-delete";
    }

    if (value.includes("update")) {
      return "activity-update";
    }

    if (value.includes("insert")) {
      return "activity-add";
    }

    return "activity-neutral";
  }

  function formatData(data: unknown): string {
    if (data === null || data === undefined) {
      return "—";
    }

    try {
      if (typeof data === "string") {
        return data;
      }

      return JSON.stringify(data, null, 2);
    } catch {
      return "Unable to display data";
    }
  }

  return (
    <div className="app-page">
      <div className="page-header">
        <div>
          <p className="eyebrow">GLOBAL FINANCE</p>

          <h1>Activity</h1>

          <p className="page-description">
            Complete history of financial and profile changes.
          </p>
        </div>

        <button
          type="button"
          className="secondary-button"
          onClick={loadActivity}
          disabled={loading}
        >
          {loading ? "Refreshing..." : "Refresh"}
        </button>
      </div>

      {loading ? (
        <div className="empty-state">
          <h3>Loading activity...</h3>

          <p>
            Please wait while we load the audit history.
          </p>
        </div>
      ) : error ? (
        <div className="empty-state">
          <h3>Unable to load activity</h3>

          <p>{error}</p>

          <button
            type="button"
            className="primary-button"
            onClick={loadActivity}
          >
            Try Again
          </button>
        </div>
      ) : logs.length === 0 ? (
        <div className="empty-state">
          <h3>No activity yet</h3>

          <p>
            Changes made to income, expenses and profiles will
            appear here automatically.
          </p>
        </div>
      ) : (
        <div className="activity-list">
          {logs.map((log) => {
            const userName = getUserName(log.user_id);

            const hasOldData =
              log.old_data !== null &&
              log.old_data !== undefined;

            const hasNewData =
              log.new_data !== null &&
              log.new_data !== undefined;

            return (
              <div className="activity-card" key={log.id}>
                <div className="activity-card-top">
                  <div>
                    <div className="activity-title-row">
                      <span
                        className={`activity-badge ${getActionClass(
                          log.action
                        )}`}
                      >
                        {formatAction(log.action)}
                      </span>

                      {log.table_name && (
                        <span className="activity-table">
                          {log.table_name}
                        </span>
                      )}
                    </div>

                    <h3>{userName}</h3>

                    <p className="activity-time">
                      {formatDate(log.created_at)}
                    </p>
                  </div>
                </div>

                {log.record_id && (
                  <div className="activity-record">
                    <span>Record ID</span>

                    <strong>{log.record_id}</strong>
                  </div>
                )}

                {hasOldData && (
                  <div className="activity-data">
                    <div className="activity-data-heading">
                      <span>Previous Value</span>
                    </div>

                    <pre>{formatData(log.old_data)}</pre>
                  </div>
                )}

                {hasNewData && (
                  <div className="activity-data">
                    <div className="activity-data-heading">
                      <span>New Value</span>
                    </div>

                    <pre>{formatData(log.new_data)}</pre>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
