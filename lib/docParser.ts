import { parsePdfFromBuffer } from "@/lib/pdfParser";

/**
 * Extract plain text from a document buffer.
 * Supports PDF and DOCX formats.
 */
export async function parseDocumentBuffer(
  buffer: Buffer,
  filename: string,
): Promise<{ text: string }> {
  const lower = filename.toLowerCase();

  if (lower.endsWith(".pdf")) {
    const result = await parsePdfFromBuffer(buffer);
    return { text: result.text };
  }

  if (lower.endsWith(".docx") || lower.endsWith(".doc")) {
    const mammoth = await import("mammoth");
    const result = await mammoth.extractRawText({ buffer });
    return { text: result.value.trim() };
  }

  throw new Error(
    `Unsupported file format: ${filename}. Upload a PDF or DOCX file.`,
  );
}

/** File extensions accepted for resume uploads */
export const RESUME_ACCEPT =
  "application/pdf,.pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document,.docx,application/msword,.doc";

/** File extensions accepted for JD uploads */
export const JD_ACCEPT = `${RESUME_ACCEPT}`;
