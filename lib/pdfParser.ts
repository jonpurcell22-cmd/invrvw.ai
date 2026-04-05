import { PDFParse } from "pdf-parse";
import type { ParsedPdfResult } from "@/types";

/**
 * Extract plain text from a PDF buffer (Node runtime).
 */
export async function parsePdfFromBuffer(buffer: Buffer): Promise<ParsedPdfResult> {
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
