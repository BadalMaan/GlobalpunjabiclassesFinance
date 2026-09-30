import AppShell from "./app-shell";

export default function SimplePage({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle: string;
  children?: React.ReactNode;
}) {
  return (
    <AppShell>
      <div className="content">
        <div className="page-title">{title}</div>
        <div className="page-subtitle">{subtitle}</div>
        <div className="card section-card" style={{ marginTop: 22 }}>
          {children || <div className="empty">This section is ready for the next build step.</div>}
        </div>
      </div>
    </AppShell>
  );
}