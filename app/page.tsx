import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { ShareButton } from "@/components/ShareButton";
import {
  FileText,
  Mic,
  Target,
  BrainCircuit,
  BarChart3,
  AudioLines,
  MessageSquareText,
  TrendingUp,
  UserCheck,
} from "lucide-react";

const STEPS = [
  {
    icon: FileText,
    num: "01",
    title: "Upload your materials",
    desc: "Resume and job description. PDF, DOCX, or paste a link. Takes 30 seconds.",
  },
  {
    icon: Mic,
    num: "02",
    title: "Answer out loud",
    desc: "Speak your answers using your mic. Real-time transcription and delivery tracking.",
  },
  {
    icon: Target,
    num: "03",
    title: "Get your coaching report",
    desc: "Scored feedback, a stronger version of your answer built from your background, and what to fix next.",
  },
];

const FEATURES = [
  {
    icon: BrainCircuit,
    title: "Questions you'll actually face",
    desc: "We research the company and read your resume. Every question is tailored to this specific interview.",
  },
  {
    icon: BarChart3,
    title: "7-dimension scoring",
    desc: "Relevance, structure, specificity, impact, clarity, reasoning, and values. Calibrated to your seniority.",
  },
  {
    icon: AudioLines,
    title: "Delivery analytics",
    desc: "Speaking pace, answer duration, filler words. Understand how you sound, not just what you say.",
  },
  {
    icon: MessageSquareText,
    title: "Your story, told better",
    desc: "Model answers built from your real companies and accomplishments. Not generic templates.",
  },
  {
    icon: TrendingUp,
    title: "Pattern recognition",
    desc: "Cross-question analysis identifies the habits that help and the ones holding you back.",
  },
  {
    icon: UserCheck,
    title: "No signup to start",
    desc: "Practice immediately. Create an account when you're ready to see your results.",
  },
];

