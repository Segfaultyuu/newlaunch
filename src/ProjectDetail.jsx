/* global React, Card, Tag, Icon, Button, Stub, Tabs, Metric, Sparkline, PredictionChart, PROJECTS_BY_ID */
const { useState: useStateD, useEffect: useEffectD } = React;

function ProjectDetail({ projectId, lang, persona, onBack }) {
  const pBase = PROJECTS_BY_ID[projectId] || PROJECTS_BY_ID["parktown-residence"];
  const [tab, setTab] = useStateD("prediction");
  const [forecast, setForecast] = useStateD(null);
  useEffectD(() => {
    setForecast(null);
    window.LIVE_DATA?.forecastProject(pBase).then(setForecast).catch(() => {});
  }, [pBase.id]);

  // Merge live forecast into project so children (PredictionChart, Metric etc.) use it.
  // Also fill defaults for upcoming projects (no launchPsf/day1Sold/etc.) so the
  // detail layout renders without crashing.
  const fairMid = pBase.fairPsf ? Math.round((pBase.fairPsf[0] + pBase.fairPsf[1]) / 2) : 2300;
  const defaults = {
    launchPsf: pBase.launchPsf || fairMid,
    avgPsf: pBase.avgPsf || pBase.launchPsf || fairMid,
    day1Sold: pBase.day1Sold ?? null,
    totalSold: pBase.totalSold ?? null,
    predictedUplift: pBase.predictedUplift || [5, 12],
    rentalYield: pBase.rentalYield || 3.6,
    vacancyRisk: pBase.vacancyRisk || "low",
    premiumIndex: pBase.premiumIndex ?? 10,
    competingSupply: pBase.competingSupply || null,
    unitMix: pBase.unitMix || [],
    highlights: pBase.highlights || [],
    schools: pBase.schools || [],
    tenantProfile: pBase.tenantProfile || "—",
    mrtDistance: pBase.mrtDistance || "—",
  };
  const p = {
    ...pBase,
    ...Object.fromEntries(Object.entries(defaults).filter(([k]) => pBase[k] == null)),
    ...(forecast ? {
      predictedUplift: [forecast.upliftLow, forecast.upliftHigh],
      fairPsf: [forecast.fairLow, forecast.fairHigh],
      rentalYield: forecast.yieldAtTop,
    } : {}),
    _forecast: forecast,
    _upcoming: pBase.status === "upcoming",
  };

  const verdictTone = p.verdict === "outperform" ? "success" : p.verdict === "neutral" ? "warning" : "info";

  return (
    <div style={{ padding: 24, display: "flex", flexDirection: "column", gap: 16 }}>
      {/* Back + hero header */}
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <Button intent="outlined" size="sm" icon="arrow-left" onClick={onBack}>Back</Button>
        <span style={{ fontSize: 12, color: "var(--fg-muted)" }}>
          <span style={{ cursor: "pointer" }} onClick={onBack}>Launched Projects</span> <Icon name="chevron-right" size={11} /> <span style={{ color: "var(--fg-default)", fontWeight: 600 }}>{p.name}</span>
        </span>
      </div>

      <Card pad={0} radius={16} style={{ overflow: "hidden" }}>
        <div style={{ display: "grid", gridTemplateColumns: "320px 1fr", gap: 0 }}>
          <Stub h={220} label="HERO · PROJECT RENDER" style={{ borderRadius: 0 }} />
          <div style={{ padding: "22px 26px", display: "flex", flexDirection: "column", gap: 10 }}>
            <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
              <Tag tone={verdictTone}>{p.verdictLabel} · {p.zhVerdictLabel}</Tag>
              <Tag tone="neutral" dot={false}>{p.tenure}</Tag>
              <Tag tone="neutral" dot={false}>{p.units} units</Tag>
              <Tag tone="neutral" dot={false}>TOP {p.topDate}</Tag>
            </div>
            <div>
              <div style={{ fontSize: 28, fontWeight: 700, letterSpacing: "-0.6px", color: "var(--fg-default)", lineHeight: 1.15 }}>
                {p.name}
              </div>
              {lang === "both" && (
                <div style={{ fontSize: 16, fontWeight: 500, color: "var(--fg-muted)", marginTop: 2 }}>{p.zhName}</div>
              )}
              <div style={{ fontSize: 13, color: "var(--fg-muted)", marginTop: 6 }}>
                {p.district} · {p.developer} {lang === "both" && `· ${p.zhDeveloper}`}
              </div>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 14, marginTop: 6 }}>
              <Metric label={p._upcoming ? "Indicative PSF" : "Launch PSF"} value={`$${p.launchPsf.toLocaleString()}`} />
              <Metric label={p._upcoming ? "Fair PSF range" : "Current avg PSF"}
                value={p._upcoming ? `$${p.fairPsf[0].toLocaleString()}–${p.fairPsf[1].toLocaleString()}`
                                   : `$${p.avgPsf.toLocaleString()}`}
                delta={p._upcoming ? "land + build + margin" : `+${((p.avgPsf/p.launchPsf-1)*100).toFixed(1)}%`}
                deltaTone="up" />
              <Metric label={p._upcoming ? "Entry score" : "Day-1 sell-through"}
                value={p._upcoming ? `${pBase.entryScore ?? "—"}/100` : `${p.day1Sold}%`}
                delta={p._upcoming ? "higher = better entry" : `${p.totalSold}% total`}
                deltaTone={p._upcoming ? "up" : (p.day1Sold > 60 ? "up" : "flat")} />
              <Metric label="Predicted TOP uplift" value={`+${p.predictedUplift[0]}–${p.predictedUplift[1]}%`} />
            </div>
          </div>
        </div>
      </Card>

      {/* Tabs */}
      <Tabs active={tab} onChange={setTab} items={[
        { id: "prediction", label: lang === "both" ? "Prediction · 预测" : "Prediction", icon: "trending-up" },
        { id: "psf", label: lang === "both" ? "PSF & Fair Value · 尺价" : "PSF & Fair Value", icon: "scale" },
        { id: "tenants", label: lang === "both" ? "Tenants · 租客" : "Tenants & Yield", icon: "users" },
        { id: "developer", label: lang === "both" ? "Developer · 开发商" : "Developer", icon: "hard-hat" },
      ]} />

      {tab === "prediction" && <TabPrediction p={p} lang={lang} persona={persona} />}
      {tab === "psf" && <TabPSF p={p} lang={lang} />}
      {tab === "tenants" && <TabTenants p={p} lang={lang} />}
      {tab === "developer" && <TabDeveloper p={p} lang={lang} />}
    </div>
  );
}

