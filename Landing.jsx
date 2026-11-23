import { Link } from "react-router-dom";
import { useAuth } from "../auth.jsx";
import { Disclaimer } from "../components/Common.jsx";

export default function Landing({ t }) {
  const { user } = useAuth();
  return (
    <>
      <section className="hero">
        <div className="container">
          <h1>{t("tagline")}</h1>
          <p>Ask questions about welfare schemes for farmers, students, women, senior citizens and more. Answers are written from official government sources, and every answer shows where it came from.</p>
          <div className="row" style={{ marginTop: 20 }}>
            <Link className="btn accent" to={user ? "/chat" : "/register"}>{user ? t("chat") : "Get started"}</Link>
            <Link className="btn ghost" to="/schemes">{t("explore")}</Link>
          </div>
        </div>
      </section>
      <div className="container">
        <div className="features">
          <div className="feature"><h3>💬 Ask in your language</h3><p className="muted small">English, Hindi and Kannada. Kannada quality depends on the local model and may be weaker.</p></div>
          <div className="feature"><h3>📄 Answers with sources</h3><p className="muted small">Each answer lists the document or scheme record it was built from.</p></div>
          <div className="feature"><h3>🎯 Suggestions for you</h3><p className="muted small">Optional profile details help suggest schemes that may be relevant.</p></div>
          <div className="feature"><h3>⚖ Compare schemes</h3><p className="muted small">Put schemes side by side: benefits, eligibility, documents, procedure.</p></div>
        </div>
        <div className="page">
          <h2>How it works</h2>
          <ol className="steps">
            <li><b>You ask</b><br /><span className="muted small">Type a question in plain language.</span></li>
            <li><b>We search</b><br /><span className="muted small">The system finds the most relevant passages in official scheme documents.</span></li>
            <li><b>AI explains</b><br /><span className="muted small">A language model writes a simple answer using only those passages.</span></li>
            <li><b>You verify</b><br /><span className="muted small">Check the shown source and the official website before applying.</span></li>
          </ol>
          <Disclaimer t={t} />
        </div>
      </div>
    </>
  );
}
