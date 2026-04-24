/* global React, Card, Icon, Button, Slider, Tag, Metric */
const { useState: useStateC, useMemo: useMemoC } = React;

function Calculator({ lang }) {
  const [price, setPrice] = useStateC(2400000);
  const [loanPct, setLoanPct] = useStateC(75);
  const [rate, setRate] = useStateC(3.5);
  const [tenure, setTenure] = useStateC(30);
  const [buildMonths, setBuildMonths] = useStateC(42);

  const loan = price * (loanPct / 100);
  const down = price - loan;
  const monthly = (loan * (rate / 100 / 12)) / (1 - Math.pow(1 + rate / 100 / 12, -tenure * 12));

  // Progressive Payment Scheme (typical SG milestones, % of price)
  const pps = [
    { pct: 5, name: "Booking fee · 订金", at: 0 },
    { pct: 15, name: "Sale & Purchase · S&P", at: 2 },
    { pct: 10, name: "Foundation · 地基", at: Math.round(buildMonths * 0.2) },
    { pct: 10, name: "Reinforced concrete · 钢筋混凝土", at: Math.round(buildMonths * 0.35) },
    { pct: 5, name: "Brick walls · 砖墙", at: Math.round(buildMonths * 0.5) },
    { pct: 5, name: "Roofing · 封顶", at: Math.round(buildMonths * 0.6) },
    { pct: 5, name: "Finishes · 装修", at: Math.round(buildMonths * 0.72) },
    { pct: 5, name: "Car park & drainage · 车库排水", at: Math.round(buildMonths * 0.82) },
    { pct: 25, name: "TOP · 交房", at: buildMonths },
    { pct: 15, name: "CSC · 入伙", at: buildMonths + 12 },
  ];
  let cumLoan = 0;
  const rows = pps.map((s, i) => {
    const amount = price * (s.pct / 100);
    // Down payment covers first 25% (5% + 20% typically), remainder is loan-drawn
    const downRemaining = Math.max(0, down - price * pps.slice(0, i).reduce((a, b) => a + b.pct, 0) / 100);
    const downUsed = Math.min(amount, downRemaining);
    const loanDrawn = amount - downUsed;
    cumLoan += loanDrawn;
    // rough interest-only while building
    const interestOnly = (cumLoan * rate / 100) / 12;
    return { ...s, amount, downUsed, loanDrawn, cumLoan, interestOnly };
  });

  return (
    <div style={{ padding: 24, display: "flex", flexDirection: "column", gap: 16 }}>
      <Card pad={0} radius={16} style={{ background: "var(--gray-100)", color: "#fff", overflow: "hidden" }}>
        <div style={{ padding: "22px 26px", display: "flex", alignItems: "center", gap: 14 }}>
          <Icon name="calculator" size={20} color="#70FC8E" />
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 18, fontWeight: 700, letterSpacing: "-0.3px" }}>Progressive Payment Simulator</div>
            <div style={{ fontSize: 12, color: "var(--gray-40)", marginTop: 2 }}>期房阶段性付款计算器 · Model your cash-flow from booking to CSC</div>
          </div>
          <Tag tone="brand">Live · 实时</Tag>
        </div>
      </Card>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1.5fr", gap: 16 }}>
        {/* Inputs */}
        <Card pad={22} radius={16}>
          <div style={{ fontSize: 14, fontWeight: 700, letterSpacing: "-0.2px", marginBottom: 14 }}>Inputs · 参数</div>
          <Field label="Purchase price · 购房总价" zh>
            <Slider value={price} onChange={setPrice} min={800000} max={5000000} step={50000} format={v => `$${(v/1000).toLocaleString()}k`} />
          </Field>
          <Field label="Loan-to-value · 贷款成数" zh>
            <Slider value={loanPct} onChange={setLoanPct} min={25} max={75} step={5} format={v => `${v}%`} />
          </Field>
          <Field label="Interest rate · 年利率" zh>
            <Slider value={rate} onChange={setRate} min={1.5} max={6} step={0.1} format={v => `${v.toFixed(1)}%`} />
          </Field>
          <Field label="Loan tenure · 贷款年限" zh>
            <Slider value={tenure} onChange={setTenure} min={10} max={35} step={1} format={v => `${v} yrs`} />
          </Field>
          <Field label="Build duration · 建设周期" zh>
            <Slider value={buildMonths} onChange={setBuildMonths} min={30} max={60} step={3} format={v => `${v} mo`} />
          </Field>

          <div style={{ marginTop: 18, padding: 14, background: "var(--gray-10)", borderRadius: 10, display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 10 }}>
            <Metric label="Downpayment" value={`$${Math.round(down).toLocaleString()}`} mono />
            <Metric label="Loan amount" value={`$${Math.round(loan).toLocaleString()}`} mono />
            <Metric label="Monthly (post-TOP)" value={`$${Math.round(monthly).toLocaleString()}`} mono />
            <Metric label="Total interest" value={`$${Math.round(monthly*tenure*12-loan).toLocaleString()}`} mono />
          </div>
        </Card>

        {/* Stages + chart */}
        <Card pad={22} radius={16}>
          <div style={{ display: "flex", alignItems: "center", marginBottom: 14 }}>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 14, fontWeight: 700, letterSpacing: "-0.2px" }}>PPS Stages · 阶段性付款</div>
              <div style={{ fontSize: 12, color: "var(--fg-muted)", marginTop: 2 }}>Milestones as % of price · cumulative cash-flow</div>
            </div>
          </div>

          {/* Milestone chart */}
          <CashflowChart rows={rows} buildMonths={buildMonths} />

          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12, marginTop: 16 }}>
            <thead>
              <tr style={{ textAlign: "left", color: "var(--fg-muted)", fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em" }}>
                <th style={{ padding: "6px 0" }}>Milestone</th>
                <th style={{ padding: "6px 0", textAlign: "right" }}>At</th>
                <th style={{ padding: "6px 0", textAlign: "right" }}>%</th>
                <th style={{ padding: "6px 0", textAlign: "right" }}>Amount</th>
                <th style={{ padding: "6px 0", textAlign: "right" }}>Cash</th>
                <th style={{ padding: "6px 0", textAlign: "right" }}>Loan drawn</th>
                <th style={{ padding: "6px 0", textAlign: "right" }}>Interest/mo</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r, i) => (
                <tr key={i} style={{ borderTop: "1px solid var(--border-muted)" }}>
                  <td style={{ padding: "8px 0", fontWeight: 600 }}>{r.name}</td>
                  <td style={{ padding: "8px 0", textAlign: "right", color: "var(--fg-muted)", fontFamily: "var(--font-mono)" }}>{r.at === 0 ? "T0" : `+${r.at}m`}</td>
                  <td style={{ padding: "8px 0", textAlign: "right", fontFamily: "var(--font-mono)" }}>{r.pct}%</td>
                  <td style={{ padding: "8px 0", textAlign: "right", fontFamily: "var(--font-mono)", fontWeight: 600 }}>${Math.round(r.amount).toLocaleString()}</td>
                  <td style={{ padding: "8px 0", textAlign: "right", fontFamily: "var(--font-mono)", color: "var(--fg-muted)" }}>${Math.round(r.downUsed).toLocaleString()}</td>
                  <td style={{ padding: "8px 0", textAlign: "right", fontFamily: "var(--font-mono)", color: "var(--fg-muted)" }}>${Math.round(r.loanDrawn).toLocaleString()}</td>
                  <td style={{ padding: "8px 0", textAlign: "right", fontFamily: "var(--font-mono)", color: "#C85D00" }}>${Math.round(r.interestOnly).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      </div>
    </div>
  );
}

function Field({ label, children }) {
  return (
    <div style={{ marginBottom: 14 }}>
      <div style={{ fontSize: 12, fontWeight: 600, color: "var(--fg-default)", marginBottom: 6 }}>{label}</div>
      {children}
    </div>
  );
}

function CashflowChart({ rows, buildMonths }) {
  const W = 680, H = 140, padL = 40, padR = 12, padT = 10, padB = 24;
  const iw = W - padL - padR, ih = H - padT - padB;
  const maxT = buildMonths + 14;
  const x = t => padL + (t / maxT) * iw;
  const maxCum = Math.max(...rows.map(r => r.cumLoan)) || 1;
  const y = v => padT + ih - (v / maxCum) * ih;

  const line = rows.map((r, i) => `${i === 0 ? "M" : "L"}${x(r.at).toFixed(1)},${y(r.cumLoan).toFixed(1)}`).join(" ");
  const area = `${line} L${x(rows[rows.length-1].at)},${y(0)} L${x(0)},${y(0)} Z`;

  return (
    <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", height: "auto", display: "block" }}>
      {[0, 0.5, 1].map((f, i) => (
        <g key={i}>
          <line x1={padL} x2={W-padR} y1={y(maxCum*f)} y2={y(maxCum*f)} stroke="var(--gray-20)" strokeDasharray={i===0?"0":"2 3"} />
          <text x={padL-6} y={y(maxCum*f)+3} textAnchor="end" fontSize="9" fill="var(--fg-muted)" fontFamily="var(--font-mono)">
            ${Math.round(maxCum*f/1000)}k
          </text>
        </g>
      ))}
      {/* TOP marker */}
      <line x1={x(buildMonths)} x2={x(buildMonths)} y1={padT} y2={padT+ih} stroke="#2B873F" strokeDasharray="2 3" />
      <text x={x(buildMonths)} y={H-6} textAnchor="middle" fontSize="9" fill="#2B873F" fontWeight="700">TOP</text>
      <path d={area} fill="rgba(55,101,246,0.14)" />
      <path d={line} fill="none" stroke="#3765F6" strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />
      {rows.map((r, i) => (
        <circle key={i} cx={x(r.at)} cy={y(r.cumLoan)} r="3" fill="#fff" stroke="#3765F6" strokeWidth="2" />
      ))}
    </svg>
  );
}

window.Calculator = Calculator;
