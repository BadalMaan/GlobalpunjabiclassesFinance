"use client";

import { useEffect, useState } from "react";
import AppShell from "../../components/app-shell";
import { createClient } from "../../lib/supabase/client";

type Member = {
  id: string;
  name: string;
  email: string;
  share_percentage: number;
};

export default function MembersPage() {
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    loadMembers();
  }, []);

  async function loadMembers() {
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

    const { data, error: fetchError } = await supabase
      .from("profiles")
      .select("id, name, email, share_percentage")
      .order("name", { ascending: true });

    if (fetchError) {
      setError(fetchError.message);
      setLoading(false);
      return;
    }

    setMembers((data || []) as Member[]);
    setLoading(false);
  }

  function getInitials(name: string) {
    return name
      .split(" ")
      .filter(Boolean)
      .map((part) => part[0])
      .join("")
      .slice(0, 2)
      .toUpperCase();
  }

  return (
    <AppShell>
      <div className="app-page">
        <div className="page-header">
          <div>
            <p className="eyebrow">GLOBAL FINANCE</p>

            <h1>Members</h1>

            <p className="page-description">
              Three secure profiles with fixed ownership shares.
            </p>
          </div>

          <button
            type="button"
            className="secondary-button"
            onClick={loadMembers}
            disabled={loading}
          >
            {loading ? "Loading..." : "Refresh"}
          </button>
        </div>

        {loading ? (
          <div className="empty-state">
            <h3>Loading members...</h3>

            <p>
              Please wait while we load the member profiles.
            </p>
          </div>
        ) : error ? (
          <div className="empty-state">
            <h3>Unable to load members</h3>

            <p>{error}</p>

            <button
              type="button"
              className="primary-button"
              onClick={loadMembers}
            >
              Try Again
            </button>
          </div>
        ) : members.length === 0 ? (
          <div className="empty-state">
            <h3>No members found</h3>

            <p>
              No member profiles are currently available.
            </p>
          </div>
        ) : (
          <div className="members-grid">
            {members.map((member) => (
              <div className="member-card" key={member.id}>
                <div className="member-card-top">
                  <div className="member-avatar">
                    {getInitials(member.name)}
                  </div>

                  <div className="member-info">
                    <h3>{member.name}</h3>

                    <p>{member.email}</p>
                  </div>

                  <div className="member-share">
                    <strong>
                      {Number(member.share_percentage || 0)}%
                    </strong>

                    <span>Ownership</span>
                  </div>
                </div>

                <div className="member-divider" />

                <div className="member-details">
                  <div>
                    <span>Ownership Share</span>

                    <strong>
                      {Number(member.share_percentage || 0)}%
                    </strong>
                  </div>

                  <div>
                    <span>Account</span>

                    <strong>Active</strong>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </AppShell>
  );
}
