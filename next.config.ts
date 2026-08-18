import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ["pdf-parse", "@napi-rs/canvas"],
  // pdfjs-dist loads its worker through a computed path, so file tracing misses
  // pdf.worker.mjs and the deployed function fails with "Setting up fake worker
  // failed: Cannot find module ... pdf.worker.mjs". Ship it explicitly.
  outputFileTracingIncludes: {
    "/api/session/create": [
      "./node_modules/pdfjs-dist/legacy/build/pdf.worker.mjs",
    ],
  },
};

export default nextConfig;
