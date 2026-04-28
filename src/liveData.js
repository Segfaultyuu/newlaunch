/* Live data — data.gov.sg (free, no API key required for basic access)
 *
 * TO REDUCE RATE LIMITS — get a free API key:
 *   https://guide.data.gov.sg/developer-guide/api-overview/how-to-request-an-api-key
 *   Then set:  window.DATA_GOV_API_KEY = "your-key-here"  (before the page loads)
 *
 * FOR RICHER DATA (PSF per project, developer sales, pipeline) — free URA registration:
 *   https://eservice.ura.gov.sg/maps/api/reg.html
 *   Then set:  window.URA_ACCESS_KEY = "your-key-here"
 */

const DATA_GOV = "https://data.gov.sg/api/action/datastore_search";

const DS = {
  PPI:    "d_97f8a2e995022d311c6c68cfda6d034c", // Private Residential Price Index (quarterly, 1975–present)
  RENTAL: "d_8e4c50283fb7052a391dfb746a05c853", // Private Residential Rental Index (quarterly, 2004–present, ~510 rows)
  HDB:    "d_8b84c4ee58e3cfc0ece0d773c8ca6abc", // HDB Resale Flat Prices (individual transactions, 2017–present)
};

// Rental index locality field values (as stored in the dataset)
const LOCALITY_NAME = {
  OCR: "Outside Central Region",
  RCR: "Rest of Central Region",
  CCR: "Core Central Region",
};

// sessionStorage cache — 30-minute TTL, cleared on refresh-after-cache-clear
function _cache(key, fn) {
  try {
    const hit = sessionStorage.getItem("nlf_v1_" + key);
    if (hit) {
      const { ts, data } = JSON.parse(hit);
      if (Date.now() - ts < 30 * 60 * 1000) return Promise.resolve(data);
    }
  } catch (_) {}
  return fn().then(data => {
    try { sessionStorage.setItem("nlf_v1_" + key, JSON.stringify({ ts: Date.now(), data })); } catch (_) {}
    return data;
  });
}

async function _dg(id, params) {
  const url = new URL(DATA_GOV);
  url.searchParams.set("resource_id", id);
  for (const [k, v] of Object.entries(params || {})) {
    url.searchParams.set(k, typeof v === "object" ? JSON.stringify(v) : String(v));
  }
  const headers = {};
  if (window.DATA_GOV_API_KEY) headers["x-api-key"] = window.DATA_GOV_API_KEY;
  const r = await fetch(url.toString(), { mode: "cors", headers });
  if (!r.ok) throw new Error(`HTTP ${r.status}`);
  const j = await r.json();
  if (!j.success) throw new Error(j.errorMsg || "data.gov.sg API error");
  return j.result;
}

/* ─── Private Residential Property Price Index ──────────────────────────── */
// Confirmed: _id desc sort returns newest records for this dataset.
// Returns { quarter, index, qoqPct, yoyPct, history:[{quarter,index}] }
function fetchPPI() {
  return _cache("ppi", async () => {
    const res = await _dg(DS.PPI, { limit: 24, sort: "_id desc" });
    // Filter for Non-Landed (closest to new-launch condos)
    const rows = res.records
      .filter(r => r.property_type === "Non-Landed")
      .sort((a, b) => b._id - a._id);
    if (rows.length < 2) throw new Error("Insufficient PPI data");

    const cur  = parseFloat(rows[0].index);
    const prev = parseFloat(rows[1].index);
    const yoy  = rows.length >= 5 ? parseFloat(rows[4].index) : null;

    return {
      quarter: rows[0].quarter,
      index:   cur,
      qoqPct:  parseFloat(((cur - prev) / prev * 100).toFixed(1)),
      yoyPct:  yoy ? parseFloat(((cur - yoy) / yoy * 100).toFixed(1)) : null,
      history: rows.slice(0, 8).reverse().map(r => ({ quarter: r.quarter, index: parseFloat(r.index) })),
    };
  });
}

