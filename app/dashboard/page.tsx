"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import AppShell from "../../components/app-shell";
import Dashboard from "../../components/dashboard";
import { createClient } from "../../lib/supabase/client";

export default function DashboardPage() {
  const router = useRouter();

  const [checking, setChecking] = useState(true);
  const [allowed, setAllowed] = useState(false);

  useEffect(() => {
    let mounted = true;

    async function checkAuthentication() {
      const supabase = createClient();

      if (!supabase) {
        router.replace("/login");
        return;
      }

      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!mounted) return;

      if (!session) {
        router.replace("/login");
        return;
      }

      setAllowed(true);
      setChecking(false);
    }

    checkAuthentication();

    return () => {
      mounted = false;
    };
  }, [router]);

  if (checking || !allowed) {
    return (
      <main
        style={{
          minHeight: "100vh",
          display: "grid",
          placeItems: "center",
          background: "#f7f9fc",
        }}
      >
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 14,
          }}
        >
          <div
            style={{
              width: 44,
              height: 44,
              display: "grid",
              placeItems: "center",
              borderRadius: 13,
              background:
                "linear-gradient(145deg,#173b7a,#315fb3)",
              color: "#fff",
              fontSize: 13,
              fontWeight: 900,
              boxShadow:
                "0 10px 25px rgba(23,59,122,.17)",
            }}
          >
            GF
          </div>

          <div
            style={{
              color: "#667085",
              fontSize: 11,
              fontWeight: 650,
            }}
          >
            Loading your finance workspace...
          </div>
        </div>
      </main>
    );
  }

  return (
    <AppShell>
      <Dashboard />
    </AppShell>
  );
}
