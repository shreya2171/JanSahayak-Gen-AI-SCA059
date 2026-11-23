import { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../auth.jsx";
import { ErrorBox } from "../components/Common.jsx";

export function Login({ t }) {
  const { login } = useAuth();
  const nav = useNavigate();
  const loc = useLocation();
  const [f, setF] = useState({ email: "", password: "" });
  const [err, setErr] = useState(""); const [busy, setBusy] = useState(false);
  const submit = async (e) => {
    e.preventDefault(); setErr(""); setBusy(true);
    try { const u = await login(f.email, f.password); nav(loc.state?.from || (u.role === "admin" ? "/admin" : "/dashboard")); }
    catch (ex) { setErr(ex.message); } finally { setBusy(false); }
  };
  return (
    <div className="container"><form className="card auth-wrap" onSubmit={submit}>
      <h2>{t("login")}</h2>
      <ErrorBox error={err} />
      <label htmlFor="email">{t("email")}</label>
      <input id="email" type="email" required value={f.email} onChange={(e) => setF({ ...f, email: e.target.value })} autoComplete="email" />
      <label htmlFor="pw">{t("password")}</label>
      <input id="pw" type="password" required value={f.password} onChange={(e) => setF({ ...f, password: e.target.value })} autoComplete="current-password" />
      <div className="row" style={{ marginTop: 18 }}>
        <button className="btn" disabled={busy}>{busy ? "Signing in…" : t("login")}</button>
        <span className="muted small">New here? <Link to="/register">{t("register")}</Link></span>
      </div>
    </form></div>
  );
}

export function Register({ t }) {
  const { register, language } = useAuth();
  const nav = useNavigate();
  const [f, setF] = useState({ name: "", email: "", password: "" });
  const [err, setErr] = useState(""); const [busy, setBusy] = useState(false);
  const submit = async (e) => {
    e.preventDefault(); setErr(""); setBusy(true);
    try { await register(f.name, f.email, f.password, language); nav("/profile"); }
    catch (ex) { setErr(ex.message); } finally { setBusy(false); }
  };
  return (
    <div className="container"><form className="card auth-wrap" onSubmit={submit}>
      <h2>{t("register")}</h2>
      <ErrorBox error={err} />
      <label htmlFor="name">{t("name")}</label>
      <input id="name" required minLength={2} maxLength={80} value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} />
      <label htmlFor="email">{t("email")}</label>
      <input id="email" type="email" required value={f.email} onChange={(e) => setF({ ...f, email: e.target.value })} autoComplete="email" />
      <label htmlFor="pw">{t("password")}</label>
      <input id="pw" type="password" required minLength={8} value={f.password} onChange={(e) => setF({ ...f, password: e.target.value })} autoComplete="new-password" />
      <p className="muted small">At least 8 characters, with a letter and a digit. Your profile details are optional and are used only for suggestions.</p>
      <div className="row" style={{ marginTop: 10 }}>
        <button className="btn accent" disabled={busy}>{busy ? "Creating…" : t("register")}</button>
        <span className="muted small">Already registered? <Link to="/login">{t("login")}</Link></span>
      </div>
    </form></div>
  );
}
