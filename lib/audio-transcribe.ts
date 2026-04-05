import { CLAUDE_MODEL, getAnthropicApiKey } from "@/lib/claude";

type AudioContentBlock = Record<string, unknown>;

function extractTextFromMessageJson(data: {
  content?: Array<{ type?: string; text?: string }>;
}): string {
  const parts: string[] = [];
  for (const block of data.content ?? []) {
    if (block.type === "text" && block.text) {
      parts.push(block.text);
    }
  }
  return parts.join("\n").trim();
}

/**
 * Transcribe audio via Claude Messages API using a base64 audio content block.
 * Tries a few block shapes for API compatibility.
 */
export async function transcribeAudioBufferWithClaudeImpl(
  buffer: Buffer,
  mimeType: string,
): Promise<string> {
  const apiKey = getAnthropicApiKey();
  const dataB64 = buffer.toString("base64");

  const attempts: AudioContentBlock[] = [
    {
      type: "input_audio",
      source: { type: "base64", media_type: mimeType, data: dataB64 },
    },
    {
      type: "audio",
      source: { type: "base64", media_type: mimeType, data: dataB64 },
    },
  ];

  let lastErr = "Unknown error";

  for (const audioBlock of attempts) {
    const body = {
      model: CLAUDE_MODEL,
      max_tokens: 4096,
      messages: [
        {
          role: "user",
          content: [
            {
              type: "text",
              text: "Transcribe this audio verbatim. Output only the spoken words as plain text. No preamble or markdown.",
            },
            audioBlock,
          ],
        },
      ],
    };

    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
        "content-type": "application/json",
      },
      body: JSON.stringify(body),
    });

    const raw = await res.text();
    if (!res.ok) {
      try {
        const errJson = JSON.parse(raw) as { error?: { message?: string } };
        lastErr = errJson.error?.message ?? raw.slice(0, 200);
      } catch {
        lastErr = raw.slice(0, 200);
      }
      continue;
    }

    const json = JSON.parse(raw) as Parameters<
      typeof extractTextFromMessageJson
    >[0];
    const text = extractTextFromMessageJson(json);
    if (!text) {
      lastErr = "Empty transcription";
      continue;
    }
    return text;
  }

  throw new Error(
    `Claude audio transcription failed (${lastErr}). If your workspace does not support audio input yet, use the Record tab (Web Speech) or paste a transcript.`,
  );
}
