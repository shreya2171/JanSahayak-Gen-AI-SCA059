import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { api } from "../api.js";
import { CompareBar, ErrorBox, Loading, SchemeCard, Disclaimer } from "../components/Common.jsx";

export default function Explorer({ t }) {
  const [params, setParams] = useSearchParams();
  const category = params.get("category") || "";
  const [q, setQ] = useState(params.get("q") || "");
  const [cats, setCats] = useState([]);
  const [items, setItems] = useState(null);
  const [err, setErr] = useState("");

  useEffect(() => { api("/schemes/categories").then(setCats).catch((e) => setErr(e.message)); }, []);
  useEffect(() => {
    setItems(null);
    const id = setTimeout(() => {
      api(`/schemes?q=${encodeURIComponent(q)}&category=${encodeURIComponent(category)}`).then(setItems).catch((e) => setErr(e.message));
    }, 250);                                   // small delay: do not query on every keystroke
    return () => clearTimeout(id);
  }, [q, category]);

  const pick = (c) => { const p = new URLSearchParams(params); c ? p.set("category", c) : p.delete("category"); setParams(p); };
  return (
    <div className="container page">
      <h1 className="page-title">{t("explore")}</h1>
      <input type="search" placeholder={t("search")} value={q} onChange={(e) => setQ(e.target.value)} aria-label={t("search")} />
      <div className="chips">
        <button className={`chip ${!category ? "active" : ""}`} onClick={() => pick("")}>{t("allCategories")}</button>
        {cats.map((c) => <button key={c.name} className={`chip ${category === c.name ? "active" : ""}`} onClick={() => pick(c.name)}>{c.name} ({c.count})</button>)}
      </div>
      <ErrorBox error={err} />
      {!items ? <Loading /> : items.length === 0
        ? <div className="alert info">No schemes found. Categories without schemes will fill up as the administrator adds more verified schemes.</div>
        : <div className="grid cols-3">{items.map((s) => <SchemeCard key={s.id} s={s} t={t} />)}</div>}
      <Disclaimer t={t} />
      <div style={{ height: 60 }} /><CompareBar t={t} />
    </div>
  );
}
