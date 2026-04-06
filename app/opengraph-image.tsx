import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt = "Intrvw.ai — AI-powered interview coaching";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OGImage() {
  return new ImageResponse(
    (
      <div
        style={{
          background: "#0B0B0F",
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          fontFamily: "system-ui, sans-serif",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "baseline",
            fontSize: 48,
            fontWeight: 600,
            color: "#EDEDF0",
            letterSpacing: "-0.02em",
          }}
        >
          intrvw
          <span style={{ color: "#3B82F6" }}>.ai</span>
        </div>
        <div
          style={{
            marginTop: 24,
            fontSize: 22,
            color: "#8B8B98",
            maxWidth: 600,
            textAlign: "center",
            lineHeight: 1.5,
          }}
        >
          Practice the interview you're actually walking into.
          Tailored questions. Scored answers. Personalized coaching.
        </div>
      </div>
    ),
    { ...size },
  );
}
