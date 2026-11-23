import { createContext, useContext, useEffect, useState, useCallback } from "react";
import { api, getToken, setToken } from "./api";

const AuthCtx = createContext(null);
export const useAuth = () => useContext(AuthCtx);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState({});
  const [language, setLanguageState] = useState(localStorage.getItem("jansahayak_lang") || "en");
  const [loading, setLoading] = useState(!!getToken());

  const setLanguage = (l) => { setLanguageState(l); localStorage.setItem("jansahayak_lang", l); };

  const refresh = useCallback(async () => {
    try {
      const d = await api("/auth/me");
      setUser(d.user); setProfile(d.profile);
      if (d.user.language) setLanguage(d.user.language);
    } catch { setToken(null); setUser(null); }
    setLoading(false);
  }, []);

  useEffect(() => { if (getToken()) refresh(); }, [refresh]);

  const login = async (email, password) => {
    const d = await api("/auth/login", { method: "POST", body: { email, password } });
    setToken(d.token); await refresh(); return d.user;
  };
  const register = async (name, email, password, lang) => {
    const d = await api("/auth/register", { method: "POST", body: { name, email, password, language: lang } });
    setToken(d.token); await refresh(); return d.user;
  };
  const logout = () => { setToken(null); setUser(null); setProfile({}); };

  return (
    <AuthCtx.Provider value={{ user, profile, loading, language, setLanguage, login, register, logout, refresh }}>
      {children}
    </AuthCtx.Provider>
  );
}
