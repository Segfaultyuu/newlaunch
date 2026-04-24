/* global React, Card, Stub, Icon */

function GenericScreen({ title, zhTitle, lang, description }) {
  return (
    <div style={{ padding: 24 }}>
      <Card pad={32} radius={16} style={{ textAlign: "center", background: "var(--gray-10)" }}>
        <div style={{ display: "inline-flex", width: 56, height: 56, borderRadius: 14, background: "var(--bg-default)", border: "1px solid var(--border-muted)", alignItems: "center", justifyContent: "center", marginBottom: 12 }}>
          <Icon name="construction" size={22} color="var(--fg-muted)" />
        </div>
        <div style={{ fontSize: 20, fontWeight: 700, letterSpacing: "-0.3px" }}>
          {title} {lang === "both" && <span style={{ color: "var(--fg-muted)", fontWeight: 500 }}>· {zhTitle}</span>}
        </div>
        <div style={{ fontSize: 13, color: "var(--fg-muted)", marginTop: 6, maxWidth: 480, margin: "6px auto 0" }}>
          {description}
        </div>
      </Card>
    </div>
  );
}

window.GenericScreen = GenericScreen;
