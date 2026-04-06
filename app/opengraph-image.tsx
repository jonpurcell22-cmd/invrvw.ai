import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt = "Intrvw.ai — The only interview coach that knows your story";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OGImage() {
  return new ImageResponse(
    (
      <div
        style={{
          background: "#0a0619",
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
            fontSize: 52,
            fontWeight: 700,
            letterSpacing: "-0.02em",
            background: "linear-gradient(135deg, #fdb051, #f2203e, #5342d6)",
            backgroundClip: "text",
            color: "transparent",
          }}
        >
          INTRVW.AI
        </div>
        <div
          style={{
            marginTop: 28,
            fontSize: 24,
            color: "#9994B0",
            maxWidth: 600,
            textAlign: "center",
            lineHeight: 1.5,
          }}
        >
          The only interview coach that knows your story.
        </div>
      </div>
    ),
    { ...size },
  );
}
