/* global React, ReactDOM, Sidebar, Topbar, Dashboard, ProjectsList, ProjectDetail, Calculator, GenericScreen */
const { useState, useEffect } = React;

// Tweakable defaults (persona + lang default) — persisted by host
const TWEAK_DEFAULTS = /*EDITMODE-BEGIN*/{
  "persona": "investor",
  "lang": "both"
}/*EDITMODE-END*/;

function App() {
  const [route, setRoute] = useState(() => localStorage.getItem("nlf-route") || "dashboard");
  const [projectId, setProjectId] = useState(() => localStorage.getItem("nlf-project") || null);
  const [persona, setPersona] = useState(TWEAK_DEFAULTS.persona);
  const [lang, setLang] = useState(TWEAK_DEFAULTS.lang);
  const [tweakOpen, setTweakOpen] = useState(false);

  // Edit-mode wiring
  useEffect(() => {
    const onMsg = (e) => {
      const d = e.data || {};
      if (d.type === "__activate_edit_mode") setTweakOpen(true);
      if (d.type === "__deactivate_edit_mode") setTweakOpen(false);
    };
    window.addEventListener("message", onMsg);
    window.parent.postMessage({ type: "__edit_mode_available" }, "*");
    return () => window.removeEventListener("message", onMsg);
  }, []);

  useEffect(() => { localStorage.setItem("nlf-route", route); }, [route]);
  useEffect(() => { if (projectId) localStorage.setItem("nlf-project", projectId); }, [projectId]);
  useEffect(() => { if (window.lucide) window.lucide.createIcons(); });

  const openProject = (id) => { setProjectId(id); setRoute("project"); };
  const setPersonaPersist = (p) => {
    setPersona(p);
    window.parent.postMessage({ type: "__edit_mode_set_keys", edits: { persona: p } }, "*");
  };
  const setLangPersist = (l) => {
    setLang(l);
    window.parent.postMessage({ type: "__edit_mode_set_keys", edits: { lang: l } }, "*");
  };

  const titles = {
    dashboard: { en: "Dashboard", zh: "总览", sub: "Your daily briefing of Singapore new-launch forecasts.", zhSub: "新加坡新盘预测每日简报" },
    launched: { en: "Launched Projects", zh: "已开盘", sub: "Live launches · TOP forecasts & attribution.", zhSub: "已开售项目 · TOP预测" },
    upcoming: { en: "Upcoming Launches", zh: "待开盘", sub: "Preview-stage projects · fair PSF & entry score.", zhSub: "预览阶段 · 合理尺价" },
    calculator: { en: "PPS Calculator", zh: "付款计算器", sub: "Model cashflow from booking to CSC.", zhSub: "期房阶段性付款模拟" },
    watchlist: { en: "Watchlist", zh: "关注列表", sub: "Tracked projects", zhSub: "" },
    developers: { en: "Developer Track Record", zh: "开发商战绩", sub: "Historical performance & quality signals.", zhSub: "" },
    masterplan: { en: "URA Master Plan", zh: "发展蓝图", sub: "Long-term regional catalysts.", zhSub: "" },
    settings: { en: "Settings", zh: "设置", sub: "Account, preferences, data sources.", zhSub: "" },
    project: { en: "Project Detail", zh: "项目详情", sub: "", zhSub: "" },
  };
  const t = titles[route] || titles.dashboard;

  let screen;
  switch (route) {
    case "dashboard": screen = <Dashboard lang={lang} persona={persona} onNav={setRoute} onOpenProject={openProject} />; break;
    case "launched": screen = <ProjectsList lang={lang} mode="launched" onOpenProject={openProject} />; break;
    case "upcoming": screen = <ProjectsList lang={lang} mode="upcoming" onOpenProject={openProject} />; break;
    case "calculator": screen = <Calculator lang={lang} />; break;
    case "project": screen = <ProjectDetail projectId={projectId} lang={lang} persona={persona} onBack={() => setRoute("launched")} />; break;
    case "watchlist": screen = <GenericScreen title="Watchlist" zhTitle="关注列表" lang={lang} description="Drag any project from Launched or Upcoming into your watchlist to track its forecast drift and caveat activity here." />; break;
    case "developers": screen = <GenericScreen title="Developer Track Record" zhTitle="开发商战绩" lang={lang} description="Aggregated quality scores, historical TOP-uplift, and defect rates across all tracked developers." />; break;
    case "masterplan": screen = <GenericScreen title="URA Master Plan 2025/2030" zhTitle="发展蓝图" lang={lang} description="Cross-Island Line, Jurong Lake District, Greater Southern Waterfront — regional catalysts scored and mapped to launches." />; break;
    case "settings": screen = <GenericScreen title="Settings" zhTitle="设置" lang={lang} description="Account, workspace, data sources, and notification preferences." />; break;
    default: screen = <Dashboard lang={lang} persona={persona} onNav={setRoute} onOpenProject={openProject} />;
  }

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: "var(--bg-muted)" }}>
      <Sidebar active={route === "project" ? "launched" : route} onNav={setRoute} lang={lang} />
      <main style={{ flex: 1, minWidth: 0 }}>
        <Topbar
          title={t.en} zhTitle={t.zh}
          subtitle={t.sub} zhSubtitle={t.zhSub}
          lang={lang} persona={persona}
          onPersonaChange={setPersonaPersist}
          onLangChange={setLangPersist}
        />
        {screen}
      </main>

      {tweakOpen && (
        <TweaksPanel
          persona={persona} onPersonaChange={setPersonaPersist}
          lang={lang} onLangChange={setLangPersist}
          onClose={() => setTweakOpen(false)}
        />
      )}
    </div>
  );
}

