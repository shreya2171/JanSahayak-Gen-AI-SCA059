import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../api.js";
import { Disclaimer, ErrorBox, Loading, SchemeCard } from "../components/Common.jsx";

export default function Recommendations({ t }) {
  const [d, setD] = useState(null); const [err, setErr] = useState("");
  useEffect(() => { api("/schemes/recommendations").then(setD).catch((e) => setErr(e.message)); }, []);
  if (err) return <div className="container page"><ErrorBox error={err} /></div>;
  if (!d) return <div className="container page"><Loading /></div>;
  return (
    <div className="container page">
      <h1 className="page-title">{t("recommend")}</h1>
      <div className="alert info">{d.disclaimer}</div>
      {!d.profile_complete && <div className="alert info">Your profile is empty. <Link to="/profile">Add a few optional details</Link> to get suggestions.</div>}
      {d.profile_complete && d.results.length === 0 && <div className="alert info">No scheme in the current dataset matches your details. You can still <Link to="/schemes">browse all schemes</Link>.</div>}
      <div className="grid cols-2">
        {d.results.map((s) => (
          <div key={s.id}>
            <SchemeCard s={s} t={t} />
            <div className="alert ok" style={{ marginTop: -4 }}><b>Why this may be relevant:</b> {s.reason.replace("This scheme may be relevant because ", "")}</div>
          </div>))}
      </div>
      <Disclaimer t={t} />
    </div>
  );
}
