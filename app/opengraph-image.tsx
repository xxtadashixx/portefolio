import { readFile } from "node:fs/promises";
import path from "node:path";
import { ImageResponse } from "next/og";

export const alt = "Rynah Tadashi — DevOps & Cloud Engineer";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

/** Image d'aperçu pour LinkedIn, WhatsApp, etc. : l'avatar pixel art à côté du nom. */
export default async function OpengraphImage() {
  // Version agrandie de l'avatar (voir scripts/pixel-avatar.py), pour garder des pixels nets.
  const avatar = await readFile(path.join(process.cwd(), "app", "og-avatar.png"));
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          padding: 70,
          background: "linear-gradient(135deg, #04060c 0%, #0a1226 60%, #14103a 100%)",
          color: "#dbe4f3",
          fontFamily: "monospace",
        }}
      >
        <div
          style={{
            display: "flex",
            width: 360,
            height: 360,
            borderRadius: 36,
            overflow: "hidden",
            border: "4px solid #22d3ee",
            background: "linear-gradient(160deg, #0d1730, #150f33)",
          }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element, jsx-a11y/alt-text */}
          <img src={`data:image/png;base64,${avatar.toString("base64")}`} width={360} height={360} />
        </div>
        <div style={{ display: "flex", flexDirection: "column", marginLeft: 60 }}>
          <div style={{ display: "flex", fontSize: 26, color: "#22d3ee" }}>visitor@rynah-cloud:~$ whoami</div>
          <div style={{ display: "flex", fontSize: 92, fontWeight: 800, letterSpacing: -3, marginTop: 18 }}>RYNAH</div>
          <div style={{ display: "flex", fontSize: 92, fontWeight: 800, letterSpacing: -3, marginTop: -14, color: "#4f8cff" }}>TADASHI</div>
          <div style={{ display: "flex", fontSize: 38, marginTop: 10, color: "#a78bfa" }}>DevOps &amp; Cloud Engineer</div>
          <div style={{ display: "flex", fontSize: 22, marginTop: 26, color: "#8a99b4" }}>provision → build → scan → deploy</div>
        </div>
      </div>
    ),
    size,
  );
}
