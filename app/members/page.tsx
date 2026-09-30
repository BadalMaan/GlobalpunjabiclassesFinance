import SimplePage from "../../components/simple-page";
import { demoMembers } from "../../lib/demo-data";

export default function MembersPage() {
  return (
    <SimplePage title="Members" subtitle="Three secure profiles with fixed ownership shares.">
      <div style={{ display: "grid", gap: 12 }}>
        {demoMembers.map(m => (
          <div key={m.id} className="card" style={{ padding: 16, display: "flex", justifyContent: "space-between", gap: 12, alignItems: "center" }}>
            <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
              <div className="avatar">{m.name.split(" ").map(x => x[0]).join("").slice(0,2)}</div>
              <div><div style={{ fontWeight: 800, fontSize: 13 }}>{m.name}</div><div style={{ color: "#98a2b3", fontSize: 11 }}>{m.email}</div></div>
            </div>
            <div style={{ fontWeight: 850, color: "#173b7a" }}>{m.share_percentage}%</div>
          </div>
        ))}
      </div>
    </SimplePage>
  );
}