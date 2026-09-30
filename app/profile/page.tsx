import SimplePage from "../../components/simple-page";
import { demoMembers } from "../../lib/demo-data";

export default function ProfilePage() {
  const user = demoMembers[2];
  return (
    <SimplePage title="My Profile" subtitle="Your personal account information and security settings.">
      <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 22 }}>
        <div className="avatar" style={{ width: 68, height: 68, fontSize: 18 }}>RS</div>
        <div><div style={{fontSize:18,fontWeight:850}}>{user.name}</div><div style={{fontSize:12,color:"#98a2b3"}}>{user.email}</div></div>
      </div>
      <div style={{ display:"grid", gap: 12, maxWidth: 620 }}>
        <label style={{fontSize:12,fontWeight:750}}>Full name<input defaultValue={user.name} style={inputStyle}/></label>
        <label style={{fontSize:12,fontWeight:750}}>Email<input defaultValue={user.email} style={inputStyle}/></label>
        <label style={{fontSize:12,fontWeight:750}}>Mobile number<input defaultValue={user.mobile} placeholder="+91 ..." style={inputStyle}/></label>
        <button className="action-btn" style={{width:"fit-content"}}>Save profile</button>
      </div>
    </SimplePage>
  );
}
const inputStyle = { marginTop:6, width:"100%", border:"1px solid #e1e5eb", borderRadius:10, padding:"11px 12px", outline:"none", background:"#fff" };