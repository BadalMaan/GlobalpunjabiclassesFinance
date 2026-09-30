"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Activity,
  BarChart3,
  CircleDollarSign,
  CreditCard,
  LayoutDashboard,
  Menu,
  Settings,
  Users,
  WalletCards,
} from "lucide-react";
import { demoMembers } from "../lib/demo-data";

const nav = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/income", label: "Income", icon: CircleDollarSign },
  { href: "/expenses", label: "Expenses", icon: CreditCard },
  { href: "/members", label: "Members", icon: Users },
  { href: "/settlements", label: "Settlements", icon: WalletCards },
  { href: "/activity", label: "Activity", icon: Activity },
  { href: "/profile", label: "Profile", icon: Settings },
];

export default function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const user = demoMembers[2];

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand">
          <div className="brand-mark">GF</div>
          <div>
            <div className="brand-title">Global Finance</div>
            <div className="brand-subtitle">Private finance workspace</div>
          </div>
        </div>

        <div className="nav-section">Workspace</div>
        {nav.map((item) => {
          const Icon = item.icon;
          const active = pathname === item.href;
          return (
            <Link key={item.href} href={item.href} className={`nav-item ${active ? "active" : ""}`}>
              <Icon size={17} strokeWidth={2} />
              {item.label}
            </Link>
          );
        })}
      </aside>

      <main className="main">
        <header className="topbar">
          <div className="topbar-left">
            <button className="mobile-menu" aria-label="Open menu">
              <Menu size={21} />
            </button>
            <div>
              <div style={{ fontSize: 12, color: "#98a2b3", fontWeight: 650 }}>Finance workspace</div>
              <div style={{ fontSize: 13, fontWeight: 800 }}>October 2026</div>
            </div>
          </div>

          <Link href="/profile" className="user-pill">
            <div className="avatar">
              {user.avatar_url ? <img src={user.avatar_url} alt={user.name} /> : "RS"}
            </div>
            <span style={{ fontSize: 12, fontWeight: 750 }}>{user.name}</span>
          </Link>
        </header>

        {children}

        <nav className="mobile-bottom">
          {nav.slice(0, 4).map((item) => {
            const Icon = item.icon;
            const active = pathname === item.href;
            return (
              <Link key={item.href} href={item.href} className={active ? "active" : ""}>
                <Icon size={17} />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>
      </main>
    </div>
  );
}