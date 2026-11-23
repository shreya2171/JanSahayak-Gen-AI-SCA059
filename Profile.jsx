import { useState } from "react";
import { api } from "../api.js";
import { useAuth } from "../auth.jsx";
import { LANGS } from "../i18n.js";
import { Disclaimer, ErrorBox } from "../components/Common.jsx";

const OPT = {
  age_group: [["", "Prefer not to say"], ["under_18", "Under 18"], ["18_25", "18 – 25"], ["26_40", "26 – 40"], ["41_59", "41 – 59"], ["60_plus", "60 and above"]],
  category: [["", "Prefer not to say"], ["student", "Student"], ["farmer", "Farmer"], ["employee", "Employee"], ["business_owner", "Business owner"], ["senior_citizen", "Senior citizen"], ["unemployed", "Unemployed / job seeker"], ["homemaker", "Homemaker"]],
  income_range: [["", "Prefer not to say"], ["below_1", "Below ₹1 lakh"], ["1_3", "₹1 – 3 lakh"], ["3_6", "₹3 – 6 lakh"], ["6_9", "₹6 – 9 lakh"], ["9_12", "₹9 – 12 lakh"], ["above_12", "Above ₹12 lakh"]],
  gender: [["", "Prefer not to say"], ["female", "Female"], ["male", "Male"], ["other", "Other"]],
};
const STATES = ["Andhra Pradesh", "Assam", "Bihar", "Delhi", "Gujarat", "Haryana", "Karnataka", "Kerala", "Madhya Pradesh", "Maharashtra", "Odisha", "Punjab", "Rajasthan", "Tamil Nadu", "Telangana", "Uttar Pradesh", "West Bengal", "Other"];

export default function Profile({ t }) {
  const { user, profile, refresh, setLanguage } = useAuth();
  const [f, setF] = useState({ name: user.name, language: user.language, ...Object.fromEntries(Object.keys({ age_group: 1, state: 1, occupation: 1, category: 1, income_range: 1, gender: 1 }).map((k) => [k, profile[k] || ""])) });
  const [msg, setMsg] = useState(""); const [err, setErr] = useState(""); const [busy, setBusy] = useState(false);
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });
  const save = async (e) => {
    e.preventDefault(); setMsg(""); setErr(""); setBusy(true);
    try {
      const body = Object.fromEntries(Object.entries(f).map(([k, v]) => [k, v === "" ? null : v]));
      await api("/auth/me", { method: "PUT", body }); setLanguage(f.language); await refresh(); setMsg("Profile saved.");
    } catch (ex) { setErr(ex.message); } finally { setBusy(false); }
  };
  const Sel = ({ k, label }) => (<><label htmlFor={k}>{label}</label><select id={k} value={f[k]} onChange={set(k)}>{OPT[k].map(([v, l]) => <option key={v} value={v}>{l}</option>)}</select></>);
  return (
    <div className="container page">
      <h1 className="page-title">{t("profile")}</h1>
      <form className="card" style={{ maxWidth: 640 }} onSubmit={save}>
        <p className="muted small">Account email: {user.email}. All details below except your name are optional and are used only to suggest schemes that may be relevant. They are not shared.</p>
        <label htmlFor="n">{t("name")}</label><input id="n" value={f.name} onChange={set("name")} minLength={2} maxLength={80} required />
        <label htmlFor="l">Preferred language</label>
        <select id="l" value={f.language} onChange={set("language")}>{Object.entries(LANGS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}</select>
        <Sel k="age_group" label="Age group" /><Sel k="gender" label="Gender" /><Sel k="category" label="I am a…" />
        <label htmlFor="state">State</label>
        <select id="state" value={f.state} onChange={set("state")}><option value="">Prefer not to say</option>{STATES.map((s) => <option key={s}>{s}</option>)}</select>
        <label htmlFor="occ">Occupation (optional)</label><input id="occ" value={f.occupation} onChange={set("occupation")} maxLength={60} placeholder="e.g. farmer, daily-wage worker" />
        <Sel k="income_range" label="Annual household income" />
        <ErrorBox error={err} />{msg && <div className="alert ok">{msg}</div>}
        <button className="btn" style={{ marginTop: 16 }} disabled={busy}>{busy ? "Saving…" : t("save")}</button>
      </form>
      <Disclaimer t={t} />
    </div>
  );
}