export default function HomePage() {
  return (
    <div className="flex flex-1 flex-col">
      {/* Header */}
      <header className="sticky top-0 z-10 border-b border-[var(--border)] bg-[var(--bg)]/90 backdrop-blur-md">
        <div className="mx-auto flex h-14 w-full max-w-6xl items-center justify-between px-6">
          <span className="text-sm font-semibold tracking-tight text-[var(--fg)]">
            intrvw<span className="text-[var(--accent)]">.ai</span>
          </span>
          <nav className="flex items-center gap-3">
            <ShareButton />
            <Link
              href="/login"
              className="cursor-pointer text-sm text-[var(--fg-muted)] transition-colors duration-150 hover:text-[var(--fg)]"
            >
              Log in
            </Link>
            <Button variant="primary" size="sm" href="/session/new">
              Start practicing
            </Button>
          </nav>
        </div>
      </header>

      {/* Hero */}
      <section className="border-b border-[var(--border)]">
        <div className="mx-auto max-w-4xl px-6 pb-20 pt-24 text-center">
          <div className="animate-fade-up">
            <p className="text-sm font-medium text-[var(--accent)]">
              AI-powered interview coaching
            </p>
            <h1 className="mt-4 text-3xl font-bold leading-[1.15] tracking-tight text-[var(--fg)] sm:text-4xl lg:text-5xl">
              Practice the interview you're
              <br className="hidden sm:block" />
              actually walking into
            </h1>
            <p className="mx-auto mt-6 max-w-2xl text-base leading-relaxed text-[var(--fg-muted)]">
              Upload your resume and a job description. Intrvw.ai generates
              tailored questions, records your spoken answers, and coaches you
              with the specificity of a hiring manager who wants you to get the offer.
            </p>
            <div className="mt-8 flex flex-wrap justify-center gap-3">
              <Button variant="primary" size="lg" href="/session/new">
                Try it free — no signup
              </Button>
              <Button variant="secondary" size="lg" href="#how-it-works">
                How it works
              </Button>
            </div>
          </div>

          {/* Video embed area */}
          <div
            className="mx-auto mt-16 max-w-3xl animate-fade-up"
            style={{ animationDelay: "150ms" }}
          >
            <div className="overflow-hidden rounded-xl border border-[var(--border-strong)] bg-[var(--surface)] shadow-[var(--shadow-elevated)]">
              <video
                className="aspect-video w-full"
                controls
                preload="metadata"
                poster=""
              >
                <source src="/demo.mp4" type="video/mp4" />
                Your browser does not support the video tag.
              </video>
            </div>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section id="how-it-works" className="border-b border-[var(--border)]">
        <div className="mx-auto max-w-5xl px-6 py-24">
          <div className="text-center">
            <p className="text-sm font-medium text-[var(--accent)]">
              Three steps
            </p>
            <h2 className="mt-3 text-2xl font-bold tracking-tight text-[var(--fg)] sm:text-3xl">
              Ready in under 3 minutes
            </h2>
          </div>

          <div className="stagger-children mt-16 grid gap-px overflow-hidden rounded-xl border border-[var(--border)] bg-[var(--border)] sm:grid-cols-3">
            {STEPS.map((s) => {
              const Icon = s.icon;
              return (
                <div
                  key={s.num}
                  className="bg-[var(--surface)] p-8 transition-colors duration-150 hover:bg-[var(--surface-hover)]"
                >
                  <div className="flex items-center gap-3">
                    <Icon size={16} className="text-[var(--accent)]" />
                    <span className="font-mono text-xs text-[var(--fg-subtle)]">
                      {s.num}
                    </span>
                  </div>
                  <h3 className="mt-4 text-sm font-semibold text-[var(--fg)]">
                    {s.title}
                  </h3>
                  <p className="mt-2 text-sm leading-relaxed text-[var(--fg-muted)]">
                    {s.desc}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="border-b border-[var(--border)]">
        <div className="mx-auto max-w-5xl px-6 py-24">
          <div className="text-center">
            <p className="text-sm font-medium text-[var(--accent)]">
              What you get
            </p>
            <h2 className="mt-3 text-2xl font-bold tracking-tight text-[var(--fg)] sm:text-3xl">
              Coaching that changes your outcome
            </h2>
            <p className="mx-auto mt-3 max-w-xl text-sm text-[var(--fg-muted)]">
              The difference between a good interview and a great one can be
              tens of thousands of dollars. Intrvw.ai helps you close that gap.
            </p>
          </div>

          <div className="stagger-children mt-16 grid gap-px overflow-hidden rounded-xl border border-[var(--border)] bg-[var(--border)] sm:grid-cols-2 lg:grid-cols-3">
            {FEATURES.map((f) => {
              const Icon = f.icon;
              return (
                <div
                  key={f.title}
                  className="bg-[var(--surface)] p-7 transition-colors duration-150 hover:bg-[var(--surface-hover)]"
                >
                  <Icon size={16} className="text-[var(--accent)]" />
                  <h3 className="mt-3 text-sm font-semibold text-[var(--fg)]">
                    {f.title}
                  </h3>
                  <p className="mt-2 text-sm leading-relaxed text-[var(--fg-muted)]">
                    {f.desc}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="border-b border-[var(--border)]">
        <div className="mx-auto max-w-2xl px-6 py-24 text-center">
          <h2 className="text-2xl font-bold tracking-tight text-[var(--fg)] sm:text-3xl">
            Your next interview is worth preparing for
          </h2>
          <p className="mt-4 text-sm text-[var(--fg-muted)]">
            Free during early access. No signup needed to start.
          </p>
          <Button variant="primary" size="lg" href="/session/new" className="mt-8">
            Start practicing now
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8">
        <div className="mx-auto max-w-6xl px-6">
          <div className="flex flex-col items-center gap-3 sm:flex-row sm:justify-between">
            <p className="text-xs text-[var(--fg-subtle)]">
              intrvw<span className="text-[var(--accent)]">.ai</span>
              {" — "}AI-powered interview coaching
            </p>
            <div className="flex gap-4 text-xs text-[var(--fg-subtle)]">
              <Link
                href="/terms"
                className="transition-colors hover:text-[var(--fg-muted)]"
              >
                Terms
              </Link>
              <Link
                href="/privacy"
                className="transition-colors hover:text-[var(--fg-muted)]"
              >
                Privacy
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