/* ─── Private Residential Rental Index by region ────────────────────────── */
// Dataset has ~510 rows total (6 locality+type combos × ~85 quarters from 2004).
// We fetch the last 48 rows via offset (covers ~8 quarters) then filter client-side.
// Returns [{ quarter, index, locality }] sorted oldest → newest
function fetchRentalIndex(region) {
  return _cache("rental_" + region, async () => {
    const locality = LOCALITY_NAME[region] || "Whole Island";

    // Attempt 1: offset-based tail fetch (fast, 1 request, non-keyed)
    const RENTAL_TOTAL = 510;
    const TAIL = 48;
    const offset = Math.max(0, RENTAL_TOTAL - TAIL);

    const res = await _dg(DS.RENTAL, { limit: TAIL, offset });
    let rows = res.records
      .filter(r => r.locality === locality && r.property_type === "Non-Landed")
      .sort((a, b) => a.quarter.localeCompare(b.quarter));

    if (rows.length === 0) {
      // Fallback: locality name may have changed — accept any locality
      rows = res.records
        .filter(r => r.property_type === "Non-Landed")
        .sort((a, b) => a.quarter.localeCompare(b.quarter));
    }

    return rows.map(r => ({ quarter: r.quarter, index: parseFloat(r.index), locality: r.locality }));
  });
}

/* ─── HDB Resale Flat Prices by town ─────────────────────────────────────── */
// Returns [{ type, avgPsf, medianPsf, txCount, latestMonth }] for common flat types
function fetchHDBResale(town) {
  return _cache("hdb_" + town, async () => {
    const res = await _dg(DS.HDB, {
      limit: 200,
      sort: "_id desc",
      filters: { town: town.toUpperCase() },
    });
    const byType = {};
    for (const r of res.records) {
      const sqm = parseFloat(r.floor_area_sqm);
      if (!sqm) continue;
      const psf = parseFloat(r.resale_price) / (sqm * 10.7639);
      if (!isFinite(psf) || psf < 50 || psf > 3000) continue;
      const t = r.flat_type;
      if (!byType[t]) byType[t] = { vals: [], months: [] };
      byType[t].vals.push(psf);
      byType[t].months.push(r.month);
    }
    const TYPES = ["3 ROOM", "4 ROOM", "5 ROOM", "EXECUTIVE"];
    return TYPES
      .filter(t => byType[t]?.vals.length > 0)
      .map(t => {
        const vals = byType[t].vals.slice().sort((a, b) => a - b);
        const mid  = vals[Math.floor(vals.length / 2)];
        return {
          type:        t,
          avgPsf:      Math.round(vals.reduce((s, v) => s + v, 0) / vals.length),
          medianPsf:   Math.round(mid),
          txCount:     vals.length,
          latestMonth: byType[t].months.sort().slice(-1)[0],
        };
      });
  });
}

/* ─── Project-level helpers ──────────────────────────────────────────────── */
const DISTRICT_HDB_TOWN = {
  D3:  "QUEENSTOWN",   D4:  "QUEENSTOWN",  D5:  "QUEENSTOWN",
  D10: "BUKIT TIMAH",  D11: "NOVENA",
  D12: "TOA PAYOH",    D13: "SERANGOON",   D14: "GEYLANG",
  D15: "MARINE PARADE",D16: "BEDOK",       D17: "PASIR RIS",
  D18: "TAMPINES",     D19: "SERANGOON",   D20: "ANG MO KIO",
  D21: "BUKIT TIMAH",  D22: "JURONG",      D23: "BUKIT BATOK",
  D24: "CHOA CHU KANG",D25: "WOODLANDS",   D26: "ANG MO KIO",
  D27: "YISHUN",       D28: "SENGKANG",
};

function hdbTownForProject(project) {
  if (!project?.district) return null;
  const key = project.district.split("·")[0].trim(); // "D15"
  return DISTRICT_HDB_TOWN[key] || null;
}

function rentalLocalityForProject(project) {
  if (project?.region?.startsWith("OCR")) return "OCR";
  if (project?.region === "RCR") return "RCR";
  if (project?.region === "CCR") return "CCR";
  return "OCR";
}

