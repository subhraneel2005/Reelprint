import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Offline — Reelprint",
  robots: { index: false, follow: false },
};

export default function OfflinePage() {
  return (
    <>
      <style>{`html,body{margin:0;padding:0;background:#eef0ec}`}</style>
      <div
      style={{
        minHeight: "100dvh",
        display: "grid",
        placeItems: "center",
        padding: "24px",
        background: "#eef0ec",
        color: "#121614",
        fontFamily: "ui-sans-serif, system-ui, -apple-system, sans-serif",
      }}
    >
      <div style={{ width: "100%", maxWidth: "380px" }}>
        <div
          aria-hidden
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(3, 1fr)",
            alignItems: "end",
            gap: "4px",
            width: "42px",
            height: "42px",
            padding: "8px",
            borderRadius: "10px",
            background: "#e0452a",
          }}
        >
          <span style={{ height: "100%", background: "#eef0ec" }} />
          <span style={{ height: "55%", background: "#eef0ec" }} />
          <span style={{ height: "80%", background: "#eef0ec" }} />
        </div>
        <p
          style={{
            margin: "28px 0 0",
            fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace",
            fontSize: "10px",
            letterSpacing: "0.14em",
            textTransform: "uppercase",
            color: "#66716a",
          }}
        >
          no signal
        </p>
        <h1
          style={{
            margin: "10px 0 0",
            fontSize: "clamp(2.2rem, 12vw, 3.2rem)",
            fontWeight: 650,
            letterSpacing: "-0.055em",
            lineHeight: 0.95,
          }}
        >
          The desk is offline.
        </h1>
        <p style={{ margin: "16px 0 0", fontSize: "14px", lineHeight: 1.6, color: "#303a34" }}>
          Reconnect to send a reel or run research. Everything already transcribed is still saved on
          this device.
        </p>
        <Link
          href="/"
          style={{
            display: "inline-flex",
            marginTop: "24px",
            height: "44px",
            alignItems: "center",
            padding: "0 18px",
            borderRadius: "999px",
            background: "#e0452a",
            color: "#fff",
            fontSize: "13px",
            fontWeight: 500,
            textDecoration: "none",
          }}
        >
          Try again
        </Link>
      </div>
    </div>
    </>
  );
}
