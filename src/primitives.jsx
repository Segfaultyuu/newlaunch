/* global React */
const { useState, useMemo, useEffect, useRef } = React;

// ---------- Icon (Lucide) ----------
const Icon = ({ name, size = 18, color = "currentColor", strokeWidth = 1.75, style = {} }) => (
  <i data-lucide={name} style={{ width: size, height: size, color, strokeWidth, display: "inline-flex", ...style }} />
);

// ---------- Button ----------
const Button = ({ intent = "primary", size = "md", icon, iconRight, children, onClick, style = {}, ...rest }) => {
  const bg = { primary: "var(--gray-100)", outlined: "var(--bg-default)", ghost: "transparent", brand: "var(--primary-40)", danger: "var(--error-50)" }[intent];
  const fg = { primary: "#fff", outlined: "var(--fg-default)", ghost: "var(--fg-default)", brand: "var(--primary-100)", danger: "#fff" }[intent];
  const border = intent === "outlined" ? "1px solid var(--border-default)" : "1px solid transparent";
  const pad = size === "sm" ? "7px 12px" : size === "lg" ? "13px 20px" : "10px 16px";
  const fs = size === "sm" ? 13 : size === "lg" ? 15 : 14;
  return (
    <button onClick={onClick} className="rx-btn" style={{
      display: "inline-flex", alignItems: "center", gap: 8,
      background: bg, color: fg, border, padding: pad, fontSize: fs, fontWeight: 600,
      borderRadius: 8, cursor: "pointer", letterSpacing: "-0.2px",
      fontFamily: "var(--font-sans)", transition: "background .15s ease, transform .05s",
      ...style,
    }} {...rest}>
      {icon && <Icon name={icon} size={fs + 2} />}
      {children}
      {iconRight && <Icon name={iconRight} size={fs + 2} />}
    </button>
  );
};

// ---------- Tag ----------
const Tag = ({ tone = "neutral", children, dot = true, style = {} }) => {
  const tones = {
    success: ["#E9FBEF", "#2B873F"],
    warning: ["#FFF1E5", "#C85D00"],
    info: ["#E5F1FF", "#005DCA"],
    danger: ["#FFEDED", "#C32B2B"],
    neutral: ["var(--gray-20)", "var(--gray-70)"],
    brand: ["#EAFFEE", "#2B873F"],
    dark: ["var(--gray-100)", "#fff"],
  };
  const [bg, fg] = tones[tone] || tones.neutral;
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: 6, padding: "3px 10px",
      background: bg, color: fg, borderRadius: 9999, fontSize: 12, fontWeight: 600,
      letterSpacing: "-0.1px", whiteSpace: "nowrap", ...style,
    }}>
      {dot && <span style={{ width: 6, height: 6, borderRadius: 9999, background: fg }} />}
      {children}
    </span>
  );
};

// ---------- Card ----------
const Card = ({ children, style = {}, pad = 20, radius = 16, onClick }) => (
  <div onClick={onClick} style={{
    background: "var(--bg-default)",
    border: "1px solid var(--border-muted-card)",
    borderRadius: radius,
    padding: pad,
    boxShadow: "var(--shadow-xs)",
    cursor: onClick ? "pointer" : "default",
    transition: "border-color .15s ease, box-shadow .15s ease",
    ...style,
  }}>{children}</div>
);

// ---------- Bilingual label (EN primary, ZH secondary) ----------
const Bi = ({ en, zh, lang = "both", style = {} }) => {
  if (lang === "en" || !zh) return <span style={style}>{en}</span>;
  return (
    <span style={{ display: "inline-flex", flexDirection: "column", lineHeight: 1.15, ...style }}>
      <span>{en}</span>
      <span style={{ fontSize: "0.72em", color: "var(--fg-muted)", fontWeight: 400, letterSpacing: 0 }}>{zh}</span>
    </span>
  );
};

// ---------- Avatar ----------
const AV_COLORS = ["#3765F6", "#2B873F", "#F07000", "#929FB1", "#0A0D11"];
const Avatar = ({ name = "??", size = 36, online }) => {
  const initials = name.split(" ").map(n => n[0]).slice(0, 2).join("").toUpperCase();
  const hash = [...name].reduce((a, c) => a + c.charCodeAt(0), 0);
  const bg = AV_COLORS[hash % AV_COLORS.length];
  return (
    <div style={{
      width: size, height: size, borderRadius: 9999, background: bg, color: "#fff",
      display: "inline-flex", alignItems: "center", justifyContent: "center",
      fontWeight: 600, fontSize: size * 0.4, position: "relative", flexShrink: 0,
    }}>
      {initials}
      {online && <span style={{
        position: "absolute", right: 0, bottom: 0, width: size * 0.28, height: size * 0.28,
        background: "#4AC263", border: "2px solid var(--bg-default)", borderRadius: 9999,
      }} />}
    </div>
  );
};

