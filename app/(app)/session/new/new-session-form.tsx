"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/Button";
import { INTERVIEW_STAGES } from "@/lib/constants";

type Step = "resume" | "jd" | "details" | "generating";
type JdMode = "paste" | "url" | "file";

type ProfileInfo = {
  hasResume: boolean;
  resumeFilename: string | null;
};

const RESUME_ACCEPT =
  "application/pdf,.pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document,.docx,application/msword,.doc";

export function NewSessionForm() {
  const router = useRouter();
  const [step, setStep] = useState<Step>("resume");
  const [error, setError] = useState<string | null>(null);
  const errorRef = useRef<HTMLParagraphElement>(null);

  // Resume state
  const [resumeSource, setResumeSource] = useState<"saved" | "upload">("upload");
  const [resumeFile, setResumeFile] = useState<File | null>(null);
  const [profile, setProfile] = useState<ProfileInfo | null>(null);
  const resumeInputRef = useRef<HTMLInputElement>(null);

  // JD state
  const [jdMode, setJdMode] = useState<JdMode>("paste");
  const [jdFile, setJdFile] = useState<File | null>(null);
  const [jdText, setJdText] = useState("");
  const [jdUrl, setJdUrl] = useState("");
  const [jdFetching, setJdFetching] = useState(false);
  const jdInputRef = useRef<HTMLInputElement>(null);

  // Details state (auto-populated)
  const [stage, setStage] = useState(INTERVIEW_STAGES[0]);
  const [companyHint, setCompanyHint] = useState("");
  const [roleHint, setRoleHint] = useState("");
  const [extracting, setExtracting] = useState(false);

  // Load profile on mount
  useEffect(() => {
    fetch("/api/profile")
      .then((r) => r.json())
      .then((data: ProfileInfo) => {
        setProfile(data);
        if (data.hasResume) setResumeSource("saved");
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (error && errorRef.current) {
      errorRef.current.scrollIntoView({ behavior: "smooth", block: "nearest" });
    }
  }, [error]);

  const hasResume =
    resumeSource === "saved"
      ? Boolean(profile?.hasResume)
      : Boolean(resumeFile);

  // Get the resolved JD text (from paste, URL fetch, or file — file handled server-side)
  const resolvedJdText = jdText.trim();
  const hasJd = Boolean(jdFile || resolvedJdText);

  // Fetch URL content
  async function handleFetchUrl() {
    if (!jdUrl.trim()) return;
    setJdFetching(true);
    setError(null);
    try {
      const res = await fetch("/api/extract-url", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ url: jdUrl.trim() }),
      });
      const data = (await res.json()) as { text?: string; error?: string };
      if (!res.ok) throw new Error(data.error ?? "Failed to fetch URL");
      if (data.text) {
        setJdText(data.text);
        setJdMode("paste"); // Switch to paste view to show extracted text
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to fetch URL");
    } finally {
      setJdFetching(false);
    }
  }

  // Auto-extract company/role when moving to step 3
  async function handleGoToDetails() {
    setStep("details");
    if (companyHint || roleHint) return; // already populated

    const text = resolvedJdText;
    if (!text || text.length < 20) return;

    setExtracting(true);
    try {
      const res = await fetch("/api/extract-jd-meta", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ text }),
      });
      const data = (await res.json()) as {
        company?: string | null;
        role?: string | null;
      };
      if (data.company) setCompanyHint(data.company);
      if (data.role) setRoleHint(data.role);
    } catch {
      // Non-critical — fields stay empty
    } finally {
      setExtracting(false);
    }
  }

  async function handleSubmit() {
    setError(null);
    setStep("generating");

    const fd = new FormData();
    fd.set("resumeSource", resumeSource);
    if (resumeSource === "upload" && resumeFile) {
      fd.set("resume", resumeFile);
    }
    if (jdFile) {
      fd.set("jobDescriptionFile", jdFile);
    }
    if (jdText.trim()) {
      fd.set("jobDescriptionText", jdText.trim());
    }
    fd.set("interviewStage", stage);
    if (companyHint.trim()) fd.set("companyHint", companyHint.trim());
    if (roleHint.trim()) fd.set("roleHint", roleHint.trim());

    try {
      const res = await fetch("/api/session/create", {
        method: "POST",
        body: fd,
        credentials: "same-origin",
      });
      const text = await res.text();
      let data: { sessionId?: string; error?: string } = {};
      if (text) {
        try {
          data = JSON.parse(text) as { sessionId?: string; error?: string };
        } catch {
          setError(
            res.ok
              ? "Server returned invalid JSON."
              : `Server error (${res.status}).`,
          );
          setStep("details");
          return;
        }
      }
      if (!res.ok) {
        setError(data.error ?? `Request failed (${res.status})`);
        setStep("details");
        return;
      }
      if (!data.sessionId) {
        setError("Missing session id in response");
        setStep("details");
        return;
      }
      router.push(`/session/${data.sessionId}/questions`);
      router.refresh();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Network error — try again.",
      );
      setStep("details");
    }
  }

  return (
    <div className="space-y-6">
      {/* Progress indicator */}
      <div className="flex items-center gap-2">
        {(["resume", "jd", "details"] as const).map((s, i) => {
          const currentIdx = ["resume", "jd", "details"].indexOf(
            step === "generating" ? "details" : step,
          );
          return (
            <div key={s} className="flex items-center gap-2">
              <div
                className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold transition-all ${
                  currentIdx === i
                    ? "bg-gradient-to-r from-[var(--grad-start)] to-[var(--grad-end)] text-white shadow-[0_2px_8px_rgba(124,58,237,0.3)]"
                    : currentIdx > i
                      ? "bg-gradient-to-r from-[var(--grad-start)]/20 to-[var(--grad-end)]/20 text-[var(--accent)]"
                      : "bg-[var(--surface-raised)] text-[var(--fg-subtle)]"
                }`}
              >
                {i + 1}
              </div>
              {i < 2 ? (
                <div className="h-px w-8 bg-[var(--border)] sm:w-12" />
              ) : null}
            </div>
          );
        })}
      </div>

      {/* Step 1: Resume */}
      {step === "resume" ? (
        <div className="animate-fade-up glass gradient-border rounded-2xl p-6 shadow-[var(--shadow-card)]">
          <h2 className="text-lg font-bold text-[var(--fg)]">Your resume</h2>
          <p className="mt-1 text-sm text-[var(--fg-muted)]">
            We use your resume to personalize questions and model answers to your
            actual background.
          </p>

          <div className="mt-6 space-y-4">
            {profile?.hasResume ? (
              <>
                <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-[var(--border)] bg-[var(--bg)] px-4 py-3 transition-colors hover:border-[var(--accent)]/30">
                  <input
                    type="radio"
                    name="resumeSource"
                    checked={resumeSource === "saved"}
                    onChange={() => setResumeSource("saved")}
                    className="mt-0.5 accent-[var(--accent)]"
                  />
                  <div>
                    <p className="text-sm font-medium text-[var(--fg)]">
                      Use saved resume
                    </p>
                    <p className="text-xs text-[var(--fg-muted)]">
                      {profile.resumeFilename ?? "Previously uploaded resume"}
                    </p>
                  </div>
                </label>

                <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-[var(--border)] bg-[var(--bg)] px-4 py-3 transition-colors hover:border-[var(--accent)]/30">
                  <input
                    type="radio"
                    name="resumeSource"
                    checked={resumeSource === "upload"}
                    onChange={() => setResumeSource("upload")}
                    className="mt-0.5 accent-[var(--accent)]"
                  />
                  <div>
                    <p className="text-sm font-medium text-[var(--fg)]">
                      Upload a different resume
                    </p>
                  </div>
                </label>
              </>
            ) : null}

            {resumeSource === "upload" || !profile?.hasResume ? (
              <div>
                <input
                  ref={resumeInputRef}
                  type="file"
                  accept={RESUME_ACCEPT}
                  className="sr-only"
                  onChange={(e) => setResumeFile(e.target.files?.[0] ?? null)}
                />
                <button
                  type="button"
                  onClick={() => resumeInputRef.current?.click()}
                  className="w-full rounded-xl border border-dashed border-[var(--border)] bg-[var(--bg)] px-6 py-8 text-center transition-colors hover:border-[var(--accent)]/30"
                >
                  {resumeFile ? (
                    <p className="text-sm font-medium text-[var(--accent)]">
                      {resumeFile.name}
                    </p>
                  ) : (
                    <>
                      <p className="text-sm font-medium text-[var(--fg-muted)]">
                        Click to upload PDF or DOCX
                      </p>
                      <p className="mt-1 text-xs text-[var(--fg-subtle)]">
                        Your resume is saved for future sessions
                      </p>
                    </>
                  )}
                </button>
              </div>
            ) : null}
          </div>

          <div className="mt-6 flex justify-end gap-3">
            <Button
              variant="secondary"
              onClick={() => router.push("/dashboard")}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              disabled={!hasResume}
              onClick={() => setStep("jd")}
            >
              Continue
            </Button>
          </div>
        </div>
      ) : null}

      {/* Step 2: Job Description */}
      {step === "jd" ? (
        <div className="animate-fade-up glass gradient-border rounded-2xl p-6 shadow-[var(--shadow-card)]">
          <h2 className="text-lg font-bold text-[var(--fg)]">
            Job description
          </h2>
          <p className="mt-1 text-sm text-[var(--fg-muted)]">
            Paste it, drop in a link, or upload a file. We research the company
            and tailor questions to the role.
          </p>

          {/* Mode tabs */}
          <div className="mt-5 flex gap-1 rounded-lg bg-[var(--bg)] p-1">
            {(
              [
                ["paste", "Paste text"],
                ["url", "From URL"],
                ["file", "Upload file"],
              ] as const
            ).map(([mode, label]) => (
              <button
                key={mode}
                type="button"
                onClick={() => setJdMode(mode)}
                className={`flex-1 rounded-md px-3 py-2 text-sm font-medium transition-all duration-200 ${
                  jdMode === mode
                    ? "bg-[var(--surface-hover)] text-[var(--fg)] shadow-sm"
                    : "text-[var(--fg-subtle)] hover:text-[var(--fg-muted)]"
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          <div className="mt-5">
            {jdMode === "paste" ? (
              <textarea
                value={jdText}
                onChange={(e) => setJdText(e.target.value)}
                rows={8}
                placeholder="Paste the role summary, requirements, and any team context…"
                className="w-full resize-y rounded-xl border border-[var(--border)] bg-[var(--surface-hover)] px-4 py-3 text-sm text-[var(--fg)] placeholder:text-[var(--fg-subtle)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]/50"
              />
            ) : jdMode === "url" ? (
              <div className="space-y-3">
                <div className="flex gap-2">
                  <input
                    type="url"
                    value={jdUrl}
                    onChange={(e) => setJdUrl(e.target.value)}
                    placeholder="https://jobs.lever.co/company/... or Google Docs link"
                    className="flex h-10 flex-1 rounded-lg border border-[var(--border)] bg-[var(--surface-hover)] px-3 text-sm text-[var(--fg)] placeholder:text-[var(--fg-subtle)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]/50"
                  />
                  <Button
                    variant="secondary"
                    size="md"
                    disabled={!jdUrl.trim() || jdFetching}
                    onClick={handleFetchUrl}
                  >
                    {jdFetching ? "Fetching…" : "Fetch"}
                  </Button>
                </div>
                <p className="text-xs text-[var(--fg-subtle)]">
                  Works with job board links, company career pages, and Google
                  Docs.
                </p>
                {jdText && (
                  <div className="max-h-48 overflow-y-auto rounded-lg border border-[var(--border)] bg-[var(--bg)] p-3 text-xs text-[var(--fg-muted)]">
                    {jdText.slice(0, 500)}
                    {jdText.length > 500 ? "…" : ""}
                  </div>
                )}
              </div>
            ) : (
              <div>
                <input
                  ref={jdInputRef}
                  type="file"
                  accept={RESUME_ACCEPT}
                  className="sr-only"
                  onChange={(e) => setJdFile(e.target.files?.[0] ?? null)}
                />
                <button
                  type="button"
                  onClick={() => jdInputRef.current?.click()}
                  className="w-full rounded-xl border border-dashed border-[var(--border)] bg-[var(--bg)] px-6 py-8 text-center transition-colors hover:border-[var(--accent)]/30"
                >
                  {jdFile ? (
                    <p className="text-sm font-medium text-[var(--accent)]">
                      {jdFile.name}
                    </p>
                  ) : (
                    <p className="text-sm font-medium text-[var(--fg-muted)]">
                      Click to upload PDF or DOCX
                    </p>
                  )}
                </button>
              </div>
            )}
          </div>

          {error ? (
            <p
              ref={errorRef}
              className="mt-4 text-sm text-[var(--danger)]"
              role="alert"
            >
              {error}
            </p>
          ) : null}

          <div className="mt-6 flex justify-between gap-3">
            <Button variant="ghost" onClick={() => setStep("resume")}>
              Back
            </Button>
            <Button
              variant="primary"
              disabled={!hasJd || jdFetching}
              onClick={handleGoToDetails}
            >
              Continue
            </Button>
          </div>
        </div>
      ) : null}

      {/* Step 3: Quick setup */}
      {step === "details" || step === "generating" ? (
        <div className="animate-fade-up glass gradient-border rounded-2xl p-6 shadow-[var(--shadow-card)]">
          <h2 className="text-lg font-bold text-[var(--fg)]">Quick setup</h2>
          <p className="mt-1 text-sm text-[var(--fg-muted)]">
            {extracting
              ? "Reading job description…"
              : "Confirm these details. We auto-detected what we could."}
          </p>

          <div className="mt-6 space-y-5">
            <div className="space-y-2">
              <label
                htmlFor="stage"
                className="block text-sm font-medium text-[var(--fg-muted)]"
              >
                Interview stage
              </label>
              <select
                id="stage"
                value={stage}
                onChange={(e) => setStage(e.target.value as typeof stage)}
                disabled={step === "generating"}
                className="h-10 w-full rounded-lg border border-[var(--border)] bg-[var(--surface-hover)] px-3 text-sm text-[var(--fg)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]/50"
              >
                {INTERVIEW_STAGES.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <label
                  htmlFor="company"
                  className="block text-sm font-medium text-[var(--fg-muted)]"
                >
                  Company
                </label>
                <input
                  id="company"
                  type="text"
                  value={companyHint}
                  onChange={(e) => setCompanyHint(e.target.value)}
                  disabled={step === "generating"}
                  placeholder={extracting ? "Detecting…" : "e.g. Stripe"}
                  className="flex h-10 w-full rounded-lg border border-[var(--border)] bg-[var(--surface-hover)] px-3 text-sm text-[var(--fg)] placeholder:text-[var(--fg-subtle)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]/50"
                />
              </div>
              <div className="space-y-2">
                <label
                  htmlFor="role"
                  className="block text-sm font-medium text-[var(--fg-muted)]"
                >
                  Role title
                </label>
                <input
                  id="role"
                  type="text"
                  value={roleHint}
                  onChange={(e) => setRoleHint(e.target.value)}
                  disabled={step === "generating"}
                  placeholder={extracting ? "Detecting…" : "e.g. Staff Engineer"}
                  className="flex h-10 w-full rounded-lg border border-[var(--border)] bg-[var(--surface-hover)] px-3 text-sm text-[var(--fg)] placeholder:text-[var(--fg-subtle)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]/50"
                />
              </div>
            </div>
          </div>

          {step === "generating" ? (
            <p className="mt-6 animate-gradient rounded-xl border border-[var(--accent)]/15 bg-gradient-to-r from-violet-50 via-rose-50 to-orange-50 px-4 py-3 text-sm text-[var(--accent)]">
              Generating your interview — this takes{" "}
              <span className="font-semibold">1–2 minutes</span> while we
              research the company and build tailored questions.
            </p>
          ) : null}

          {error && step !== "jd" ? (
            <p
              ref={errorRef}
              className="mt-4 text-sm text-[var(--danger)]"
              role="alert"
            >
              {error}
            </p>
          ) : null}

          <div className="mt-6 flex justify-between gap-3">
            <Button
              variant="ghost"
              onClick={() => setStep("jd")}
              disabled={step === "generating"}
            >
              Back
            </Button>
            <Button
              variant="primary"
              disabled={step === "generating"}
              onClick={handleSubmit}
            >
              {step === "generating" ? "Generating…" : "Generate questions"}
            </Button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