/* ─── Trend-based forecast ───────────────────────────────────────────────── */
// Parse TOP date strings like "Q2 2030", "2030", "Q4 2031" → Date (mid-quarter)
function _parseTopDate(s) {
  if (!s) return null;
  const m = String(s).match(/Q([1-4])\s*(\d{4})/i) || String(s).match(/(\d{4})/);
  if (!m) return null;
  if (m.length === 3) {
    const q = parseInt(m[1], 10), y = parseInt(m[2], 10);
    return new Date(y, (q - 1) * 3 + 1, 15); // mid of quarter
  }
  return new Date(parseInt(m[1], 10), 5, 30); // mid of year
}

// CAGR (%/yr) from an index series [{quarter, index}] or [number]
function _cagr(series) {
  if (!series || series.length < 5) return null;
  const vals = series.map(s => typeof s === "number" ? s : s.index).filter(Number.isFinite);
  if (vals.length < 5) return null;
  const first = vals[0], last = vals[vals.length - 1];
  const years = (vals.length - 1) / 4; // quarterly series
  if (first <= 0 || years <= 0) return null;
  return (Math.pow(last / first, 1 / years) - 1) * 100;
}

// Score MRT proximity from a plain-English string (0–100)
function _mrtScore(s) {
  if (!s) return 45;
  const t = s.toLowerCase();
  if (/integrated|directly connected|direct access|direct to/.test(t)) return 97;
  const m = t.match(/(\d+)\s*m/);
  if (m) {
    const d = parseInt(m[1]);
    if (d <= 150) return 94;
    if (d <= 300) return 88;
    if (d <= 500) return 79;
    if (d <= 800) return 68;
    return 55;
  }
  if (/within.*(walking|few)/.test(t)) return 72;
  return 50;
}

// Score supply pipeline (lower competing supply = higher score, 0–100)
function _supplyScore(units) {
  if (units == null) return 60;
  return Math.round(Math.max(10, 100 - units / 40));
}

// Score school catchment from array of school strings (0–100)
function _schoolScore(schools) {
  if (!schools?.length) return 30;
  const n = schools.length;
  const top = schools.some(s => /within 1km/i.test(s));
  return Math.min(98, 40 + n * 18 + (top ? 10 : 0));
}

