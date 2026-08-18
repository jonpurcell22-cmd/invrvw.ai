import type { ParsedPdfResult } from "@/types";

/**
 * pdf-parse pulls in pdfjs-dist/legacy, which evaluates `new DOMMatrix()` at module
 * scope. On Node it polyfills that global via a bare `require("@napi-rs/canvas")`,
 * which cannot resolve the native binary inside a bundled serverless function — the
 * polyfill degrades to a warning and the import then throws
 * `ReferenceError: DOMMatrix is not defined`.
 *
 * Install the globals ourselves first, then import pdf-parse dynamically so pdf.js is
 * only evaluated once they exist. Keeping the import lazy also means a load failure
 * surfaces inside the caller's try/catch instead of breaking the route module.
 */
let pdfParsePromise: Promise<typeof import("pdf-parse")> | null = null;

async function loadPdfParse(): Promise<typeof import("pdf-parse")> {
  if (!pdfParsePromise) {
    pdfParsePromise = (async () => {
      const g = globalThis as Record<string, unknown>;
      if (!g.DOMMatrix || !g.Path2D || !g.ImageData) {
        const canvas = await import("@napi-rs/canvas");
        g.DOMMatrix ??= canvas.DOMMatrix;
        g.Path2D ??= canvas.Path2D;
        g.ImageData ??= canvas.ImageData;
      }
      return import("pdf-parse");
    })();
    // Don't cache a rejected import — let the next call retry.
    pdfParsePromise.catch(() => {
      pdfParsePromise = null;
    });
  }
  return pdfParsePromise;
}

/**
 * Extract plain text from a PDF buffer (Node runtime).
 */
export async function parsePdfFromBuffer(buffer: Buffer): Promise<ParsedPdfResult> {
  const { PDFParse } = await loadPdfParse();
  const parser = new PDFParse({ data: buffer });
  try {
    const textResult = await parser.getText();
    const pageCount = textResult.pages?.length ?? textResult.total;
    return {
      text: textResult.text.trim(),
      pageCount,
    };
  } finally {
    await parser.destroy().catch(() => undefined);
  }
}
