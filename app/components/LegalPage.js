"use client";

import { Screen, Card } from "@/app/components/ui";

/** Shared layout for /privacy and /terms — one card per section, same look as «من نحن». */
export default function LegalPage({ title, subtitle, updated, sections }) {
  return (
    <Screen title={title} subtitle={subtitle} active="order">
      {sections.map(([h, body]) => (
        <Card key={h} pad={18}>
          <h2 style={{ fontSize: 15.5, fontWeight: 900, margin: "0 0 8px" }}>{h}</h2>
          <p style={{ fontSize: 13.5, color: "var(--t-muted)", lineHeight: 1.95, margin: 0, whiteSpace: "pre-line" }}>{body}</p>
        </Card>
      ))}
      <p style={{ textAlign: "center", fontSize: 12, color: "var(--t-faint)", margin: "6px 0 18px" }}>
        آخر تحديث: {updated} — <a href="/privacy" style={{ color: "inherit" }}>الخصوصية</a> · <a href="/terms" style={{ color: "inherit" }}>الشروط</a> · <a href="/contact" style={{ color: "inherit" }}>تواصل معنا</a>
      </p>
    </Screen>
  );
}