// Returns: { horizonYears, ppiCagr, rentalCagr, upliftLow, upliftMid, upliftHigh,
//            fairLow, fairHigh, yieldAtTop, breakevenPsf, attribution, method }
// All values are LIVE trend-based projections — not a hedonic model.
async function forecastProject(project) {
  const top = _parseTopDate(project.topDate);
  const now = new Date();
  const horizonYears = top ? Math.max(0.5, (top - now) / (365.25 * 24 * 3600 * 1000)) : 3;

  const [ppi, rental] = await Promise.all([
    fetchPPI().catch(() => null),
    fetchRentalIndex(rentalLocalityForProject(project)).catch(() => null),
  ]);

  const ppiCagr = ppi?.history ? _cagr(ppi.history) : null;
  const rentalCagr = rental ? _cagr(rental.slice(-12)) : null;

  // Base growth = PPI CAGR, clipped to [1%, 8%] to damp tail quarters
  const baseCagr = ppiCagr != null ? Math.max(1, Math.min(8, ppiCagr)) : 4;

  // Modifiers (each ±1pt, additive on CAGR):
  //  day-1 sell-through: strong demand signal
  //  premiumIndex: developer charging above fair → mean-reversion drag
  //  verdict: pre-existing qualitative tilt
  //  newTown: first-mover in a new town — Punggol/Sengkang precedent (+30–50% over 5yr as town matures)
  const demandAdj = project.day1Sold != null
    ? (project.day1Sold - 55) / 45  // +1 at 100%, 0 at 55%, -1 at 10%
    : 0;
  const premiumAdj = project.premiumIndex != null
    ? -(project.premiumIndex - 10) / 20  // +0.5 at 0, 0 at 10%, -1 at 30%
    : 0;
  const verdictAdj = project.verdict === "outperform" ? 0.8
                   : project.verdict === "underperform" ? -0.8 : 0;
  const newTownAdj = project.newTown ? 1.0 : 0; // +1pt CAGR for new-town maturation premium

  const adjCagr = baseCagr + demandAdj + premiumAdj + verdictAdj + newTownAdj;
  const upliftMidPct = (Math.pow(1 + adjCagr / 100, horizonYears) - 1) * 100;
  // Band = ±40% of midpoint, floor of 4pt
  const half = Math.max(2, Math.abs(upliftMidPct) * 0.4);
  const upliftLow = Math.round(upliftMidPct - half);
  const upliftHigh = Math.round(upliftMidPct + half);

  // Fair PSF range = land + build + margin [15%, 20%]
  const build = 450;
  const cost = (project.landRatePsf || 1000) + build;
  const fairLow = Math.round(cost * 1.15);
  const fairHigh = Math.round(cost * 1.20);

  // Rental yield at TOP: today's yield × (1 + rentalCagr·h) / (1 + priceCagr·h)
  const yieldToday = project.rentalYield || 3.6;
  const rcr = rentalCagr != null ? Math.max(-3, Math.min(6, rentalCagr)) : baseCagr * 0.6;
  const yieldAtTop = yieldToday * Math.pow(1 + rcr / 100, horizonYears) /
                                   Math.pow(1 + baseCagr / 100, horizonYears);

  // ── Per-factor attribution ──────────────────────────────────────────────
  // Each score (0–100) drives the bar width; w is the %-pt contribution to
  // the total uplift range, derived from the same modifiers used above.
  const mrtScore   = _mrtScore(project.mrtDistance);
  const supplyScore = _supplyScore(project.competingSupply);
  const schoolScore = _schoolScore(project.schools);
  const yieldScore  = Math.min(100, Math.round((project.rentalYield || 3.6) / 5.5 * 100));

  // Weight = modifier × horizonYears (approximate %-pt delta on uplift)
  const wDemand   = parseFloat((demandAdj   * horizonYears).toFixed(1));
  const wPremium  = parseFloat((premiumAdj  * horizonYears).toFixed(1));
  const wMrt      = parseFloat(((mrtScore - 65) / 35 * horizonYears * 0.6).toFixed(1));
  const wSupply   = parseFloat(((supplyScore - 60) / 40 * horizonYears * -0.5).toFixed(1));
  const wRental   = parseFloat(((yieldScore - 55) / 45 * horizonYears * 0.3).toFixed(1));
  const wSchool   = parseFloat(((schoolScore - 50) / 50 * horizonYears * 0.25).toFixed(1));
  const wNewTown  = parseFloat((newTownAdj * horizonYears).toFixed(1));

  const _fmt = n => (n >= 0 ? "+" : "") + n + "pt";

  // Human-readable reasons, derived from project data
  const day1 = project.day1Sold;
  const reasonDemand = day1 != null
    ? `${day1}% of ${project.units || "—"} units sold day 1 — ${day1 >= 90 ? "exceptional" : day1 >= 70 ? "strong" : day1 >= 50 ? "moderate" : "soft"} market reception`
    : project.entryScore != null
      ? `Not yet launched · entry score ${project.entryScore}/100`
      : "No sell-through data available";

  const pIdx = project.premiumIndex ?? 10;
  const launchVsFair = project.launchPsf && fairLow
    ? Math.round((project.launchPsf / fairLow - 1) * 100)
    : null;
  const reasonPremium = launchVsFair != null
    ? `Launch $${project.launchPsf?.toLocaleString()} PSF is ${launchVsFair >= 0 ? launchVsFair + "% above" : Math.abs(launchVsFair) + "% below"} fair floor of $${fairLow.toLocaleString()} — ${pIdx > 20 ? "mean-reversion drag" : pIdx > 10 ? "moderate premium" : "priced near fair value"}`
    : `Developer premium index ${pIdx}/40 — ${pIdx > 20 ? "above-fair pricing may cap resale upside" : "within normal margin band"}`;

  const reasonMrt = project.mrtDistance
    ? `${project.mrtDistance} · connectivity score ${mrtScore}/100`
    : "MRT proximity not specified";

  const supplyUnits = project.competingSupply;
  const reasonSupply = supplyUnits != null
    ? `${supplyUnits.toLocaleString()} competing units within 1.5km over 3 yrs — ${supplyUnits < 1000 ? "thin pipeline, supports pricing" : supplyUnits < 3000 ? "moderate supply, manageable" : "heavy pipeline, near-term headwind"}`
    : "Supply pipeline data not available";

  const ryield = project.rentalYield || 3.6;
  const regionBench = project.region?.startsWith("CCR") ? 3.2 : project.region === "RCR" ? 3.5 : 3.7;
  const reasonRental = `${ryield}% gross yield vs ${regionBench}% ${project.region || ""} benchmark${rentalCagr != null ? ` · rental index CAGR ${rentalCagr.toFixed(1)}%/yr` : ""}`;

  const schools = project.schools || [];
  const reasonSchool = schools.length
    ? schools.slice(0, 2).join(" · ") + (schools.length > 2 ? ` + ${schools.length - 2} more` : "")
    : "No priority schools within 1km";

  const reasonNewTown = project.newTown
    ? `First private condo in a new planned town — Punggol/Sengkang precedent shows +30–50% uplift over 5yrs as town matures with MRT, amenities and JLD spillover`
    : null;

  const attribution = [
    { label: "Day-1 absorption",   v: project.day1Sold ?? 55,   cap: 100, w: _fmt(wDemand),  pos: wDemand  >= 0, reason: reasonDemand },
    { label: "Developer premium",  v: Math.min(100, pIdx * 2.5), cap: 100, w: _fmt(wPremium), pos: wPremium >= 0, reason: reasonPremium },
    { label: "MRT · connectivity", v: mrtScore,    cap: 100, w: _fmt(wMrt),    pos: wMrt    >= 0, reason: reasonMrt },
    { label: "Supply pipeline",    v: supplyScore, cap: 100, w: _fmt(wSupply), pos: wSupply >= 0, reason: reasonSupply },
    { label: "Rental yield",       v: yieldScore,  cap: 100, w: _fmt(wRental), pos: wRental >= 0, reason: reasonRental },
    { label: "School catchment",   v: schoolScore, cap: 100, w: _fmt(wSchool), pos: wSchool >= 0, reason: reasonSchool },
    ...(project.newTown ? [{ label: "New-town catalyst", v: 92, cap: 100, w: _fmt(wNewTown), pos: true, reason: reasonNewTown }] : []),
  ];

  return {
    horizonYears: parseFloat(horizonYears.toFixed(1)),
    ppiCagr: ppiCagr != null ? parseFloat(ppiCagr.toFixed(1)) : null,
    rentalCagr: rentalCagr != null ? parseFloat(rentalCagr.toFixed(1)) : null,
    ppiQuarter: ppi?.quarter || null,
    upliftMid: Math.round(upliftMidPct),
    upliftLow,
    upliftHigh,
    fairLow,
    fairHigh,
    yieldAtTop: parseFloat(yieldAtTop.toFixed(2)),
    breakevenPsf: Math.round(cost),
    attribution,
    method: `Trend extrapolation: ${ppiCagr != null ? ppiCagr.toFixed(1) + "%/yr PPI CAGR" : "4%/yr base"}${rentalCagr != null ? ` · ${rentalCagr.toFixed(1)}%/yr rental CAGR` : ""} over ${horizonYears.toFixed(1)} yrs to TOP, adjusted for day-1 absorption, developer premium${project.newTown ? ", and new-town maturation catalyst (+1pt CAGR)" : ""}.`,
  };
}

window.LIVE_DATA = {
  fetchPPI,
  fetchRentalIndex,
  fetchHDBResale,
  hdbTownForProject,
  rentalLocalityForProject,
  forecastProject,
};