// ---------- Sparkline ----------
const Sparkline = ({ data = [], color = "#2B873F", fill = "rgba(112,252,142,0.22)", height = 44, width = 200 }) => {
  if (!data.length) return null;
  const min = Math.min(...data), max = Math.max(...data);
  const range = max - min || 1;
  const step = width / (data.length - 1);
  const pts = data.map((v, i) => `${i * step},${height - ((v - min) / range) * (height - 4) - 2}`);
  const path = `M${pts.join(" L")}`;
  const area = `${path} L${width},${height} L0,${height} Z`;
  return (
    <svg width="100%" viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none" style={{ display: "block", width: "100%", height }}>
      <path d={area} fill={fill} />
      <path d={path} fill="none" stroke={color} strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />
    </svg>
  );
};

// ---------- Placeholder image / "stub" tiles ----------
const Stub = ({ w = "100%", h = 120, label, tone = "neutral", style = {} }) => {
  const bg = tone === "dark" ? "var(--gray-100)" : "var(--gray-20)";
  const fg = tone === "dark" ? "var(--gray-50)" : "var(--gray-60)";
  return (
    <div style={{
      width: w, height: h, background: bg, borderRadius: 10,
      display: "flex", alignItems: "center", justifyContent: "center",
      color: fg, fontSize: 11, fontWeight: 600, letterSpacing: "0.08em",
      textTransform: "uppercase", fontFamily: "var(--font-mono)",
      backgroundImage: tone === "dark" ? "none" : "repeating-linear-gradient(135deg, rgba(0,0,0,0) 0 8px, rgba(0,0,0,0.025) 8px 16px)",
      ...style,
    }}>{label || "placeholder"}</div>
  );
};

// ---------- Slider ----------
const Slider = ({ value, onChange, min = 0, max = 100, step = 1, format = v => v, style = {} }) => (
  <div style={{ display: "flex", alignItems: "center", gap: 12, ...style }}>
    <input type="range" min={min} max={max} step={step} value={value}
      onChange={e => onChange(Number(e.target.value))}
      style={{ flex: 1, accentColor: "var(--primary-60)" }} />
    <span style={{
      minWidth: 72, textAlign: "right", fontFamily: "var(--font-mono)",
      fontSize: 13, fontWeight: 600, color: "var(--fg-default)",
    }}>{format(value)}</span>
  </div>
);

// ---------- Input ----------
const Input = ({ icon, style, ...rest }) => (
  <div style={{ position: "relative", ...style }}>
    {icon && <span style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "var(--fg-muted)" }}>
      <Icon name={icon} size={16} /></span>}
    <input {...rest} style={{
      width: "100%", boxSizing: "border-box",
      padding: icon ? "10px 14px 10px 36px" : "10px 14px",
      border: "1px solid var(--border-muted-input)", borderRadius: 8,
      fontSize: 14, fontFamily: "var(--font-sans)", background: "var(--bg-default)",
      color: "var(--fg-default)", outline: "none",
    }} />
  </div>
);

// ---------- Tabs ----------
const Tabs = ({ items, active, onChange }) => (
  <div style={{ display: "flex", gap: 2, borderBottom: "1px solid var(--border-muted)" }}>
    {items.map(it => {
      const is = it.id === active;
      return (
        <button key={it.id} onClick={() => onChange(it.id)} style={{
          padding: "12px 18px", border: 0, background: "transparent",
          fontFamily: "var(--font-sans)", fontSize: 14, fontWeight: is ? 700 : 500,
          color: is ? "var(--fg-default)" : "var(--fg-muted)", cursor: "pointer",
          borderBottom: is ? "2px solid var(--gray-100)" : "2px solid transparent",
          marginBottom: -1, letterSpacing: "-0.2px",
          display: "inline-flex", alignItems: "center", gap: 8,
        }}>
          {it.icon && <Icon name={it.icon} size={15} />}
          {it.label}
        </button>
      );
    })}
  </div>
);

// ---------- Metric ----------
const Metric = ({ label, sub, value, delta, deltaTone, mono = true, size = "md" }) => {
  const fs = size === "lg" ? 32 : size === "sm" ? 18 : 24;
  const deltaColor = deltaTone === "down" ? "#C32B2B" : deltaTone === "flat" ? "var(--fg-muted)" : "#2B873F";
  const deltaBg = deltaTone === "down" ? "#FFEDED" : deltaTone === "flat" ? "var(--gray-20)" : "#E9FBEF";
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
      <div style={{ fontSize: 11, fontWeight: 600, color: "var(--fg-muted)", letterSpacing: "0.04em", textTransform: "uppercase" }}>{label}</div>
      {sub && <div style={{ fontSize: 11, color: "var(--fg-muted)", marginTop: -2 }}>{sub}</div>}
      <div style={{ fontSize: fs, fontWeight: 700, color: "var(--fg-default)", letterSpacing: "-0.8px", lineHeight: 1.05, fontFamily: mono ? "var(--font-mono)" : "var(--font-display)", marginTop: 4 }}>
        {value}
      </div>
      {delta && (
        <div style={{
          display: "inline-flex", alignSelf: "flex-start", alignItems: "center", gap: 4,
          fontSize: 11, fontWeight: 600, color: deltaColor, background: deltaBg,
          padding: "2px 8px", borderRadius: 9999, marginTop: 4,
        }}>{delta}</div>
      )}
    </div>
  );
};

Object.assign(window, { Icon, Button, Tag, Card, Bi, Avatar, Sparkline, Stub, Slider, Input, Tabs, Metric });
