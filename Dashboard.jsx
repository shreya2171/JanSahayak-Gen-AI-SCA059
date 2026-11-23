import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../api.js";
import { useAuth } from "../auth.jsx";
import { Disclaimer, ErrorBox, Loading } from "../components/Common.jsx";

export default function Dashboard({ t }) {
  const { user } = useAuth();
  const [d, setD] = useState(null); const [err, setErr] = useState("");
  useEffect(() => { api("/dashboard").then(setD).catch((e) => setErr(e.message)); }, []);
  if (err) return <div className="container page"><ErrorBox error={err} /></div>;
  if (!d) return <div className="container page"><Loading /></div>;
  const list = (items, empty) => items.length
    ? <ul style={{ paddingLeft: 18, margin: 0 }}>{items.map((s) => <li key={s.id}><Link to={`/schemes/${s.id}`}>{s.name}</Link><div className="muted small">{s.reason || s.category}</div></li>)}</ul>
    : <p className="muted small">{empty}</p>;
  return (
    <div className="container page">
      <h1 className="page-title">{t("dashboard")} — {user.name}</h1>
      <div className="stats">
        <div className="stat"><b>{d.total_schemes}</b>Total schemes available</div>
        <div className="stat"><b>{d.categories.filter((c) => c.count > 0).length}</b>Categories with schemes</div>
        <div className="stat"><b>{d.recommended.length}</b>Suggested for you</div>
      </div>
      <div className="grid cols-2">
        <section className="card"><h3>Scheme categories</h3>
          <div className="chips">{d.categories.map((c) => <Link key={c.name} to={`/schemes?category=${encodeURIComponent(c.name)}`} className="chip">{c.name} ({c.count})</Link>)}</div>
        </section>
        <section className="card"><h3>Recommended for you</h3>{list(d.recommended, "Add details in your profile to get suggestions.")}
          <p className="small" style={{ marginTop: 10 }}><Link to="/recommendations">See all suggestions →</Link></p></section>
        <section className="card"><h3>Recently added</h3>{list(d.recently_added, "No schemes yet.")}</section>
        <section className="card"><h3>Recently viewed</h3>{list(d.recently_viewed, "Schemes you open will appear here.")}</section>
      </div>
      <div className="row" style={{ marginTop: 20 }}><Link className="btn accent" to="/chat">{t("chat")}</Link><Link className="btn outline" to="/schemes">{t("explore")}</Link></div>
      <Disclaimer t={t} />
    </div>
  );
}
