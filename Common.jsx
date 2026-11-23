import { Link } from "react-router-dom";
import { useCompare } from "../App.jsx";

export const Disclaimer = ({ t }) => <div className="disclaimer" role="note">⚠ {t("disclaimer")}</div>;
export const Loading = ({ text = "Loading…" }) => <p className="muted"><span className="spinner" /> {text}</p>;
export const ErrorBox = ({ error }) => (error ? <div className="alert error" role="alert">{error}</div> : null);

export function StatusBadge({ status }) {
  const map = {
    verified: ["ok", "Verified"], partially_verified: ["partial", "Partially verified"],
    low_confidence: ["low", "Low confidence"], unverified: ["low", "Unverified"],
  };
  const [cls, label] = map[status] || ["low", "Unverified"];
  return <span className={`badge ${cls}`}>{label}</span>;
}

export function SchemeCard({ s, t }) {
  const { compareIds, toggleCompare } = useCompare();
  const selected = compareIds.includes(s.id);
  return (
    <article className="card scheme-card">
      <div className="row"><span className="badge">{s.category}</span><StatusBadge status={s.verification_status} /></div>
      <h3>{s.name}</h3>
      <p>{s.description}</p>
      <div className="actions">
        <Link className="btn small" to={`/schemes/${s.id}`}>{t("viewDetails")}</Link>
        <button className={`btn small ${selected ? "accent" : "outline"}`} onClick={() => toggleCompare(s.id)}>
          {selected ? "✓ " : "+ "}{t("addCompare")}
        </button>
      </div>
    </article>
  );
}

export function CompareBar({ t }) {
  const { compareIds, clear } = useCompare();
  if (!compareIds.length) return null;
  return (
    <div className="compare-bar">
      <b>{compareIds.length}/4 selected for comparison</b>
      <Link className={`btn small ${compareIds.length < 2 ? "outline" : "accent"}`} to="/compare">{t("compare")} →</Link>
      <button className="btn small outline" onClick={clear}>Clear</button>
    </div>
  );
}
