"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Activity,
  CircleDollarSign,
  CreditCard,
  LayoutDashboard,
  Menu,
  Settings,
  Users,
  WalletCards,
  X,
} from "lucide-react";
import { useEffect, useState } from "react";
import { createClient } from "../lib/supabase";

const nav = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/income", label: "Income", icon: CircleDollarSign },
  { href: "/expenses", label: "Expenses", icon: CreditCard },
  { href: "/members", label: "Members", icon: Users },
  { href: "/settlements", label: "Settlements", icon: WalletCards },
  { href: "/activity", label: "Activity", icon: Activity },
  { href: "/profile", label: "Profile", icon: Settings },
];

type Profile = {
  name: string | null;
  avatar_url: string | null;
};

export default function AppShell({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();

  const [menuOpen, setMenuOpen] = useState(false);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    async function loadUser() {
      const supabase = createClient();

      if (!supabase) {
        if (mounted) setLoading(false);
        return;
      }

      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        router.replace("/login");
        return;
      }

      const { data } = await supabase
        .from("profiles")
        .select("name, avatar_url")
        .eq("id", user.id)
        .maybeSingle();

      if (mounted) {
        setProfile(
          data || {
            name: user.email?.split("@")[0] || "User",
            avatar_url: null,
          }
        );

        setLoading(false);
      }
    }

    loadUser();

    return () => {
      mounted = false;
    };
  }, [router]);

  useEffect(() => {
    setMenuOpen(false);
  }, [pathname]);

  async function handleSignOut() {
    const supabase = createClient();

    if (!supabase) return;

    await supabase.auth.signOut();
    router.replace("/login");
  }

  const displayName = profile?.name || "User";
  const initials = displayName
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();

  return (
    <div className="app-shell">
      {/* Desktop Sidebar */}
      <aside className="sidebar">
        <div className="brand">
          <div className="brand-mark">GF</div>

          <div>
            <div className="brand-title">Global Finance</div>
            <div className="brand-subtitle">
              Private finance workspace
            </div>
          </div>
        </div>

        <div className="nav-section">Workspace</div>

        {nav.map((item) => {
          const Icon = item.icon;
          const active =
            pathname === item.href ||
            (item.href !== "/dashboard" &&
              pathname.startsWith(`${item.href}/`));

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`nav-item ${active ? "active" : ""}`}
            >
              <Icon size={17} strokeWidth={2} />
              <span>{item.label}</span>
            </Link>
          );
        })}

        <div style={{ flex: 1 }} />

        <button
          type="button"
          className="nav-item"
          onClick={handleSignOut}
          style={{
            border: 0,
            background: "transparent",
            width: "100%",
            cursor: "pointer",
            textAlign: "left",
          }}
        >
          <span
            style={{
              width: 17,
              display: "inline-flex",
              justifyContent: "center",
            }}
          >
            ↪
          </span>
          <span>Sign out</span>
        </button>
      </aside>

      {/* Mobile Sidebar Overlay */}
      {menuOpen && (
        <div
          className="mobile-menu-overlay"
          onClick={() => setMenuOpen(false)}
        />
      )}

      {/* Mobile Sidebar */}
      <aside className={`mobile-sidebar ${menuOpen ? "open" : ""}`}>
        <div
          className="brand"
          style={{
            justifyContent: "space-between",
            paddingRight: 6,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div className="brand-mark">GF</div>

            <div>
              <div className="brand-title">Global Finance</div>
              <div className="brand-subtitle">
                Private finance workspace
              </div>
            </div>
          </div>

          <button
            type="button"
            className="mobile-close"
            onClick={() => setMenuOpen(false)}
            aria-label="Close menu"
          >
            <X size={20} />
          </button>
        </div>

        <div className="nav-section">Workspace</div>

        {nav.map((item) => {
          const Icon = item.icon;
          const active =
            pathname === item.href ||
            (item.href !== "/dashboard" &&
              pathname.startsWith(`${item.href}/`));

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`nav-item ${active ? "active" : ""}`}
            >
              <Icon size={18} strokeWidth={2} />
              <span>{item.label}</span>
            </Link>
          );
        })}

        <div style={{ flex: 1 }} />

        <button
          type="button"
          className="nav-item"
          onClick={handleSignOut}
          style={{
            border: 0,
            background: "transparent",
            width: "100%",
            cursor: "pointer",
            textAlign: "left",
          }}
        >
          <span
            style={{
              width: 18,
              display: "inline-flex",
              justifyContent: "center",
            }}
          >
            ↪
          </span>
          <span>Sign out</span>
        </button>
      </aside>

      <main className="main">
        {/* Top Bar */}
        <header className="topbar">
          <div className="topbar-left">
            <button
              type="button"
              className="mobile-menu"
              aria-label="Open menu"
              onClick={() => setMenuOpen(true)}
            >
              <Menu size={21} />
            </button>

            <div>
              <div
                style={{
                  fontSize: 12,
                  color: "#98a2b3",
                  fontWeight: 650,
                }}
              >
                Finance workspace
              </div>

              <div
                style={{
                  fontSize: 13,
                  fontWeight: 800,
                }}
              >
                October 2026
              </div>
            </div>
          </div>

          <Link href="/profile" className="user-pill">
            <div className="avatar">
              {loading ? (
                "..."
              ) : profile?.avatar_url ? (
                <img
                  src={profile.avatar_url}
                  alt={displayName}
                />
              ) : (
                initials || "U"
              )}
            </div>

            <span
              style={{
                fontSize: 12,
                fontWeight: 750,
              }}
            >
              {loading ? "Loading..." : displayName}
            </span>
          </Link>
        </header>

        {children}

        {/* Mobile Bottom Navigation */}
        <nav className="mobile-bottom">
          {nav.slice(0, 4).map((item) => {
            const Icon = item.icon;

            const active =
              pathname === item.href ||
              (item.href !== "/dashboard" &&
                pathname.startsWith(`${item.href}/`));

            return (
              <Link
                key={item.href}
                href={item.href}
                className={active ? "active" : ""}
              >
                <Icon size={17} strokeWidth={2} />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>
      </main>
    </div>
  );
}
