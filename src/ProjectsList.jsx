/* global React, Card, Tag, Icon, Button, Stub, Input, PROJECTS */
const { useState: useStateList, useMemo: useMemoList } = React;

function ProjectsList({ lang, mode, onOpenProject }) {
  // mode: "launched" or "upcoming"
  const [sort, setSort] = useStateList(mode === "launched" ? "forecast" : "score");
  const [filterRegion, setFilterRegion] = useStateList("all");
  const [filterTenure, setFilterTenure] = useStateList("all");
  const [q, setQ] = useStateList("");

  const list = useMemoList(() => {
    let arr = PROJECTS.filter(p => p.status === mode);
    if (filterRegion !== "all") arr = arr.filter(p => p.region === filterRegion);
    if (filterTenure !== "all") arr = arr.filter(p => p.tenure.toLowerCase().includes(filterTenure));
    if (q) arr = arr.filter(p => (p.name + p.zhName + p.district).toLowerCase().includes(q.toLowerCase()));

    arr = arr.slice().sort((a, b) => {
      if (sort === "forecast") return (b.predictedUplift?.[1] || 0) - (a.predictedUplift?.[1] || 0);
      if (sort === "score") return (b.entryScore || 0) - (a.entryScore || 0);
      if (sort === "psf-low") return (a.avgPsf || a.fairPsf?.[0] || 0) - (b.avgPsf || b.fairPsf?.[0] || 0);
      if (sort === "psf-high") return (b.avgPsf || b.fairPsf?.[1] || 0) - (a.avgPsf || a.fairPsf?.[1] || 0);
      if (sort === "top-date") return a.topDate.localeCompare(b.topDate);
      return 0;
    });
    return arr;
  }, [mode, sort, filterRegion, filterTenure, q]);

  return (
    <div style={{ padding: 24, display: "flex", flexDirection: "column", gap: 16 }}>
      {/* Filter bar */}
      <Card pad={16} radius={12}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
          <Input icon="search" placeholder="Filter by name · 按名称筛选" value={q} onChange={e => setQ(e.target.value)} style={{ width: 280 }} />
          <Select label="Region · 区域" value={filterRegion} onChange={setFilterRegion} options={[
            { v: "all", l: "All regions" }, { v: "OCR East", l: "OCR East · 东" },
            { v: "OCR West", l: "OCR West · 西" }, { v: "RCR", l: "RCR · 其他中央" }, { v: "CCR", l: "CCR · 核心中央" },
          ]} />
          <Select label="Tenure · 地契" value={filterTenure} onChange={setFilterTenure} options={[
            { v: "all", l: "All" }, { v: "99", l: "99-year · 99年" }, { v: "freehold", l: "Freehold · 永久" },
          ]} />
          <div style={{ flex: 1 }} />
          <Select label="Sort · 排序" value={sort} onChange={setSort} options={mode === "launched" ? [
            { v: "forecast", l: "Forecast uplift · 预测涨幅" },
            { v: "psf-low", l: "PSF low → high" },
            { v: "psf-high", l: "PSF high → low" },
            { v: "top-date", l: "TOP date" },
          ] : [
            { v: "score", l: "Entry score · 入场指数" },
            { v: "psf-low", l: "Fair PSF low → high" },
            { v: "top-date", l: "TOP date" },
          ]} />
        </div>
      </Card>

      <div style={{ fontSize: 12, color: "var(--fg-muted)", fontWeight: 600 }}>
        {list.length} projects · {mode === "launched" ? "已开盘" : "待开盘"}
      </div>

      {/* Table */}
      <Card pad={0} radius={16} style={{ overflow: "hidden" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
          <thead>
            <tr style={{ background: "var(--gray-10)", textAlign: "left" }}>
              {(mode === "launched" ? [
                "Project · 项目", "Region", "TOP", "Units", "Avg PSF", "Day-1 %", "Fair range", "Forecast", "Verdict", ""
              ] : [
                "Project · 项目", "Region", "Developer", "Preview", "TOP", "Units", "Land PSF", "Fair PSF", "Entry", ""
              ]).map((h, i) => (
                <th key={i} style={{ padding: "10px 14px", fontSize: 10, fontWeight: 700, color: "var(--fg-muted)", letterSpacing: "0.08em", textTransform: "uppercase", borderBottom: "1px solid var(--border-muted)" }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {list.map(p => mode === "launched" ? (
              <LaunchedRow key={p.id} p={p} lang={lang} onOpen={() => onOpenProject(p.id)} />
            ) : (
              <UpcomingRow key={p.id} p={p} lang={lang} onOpen={() => onOpenProject(p.id)} />
            ))}
          </tbody>
        </table>
      </Card>
    </div>
  );
}

function Select({ label, value, onChange, options }) {
  return (
    <label style={{ display: "inline-flex", alignItems: "center", gap: 8, fontSize: 12, color: "var(--fg-muted)" }}>
      <span style={{ fontWeight: 600 }}>{label}</span>
      <select value={value} onChange={e => onChange(e.target.value)} style={{
        padding: "7px 10px", border: "1px solid var(--border-muted-input)", borderRadius: 8,
        fontSize: 12, fontFamily: "var(--font-sans)", background: "var(--bg-default)", color: "var(--fg-default)",
        fontWeight: 600, cursor: "pointer",
      }}>
        {options.map(o => <option key={o.v} value={o.v}>{o.l}</option>)}
      </select>
    </label>
  );
}

function LaunchedRow({ p, lang, onOpen }) {
  const tone = p.verdict === "outperform" ? "success" : p.verdict === "neutral" ? "warning" : "info";
  const color = p.verdict === "outperform" ? "#2B873F" : p.verdict === "neutral" ? "#C85D00" : "var(--fg-default)";
  return (
    <tr onClick={onOpen} style={{ cursor: "pointer", borderBottom: "1px solid var(--border-muted)" }}
        onMouseEnter={e => e.currentTarget.style.background = "var(--gray-10)"}
        onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
      <td style={{ padding: "12px 14px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <Stub w={36} h={36} label="IMG" style={{ borderRadius: 6 }} />
          <div>
            <div style={{ fontWeight: 600, color: "var(--fg-default)" }}>{p.name}</div>
            {lang === "both" && <div style={{ fontSize: 11, color: "var(--fg-muted)" }}>{p.zhName} · {p.zhDeveloper}</div>}
            {lang === "en" && <div style={{ fontSize: 11, color: "var(--fg-muted)" }}>{p.developer}</div>}
          </div>
        </div>
      </td>
      <td style={{ padding: "12px 14px", color: "var(--fg-muted)" }}>{p.district}</td>
      <td style={{ padding: "12px 14px", fontFamily: "var(--font-mono)", color: "var(--fg-muted)" }}>{p.topDate}</td>
      <td style={{ padding: "12px 14px", fontFamily: "var(--font-mono)" }}>{p.units}</td>
      <td style={{ padding: "12px 14px", fontFamily: "var(--font-mono)", fontWeight: 600 }}>${p.avgPsf}</td>
      <td style={{ padding: "12px 14px" }}>
        <div style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
          <div style={{ width: 40, height: 5, background: "var(--gray-20)", borderRadius: 9999, overflow: "hidden" }}>
            <div style={{ width: `${p.day1Sold}%`, height: "100%", background: p.day1Sold > 60 ? "#70FC8E" : p.day1Sold > 40 ? "#FF902E" : "#FF5252" }} />
          </div>
          <span style={{ fontFamily: "var(--font-mono)", fontSize: 12, fontWeight: 600 }}>{p.day1Sold}%</span>
        </div>
      </td>
      <td style={{ padding: "12px 14px", fontFamily: "var(--font-mono)", color: "var(--fg-muted)", fontSize: 12 }}>
        ${p.fairPsf[0]}–{p.fairPsf[1]}
      </td>
      <td style={{ padding: "12px 14px", fontFamily: "var(--font-mono)", fontWeight: 700, color }}>
        +{p.predictedUplift[0]}–{p.predictedUplift[1]}%
      </td>
      <td style={{ padding: "12px 14px" }}>
        <Tag tone={tone}>{p.verdictLabel}</Tag>
      </td>
      <td style={{ padding: "12px 14px", textAlign: "right" }}>
        <Icon name="chevron-right" size={16} color="var(--fg-muted)" />
      </td>
    </tr>
  );
}

function UpcomingRow({ p, lang, onOpen }) {
  const scoreColor = p.entryScore >= 80 ? "#2B873F" : p.entryScore >= 65 ? "#3765F6" : "#C85D00";
  return (
    <tr onClick={onOpen} style={{ cursor: "pointer", borderBottom: "1px solid var(--border-muted)" }}
        onMouseEnter={e => e.currentTarget.style.background = "var(--gray-10)"}
        onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
      <td style={{ padding: "12px 14px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <Stub w={36} h={36} label="PLOT" style={{ borderRadius: 6 }} />
          <div>
            <div style={{ fontWeight: 600, color: "var(--fg-default)" }}>{p.name}</div>
            {lang === "both" && <div style={{ fontSize: 11, color: "var(--fg-muted)" }}>{p.zhName}</div>}
          </div>
        </div>
      </td>
      <td style={{ padding: "12px 14px", color: "var(--fg-muted)" }}>{p.district}</td>
      <td style={{ padding: "12px 14px", color: "var(--fg-muted)" }}>{p.developer}</td>
      <td style={{ padding: "12px 14px", fontFamily: "var(--font-mono)", color: "var(--fg-muted)", fontSize: 12 }}>{p.launchDate}</td>
      <td style={{ padding: "12px 14px", fontFamily: "var(--font-mono)", color: "var(--fg-muted)", fontSize: 12 }}>{p.topDate}</td>
      <td style={{ padding: "12px 14px", fontFamily: "var(--font-mono)" }}>{p.units}</td>
      <td style={{ padding: "12px 14px", fontFamily: "var(--font-mono)", color: "var(--fg-muted)" }}>${p.landRatePsf}</td>
      <td style={{ padding: "12px 14px", fontFamily: "var(--font-mono)", fontWeight: 600 }}>
        ${p.fairPsf[0]}–{p.fairPsf[1]}
      </td>
      <td style={{ padding: "12px 14px" }}>
        <div style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
          <div style={{
            width: 40, height: 22, borderRadius: 6, background: `${scoreColor}18`,
            color: scoreColor, fontFamily: "var(--font-mono)", fontWeight: 700, fontSize: 12,
            display: "inline-flex", alignItems: "center", justifyContent: "center",
          }}>{p.entryScore}</div>
          <Tag tone={p.entryScore >= 80 ? "success" : p.entryScore >= 65 ? "info" : "warning"}>{p.verdictLabel}</Tag>
        </div>
      </td>
      <td style={{ padding: "12px 14px", textAlign: "right" }}>
        <Icon name="chevron-right" size={16} color="var(--fg-muted)" />
      </td>
    </tr>
  );
}

window.ProjectsList = ProjectsList;
