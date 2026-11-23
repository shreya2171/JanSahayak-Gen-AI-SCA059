import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { api } from "../api.js";
import { useAuth } from "../auth.jsx";
import { useCompare } from "../App.jsx";
import { Disclaimer, ErrorBox, Loading, StatusBadge } from "../components/Common.jsx";

export default function SchemeDetail({ t }) {
  const { id } = useParams();
  const { user } = useAuth();
  const { compareIds, toggleCompare } = useCompare();
  const [s, setS] = useState(null); const [err, setErr] = useState(""); const [msg, setMsg] = useState("");
  useEffect(() => { setS(null); api(`/schemes/${id}`).then(setS).catch((e) => setErr(e.message)); }, [id]);

  const report = async () => {
    const comment = window.prompt("What is incorrect or outdated on this page?");
    if (!comment) return;
    try { await api("/feedback", { method: "POST", body: { kind: "report", scheme_id: s.id, comment } }); setMsg("Thank you. The administrator will review your report."); }
    catch (e) { setErr(e.message); }
  };
  if (err && !s) return <div className="container page"><ErrorBox error={err} /><Link to="/schemes">← Back</Link></div>;
  if (!s) return <div className="container page"><Loading /></div>;
  const Section = ({ title, text }) => <div className="detail-section"><h3>{title}</h3><p>{text || "Not stated in the sources used."}</p></div>;
  return (
    <div className="container page">
      <Link to="/schemes">← {t("explore")}</Link>
      <div className="card" style={{ marginTop: 12 }}>
        <div className="row"><span className="badge">{s.category}</span><StatusBadge status={s.verification_status} /></div>
        <h1 style={{ marginTop: 8 }}>{s.name}</h1>
        <p>{s.description}</p>
        {s.verification_status !== "verified" && <div className="alert info"><b>Verification note:</b> {s.verification_notes || "This information has not been fully verified."}</div>}
        <Section title={t("benefits")} text={s.benefits} />
        <Section title={t("eligibility")} text={s.eligibility} />
        <Section title={t("documents")} text={s.documents} />
        <Section title={t("howToApply")} text={s.application_process} />
        <div className="detail-section"><h3>{t("officialSite")} / {t("sourceUrl")}</h3>
          <p><a href={s.official_website} target="_blank" rel="noreferrer">{s.official_website}</a><br />
            {t("sourceUrl")}: <a href={s.source_url} target="_blank" rel="noreferrer">{s.source_url}</a><br />
            {t("lastVerified")}: {s.last_verified}</p></div>
        <div className="row" style={{ marginTop: 18 }}>
          <button className={`btn ${compareIds.includes(s.id) ? "accent" : "outline"}`} onClick={() => toggleCompare(s.id)}>{compareIds.includes(s.id) ? "✓ In comparison" : `+ ${t("addCompare")}`}</button>
          {user && <button className="btn outline" onClick={report}>⚑ {t("report")}</button>}
          <Link className="btn" to="/chat">{t("chat")}</Link>
        </div>
        {msg && <div className="alert ok">{msg}</div>}<ErrorBox error={err} />
      </div>
      <Disclaimer t={t} />
    </div>
  );
}
