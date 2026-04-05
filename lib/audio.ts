/**
 * Browser: Web Speech API capture.
 * Server: `transcribeAudioBufferWithClaude` (dynamic import — call only from Route Handlers / Server Actions).
 */

export function isWebSpeechRecognitionSupported(): boolean {
  if (typeof window === "undefined") return false;
  return Boolean(
    (window as unknown as { SpeechRecognition?: unknown }).SpeechRecognition ||
      (window as unknown as { webkitSpeechRecognition?: unknown })
        .webkitSpeechRecognition,
  );
}

export interface WebSpeechCapture {
  /** Start listening (requests mic permission). */
  start(): void;
  /** Stop and resolve with accumulated final transcript. */
  stop(): Promise<string>;
  /** Abort without resolving stop(). */
  abort(): void;
  /** Latest interim text while listening. */
  getInterim(): string;
}

type SpeechRecognitionLike = {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  onresult: ((ev: SpeechRecognitionEventLike) => void) | null;
  onerror: ((ev: { error?: string }) => void) | null;
  onend: (() => void) | null;
  start: () => void;
  stop: () => void;
  abort: () => void;
};

interface SpeechRecognitionEventLike {
  resultIndex: number;
  results: {
    length: number;
    [i: number]: { 0: { transcript: string }; isFinal: boolean };
  };
}

function getSpeechRecognitionCtor():
  | (new () => SpeechRecognitionLike)
  | null {
  if (typeof window === "undefined") return null;
  const w = window as unknown as {
    SpeechRecognition?: new () => SpeechRecognitionLike;
    webkitSpeechRecognition?: new () => SpeechRecognitionLike;
  };
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null;
}

/**
 * Live dictation using the Web Speech API. Not available in all browsers.
 */
export function createWebSpeechCapture(
  onInterim?: (text: string) => void,
  onError?: (err: Error) => void,
): WebSpeechCapture {
  const Ctor = getSpeechRecognitionCtor();
  if (!Ctor) {
    return {
      start() {},
      stop() {
        return Promise.resolve("");
      },
      abort() {},
      getInterim() {
        return "";
      },
    };
  }

  let recognition: SpeechRecognitionLike | null = null;
  let finalChunks: string[] = [];
  let interim = "";
  let stopResolver: ((value: string) => void) | null = null;
  let stopReject: ((e: Error) => void) | null = null;
  let active = false;
  let aborted = false;

  function appendFinal(text: string) {
    const t = text.trim();
    if (t) finalChunks.push(t);
  }

  function startRecognition() {
    recognition = new Ctor!();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = "en-US";
    recognition.onresult = (ev: SpeechRecognitionEventLike) => {
      let piece = "";
      for (let i = ev.resultIndex; i < ev.results.length; i++) {
        const r = ev.results[i];
        const t = r[0]?.transcript ?? "";
        if (r.isFinal) appendFinal(t);
        else piece += t;
      }
      interim = piece.trim();
      onInterim?.([...finalChunks, interim].filter(Boolean).join(" "));
    };
    recognition.onerror = (ev) => {
      if (ev.error === "no-speech" || ev.error === "aborted") return;
      const err = new Error(ev.error ?? "speech_recognition_error");
      active = false;
      onError?.(err);
      stopReject?.(err);
      stopReject = null;
      stopResolver = null;
    };
    recognition.onend = () => {
      if (stopResolver) {
        const out = [...finalChunks, interim].filter(Boolean).join(" ").trim();
        stopResolver(out);
        stopResolver = null;
        stopReject = null;
        active = false;
      } else if (active && !aborted) {
        // Browser ended recognition on its own (silence, etc.) — restart
        try {
          startRecognition();
          recognition!.start();
        } catch {
          active = false;
          onError?.(new Error("speech_recognition_restart_failed"));
        }
      }
    };
    return recognition;
  }

  return {
    start() {
      finalChunks = [];
      interim = "";
      active = true;
      aborted = false;
      startRecognition();
      recognition!.start();
    },
    stop() {
      active = false;
      return new Promise<string>((resolve, reject) => {
        stopResolver = resolve;
        stopReject = reject;
        try {
          recognition?.stop();
        } catch {
          resolve([...finalChunks, interim].filter(Boolean).join(" ").trim());
        }
      });
    },
    abort() {
      active = false;
      aborted = true;
      stopResolver = null;
      stopReject = null;
      try {
        recognition?.abort();
      } catch {
        /* ignore */
      }
      recognition = null;
    },
    getInterim() {
      return [...finalChunks, interim].filter(Boolean).join(" ").trim();
    },
  };
}

// ---------------------------------------------------------------------------
// MediaRecorder-based audio capture (records actual audio for analytics)
// ---------------------------------------------------------------------------

export interface AudioRecording {
  /** Audio blob (webm or mp4) */
  blob: Blob;
  /** MIME type of the recording */
  mimeType: string;
  /** Duration in seconds */
  durationSec: number;
}

export interface AudioRecorder {
  start(): void;
  stop(): Promise<AudioRecording>;
  abort(): void;
  isRecording(): boolean;
}

export function isMediaRecorderSupported(): boolean {
  if (typeof window === "undefined") return false;
  return typeof MediaRecorder !== "undefined";
}

export function createAudioRecorder(): AudioRecorder {
  let mediaRecorder: MediaRecorder | null = null;
  let stream: MediaStream | null = null;
  let chunks: Blob[] = [];
  let startTime = 0;
  let recording = false;
  let stopResolver: ((val: AudioRecording) => void) | null = null;

  const mimeType = MediaRecorder.isTypeSupported("audio/webm;codecs=opus")
    ? "audio/webm;codecs=opus"
    : MediaRecorder.isTypeSupported("audio/webm")
      ? "audio/webm"
      : "audio/mp4";

  return {
    async start() {
      chunks = [];
      stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorder = new MediaRecorder(stream, { mimeType });
      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunks.push(e.data);
      };
      mediaRecorder.onstop = () => {
        const blob = new Blob(chunks, { type: mimeType });
        const durationSec = (Date.now() - startTime) / 1000;
        stream?.getTracks().forEach((t) => t.stop());
        stream = null;
        recording = false;
        stopResolver?.({ blob, mimeType, durationSec });
        stopResolver = null;
      };
      startTime = Date.now();
      mediaRecorder.start(1000); // collect in 1s chunks
      recording = true;
    },
    stop() {
      return new Promise<AudioRecording>((resolve) => {
        stopResolver = resolve;
        try {
          mediaRecorder?.stop();
        } catch {
          const blob = new Blob(chunks, { type: mimeType });
          const durationSec = (Date.now() - startTime) / 1000;
          recording = false;
          resolve({ blob, mimeType, durationSec });
        }
      });
    },
    abort() {
      recording = false;
      stopResolver = null;
      try {
        mediaRecorder?.stop();
      } catch { /* ignore */ }
      stream?.getTracks().forEach((t) => t.stop());
      stream = null;
      mediaRecorder = null;
    },
    isRecording() {
      return recording;
    },
  };
}

/** Server-only: transcribe bytes with Claude (see `audio-transcribe.ts`). */
export async function transcribeAudioBufferWithClaude(
  buffer: Buffer,
  mimeType: string,
): Promise<string> {
  const { transcribeAudioBufferWithClaudeImpl } = await import(
    "./audio-transcribe"
  );
  return transcribeAudioBufferWithClaudeImpl(buffer, mimeType);
}

/** @deprecated use isWebSpeechRecognitionSupported */
export function isBrowserMediaSupported(): boolean {
  return isWebSpeechRecognitionSupported();
}