function TabPrediction({ p, lang, persona }) {
  return (
    <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: 16 }}>
      <Card pad={22} radius={16}>
        <div style={{ display: "flex", alignItems: "center", marginBottom: 10 }}>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 16, fontWeight: 700, letterSpacing: "-0.3px" }}>Price trajectory · 价格轨迹</div>
            <div style={{ fontSize: 12, color: "var(--fg-muted)", marginTop: 2 }}>
              Launch → TOP → +5yr · confidence band indicates range of scenarios
            </div>
          </div>
          <Tag tone="neutral" dot={false}>{p.verdictLabel}</Tag>
        </div>
        <PredictionChart project={p} height={280} />
        {p._forecast && (
          <div style={{ display: "flex", gap: 10, marginTop: 14, flexWrap: "wrap", alignItems: "center" }}>
            <span style={{ fontSize: 9, fontWeight: 700, letterSpacing: "0.08em",
              background: p._forecast.ppiCagr != null ? "#E9FBEF" : "#FFF1E5",
              color: p._forecast.ppiCagr != null ? "#2B873F" : "#C85D00",
              padding: "3px 8px", borderRadius: 9999 }}>
              {p._forecast.ppiCagr != null ? "LIVE · data.gov.sg" : "OFFLINE · base rate"}
            </span>
            <span style={{ fontSize: 11, color: "var(--fg-muted)", fontFamily: "var(--font-mono)" }}>
              {p._forecast.ppiCagr != null
                ? `PPI ${p._forecast.ppiQuarter} · CAGR ${p._forecast.ppiCagr}%/yr · horizon ${p._forecast.horizonYears}yr`
                : `base 4%/yr · horizon ${p._forecast.horizonYears}yr · (data.gov.sg rate-limited)`}
            </span>
          </div>
        )}
        <div style={{ marginTop: 14, padding: 14, background: "var(--gray-10)", borderRadius: 10, fontSize: 12, color: "var(--fg-muted)", lineHeight: 1.5 }}>
          <strong style={{ color: "var(--fg-default)" }}>How we forecast · 预测方法：</strong>{" "}
          {p._forecast
            ? p._forecast.method + " This is a trend-based estimate, not a hedonic model."
            : "Developer premium vs. resale PSF, day-1 absorption curve, forward supply pressure, MRT connectivity score, and URA Master Plan catalysts — weighted per persona."}
        </div>
      </Card>

      <Card pad={22} radius={16}>
        <div style={{ display: "flex", alignItems: "center", marginBottom: 2 }}>
          <div style={{ flex: 1, fontSize: 14, fontWeight: 700, letterSpacing: "-0.2px" }}>Attribution · 归因</div>
          {p._forecast?.attribution && (
            <span style={{ fontSize: 9, fontWeight: 700, letterSpacing: "0.08em", background: "#E9FBEF", color: "#2B873F", padding: "2px 6px", borderRadius: 9999 }}>LIVE</span>
          )}
        </div>
        <div style={{ fontSize: 12, color: "var(--fg-muted)", marginTop: 2, marginBottom: 14 }}>What drives the forecast · %-pt contribution to uplift</div>
        {(p._forecast?.attribution || [
          { label: "Day-1 absorption",   v: p.day1Sold ?? 55, cap: 100, w: "—", pos: (p.day1Sold ?? 55) > 55, reason: "Loading…" },
          { label: "Developer premium",  v: Math.min(100, (p.premiumIndex ?? 10) * 2.5), cap: 100, w: "—", pos: false, reason: "Loading…" },
          { label: "MRT · connectivity", v: 75, cap: 100, w: "—", pos: true, reason: "Loading…" },
          { label: "Supply pipeline",    v: 60, cap: 100, w: "—", pos: true, reason: "Loading…" },
          { label: "Rental yield",       v: 65, cap: 100, w: "—", pos: true, reason: "Loading…" },
          { label: "School catchment",   v: 60, cap: 100, w: "—", pos: true, reason: "Loading…" },
        ]).map((f, i) => (
          <div key={i} style={{ marginBottom: 14 }}>
            <div style={{ display: "flex", fontSize: 12, marginBottom: 3, alignItems: "center" }}>
              <span style={{ flex: 1, color: "var(--fg-default)", fontWeight: 600 }}>{f.label}</span>
              <span style={{
                fontFamily: "var(--font-mono)", fontSize: 11, fontWeight: 600,
                color: f.pos ? "#2B873F" : "#C32B2B",
              }}>{f.w}</span>
            </div>
            <div style={{ height: 5, background: "var(--gray-20)", borderRadius: 9999, overflow: "hidden", marginBottom: 5 }}>
              <div style={{ width: `${(f.v / f.cap) * 100}%`, height: "100%", background: f.pos ? "#70FC8E" : "#FF902E" }} />
            </div>
            {f.reason && (
              <div style={{ fontSize: 10, color: "var(--fg-muted)", lineHeight: 1.4 }}>{f.reason}</div>
            )}
          </div>
        ))}
      </Card>

      <Card pad={22} radius={16} style={{ gridColumn: "span 2" }}>
        <div style={{ fontSize: 14, fontWeight: 700, letterSpacing: "-0.2px", marginBottom: 12 }}>Key highlights · 关键信号</div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12 }}>
          {p.highlights?.map((h, i) => (
            <div key={i} style={{
              padding: 14, borderRadius: 10,
              background: h.tone === "success" ? "#E9FBEF" : h.tone === "warning" ? "#FFF1E5" : "#E5F1FF",
              borderLeft: `3px solid ${h.tone === "success" ? "#2B873F" : h.tone === "warning" ? "#C85D00" : "#005DCA"}`,
            }}>
              <div style={{ fontSize: 13, color: "var(--fg-default)", fontWeight: 500, lineHeight: 1.45 }}>{h.en}</div>
              {lang === "both" && <div style={{ fontSize: 11, color: "var(--fg-muted)", marginTop: 6 }}>{h.zh}</div>}
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}

function TabPSF({ p, lang }) {
  const [hdbRows, setHdbRows] = useStateD(null);
  const [hdbTown, setHdbTown] = useStateD(null);
  useEffectD(() => {
    const town = window.LIVE_DATA?.hdbTownForProject(p);
    if (town) {
      setHdbTown(town);
      window.LIVE_DATA.fetchHDBResale(town).then(setHdbRows).catch(() => {});
    }
  }, [p.id]);

  const costBuild = 450, cost = p.landRatePsf + costBuild;
  const margin15 = cost * 1.15, margin20 = cost * 1.20;
  return (
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
      <Card pad={22} radius={16}>
        <div style={{ fontSize: 14, fontWeight: 700, letterSpacing: "-0.2px" }}>Fair PSF build-up · 合理尺价测算</div>
        <div style={{ fontSize: 12, color: "var(--fg-muted)", marginTop: 2, marginBottom: 16 }}>Land + build + developer margin</div>
        {[
          { label: "Land Rate PSF ppr · 地价", v: p.landRatePsf, color: "var(--gray-80)" },
          { label: "Construction & fees · 建设成本", v: 450, color: "var(--gray-60)" },
          { label: "Margin @ 15% · 利润15%", v: margin15 - cost, color: "#70FC8E" },
          { label: "Margin @ 20% · 利润20%", v: margin20 - margin15, color: "#4AC263" },
        ].map((r, i) => (
          <div key={i} style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
            <div style={{ flex: 1, fontSize: 12, fontWeight: 600 }}>{r.label}</div>
            <div style={{ height: 10, width: 180, background: "var(--gray-20)", borderRadius: 9999, overflow: "hidden" }}>
              <div style={{ width: `${(r.v / margin20) * 100}%`, height: "100%", background: r.color }} />
            </div>
            <div style={{ width: 80, textAlign: "right", fontFamily: "var(--font-mono)", fontSize: 12, fontWeight: 600 }}>${Math.round(r.v)}</div>
          </div>
        ))}
        <div style={{ marginTop: 14, padding: 14, background: "var(--gray-10)", borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div>
            <div style={{ fontSize: 11, color: "var(--fg-muted)", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em" }}>Fair launch PSF</div>
            <div style={{ fontSize: 20, fontWeight: 700, fontFamily: "var(--font-mono)", letterSpacing: "-0.4px", marginTop: 2 }}>
              ${Math.round(margin15)} – ${Math.round(margin20)}
            </div>
          </div>
          <div style={{ textAlign: "right" }}>
            <div style={{ fontSize: 11, color: "var(--fg-muted)", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em" }}>Actual launch</div>
            <div style={{ fontSize: 20, fontWeight: 700, fontFamily: "var(--font-mono)", color: p.launchPsf > margin20 ? "#C32B2B" : "#2B873F", letterSpacing: "-0.4px", marginTop: 2 }}>
              ${p.launchPsf}
            </div>
          </div>
        </div>
      </Card>

      <Card pad={22} radius={16}>
        <div style={{ fontSize: 14, fontWeight: 700, letterSpacing: "-0.2px" }}>Unit mix · 户型配比</div>
        <div style={{ fontSize: 12, color: "var(--fg-muted)", marginTop: 2, marginBottom: 14 }}>PSF by bedroom count</div>
        <div style={{ display: "flex", height: 14, borderRadius: 9999, overflow: "hidden", marginBottom: 14, border: "1px solid var(--border-muted)" }}>
          {p.unitMix?.map((u, i) => (
            <div key={i} style={{
              width: `${u.pct}%`,
              background: ["#3765F6", "#70FC8E", "#FF902E", "#929FB1"][i],
            }} />
          ))}
        </div>
        {p.unitMix?.map((u, i) => (
          <div key={i} style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 0", borderTop: i === 0 ? "none" : "1px solid var(--border-muted)" }}>
            <span style={{ width: 10, height: 10, borderRadius: 3, background: ["#3765F6", "#70FC8E", "#FF902E", "#929FB1"][i] }} />
            <span style={{ flex: 1, fontSize: 13, fontWeight: 600 }}>
              {u.type} {lang === "both" && <span style={{ color: "var(--fg-muted)", fontWeight: 500 }}>· {u.zh}</span>}
            </span>
            <span style={{ fontFamily: "var(--font-mono)", fontSize: 12, color: "var(--fg-muted)" }}>{u.pct}%</span>
            <span style={{ fontFamily: "var(--font-mono)", fontSize: 13, fontWeight: 600, width: 64, textAlign: "right" }}>${u.psf}</span>
          </div>
        ))}
      </Card>

      <Card pad={22} radius={16} style={{ gridColumn: "span 2" }}>
        <div style={{ display: "flex", alignItems: "center", marginBottom: 2 }}>
          <div style={{ flex: 1, fontSize: 14, fontWeight: 700, letterSpacing: "-0.2px" }}>
            {hdbRows ? "HDB resale benchmark · 组屋转售基准" : "Vs. nearby resale · 周边转售对比"}
          </div>
          {hdbRows && (
            <span style={{
              fontSize: 9, fontWeight: 700, letterSpacing: "0.08em",
              background: "#E9FBEF", color: "#2B873F", padding: "2px 6px", borderRadius: 9999,
            }}>LIVE · data.gov.sg</span>
          )}
        </div>
        <div style={{ fontSize: 12, color: "var(--fg-muted)", marginTop: 2, marginBottom: 14 }}>
          {hdbRows
            ? `Recent HDB resale transactions in ${hdbTown} — public housing benchmark for the neighbourhood`
            : "Recent caveats within 800m, last 6mo"}
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12 }}>
          {hdbRows === null ? (
            // Loading / fallback static
            [
              { name: "Amber Park", psf: 2380, age: "2023 TOP", delta: +4 },
              { name: "The Continuum", psf: 2450, age: "2027 TOP", delta: +1 },
              { name: "Meyer Mansion", psf: 2280, age: "2024 TOP", delta: +9 },
              { name: "Amber Sea", psf: 2150, age: "2020 TOP", delta: +15 },
            ].map((r, i) => (
              <div key={i} style={{ padding: 14, border: "1px solid var(--border-muted)", borderRadius: 10 }}>
                <div style={{ fontSize: 12, fontWeight: 600 }}>{r.name}</div>
                <div style={{ fontSize: 20, fontWeight: 700, fontFamily: "var(--font-mono)", letterSpacing: "-0.4px", marginTop: 4 }}>${r.psf}</div>
                <div style={{ fontSize: 11, color: "var(--fg-muted)", marginTop: 2 }}>{r.age}</div>
                <div style={{ fontSize: 11, color: "#2B873F", fontWeight: 600, marginTop: 6 }}>{p.name} +{r.delta}%</div>
              </div>
            ))
          ) : hdbRows.length === 0 ? (
            <div style={{ gridColumn: "span 4", fontSize: 13, color: "var(--fg-muted)", padding: 14 }}>
              No HDB resale data found for this area.
            </div>
          ) : (
            hdbRows.map((r, i) => {
              const psfLaunch = p.launchPsf || p.avgPsf;
              const premium = psfLaunch ? Math.round((psfLaunch / r.medianPsf - 1) * 100) : null;
              return (
                <div key={i} style={{ padding: 14, border: "1px solid var(--border-muted)", borderRadius: 10 }}>
                  <div style={{ fontSize: 12, fontWeight: 600 }}>{r.type}</div>
                  <div style={{ fontSize: 10, color: "var(--fg-muted)", marginTop: 1, textTransform: "uppercase", letterSpacing: "0.04em", fontWeight: 600 }}>
                    HDB · {hdbTown}
                  </div>
                  <div style={{ fontSize: 20, fontWeight: 700, fontFamily: "var(--font-mono)", letterSpacing: "-0.4px", marginTop: 6 }}>
                    ${r.medianPsf.toLocaleString()}
                  </div>
                  <div style={{ fontSize: 11, color: "var(--fg-muted)", marginTop: 2 }}>
                    Median PSF · {r.txCount} tx · {r.latestMonth}
                  </div>
                  {premium !== null && (
                    <div style={{ fontSize: 11, fontWeight: 600, marginTop: 6, color: premium > 30 ? "#C32B2B" : "#C85D00" }}>
                      {p.name} +{premium}% premium
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </Card>
    </div>
  );
}

function TabTenants({ p, lang }) {
  const [rentalIdx, setRentalIdx] = useStateD(null);
  useEffectD(() => {
    const locality = window.LIVE_DATA?.rentalLocalityForProject(p);
    window.LIVE_DATA?.fetchRentalIndex(locality).then(setRentalIdx).catch(() => {});
  }, [p.id]);

  const rentalQoQ = rentalIdx && rentalIdx.length >= 2
    ? parseFloat(((rentalIdx[rentalIdx.length - 1].index - rentalIdx[rentalIdx.length - 2].index) /
        rentalIdx[rentalIdx.length - 2].index * 100).toFixed(1))
    : null;

  return (
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
      <Card pad={22} radius={16}>
        <div style={{ fontSize: 14, fontWeight: 700, letterSpacing: "-0.2px" }}>Tenant profile · 租客画像</div>
        <div style={{ fontSize: 12, color: "var(--fg-muted)", marginTop: 2, marginBottom: 14 }}>Post-TOP primary market</div>
        <Stub h={140} label="Tenant segmentation placeholder" />
        <div style={{ fontSize: 13, color: "var(--fg-default)", lineHeight: 1.55, marginTop: 14 }}>
          {p.tenantProfile}
        </div>
      </Card>

      <Card pad={22} radius={16}>
        <div style={{ display: "flex", alignItems: "center", marginBottom: 14 }}>
          <div style={{ flex: 1, fontSize: 14, fontWeight: 700, letterSpacing: "-0.2px" }}>Rental outlook · 租金展望</div>
          {rentalIdx && (
            <span style={{
              fontSize: 9, fontWeight: 700, letterSpacing: "0.08em",
              background: "#E9FBEF", color: "#2B873F", padding: "2px 6px", borderRadius: 9999,
            }}>LIVE</span>
          )}
        </div>
        {rentalIdx && rentalIdx.length >= 2 && (
          <div style={{ marginBottom: 14 }}>
            <div style={{ fontSize: 11, color: "var(--fg-muted)", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 6 }}>
              {rentalIdx[rentalIdx.length - 1].locality} Rental Index · {rentalIdx[rentalIdx.length - 1].quarter}
            </div>
            <div style={{ display: "flex", alignItems: "flex-end", gap: 10 }}>
              <span style={{ fontSize: 24, fontWeight: 700, fontFamily: "var(--font-mono)", letterSpacing: "-0.4px" }}>
                {rentalIdx[rentalIdx.length - 1].index.toFixed(1)}
              </span>
              <span style={{
                fontSize: 11, fontWeight: 600, padding: "2px 8px", borderRadius: 9999, marginBottom: 4,
                background: rentalQoQ >= 0 ? "#E9FBEF" : "#FFEDED",
                color: rentalQoQ >= 0 ? "#2B873F" : "#C32B2B",
              }}>
                {rentalQoQ >= 0 ? "▲" : "▼"} {Math.abs(rentalQoQ)}% QoQ
              </span>
            </div>
            <Sparkline
              data={rentalIdx.map(r => r.index)}
              color={rentalQoQ >= 0 ? "#2B873F" : "#C32B2B"}
              fill={rentalQoQ >= 0 ? "rgba(112,252,142,0.18)" : "rgba(227,62,62,0.10)"}
              height={48}
            />
          </div>
        )}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 14 }}>
          <Metric label="Gross yield (proj.)" value={`${p.rentalYield}%`} delta={`${p.district?.split("·")[0]?.trim()} median 3.6%`} deltaTone="up" />
          <Metric label="Vacancy risk" value={p.vacancyRisk ? (p.vacancyRisk.charAt(0).toUpperCase() + p.vacancyRisk.slice(1)) : "Low"} deltaTone={p.vacancyRisk === "medium" ? "flat" : "up"} mono={false} />
          <Metric label="Breakeven rent" value="$6,400/mo" mono={false} />
          <Metric label="Competing supply" value={`${p.competingSupply || "—"}`} delta="units within 1.5km, 3yr" deltaTone="flat" />
        </div>
      </Card>

      <Card pad={22} radius={16} style={{ gridColumn: "span 2" }}>
        <div style={{ fontSize: 14, fontWeight: 700, letterSpacing: "-0.2px", marginBottom: 12 }}>Catchment · 学区与交通</div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12 }}>
          <div style={{ padding: 14, border: "1px solid var(--border-muted)", borderRadius: 10 }}>
            <div style={{ fontSize: 11, color: "var(--fg-muted)", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em" }}>Transit · 交通</div>
            <div style={{ fontSize: 14, fontWeight: 600, marginTop: 4 }}>{p.mrtDistance}</div>
          </div>
          <div style={{ padding: 14, border: "1px solid var(--border-muted)", borderRadius: 10 }}>
            <div style={{ fontSize: 11, color: "var(--fg-muted)", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em" }}>Schools · 学区</div>
            <div style={{ fontSize: 13, fontWeight: 500, marginTop: 4 }}>{p.schools?.join(" · ") || "—"}</div>
          </div>
          <div style={{ padding: 14, border: "1px solid var(--border-muted)", borderRadius: 10 }}>
            <div style={{ fontSize: 11, color: "var(--fg-muted)", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em" }}>Master Plan · 蓝图</div>
            <div style={{ fontSize: 13, fontWeight: 500, marginTop: 4 }}>Marine Parade town centre rejuvenation · TEL3 operational 2026</div>
          </div>
        </div>
      </Card>
    </div>
  );
}

function TabDeveloper({ p, lang }) {
  const track = [
    { name: "Riviere", year: 2022, uplift: "+12%", quality: 4.2 },
    { name: "One Holland Village", year: 2023, uplift: "+8%", quality: 3.9 },
    { name: "Royalgreen", year: 2021, uplift: "+18%", quality: 4.4 },
    { name: "Juniper Hill", year: 2023, uplift: "+5%", quality: 3.7 },
  ];
  return (
    <div style={{ display: "grid", gridTemplateColumns: "1.3fr 1fr", gap: 16 }}>
      <Card pad={22} radius={16}>
        <div style={{ fontSize: 14, fontWeight: 700, letterSpacing: "-0.2px" }}>{p.developer} · track record</div>
        <div style={{ fontSize: 12, color: "var(--fg-muted)", marginTop: 2, marginBottom: 14 }}>Past 4 completed projects · TOP uplift & quality</div>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
          <thead>
            <tr style={{ textAlign: "left", color: "var(--fg-muted)", fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em" }}>
              <th style={{ padding: "6px 0" }}>Project</th>
              <th style={{ padding: "6px 0" }}>Year</th>
              <th style={{ padding: "6px 0", textAlign: "right" }}>Post-TOP uplift</th>
              <th style={{ padding: "6px 0", textAlign: "right" }}>Quality</th>
            </tr>
          </thead>
          <tbody>
            {track.map((t, i) => (
              <tr key={i} style={{ borderTop: "1px solid var(--border-muted)" }}>
                <td style={{ padding: "10px 0", fontWeight: 600 }}>{t.name}</td>
                <td style={{ padding: "10px 0", color: "var(--fg-muted)", fontFamily: "var(--font-mono)" }}>{t.year}</td>
                <td style={{ padding: "10px 0", textAlign: "right", fontFamily: "var(--font-mono)", fontWeight: 600, color: "#2B873F" }}>{t.uplift}</td>
                <td style={{ padding: "10px 0", textAlign: "right", fontFamily: "var(--font-mono)" }}>{t.quality} ★</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>

      <Card pad={22} radius={16}>
        <div style={{ fontSize: 14, fontWeight: 700, letterSpacing: "-0.2px" }}>Reputation signals</div>
        <div style={{ fontSize: 12, color: "var(--fg-muted)", marginTop: 2, marginBottom: 14 }}>Aggregated from buyer reviews & handover defects</div>
        {[
          { label: "Build quality · 工程质量", v: 82 },
          { label: "Material spec · 用料", v: 76 },
          { label: "Handover defects · 交付瑕疵", v: 68, inv: true },
          { label: "Post-TOP MCST · 管理", v: 71 },
        ].map((r, i) => (
          <div key={i} style={{ marginBottom: 12 }}>
            <div style={{ display: "flex", fontSize: 12, marginBottom: 4 }}>
              <span style={{ flex: 1, fontWeight: 600 }}>{r.label}</span>
              <span style={{ fontFamily: "var(--font-mono)", color: "var(--fg-muted)" }}>{r.v}/100</span>
            </div>
            <div style={{ height: 6, background: "var(--gray-20)", borderRadius: 9999, overflow: "hidden" }}>
              <div style={{ width: `${r.v}%`, height: "100%", background: r.v > 75 ? "#70FC8E" : r.v > 60 ? "#3765F6" : "#FF902E" }} />
            </div>
          </div>
        ))}
      </Card>
    </div>
  );
}

window.ProjectDetail = ProjectDetail;
