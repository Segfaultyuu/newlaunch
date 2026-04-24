/* global React, Icon, Avatar, Bi */
const { useState: useStateSB } = React;

const NAV_ITEMS = [
  { id: "dashboard", en: "Dashboard", zh: "总览", icon: "layout-dashboard" },
  { id: "launched", en: "Launched Projects", zh: "已开盘", icon: "building-2", count: 42 },
  { id: "upcoming", en: "Upcoming Launches", zh: "待开盘", icon: "calendar-clock", count: 18 },
  { id: "watchlist", en: "Watchlist", zh: "关注", icon: "star" },
  { id: "developers", en: "Developer Track Record", zh: "开发商战绩", icon: "hard-hat" },
  { id: "calculator", en: "PPS Calculator", zh: "付款计算器", icon: "calculator" },
  { id: "masterplan", en: "URA Master Plan", zh: "发展蓝图", icon: "map" },
];
const BOTTOM = [
  { id: "settings", en: "Settings", zh: "设置", icon: "settings" },
];

function Sidebar({ active, onNav, lang }) {
  return (
    <aside style={{
      width: 256, flexShrink: 0, background: "var(--bg-default)",
      borderRight: "1px solid var(--border-muted)",
      display: "flex", flexDirection: "column",
      padding: "18px 12px", gap: 2, height: "100vh", position: "sticky", top: 0,
    }}>
      {/* Logo */}
      <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "4px 8px 14px" }}>
        <div style={{
          width: 30, height: 30, borderRadius: 8, background: "var(--gray-100)",
          display: "flex", alignItems: "center", justifyContent: "center",
        }}>
          <div style={{
            width: 18, height: 18,
            background: "linear-gradient(135deg, #70FC8E 0%, #3765F6 100%)",
            clipPath: "polygon(50% 0, 100% 50%, 50% 100%, 0 50%)",
          }} />
        </div>
        <div style={{ lineHeight: 1.1 }}>
          <div style={{ fontWeight: 700, fontSize: 15, letterSpacing: "-0.4px", color: "var(--fg-default)" }}>
            NewLaunch
          </div>
          <div style={{ fontSize: 11, color: "var(--fg-muted)", fontWeight: 500 }}>Forecaster · 新盘预言家</div>
        </div>
        <span style={{
          marginLeft: "auto", fontSize: 9, fontWeight: 700, padding: "2px 5px",
          background: "#70FC8E", color: "#07200C", borderRadius: 3, letterSpacing: "0.03em",
        }}>MVP</span>
      </div>

      {/* Market pulse mini card */}
      <div style={{
        display: "flex", flexDirection: "column", gap: 6, padding: "10px 10px",
        borderRadius: 10, border: "1px solid var(--border-muted)", marginBottom: 10,
        background: "var(--gray-10)",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <span style={{ width: 6, height: 6, borderRadius: 9999, background: "#4AC263" }} />
          <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--fg-muted)" }}>
            SG Market · 市场
          </span>
        </div>
        <div style={{ fontSize: 13, fontWeight: 600, color: "var(--fg-default)", lineHeight: 1.2 }}>
          OCR Index <span style={{ color: "#2B873F", fontFamily: "var(--font-mono)" }}>+4.2%</span>
        </div>
        <div style={{ fontSize: 10, color: "var(--fg-muted)" }}>
          URA Caveats · updated 2m ago
        </div>
      </div>

      <div style={{ fontSize: 10, fontWeight: 700, color: "var(--fg-muted)", letterSpacing: "0.1em", padding: "8px 10px 4px", textTransform: "uppercase" }}>
        Analysis
      </div>
      {NAV_ITEMS.map(n => (
        <NavItem key={n.id} {...n} active={active === n.id} onClick={() => onNav(n.id)} lang={lang} />
      ))}

      <div style={{ marginTop: "auto" }}>
        {BOTTOM.map(n => (
          <NavItem key={n.id} {...n} active={active === n.id} onClick={() => onNav(n.id)} lang={lang} />
        ))}
      </div>
    </aside>
  );
}

function NavItem({ en, zh, icon, count, active, onClick, lang }) {
  return (
    <button onClick={onClick} style={{
      display: "flex", alignItems: "center", gap: 10,
      padding: "9px 10px", borderRadius: 8, border: 0,
      background: active ? "var(--gray-100)" : "transparent",
      color: active ? "var(--white)" : "var(--fg-default)",
      fontFamily: "var(--font-sans)", fontSize: 13, fontWeight: active ? 600 : 500,
      cursor: "pointer", width: "100%", textAlign: "left", letterSpacing: "-0.1px",
    }}>
      <Icon name={icon} size={16} color={active ? "#fff" : "var(--fg-muted)"} />
      <span style={{ flex: 1, display: "flex", flexDirection: "column", lineHeight: 1.1 }}>
        <span>{en}</span>
        {lang === "both" && <span style={{ fontSize: 10, color: active ? "rgba(255,255,255,0.6)" : "var(--fg-muted)", fontWeight: 400 }}>{zh}</span>}
      </span>
      {count != null && (
        <span style={{
          background: active ? "rgba(255,255,255,0.15)" : "var(--gray-20)",
          color: active ? "#fff" : "var(--fg-default)",
          fontSize: 10, fontWeight: 600, padding: "1px 6px", borderRadius: 9999,
          fontFamily: "var(--font-mono)",
        }}>{count}</span>
      )}
    </button>
  );
}

window.Sidebar = Sidebar;
