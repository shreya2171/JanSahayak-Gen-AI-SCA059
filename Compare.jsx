import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../api.js";
import { useCompare } from "../App.jsx";
import { Disclaimer, ErrorBox, Loading, StatusBadge } from "../components/Common.jsx";

const ROWS = [["target_group", "Target beneficiaries"], ["eligibility", "Eligibility"], ["benefits", "Benefits"],
  ["documents", "Documents required"], ["application_process", "Application procedure"], ["last_verified", "Last verified"]];

export default function Compare({ t }) {
  const { compareIds, toggleCompare, clear } = useCompare();
  const [data, setData] = useState(null); const [err, setErr] = useState("");
  const [all, setAll] = useState([]);
  useEffect(() => { api("/schemes").then(setAll).catch(() => {}); }, []);
  useEffect(() => {
    setErr("");
    if (compareIds.length < 2) { setData(null); return; }
    api(`/schemes/compare?ids=${compareIds.join(",")}`).then(setData).catch((e) => setErr(e.message));
  }, [compareIds]);
  const order = data ? compareIds.map((id) => data.find((s) => s.id === id)).filter(Boolean) : [];
  return (
    <div className="container page">
      <h1 className="page-title">{t("compare")}</h1>
      <p className="muted">Select 2 to 4 schemes to compare side by side.</p>
      <div className="chips">
        {all.map((s) => <button key={s.id} className={`chip ${compareIds.includes(s.id) ? "active" : ""}`} onClick={() => toggleCompare(s.id)}>{s.name.length > 48 ? s.name.slice(0, 46) + "…" : s.name}</button>)}
      </div>
      {compareIds.length > 0 && <button className="btn outline small" onClick={clear}>Clear selection</button>}
      <ErrorBox error={err} />
      {compareIds.length < 2 && <div className="alert info">Choose at least two schemes above.</div>}
      {compareIds.length >= 2 && !data && !err && <Loading />}
      {data && (
        <div className="table-wrap" style={{ marginTop: 16 }}>
          <table className="compare">
            <thead><tr><th></th>{order.map((s) => <th key={s.id} style={{ width: "auto" }}><Link to={`/schemes/${s.id}`}>{s.name}</Link><div><StatusBadge status={s.verification_status} /></div></th>)}</tr></thead>
            <tbody>{ROWS.map(([k, label]) => (
              <tr key={k}><th>{label}</th>{order.map((s) => <td key={s.id}>{k === "target_group" ? (s[k] || "Not stated").replace(/_/g, " ") : (s[k] || "Not stated")}</td>)}</tr>))}</tbody>
          </table>
        </div>)}
      <Disclaimer t={t} />
    </div>
  );
}
