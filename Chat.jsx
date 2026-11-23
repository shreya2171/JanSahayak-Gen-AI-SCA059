import { useEffect, useRef, useState } from "react";
import { api } from "../api.js";
import { useAuth } from "../auth.jsx";
import { Disclaimer, ErrorBox } from "../components/Common.jsx";
import { LANGS } from "../i18n.js";

const EXAMPLES = ["Which government schemes are available for farmers?", "What documents are required for PM-KISAN?",
  "Explain Ayushman Bharat in simple language", "Who can open a Sukanya Samriddhi account?"];

export default function Chat({ t }) {
  const { language, setLanguage } = useAuth();
  const [msgs, setMsgs] = useState([]);
  const [q, setQ] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const [status, setStatus] = useState(null);
  const [fb, setFb] = useState({});            // message_id -> feedback state
  const end = useRef(null);

  useEffect(() => {
    api("/chat/history").then((h) => setMsgs(h.map((m) => ({ id: m.id, role: m.role === "user" ? "user" : "bot", text: m.content, sources: m.sources, answered: !!m.answered })))).catch(() => {});
    api("/chat/status").then(setStatus).catch(() => {});
  }, []);
  useEffect(() => { end.current?.scrollIntoView({ behavior: "smooth" }); }, [msgs, busy]);

  const send = async (text) => {
    const question = (text ?? q).trim();
    if (question.length < 2 || busy) return;
    setErr(""); setQ(""); setBusy(true);
    setMsgs((m) => [...m, { role: "user", text: question }]);
    try {
      const r = await api("/chat", { method: "POST", body: { question, language } });
      setMsgs((m) => [...m, { id: r.message_id, role: "bot", text: r.answer, sources: r.sources, answered: r.answered, note: r.disclaimer }]);
    } catch (e) { setErr(e.message); } finally { setBusy(false); }
  };

  const rate = async (id) => {
    try { await api("/feedback", { method: "POST", body: { kind: "rating", rating: 5, message_id: id } }); setFb((f) => ({ ...f, [id]: "rated" })); }
    catch (e) { setErr(e.message); }
  };
  const report = async (id) => {
    const comment = window.prompt("What is incorrect or outdated in this answer?");
    if (!comment) return;
    try { await api("/feedback", { method: "POST", body: { kind: "report", comment, message_id: id } }); setFb((f) => ({ ...f, [id]: "reported" })); }
    catch (e) { setErr(e.message); }
  };
  const clear = async () => { if (window.confirm("Delete your chat history?")) { await api("/chat/history", { method: "DELETE" }); setMsgs([]); } };

  return (
    <div className="container page">
      <div className="row" style={{ justifyContent: "space-between", marginBottom: 10 }}>
        <h1 style={{ margin: 0 }}>{t("chat")}</h1>
        <div className="row">
          <label style={{ margin: 0 }} htmlFor="rl">{t("language")}:</label>
          <select id="rl" style={{ width: "auto" }} value={language} onChange={(e) => setLanguage(e.target.value)}>
            {Object.entries(LANGS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </select>
          <button className="btn outline small" onClick={clear}>{t("clearChat")}</button>
        </div>
      </div>
      {status && !status.llm_available && (
        <div className="alert info">The local language model (Ollama, model “{status.model}”) is not reachable. You will see the most relevant source passages but no written answer until Ollama is running.</div>
      )}
      {language === "kn" && <div className="alert info">Kannada answers depend on the local model, which may not fully support Kannada. Please verify important details.</div>}
      <div className="chat">
        <div className="messages" aria-live="polite">
          {msgs.length === 0 && (
            <div className="muted">
              <p>Ask a question about a government scheme. Try:</p>
              <div className="suggest">{EXAMPLES.map((e) => <button key={e} className="chip" onClick={() => send(e)}>{e}</button>)}</div>
            </div>
          )}
          {msgs.map((m, i) => (
            <div key={i} className={`msg ${m.role} ${m.role === "bot" && !m.answered ? "warn" : ""}`}>
              {m.text}
              {m.role === "bot" && m.sources?.length > 0 && (
                <div className="sources"><b>{t("sources")}:</b>
                  {m.sources.map((s, j) => (
                    <div className="source" key={j}>
                      <b>{s.name}</b>{s.page ? ` — page ${s.page}` : " — scheme record"}
                      {s.url && <> · <a href={s.url} target="_blank" rel="noreferrer">{t("sourceUrl")}</a></>}
                    </div>))}
                </div>)}
              {m.role === "bot" && m.id && (
                <div className="row small" style={{ marginTop: 8 }}>
                  {fb[m.id] ? <span className="muted">Thank you for your feedback ({fb[m.id]}).</span> : (<>
                    <button className="btn outline small" onClick={() => rate(m.id)}>👍 {t("helpful")}</button>
                    <button className="btn outline small" onClick={() => report(m.id)}>⚑ {t("report")}</button></>)}
                </div>)}
            </div>
          ))}
          {busy && <div className="msg bot"><span className="spinner" /> {t("thinking")}</div>}
          <div ref={end} />
        </div>
        <ErrorBox error={err} />
        <form className="chat-input" onSubmit={(e) => { e.preventDefault(); send(); }}>
          <textarea value={q} maxLength={1000} placeholder={t("askPlaceholder")} onChange={(e) => setQ(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); } }} aria-label="Your question" />
          <button className="btn accent" disabled={busy || q.trim().length < 2}>{t("send")}</button>
        </form>
      </div>
      <Disclaimer t={t} />
    </div>
  );
}
