import { ImageResponse } from "next/og";

export const alt = "Rynah Tadashi — DevOps & Cloud Engineer";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          padding: 80,
          background: "linear-gradient(135deg, #04060c 0%, #0a1226 60%, #14103a 100%)",
          color: "#dbe4f3",
          fontFamily: "monospace",
        }}
      >
        <div style={{ display: "flex", fontSize: 28, color: "#22d3ee" }}>visitor@rynah-cloud:~$ whoami</div>
        <div style={{ display: "flex", fontSize: 112, fontWeight: 800, letterSpacing: -4, marginTop: 24 }}>RYNAH TADASHI</div>
        <div style={{ display: "flex", fontSize: 44, marginTop: 8, color: "#a78bfa" }}>DevOps &amp; Cloud Engineer</div>
        <div style={{ display: "flex", fontSize: 26, marginTop: 36, color: "#8a99b4" }}>
          Automatisation | CI/CD | Cloud Infrastructure | Security
        </div>
      </div>
    ),
    size,
  );
}
