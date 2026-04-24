/* global React, Icon, Button, Avatar, Bi */

function Topbar({ title, subtitle, zhTitle, zhSubtitle, lang, persona, onPersonaChange, onLangChange }) {
  const personas = [
    { id: "investor", en: "Investor", zh: "投资者", icon: "trending-up" },
    { id: "upgrader", en: "HDB Upgrader", zh: "组屋升级", icon: "home" },
    { id: "firsttime", en: "First-time Buyer", zh: "首套", icon: "sparkles" },
  ];
  return (
    <div style={{
      display: "flex", alignItems: "center", gap: 16,
      padding: "20px 28px", borderBottom: "1px solid var(--border-muted)",
      background: "var(--bg-default)", position: "sticky", top: 0, zIndex: 10,
    }}>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 22, fontWeight: 700, color: "var(--fg-default)", letterSpacing: "-0.6px", lineHeight: 1.15 }}>
          {title}
          {lang === "both" && zhTitle && (
            <span style={{ marginLeft: 12, fontSize: 15, fontWeight: 500, color: "var(--fg-muted)", letterSpacing: 0 }}>
              {zhTitle}
            </span>
          )}
        </div>
        {subtitle && (
          <div style={{ fontSize: 13, color: "var(--fg-muted)", marginTop: 3 }}>
            {subtitle}
            {lang === "both" && zhSubtitle && <span style={{ marginLeft: 8 }}>· {zhSubtitle}</span>}
          </div>
        )}
      </div>

      {/* Persona switcher — segmented */}
      <div style={{
        display: "inline-flex", padding: 3, borderRadius: 10, gap: 2,
        border: "1px solid var(--border-muted)", background: "var(--bg-muted)",
      }}>
        {personas.map(p => {
          const is = persona === p.id;
          return (
            <button key={p.id} onClick={() => onPersonaChange(p.id)} style={{
              display: "inline-flex", alignItems: "center", gap: 6,
              padding: "6px 11px", border: 0, borderRadius: 7,
              background: is ? "var(--bg-default)" : "transparent",
              boxShadow: is ? "var(--shadow-xs)" : "none",
              color: is ? "var(--fg-default)" : "var(--fg-muted)",
              fontSize: 12, fontWeight: 600, cursor: "pointer",
              fontFamily: "var(--font-sans)", letterSpacing: "-0.1px",
            }}>
              <Icon name={p.icon} size={13} />
              {p.en}
              {lang === "both" && <span style={{ fontSize: 10, opacity: 0.75 }}>· {p.zh}</span>}
            </button>
          );
        })}
      </div>

      <div style={{ position: "relative", width: 240 }}>
        <span style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "var(--fg-muted)" }}>
          <Icon name="search" size={15} />
        </span>
        <input placeholder="Search projects · 搜索项目…" style={{
          width: "100%", boxSizing: "border-box", padding: "9px 14px 9px 34px",
          border: "1px solid var(--border-muted-input)", borderRadius: 8,
          fontSize: 12, fontFamily: "var(--font-sans)", background: "var(--bg-muted)",
          color: "var(--fg-default)", outline: "none",
        }} />
      </div>

      <button onClick={() => onLangChange(lang === "en" ? "both" : "en")} style={{
        padding: "8px 10px", display: "inline-flex", alignItems: "center", gap: 6,
        background: "var(--bg-muted)", border: "1px solid var(--border-muted)",
        borderRadius: 8, cursor: "pointer", color: "var(--fg-default)",
        fontSize: 12, fontWeight: 600, fontFamily: "var(--font-sans)",
      }}>
        <Icon name="languages" size={14} />
        {lang === "en" ? "EN" : "EN · 中"}
      </button>

      <Avatar name="Zheng Wei" size={34} online />
    </div>
  );
}

window.Topbar = Topbar;
