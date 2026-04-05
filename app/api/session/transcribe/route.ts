import { NextResponse } from "next/server";
import { transcribeAudioBufferWithClaude } from "@/lib/audio";
import { ensureUser } from "@/lib/ensure-user";
import { createSupabaseServerClient } from "@/lib/supabase-server";

export const runtime = "nodejs";
export const maxDuration = 120;

const ALLOWED = new Set([
  "audio/mpeg",
  "audio/mp3",
  "audio/mp4",
  "audio/x-m4a",
  "audio/m4a",
  "audio/wav",
  "audio/x-wav",
  "audio/webm",
]);

export async function POST(request: Request) {
  try {
    const supabase = await createSupabaseServerClient();
    const user = await ensureUser(supabase);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const ct = request.headers.get("content-type") ?? "";
    if (!ct.includes("multipart/form-data")) {
      return NextResponse.json(
        { error: "Expected multipart/form-data" },
        { status: 400 },
      );
    }

    const form = await request.formData();
    const file = form.get("audio");
    if (!(file instanceof File) || file.size === 0) {
      return NextResponse.json({ error: "Audio file required" }, { status: 400 });
    }

    let mime = file.type;
    if (!mime) {
      const n = file.name.toLowerCase();
      if (n.endsWith(".mp3")) mime = "audio/mpeg";
      else if (n.endsWith(".m4a")) mime = "audio/mp4";
      else if (n.endsWith(".wav")) mime = "audio/wav";
      else if (n.endsWith(".webm")) mime = "audio/webm";
      else mime = "audio/webm";
    }
    if (!ALLOWED.has(mime)) {
      return NextResponse.json(
        { error: `Unsupported audio type: ${mime}` },
        { status: 400 },
      );
    }

    const buf = Buffer.from(await file.arrayBuffer());
    const transcript = await transcribeAudioBufferWithClaude(buf, mime);

    return NextResponse.json({ transcript });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Transcription failed";
    console.error(e);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
