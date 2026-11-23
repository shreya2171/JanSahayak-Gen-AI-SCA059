import { useEffect, useState, useCallback } from "react";
import { api } from "../api.js";
import { ErrorBox, Loading, StatusBadge } from "../components/Common.jsx";

const EMPTY = { name: "", category: "Social Welfare", target_group: "", description: "", benefits: "", eligibility: "", documents: "",
  application_process: "", official_website: "", source_url: "", last_verified: new Date().toISOString().slice(0, 10),
  verification_status: "unverified", verification_notes: "", state: "All India", gender: "any" };
const CATS = ["Education and Scholarships", "Agriculture and Farmers", "Women Empowerment", "Healthcare", "Housing", "Employment", "Entrepreneurship", "Senior Citizens", "Social Welfare"];
const TEXT_FIELDS = [["description", "Description"], ["benefits", "Benefits"], ["eligibility", "Eligibility criteria"], ["documents", "Required documents"], ["application_process", "Application procedure"], ["verification_notes", "Verification notes (what was and was not confirmed)"]];

function Schemes() {
  const [list, setList] = useState(null); const [form, setForm] = useState(null); const [editId, setEditId] = useState(null);
  const [err, setErr] = useState(""); const [msg, setMsg] = useState("");
  const load = useCallback(() => api("/schemes").then(setList).catch((e) => setErr(e.message)), []);
  useEffect(() => { load(); }, [load]);
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });
  const save = async (e) => {
    e.preventDefault(); setErr(""); setMsg("");
    const body = Object.fromEntries(Object.entries(form).filter(([k]) => !["id", "created_at", "slug"].includes(k)).map(([k, v]) => [k, v === "" ? null : v]));
    ["min_age", "max_age"].forEach((k) => { if (body[k] != null) body[k] = Number(body[k]); });
    if (body.income_max_lakh != null) body.income_max_lakh = Number(body.income_max_lakh);
    try {
      if (editId) await api(`/admin/schemes/${editId}`, { method: "PUT", body }); else await api("/admin/schemes", { method: "POST", body });
      setMsg("Scheme saved and re-indexed for the chatbot."); setForm(null); setEditId(null); load();
    } catch (ex) { setErr(ex.message); }
  };
  const del = async (s) => { if (!window.confirm(`Delete "${s.name}"?`)) return; try { await api(`/admin/schemes/${s.id}`, { method: "DELETE" }); load(); } catch (ex) { setErr(ex.message); } };
  if (form) return (
    <form className="card" onSubmit={save}>
      <h3>{editId ? "Edit scheme" : "Add scheme"}</h3><ErrorBox error={err} />
      <label>Scheme name</label><input required minLength={3} value={form.name} onChange={set("name")} />
      <div className="grid cols-3">
        <div><label>Category</label><select value={form.category} onChange={set("category")}>{CATS.map((c) => <option key={c}>{c}</option>)}</select></div>
        <div><label>Target group (e.g. farmer, student)</label><input value={form.target_group || ""} onChange={set("target_group")} /></div>
        <div><label>Verification status</label><select value={form.verification_status} onChange={set("verification_status")}>
          {["verified", "partially_verified", "low_confidence", "unverified"].map((v) => <option key={v}>{v}</option>)}</select></div>
        <div><label>Min age</label><input type="number" min="0" max="120" value={form.min_age ?? ""} onChange={set("min_age")} /></div>
        <div><label>Max age</label><input type="number" min="0" max="120" value={form.max_age ?? ""} onChange={set("max_age")} /></div>
        <div><label>Income ceiling (₹ lakh)</label><input type="number" step="0.1" min="0" value={form.income_max_lakh ?? ""} onChange={set("income_max_lakh")} /></div>
      </div>
      {TEXT_FIELDS.map(([k, l]) => <div key={k}><label>{l}</label><textarea rows={3} value={form[k] || ""} onChange={set(k)} /></div>)}
      <div className="grid cols-3">
        <div><label>Official website (https://…)</label><input value={form.official_website || ""} onChange={set("official_website")} /></div>
        <div><label>Source URL (https://…)</label><input value={form.source_url || ""} onChange={set("source_url")} /></div>
        <div><label>Last verified (YYYY-MM-DD)</label><input value={form.last_verified || ""} onChange={set("last_verified")} /></div>
      </div>
      <div className="row" style={{ marginTop: 16 }}><button className="btn">Save</button><button type="button" className="btn outline" onClick={() => { setForm(null); setEditId(null); }}>Cancel</button></div>
    </form>);
  return (
    <div>
      <button className="btn accent" onClick={() => { setForm({ ...EMPTY }); setEditId(null); setMsg(""); }}>+ Add scheme</button>
      {msg && <div className="alert ok">{msg}</div>}<ErrorBox error={err} />
      {!list ? <Loading /> : (
        <div className="card table-wrap" style={{ marginTop: 14 }}>
          <table className="simple"><thead><tr><th>Name</th><th>Category</th><th>Status</th><th>Last verified</th><th></th></tr></thead>
            <tbody>{list.map((s) => (<tr key={s.id}><td>{s.name}</td><td>{s.category}</td><td><StatusBadge status={s.verification_status} /></td><td>{s.last_verified}</td>
              <td className="row"><button className="btn small outline" onClick={() => { setForm({ ...s }); setEditId(s.id); setMsg(""); }}>Edit</button><button className="btn small danger" onClick={() => del(s)}>Delete</button></td></tr>))}</tbody></table>
        </div>)}
    </div>);
}

function Documents() {
  const [docs, setDocs] = useState(null); const [err, setErr] = useState(""); const [msg, setMsg] = useState(""); const [busy, setBusy] = useState(false);
  const [url, setUrl] = useState("");
  const load = useCallback(() => api("/admin/documents").then(setDocs).catch((e) => setErr(e.message)), []);
  useEffect(() => { load(); }, [load]);
  const upload = async (e) => {
    e.preventDefault(); setErr(""); setMsg("");
    const file = e.target.elements.file.files[0]; if (!file) return;
    const form = new FormData(); form.append("file", file); form.append("source_url", url);
    setBusy(true);
    try { const r = await api("/admin/documents", { method: "POST", form }); setMsg(`Indexed ${r.filename}: ${r.pages} pages, ${r.chunks} chunks${r.flagged_chunks ? `, ${r.flagged_chunks} instruction-like phrase(s) neutralised` : ""}.`); e.target.reset(); load(); }
    catch (ex) { setErr(ex.message); } finally { setBusy(false); }
  };
  const del = async (d) => { if (!window.confirm(`Delete ${d.filename} and its vectors?`)) return; try { await api(`/admin/documents/${d.id}`, { method: "DELETE" }); load(); } catch (ex) { setErr(ex.message); } };
  const reindex = async () => { try { const r = await api("/admin/reindex", { method: "POST" }); setMsg(`Re-indexed ${r.scheme_chunks_indexed} scheme chunks.`); } catch (ex) { setErr(ex.message); } };
  return (
    <div>
      <form className="card" onSubmit={upload}>
        <h3>Upload official scheme document (PDF)</h3>
        <p className="muted small">Only text-based PDFs up to 10 MB. Text is extracted, checked for instruction-like text, split into chunks, embedded and stored in the vector database.</p>
        <label htmlFor="file">PDF file</label><input id="file" name="file" type="file" accept="application/pdf,.pdf" required />
        <label htmlFor="src">Official source URL of this document (recommended)</label><input id="src" value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://…" />
        <div className="row" style={{ marginTop: 14 }}><button className="btn" disabled={busy}>{busy ? "Processing…" : "Upload and index"}</button>
          <button type="button" className="btn outline" onClick={reindex}>Re-index scheme records</button></div>
      </form>
      {msg && <div className="alert ok">{msg}</div>}<ErrorBox error={err} />
      {!docs ? <Loading /> : (
        <div className="card table-wrap" style={{ marginTop: 14 }}>
          <table className="simple"><thead><tr><th>File</th><th>Pages</th><th>Chunks</th><th>Flagged</th><th>Uploaded</th><th></th></tr></thead>
            <tbody>{docs.length === 0 && <tr><td colSpan="6" className="muted">No documents uploaded yet.</td></tr>}
              {docs.map((d) => (<tr key={d.id}><td>{d.filename}</td><td>{d.pages}</td><td>{d.chunks}</td><td>{d.flagged_chunks}</td><td>{d.uploaded_at?.slice(0, 10)}</td><td><button className="btn small danger" onClick={() => del(d)}>Delete</button></td></tr>))}</tbody></table>
        </div>)}
    </div>);
}

function Feedback() {
  const [items, setItems] = useState(null); const [err, setErr] = useState("");
  const load = useCallback(() => api("/feedback").then(setItems).catch((e) => setErr(e.message)), []);
  useEffect(() => { load(); }, [load]);
  const setStatus = async (id, status) => { try { await api(`/feedback/${id}`, { method: "PATCH", body: { status } }); load(); } catch (ex) { setErr(ex.message); } };
  if (!items) return <Loading />;
  return (
    <div className="card table-wrap"><ErrorBox error={err} />
      <table className="simple"><thead><tr><th>Type</th><th>Rating</th><th>Comment</th><th>Scheme</th><th>User</th><th>Status</th></tr></thead>
        <tbody>{items.length === 0 && <tr><td colSpan="6" className="muted">No feedback yet.</td></tr>}
          {items.map((f) => (<tr key={f.id}><td>{f.kind}</td><td>{f.rating ?? "–"}</td><td>{f.comment || "–"}</td><td>{f.scheme_name || "–"}</td><td>{f.user_email}</td>
            <td><select value={f.status} onChange={(e) => setStatus(f.id, e.target.value)}><option>open</option><option>reviewed</option><option>resolved</option></select></td></tr>))}</tbody></table>
    </div>);
}

export default function Admin() {
  const [tab, setTab] = useState("schemes");
  return (
    <div className="container page">
      <h1 className="page-title">Administrator dashboard</h1>
      <div className="tabs">{[["schemes", "Schemes"], ["documents", "Documents (RAG)"], ["feedback", "Feedback"]].map(([k, l]) => <button key={k} className={`chip ${tab === k ? "active" : ""}`} onClick={() => setTab(k)}>{l}</button>)}</div>
      {tab === "schemes" && <Schemes />}{tab === "documents" && <Documents />}{tab === "feedback" && <Feedback />}
    </div>
  );
}
