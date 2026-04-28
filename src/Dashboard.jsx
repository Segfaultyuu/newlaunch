/* global React, Card, Tag, Bi, Icon, Button, Stub, Metric, Sparkline, PROJECTS */
const { useMemo: useMemoDash, useState: useStateDash, useEffect: useEffectDash, useRef: useRefDash } = React;

// ---------- Hero prediction chart ----------
function PredictionChart({ project, height = 240 }) {
  const { useState: useStateChart, useRef: useRefChart, useCallback: useCallbackChart } = React;
  const W = 720, H = height;
  const padL = 58, padR = 48, padT = 32, padB = 44;
  const iw = W - padL - padR, ih = H - padT - padB;

  const base   = project.launchPsf || project.avgPsf || 2300;
  const low    = project.predictedUplift?.[0] ?? 5;
  const high   = project.predictedUplift?.[1] ?? 12;

  const stops = [
    { xf: 0.00, label: "Launch",     mid: base,                                                                   lo: base,                           hi: base },
    { xf: 0.18, label: "+1yr",       mid: base * 1.02,                                                            lo: base * 1.00,                    hi: base * 1.04 },
    { xf: 0.38, label: "Mid-build",  mid: base * 1.04,                                                            lo: base * 1.01,                    hi: base * 1.07 },
    { xf: 0.55, label: "TOP",        mid: base * (1 + (low + high) / 2 / 100 * 0.65),                            lo: base * (1 + low  / 100 * 0.55), hi: base * (1 + high / 100 * 0.75) },
    { xf: 0.78, label: "+3yr post",  mid: base * (1 + (low + high) / 2 / 100),                                   lo: base * (1 + low  / 100 * 0.85), hi: base * (1 + high / 100 * 1.05) },
    { xf: 1.00, label: "+5yr post",  mid: base * (1 + high / 100 * 1.1),                                         lo: base * (1 + low  / 100),        hi: base * (1 + high / 100 * 1.3)  },
  ];

  const yMin = base * 0.94;
  const yMax = base * (1 + Math.max(high, 20) / 100 * 1.35);
  const yv   = v  => padT + ih - ((v  - yMin) / (yMax - yMin)) * ih;
  const xv   = xf => padL + xf * iw;

  // Interpolate midline PSF at arbitrary x fraction
  const interpMid = xf => {
    for (let i = 0; i < stops.length - 1; i++) {
      if (xf >= stops[i].xf && xf <= stops[i + 1].xf) {
        const t = (xf - stops[i].xf) / (stops[i + 1].xf - stops[i].xf);
        return stops[i].mid + t * (stops[i + 1].mid - stops[i].mid);
      }
    }
    return stops[stops.length - 1].mid;
  };

  // TODAY state — launched projects start ~12% in, upcoming at ~2%
  const initFrac = project.status === "launched" ? 0.12 : 0.02;
  const [todayFrac, setTodayFrac] = useStateChart(initFrac);
  const [dragging,  setDragging]  = useStateChart(false);
  const svgRef = useRefChart(null);

  const fracFromEvent = useCallbackChart(e => {
    const svg  = svgRef.current;
    if (!svg) return null;
    const rect  = svg.getBoundingClientRect();
    const cx    = e.touches ? e.touches[0].clientX : e.clientX;
    const svgX  = ((cx - rect.left) / rect.width) * W;
    return Math.max(0, Math.min(0.95, (svgX - padL) / iw));
  }, []);

  const onPointerDown = e => { e.preventDefault(); setDragging(true); };
  const onPointerMove = useCallbackChart(e => {
    if (!dragging) return;
    const f = fracFromEvent(e);
    if (f !== null) setTodayFrac(f);
  }, [dragging, fracFromEvent]);
  const onPointerUp = () => setDragging(false);

  const mkPath = key => stops.map((s, i) =>
    `${i === 0 ? "M" : "L"}${xv(s.xf).toFixed(1)},${yv(s[key]).toFixed(1)}`).join(" ");
  const bandPath =
    `M${xv(stops[0].xf)},${yv(stops[0].hi)} ` +
    stops.slice(1).map(s => `L${xv(s.xf)},${yv(s.hi)}`).join(" ") + " " +
    stops.slice().reverse().map(s => `L${xv(s.xf)},${yv(s.lo)}`).join(" ") + " Z";

  const yTicks  = 4;
  const grid    = Array.from({ length: yTicks + 1 }, (_, i) => yMin + (yMax - yMin) * (i / yTicks));

  const vc = project.verdict === "outperform" ? "#2B873F"
           : project.verdict === "neutral"    ? "#C85D00"
           : project.verdict === "underperform" ? "#C32B2B" : "#2B873F";
  const bf = project.verdict === "outperform"   ? "rgba(112,252,142,0.18)"
           : project.verdict === "neutral"       ? "rgba(255,144,46,0.14)"
           : project.verdict === "underperform"  ? "rgba(255,82,82,0.14)"  : "rgba(112,252,142,0.18)";

  // TODAY derived values
  const todayPsf  = interpMid(todayFrac);
  const todayPct  = ((todayPsf / base - 1) * 100);
  const todayPctStr = (todayPct >= 0 ? "+" : "") + todayPct.toFixed(1) + "%";
  const txToday   = xv(todayFrac);
  const tyToday   = yv(todayPsf);

  // % badge helpers: avoid overlapping the TOP marker label
  const pctLabel = (s, i) => {
    const pct = ((s.mid / base - 1) * 100);
    if (i === 0) return null; // launch = 0%, skip
    const str = (pct >= 0 ? "+" : "") + pct.toFixed(0) + "%";
    return str;
  };

  return (
    <svg
      ref={svgRef}
      viewBox={`0 0 ${W} ${H}`}
      style={{ width: "100%", height: "auto", display: "block", userSelect: "none", touchAction: "none" }}
      onMouseMove={onPointerMove} onTouchMove={onPointerMove}
      onMouseUp={onPointerUp}    onTouchEnd={onPointerUp}
      onMouseLeave={onPointerUp}
    >
      {/* gridlines */}
      {grid.map((v, i) => (
        <g key={i}>
          <line x1={padL} x2={W - padR} y1={yv(v)} y2={yv(v)}
            stroke="var(--gray-20)" strokeDasharray={i === 0 || i === yTicks ? "0" : "3 4"} />
          <text x={padL - 6} y={yv(v) + 3} textAnchor="end"
            fontSize="10" fill="var(--fg-muted)" fontFamily="var(--font-mono)">
            ${Math.round(v).toLocaleString()}
          </text>
        </g>
      ))}

      {/* TOP vertical marker — label INSIDE chart above line */}
      <line x1={xv(0.55)} x2={xv(0.55)} y1={padT} y2={padT + ih}
        stroke={vc} strokeDasharray="2 3" strokeWidth="1.5" opacity="0.5" />
      <rect x={xv(0.55) + 4} y={padT + 4} width="30" height="16" rx="4" fill={vc} />
      <text x={xv(0.55) + 19} y={padT + 15} textAnchor="middle" fontSize="9" fill="#fff" fontWeight="700">TOP</text>

      {/* confidence band + lines */}
      <path d={bandPath} fill={bf} />
      <path d={mkPath("lo")} fill="none" stroke={vc} strokeWidth="1" strokeDasharray="2 3" opacity="0.5" />
      <path d={mkPath("hi")} fill="none" stroke={vc} strokeWidth="1" strokeDasharray="2 3" opacity="0.5" />
      <path d={mkPath("mid")} fill="none" stroke={vc} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />

      {/* Stop dots + x-axis labels + % badges */}
      {stops.map((s, i) => {
        const cx   = xv(s.xf);
        const cy   = yv(s.mid);
        const pct  = pctLabel(s, i);
        // nudge % badge left on last stop to stay inside
        const badgeX = i === stops.length - 1 ? cx - 28 : cx - 14;
        return (
          <g key={i}>
            {/* x-axis label */}
            <text x={cx} y={H - 6} textAnchor="middle" fontSize="10" fill="var(--fg-muted)" fontWeight="600">{s.label}</text>
            {/* dot */}
            <circle cx={cx} cy={cy} r={i === 3 ? 5 : 3} fill="var(--bg-default)" stroke={vc} strokeWidth="2" />
            {/* % badge above dot (skip launch=0%) */}
            {pct && (
              <g>
                <rect x={badgeX} y={cy - 22} width="28" height="16" rx="4" fill={vc} opacity="0.9" />
                <text x={badgeX + 14} y={cy - 10} textAnchor="middle" fontSize="9" fill="#fff" fontWeight="700" fontFamily="var(--font-mono)">{pct}</text>
              </g>
            )}
          </g>
        );
      })}

      {/* Draggable TODAY line */}
      <line x1={txToday} x2={txToday} y1={padT} y2={padT + ih}
        stroke="var(--gray-70)" strokeDasharray="4 4" strokeWidth="1.5" />

      {/* TODAY % badge — shown above drag handle */}
      {todayPct !== 0 && (() => {
        const bw = 42, bh = 18;
        const bx = Math.min(W - padR - bw - 2, Math.max(padL, txToday - bw / 2));
        return (
          <g>
            <rect x={bx} y={padT + ih - 36} width={bw} height={bh} rx="4" fill="var(--gray-100)" />
            <text x={bx + bw / 2} y={padT + ih - 23} textAnchor="middle" fontSize="10" fill="#fff" fontWeight="700" fontFamily="var(--font-mono)">{todayPctStr}</text>
          </g>
        );
      })()}

      {/* Drag handle (invisible wide hit area + visible diamond) */}
      <rect
        x={txToday - 12} y={padT + ih - 14} width="24" height="24"
        fill="transparent" rx="4"
        style={{ cursor: dragging ? "grabbing" : "ew-resize" }}
        onMouseDown={onPointerDown} onTouchStart={onPointerDown}
      />
      <polygon
        points={`${txToday},${padT + ih - 6} ${txToday + 7},${padT + ih + 2} ${txToday},${padT + ih + 10} ${txToday - 7},${padT + ih + 2}`}
        fill="var(--gray-100)" stroke="#fff" strokeWidth="1.5"
        style={{ cursor: dragging ? "grabbing" : "ew-resize" }}
        onMouseDown={onPointerDown} onTouchStart={onPointerDown}
      />

      {/* TODAY dot on midline */}
      <circle cx={txToday} cy={tyToday} r="5" fill="#fff" stroke="var(--gray-80)" strokeWidth="2" />
    </svg>
  );
}

