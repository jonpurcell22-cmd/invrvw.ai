"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  createWebSpeechCapture,
  createAudioRecorder,
  isWebSpeechRecognitionSupported,
  isMediaRecorderSupported,
  type AudioRecording,
} from "@/lib/audio";
import { Button } from "@/components/ui/Button";

type Tab = "record" | "upload";

export interface VoiceRecorderProps {
  /** Called when a final transcript is produced (record stop or upload done). */
  onTranscript: (text: string) => void;
  /** Called with audio recording when available. */
  onAudioRecording?: (recording: AudioRecording) => void;
  disabled?: boolean;
}

function formatDuration(sec: number): string {
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

export function VoiceRecorder({
  onTranscript,
  onAudioRecording,
  disabled,
}: VoiceRecorderProps) {
  const [tab, setTab] = useState<Tab>("record");
  const [recording, setRecording] = useState(false);
  const [status, setStatus] = useState<string>("Ready");
  const [live, setLive] = useState("");
  const [elapsed, setElapsed] = useState(0);
  const [uploadBusy, setUploadBusy] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const captureRef = useRef<ReturnType<typeof createWebSpeechCapture> | null>(
    null,
  );
  const recorderRef = useRef<ReturnType<typeof createAudioRecorder> | null>(
    null,
  );
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const speechOk = isWebSpeechRecognitionSupported();
  const mediaOk = isMediaRecorderSupported();

  useEffect(() => {
    return () => {
      captureRef.current?.abort();
      recorderRef.current?.abort();
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  const handleStartRecord = useCallback(() => {
    if (disabled || !speechOk) return;
    setUploadError(null);
    setLive("");
    setElapsed(0);
    setStatus("Listening…");

    // Start Web Speech API for live transcript
    captureRef.current?.abort();
    captureRef.current = createWebSpeechCapture(
      (t) => setLive(t),
      () => {
        setRecording(false);
        setStatus("Speech recognition stopped");
        setLive("");
        if (timerRef.current) clearInterval(timerRef.current);
      },
    );
    captureRef.current.start();

    // Start MediaRecorder for audio capture
    if (mediaOk) {
      recorderRef.current?.abort();
      recorderRef.current = createAudioRecorder();
      recorderRef.current.start();
    }

    // Duration timer
    const start = Date.now();
    timerRef.current = setInterval(() => {
      setElapsed(Math.floor((Date.now() - start) / 1000));
    }, 1000);

    setRecording(true);
  }, [disabled, speechOk, mediaOk]);

  const handleStopRecord = useCallback(async () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }

    setStatus("Processing…");

    // Stop both captures
    let text = "";
    try {
      if (captureRef.current) {
        text = await captureRef.current.stop();
        captureRef.current = null;
      }
    } catch {
      // Fall back to interim
    }

    // Stop audio recorder
    if (recorderRef.current) {
      try {
        const audioRecording = await recorderRef.current.stop();
        recorderRef.current = null;
        onAudioRecording?.(audioRecording);
      } catch {
        // Audio recording is optional
      }
    }

    const out = text.trim() || live.trim();
    if (out) onTranscript(out);
    setStatus(out ? "Transcript ready" : "No speech detected");
    setRecording(false);
    setLive("");
  }, [live, onTranscript, onAudioRecording]);

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file || disabled) return;
    setUploadError(null);
    setUploadBusy(true);
    setStatus("Uploading audio…");
    try {
      const fd = new FormData();
      fd.set("audio", file);
      const res = await fetch("/api/session/transcribe", {
        method: "POST",
        body: fd,
      });
      const data = (await res.json()) as {
        transcript?: string;
        error?: string;
      };
      if (!res.ok) {
        throw new Error(data.error ?? "Transcription failed");
      }
      if (data.transcript?.trim()) {
        onTranscript(data.transcript.trim());
        setStatus("Transcript ready");
      } else {
        setStatus("Empty transcript");
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Transcription failed";
      setUploadError(msg);
      setStatus("Upload failed");
    } finally {
      setUploadBusy(false);
    }
  };

  return (
    <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-5 shadow-[var(--shadow-card)]">
      <div className="flex gap-1 rounded-lg bg-[var(--bg)] p-1">
        <button
          type="button"
          disabled={disabled}
          onClick={() => setTab("record")}
          className={`flex-1 rounded-md px-3 py-2 text-sm font-medium transition-all duration-200 ${
            tab === "record"
              ? "bg-[var(--surface-hover)] text-[var(--fg)] shadow-sm"
              : "text-[var(--fg-subtle)] hover:text-[var(--fg-muted)]"
          }`}
        >
          Record
        </button>
        <button
          type="button"
          disabled={disabled}
          onClick={() => setTab("upload")}
          className={`flex-1 rounded-md px-3 py-2 text-sm font-medium transition-all duration-200 ${
            tab === "upload"
              ? "bg-[var(--surface-hover)] text-[var(--fg)] shadow-sm"
              : "text-[var(--fg-subtle)] hover:text-[var(--fg-muted)]"
          }`}
        >
          Upload
        </button>
      </div>

      <div className="mt-5">
        {tab === "record" ? (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <p className="text-xs text-[var(--fg-subtle)]">
                {recording ? (
                  <span className="text-[var(--accent)]">{status}</span>
                ) : (
                  status
                )}
              </p>
              {recording ? (
                <div className="flex items-center gap-2">
                  <span className="h-2 w-2 animate-pulse rounded-full bg-[var(--danger)]" />
                  <span className="font-mono text-sm font-medium text-[var(--fg)]">
                    {formatDuration(elapsed)}
                  </span>
                </div>
              ) : null}
            </div>

            {recording || live ? (
              <div className="min-h-[4rem] rounded-lg border border-[var(--border)] bg-[var(--bg)] px-3 py-2 text-sm text-[var(--fg-muted)]">
                {live || (
                  <span className="animate-pulse text-[var(--fg-subtle)]">
                    Waiting for speech…
                  </span>
                )}
              </div>
            ) : null}

            <div className="flex flex-wrap gap-2">
              {!recording ? (
                <Button
                  type="button"
                  variant="primary"
                  size="md"
                  disabled={disabled || !speechOk || uploadBusy}
                  onClick={handleStartRecord}
                >
                  Start microphone
                </Button>
              ) : (
                <Button
                  type="button"
                  variant="danger"
                  size="md"
                  disabled={disabled}
                  onClick={handleStopRecord}
                >
                  Stop recording
                </Button>
              )}
            </div>
            {!speechOk ? (
              <p className="text-xs text-[var(--warning)]">
                Speech recognition is not available in this browser. Use Upload
                or another browser.
              </p>
            ) : null}
          </div>
        ) : (
          <div className="space-y-3">
            <p className="text-xs text-[var(--fg-subtle)]">
              {uploadBusy ? (
                <span className="text-[var(--accent)]">
                  Transcribing with Claude…
                </span>
              ) : (
                status
              )}
            </p>
            <label className="block">
              <span className="sr-only">Audio file</span>
              <input
                type="file"
                accept=".mp3,.m4a,.wav,.webm,audio/mpeg,audio/mp4,audio/x-m4a,audio/wav,audio/webm"
                disabled={disabled || uploadBusy}
                onChange={handleFile}
                className="block w-full text-sm text-[var(--fg-muted)] file:mr-3 file:rounded-lg file:border file:border-[var(--border)] file:bg-[var(--surface-hover)] file:px-3 file:py-1.5 file:text-xs file:font-medium file:text-[var(--fg)]"
              />
            </label>
            {uploadError ? (
              <p className="text-xs text-[var(--danger)]" role="alert">
                {uploadError}
              </p>
            ) : null}
          </div>
        )}
      </div>
    </div>
  );
}