function TweaksPanel({ persona, onPersonaChange, lang, onLangChange, onClose }) {
  const personas = [
    { id: "investor", label: "Investor · 投资者" },
    { id: "upgrader", label: "HDB Upgrader · 组屋升级" },
    { id: "firsttime", label: "First-time Buyer · 首套" },
  ];
  return (
    <div style={{
      position: "fixed", right: 20, bottom: 20, width: 280,
      background: "var(--bg-default)", border: "1px solid var(--border-default)",
      borderRadius: 14, boxShadow: "var(--shadow-lg)", padding: 16, zIndex: 100,
      fontFamily: "var(--font-sans)",
    }}>
      <div style={{ display: "flex", alignItems: "center", marginBottom: 12 }}>
        <div style={{ flex: 1, fontSize: 13, fontWeight: 700, letterSpacing: "-0.2px" }}>Tweaks</div>
        <button onClick={onClose} style={{ border: 0, background: "transparent", cursor: "pointer", color: "var(--fg-muted)" }}>
          <i data-lucide="x" style={{ width: 16, height: 16 }} />
        </button>
      </div>
      <div style={{ fontSize: 11, fontWeight: 600, color: "var(--fg-muted)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 6 }}>Persona · 视角</div>
      <div style={{ display: "flex", flexDirection: "column", gap: 6, marginBottom: 14 }}>
        {personas.map(p => (
          <button key={p.id} onClick={() => onPersonaChange(p.id)} style={{
            padding: "8px 10px", border: "1px solid var(--border-muted)", borderRadius: 8,
            background: persona === p.id ? "var(--gray-100)" : "var(--bg-default)",
            color: persona === p.id ? "#fff" : "var(--fg-default)",
            fontSize: 12, fontWeight: 600, textAlign: "left", cursor: "pointer",
          }}>{p.label}</button>
        ))}
      </div>
      <div style={{ fontSize: 11, fontWeight: 600, color: "var(--fg-muted)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 6 }}>Language · 语言</div>
      <div style={{ display: "flex", gap: 6 }}>
        {[{id:"en",l:"English"},{id:"both",l:"EN · 中"}].map(o => (
          <button key={o.id} onClick={() => onLangChange(o.id)} style={{
            flex: 1, padding: "8px", border: "1px solid var(--border-muted)", borderRadius: 8,
            background: lang === o.id ? "var(--gray-100)" : "var(--bg-default)",
            color: lang === o.id ? "#fff" : "var(--fg-default)",
            fontSize: 12, fontWeight: 600, cursor: "pointer",
          }}>{o.l}</button>
        ))}
      </div>
    </div>
  );
}

ReactDOM.createRoot(document.getElementById("root")).render(<App />);