// ---------- Dashboard ----------
function Dashboard({ lang, persona, onNav, onOpenProject }) {
  const [ppi, setPpi] = useStateDash(null);
  const [headlineForecast, setHeadlineForecast] = useStateDash(null);

  useEffectDash(() => {
    window.LIVE_DATA?.fetchPPI().then(setPpi).catch(() => {});
  }, []);

  const headlineBase = PROJECTS[0];
  useEffectDash(() => {
    window.LIVE_DATA?.forecastProject(headlineBase).then(setHeadlineForecast).catch(() => {});
  }, [headlineBase.id]);

  const personaCopy = {
    investor: { en: "Capital efficiency & exit windows — focus on PSF vs. resale and yield.", zh: "关注资金效率、尺价差与租金回报。" },
    upgrader: { en: "Cashflow, schools, and family layouts — 3BR leads.", zh: "关注现金流、学区与三房户型。" },
    firsttime: { en: "We'll walk you through jargon. Start with the glossary.", zh: "为您解释专业术语，建议先看词汇表。" },
  }[persona];

  // ── Derive KPIs from real PROJECTS data ─────────────────────────────────
  const launched  = PROJECTS.filter(p => p.status === "launched");
  const upcoming  = PROJECTS.filter(p => p.status === "upcoming");
  const withDay1  = launched.filter(p => p.day1Sold != null);
  const avgDay1   = withDay1.length
    ? Math.round(withDay1.reduce((s, p) => s + p.day1Sold, 0) / withDay1.length)
    : null;
  // YoY approximation: compare first-half vs second-half of launched list
  const half = Math.floor(withDay1.length / 2);
  const oldAvg = half > 0 ? withDay1.slice(0, half).reduce((s,p)=>s+p.day1Sold,0)/half : null;
  const newAvg = half > 0 ? withDay1.slice(half).reduce((s,p)=>s+p.day1Sold,0)/(withDay1.length-half) : null;
  const day1YoY = (oldAvg && newAvg) ? Math.round(newAvg - oldAvg) : null;

  const upcomingUnits = upcoming.reduce((s, p) => s + (p.units || 0), 0);

  // ── Regional heat from real project data ──────────────────────────────
  const REGION_META = [
    { key: "OCR East",  label: "OCR East",  en: "Tampines, Bedok, Bayshore" },
    { key: "OCR West",  label: "OCR West",  en: "Clementi, Jurong, Buona Vista" },
    { key: "OCR North", label: "OCR North", en: "Lentor, Yishun, Woodlands" },
    { key: "RCR",       label: "RCR",       en: "Queenstown, Toa Payoh, Kallang" },
    { key: "CCR",       label: "CCR",       en: "Orchard, Holland, River Valley" },
  ];
  const regionalHeat = useMemoDash(() => REGION_META.map(r => {
    const inRegion = PROJECTS.filter(p => p.region === r.key);
    const outperform = inRegion.filter(p => p.verdict === "outperform");
    const pct = inRegion.length ? Math.round(outperform.length / inRegion.length * 100) : 0;
    return { ...r, n: outperform.length, total: inRegion.length, pct };
  }), []);
  const maxPct = Math.max(...regionalHeat.map(r => r.pct), 1);

  // ── Merge live forecast into headline project ─────────────────────────
  const headline = headlineForecast ? {
    ...headlineBase,
    predictedUplift: [headlineForecast.upliftLow, headlineForecast.upliftHigh],
    fairPsf: [headlineForecast.fairLow, headlineForecast.fairHigh],
    rentalYield: headlineForecast.yieldAtTop,
    _forecast: headlineForecast,
  } : headlineBase;

  // Est. IRR: (mid-uplift + rentalYield × 3) / 3
  const upliftMid = headlineForecast?.upliftMid ?? Math.round((headline.predictedUplift[0]+headline.predictedUplift[1])/2);
  const irrEst = ((upliftMid / 100 + (headline.rentalYield || 3.8) * 3 / 100) / 3 * 100).toFixed(1);

  const watching = PROJECTS.filter(p => ["parktown-residence", "pinery-residences", "bedok-rise"].includes(p.id));

  return (
    <div style={{ padding: 24, display: "flex", flexDirection: "column", gap: 16 }}>
      {/* Persona briefing bar */}
      <Card pad={0} radius={16} style={{ overflow: "hidden", border: "1px solid var(--border-muted-card)" }}>
        <div style={{ display: "flex", alignItems: "stretch" }}>
          <div style={{ flex: 1, padding: "18px 22px", display: "flex", flexDirection: "column", gap: 6 }}>
            <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.08em", color: "var(--fg-muted)", textTransform: "uppercase" }}>
              Tuned for {persona === "investor" ? "Investor" : persona === "upgrader" ? "HDB Upgrader" : "First-time Buyer"}
              {lang === "both" && <span style={{ marginLeft: 6, color: "var(--fg-muted)" }}>· 个性化视图</span>}
            </div>
            <div style={{ fontSize: 18, fontWeight: 600, color: "var(--fg-default)", letterSpacing: "-0.3px", lineHeight: 1.3 }}>
              {personaCopy.en}
            </div>
            {lang === "both" && (
              <div style={{ fontSize: 13, color: "var(--fg-muted)" }}>{personaCopy.zh}</div>
            )}
          </div>
          <div style={{ display: "flex", alignItems: "center", padding: "0 22px", gap: 12, background: "var(--gray-10)", borderLeft: "1px solid var(--border-muted)" }}>
            <Icon name="info" size={16} color="var(--fg-muted)" />
            <div style={{ fontSize: 12, color: "var(--fg-muted)", maxWidth: 220, lineHeight: 1.4 }}>
              Change persona from the top bar — dashboard reweights metrics live.
            </div>
          </div>
        </div>
      </Card>

      {/* KPI strip */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16 }}>
        <Card pad={18} radius={16}>
          <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
            <Metric
              label={ppi ? "Private Residential PPI" : "OCR East Avg PSF"}
              sub={ppi
                ? `${ppi.quarter} · Non-Landed`
                : (lang === "both" ? "东部中部外 尺价" : "Mass market, last 30d")}
              value={ppi ? String(ppi.index.toFixed(1)) : "$2,284"}
              delta={ppi
                ? `${ppi.qoqPct >= 0 ? "▲" : "▼"} ${Math.abs(ppi.qoqPct)}% QoQ`
                : "▲ 4.2% QoQ"}
              deltaTone={ppi ? (ppi.qoqPct >= 0 ? "up" : "down") : "up"}
            />
            {ppi && ppi.history && (
              <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 4 }}>
                <span style={{
                  fontSize: 9, fontWeight: 700, letterSpacing: "0.08em",
                  background: "#E9FBEF", color: "#2B873F",
                  padding: "2px 6px", borderRadius: 9999,
                }}>LIVE</span>
                <Sparkline data={ppi.history.map(h => h.index)} width={80} height={28} />
              </div>
            )}
          </div>
        </Card>
        <Card pad={18} radius={16}>
          <Metric label="Tracked Launches" sub={lang === "both" ? "新盘跟踪数量" : "Live in platform"}
            value={`${launched.length} / ${upcoming.length}`}
            delta="launched / upcoming" deltaTone="flat" />
        </Card>
        <Card pad={18} radius={16}>
          <Metric label="Avg Day-1 Sell-through"
            sub={lang === "both" ? "首日平均去化" : `${withDay1.length} tracked launches`}
            value={avgDay1 != null ? `${avgDay1}%` : "—"}
            delta={day1YoY != null ? `${day1YoY >= 0 ? "▲" : "▼"} ${Math.abs(day1YoY)}pt recent vs earlier` : "across tracked launches"}
            deltaTone={day1YoY != null ? (day1YoY >= 0 ? "up" : "down") : "flat"} />
        </Card>
        <Card pad={18} radius={16}>
          <Metric label="Upcoming supply"
            sub={lang === "both" ? "待售单位" : `${upcoming.length} tracked upcoming launches`}
            value={upcomingUnits.toLocaleString()}
            delta="units in pipeline" deltaTone="flat" />
        </Card>
      </div>

      {/* Headline forecast — Vela Bay */}
      <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: 16 }}>
        <Card pad={22} radius={16}>
          <div style={{ display: "flex", alignItems: "flex-start", marginBottom: 16 }}>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.08em", color: "var(--fg-muted)", textTransform: "uppercase" }}>
                Headline forecast · 重点预测
              </div>
              <div style={{ fontSize: 22, fontWeight: 700, color: "var(--fg-default)", letterSpacing: "-0.5px", marginTop: 4, lineHeight: 1.2 }}>
                {headline.name} {lang === "both" && <span style={{ fontSize: 15, color: "var(--fg-muted)", fontWeight: 500 }}> · {headline.zhName}</span>}
              </div>
              <div style={{ fontSize: 12, color: "var(--fg-muted)", marginTop: 2 }}>
                {headline.district} · TOP {headline.topDate}
              </div>
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              <Tag tone="success">{headline.verdictLabel} · {headline.zhVerdictLabel}</Tag>
              <Button intent="outlined" size="sm" iconRight="arrow-right" onClick={() => onOpenProject(headline.id)}>Open detail</Button>
            </div>
          </div>

          <PredictionChart project={headline} />

          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 14, marginTop: 18, paddingTop: 16, borderTop: "1px solid var(--border-muted)" }}>
            <Metric label="TOP uplift (mid)" value={`+${Math.round((headline.predictedUplift[0]+headline.predictedUplift[1])/2)}%`} delta={`range ${headline.predictedUplift[0]}–${headline.predictedUplift[1]}%`} deltaTone="up" />
            <Metric label="Fair PSF range" value={`$${headline.fairPsf[0].toLocaleString()}–$${headline.fairPsf[1].toLocaleString()}`} mono={false} />
            <Metric label="Rental yield" value={`${headline.rentalYield}%`} delta={`${headline.region} benchmark`} deltaTone="up" />
            <Metric label="Day-1 sold" value={`${headline.day1Sold}%`} delta={`${headline.units.toLocaleString()} units total`} deltaTone="up" />
          </div>
        </Card>

        <Card pad={22} radius={16} style={{ background: "var(--gray-100)", borderColor: "transparent", color: "#fff", display: "flex", flexDirection: "column", gap: 10 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, color: "#70FC8E" }}>
            <Icon name="sparkles" size={14} />
            <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase" }}>Forecaster AI</span>
          </div>
          <div style={{ fontSize: 18, fontWeight: 700, letterSpacing: "-0.3px", lineHeight: 1.3, color: "#fff" }}>
            Why this matters for you
          </div>
          <div style={{ fontSize: 12, color: "var(--gray-30)", lineHeight: 1.55 }}>
            {persona === "investor" && `${headline.name} sold ${headline.day1Sold}% on day 1 at $${headline.launchPsf.toLocaleString()} PSF — integrated Tampines North CRL station (2030) plus thin Tampines new-launch pipeline supports the ${headline.predictedUplift[0]}–${headline.predictedUplift[1]}% TOP uplift range.`}
            {persona === "upgrader" && `${headline.name} 3BR at ~$${(headline.unitMix.find(u=>u.type==="3BR")?.psf||headline.launchPsf).toLocaleString()} PSF with on-site hawker, retail and bus interchange — Poi Ching School within 1km, CRL at your doorstep from 2030.`}
            {persona === "firsttime" && "Fair PSF means what a project should cost, based on land cost + build + normal developer margin. When launch PSF is close to the low end, you're getting a deal."}
          </div>
          <div style={{ marginTop: "auto", padding: "10px 12px", background: "var(--gray-95)", borderRadius: 10, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontSize: 11, color: "var(--gray-40)" }}>Est. 3-yr IRR{headlineForecast ? "" : " (static)"}</span>
            <span style={{ fontSize: 15, color: "#70FC8E", fontWeight: 700, fontFamily: "var(--font-mono)" }}>{irrEst}%</span>
          </div>
          <Button intent="brand" size="sm" style={{ justifyContent: "center" }} onClick={() => onOpenProject(headline.id)}>
            See full analysis
          </Button>
        </Card>
      </div>

      {/* Watchlist + Heat map */}
      <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: 16 }}>
        <Card pad={22} radius={16}>
          <div style={{ display: "flex", alignItems: "center", marginBottom: 14 }}>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 16, fontWeight: 700, letterSpacing: "-0.3px" }}>Your watchlist · 关注列表</div>
              <div style={{ fontSize: 12, color: "var(--fg-muted)", marginTop: 2 }}>3 tracked · price signals updated daily</div>
            </div>
            <Button intent="ghost" size="sm" iconRight="arrow-right" onClick={() => onNav("launched")}>See all</Button>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {watching.map(p => (
              <div key={p.id} onClick={() => onOpenProject(p.id)} style={{
                display: "grid", gridTemplateColumns: "44px 1fr 90px 120px 90px 30px", alignItems: "center", gap: 14,
                padding: "10px 12px", borderRadius: 10, border: "1px solid var(--border-muted)",
                cursor: "pointer", background: "var(--bg-default)",
              }}>
                <Stub w={44} h={44} label="IMG" style={{ borderRadius: 8 }} />
                <div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: "var(--fg-default)", letterSpacing: "-0.2px" }}>
                    {p.name} {lang === "both" && <span style={{ color: "var(--fg-muted)", fontWeight: 500 }}> · {p.zhName}</span>}
                  </div>
                  <div style={{ fontSize: 11, color: "var(--fg-muted)" }}>{p.district} · {p.developer}</div>
                </div>
                <div style={{ fontSize: 12 }}>
                  <div style={{ color: "var(--fg-muted)", fontSize: 10, textTransform: "uppercase", letterSpacing: "0.06em", fontWeight: 600 }}>PSF</div>
                  <div style={{ fontFamily: "var(--font-mono)", fontWeight: 600 }}>${p.avgPsf || p.fairPsf[0]}</div>
                </div>
                <div>
                  <div style={{ color: "var(--fg-muted)", fontSize: 10, textTransform: "uppercase", letterSpacing: "0.06em", fontWeight: 600 }}>Forecast</div>
                  <div style={{ fontFamily: "var(--font-mono)", fontWeight: 600, color: p.verdict === "outperform" ? "#2B873F" : p.verdict === "neutral" ? "#C85D00" : "var(--fg-default)" }}>
                    {p.predictedUplift ? `+${p.predictedUplift[0]}–${p.predictedUplift[1]}%` : `Score ${p.entryScore}`}
                  </div>
                </div>
                <Tag tone={p.verdict === "outperform" ? "success" : p.verdict === "neutral" ? "warning" : "info"} dot>
                  {p.verdictLabel}
                </Tag>
                <Icon name="chevron-right" size={16} color="var(--fg-muted)" />
              </div>
            ))}
          </div>
        </Card>

        <Card pad={22} radius={16}>
          <div style={{ fontSize: 16, fontWeight: 700, letterSpacing: "-0.3px" }}>Regional heat · 区域热度</div>
          <div style={{ fontSize: 12, color: "var(--fg-muted)", marginTop: 2, marginBottom: 14 }}>Outperform launches as % of tracked per region</div>
          {regionalHeat.map((row, i) => (
            <div key={i} style={{ marginBottom: 10 }}>
              <div style={{ display: "flex", fontSize: 12, marginBottom: 4 }}>
                <span style={{ flex: 1, color: "var(--fg-default)", fontWeight: 600 }}>{row.label}</span>
                <span style={{ color: "var(--fg-muted)", fontFamily: "var(--font-mono)" }}>
                  {row.n}/{row.total} outperform
                </span>
              </div>
              <div style={{ height: 6, background: "var(--gray-20)", borderRadius: 9999, overflow: "hidden" }}>
                <div style={{
                  width: `${maxPct > 0 ? (row.pct / maxPct) * 100 : 0}%`, height: "100%", borderRadius: 9999,
                  background: row.pct === maxPct ? "#70FC8E" : row.pct > 50 ? "#3765F6" : "var(--gray-60)",
                }} />
              </div>
              <div style={{ fontSize: 10, color: "var(--fg-muted)", marginTop: 2 }}>{row.en}</div>
            </div>
          ))}
        </Card>
      </div>

      {/* Footer: data sources */}
      <Card pad={16} radius={12} style={{ background: "var(--gray-10)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 16, flexWrap: "wrap", fontSize: 11, color: "var(--fg-muted)" }}>
          <span style={{ fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em" }}>Data sources</span>
          <span>· URA Caveats (live)</span>
          <span>· URA Master Plan 2025/2030</span>
          <span>· HDB Resale Index</span>
          <span>· Developer S&P filings</span>
          <span>· BCA construction cost index</span>
          <span style={{ marginLeft: "auto", fontFamily: "var(--font-mono)" }}>MVP build · all figures indicative</span>
        </div>
      </Card>
    </div>
  );
}

window.Dashboard = Dashboard;
window.PredictionChart = PredictionChart;
