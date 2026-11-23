import { useState, useMemo, createContext, useContext } from "react";
import { Routes, Route, Navigate, NavLink, Link, useLocation } from "react-router-dom";
import { useAuth } from "./auth.jsx";
import { LANGS, makeT } from "./i18n.js";
import Landing from "./pages/Landing.jsx";
import { Login, Register } from "./pages/AuthPages.jsx";
import Dashboard from "./pages/Dashboard.jsx";
import Chat from "./pages/Chat.jsx";
import Explorer from "./pages/Explorer.jsx";
import SchemeDetail from "./pages/SchemeDetail.jsx";
import Recommendations from "./pages/Recommendations.jsx";
import Compare from "./pages/Compare.jsx";
import Profile from "./pages/Profile.jsx";
import Admin from "./pages/Admin.jsx";

// Compare list lives here so it survives page changes
const CompareCtx = createContext(null);
export const useCompare = () => useContext(CompareCtx);

function Protected({ children, admin }) {
  const { user, loading } = useAuth();
  const loc = useLocation();
  if (loading) return <div className="container page"><span className="spinner" /> Loading…</div>;
  if (!user) return <Navigate to="/login" state={{ from: loc.pathname }} replace />;
  if (admin && user.role !== "admin") return <Navigate to="/dashboard" replace />;
  return children;
}

function Header({ t }) {
  const { user, logout, language, setLanguage } = useAuth();
  const [open, setOpen] = useState(false);
  const cls = ({ isActive }) => (isActive ? "active" : "");
  return (
    <>
      <div className="tricolor" />
      <header className="header">
        <div className="container">
          <Link to="/" className="brand">
            <svg viewBox="0 0 64 64"><circle cx="32" cy="32" r="22" fill="none" stroke="#fff" strokeWidth="4" /><path d="M32 14v36M14 32h36" stroke="#e8871e" strokeWidth="4" /></svg>
            {t("appName")}
          </Link>
          <button className="menu-btn" onClick={() => setOpen(!open)} aria-label="Menu">☰</button>
          <nav className={`nav ${open ? "open" : ""}`} onClick={() => setOpen(false)}>
            <NavLink to="/" end className={cls}>{t("home")}</NavLink>
            {user && <NavLink to="/dashboard" className={cls}>{t("dashboard")}</NavLink>}
            {user && <NavLink to="/chat" className={cls}>{t("chat")}</NavLink>}
            <NavLink to="/schemes" className={cls}>{t("explore")}</NavLink>
            {user && <NavLink to="/recommendations" className={cls}>{t("recommend")}</NavLink>}
            <NavLink to="/compare" className={cls}>{t("compare")}</NavLink>
            {user && <NavLink to="/profile" className={cls}>{t("profile")}</NavLink>}
            {user?.role === "admin" && <NavLink to="/admin" className={cls}>{t("admin")}</NavLink>}
          </nav>
          <div className={`header-right ${open ? "open" : ""}`}>
            <select className="lang" value={language} onChange={(e) => setLanguage(e.target.value)} aria-label="Language">
              {Object.entries(LANGS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
            </select>
            {user ? (
              <button className="btn ghost small" onClick={logout}>{t("logout")} ({user.name.split(" ")[0]})</button>
            ) : (
              <>
                <Link to="/login" className="btn ghost small">{t("login")}</Link>
                <Link to="/register" className="btn accent small">{t("register")}</Link>
              </>
            )}
          </div>
        </div>
      </header>
    </>
  );
}

export default function App() {
  const { language } = useAuth();
  const t = useMemo(() => makeT(language), [language]);
  const [compareIds, setCompareIds] = useState([]);
  const toggleCompare = (id) => setCompareIds((c) => (c.includes(id) ? c.filter((x) => x !== id) : c.length < 4 ? [...c, id] : c));

  return (
    <CompareCtx.Provider value={{ compareIds, toggleCompare, clear: () => setCompareIds([]) }}>
      <Header t={t} />
      <main>
        <Routes>
          <Route path="/" element={<Landing t={t} />} />
          <Route path="/login" element={<Login t={t} />} />
          <Route path="/register" element={<Register t={t} />} />
          <Route path="/dashboard" element={<Protected><Dashboard t={t} /></Protected>} />
          <Route path="/chat" element={<Protected><Chat t={t} /></Protected>} />
          <Route path="/schemes" element={<Explorer t={t} />} />
          <Route path="/schemes/:id" element={<SchemeDetail t={t} />} />
          <Route path="/recommendations" element={<Protected><Recommendations t={t} /></Protected>} />
          <Route path="/compare" element={<Compare t={t} />} />
          <Route path="/profile" element={<Protected><Profile t={t} /></Protected>} />
          <Route path="/admin" element={<Protected admin><Admin t={t} /></Protected>} />
          <Route path="*" element={<div className="container page"><h1>Page not found</h1><Link to="/">Go home</Link></div>} />
        </Routes>
      </main>
      <footer className="footer">
        <div className="container">{t("disclaimer")}<br />Data sources: official Government of India websites. Always verify on the official site.</div>
      </footer>
    </CompareCtx.Provider>
  );
}
