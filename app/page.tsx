import Link from "next/link";
import { Button } from "@/components/ui/Button";
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
    title: "Upload your materials",
    desc: "Drop in your resume and paste a job description. Takes 30 seconds.",
  },
  {
    icon: Mic,
    title: "Practice out loud",
    desc: "Answer tailored questions using your mic. We record delivery and transcribe in real time.",
  },
  {
    icon: Target,
    title: "Get coached",
    desc: "Scored feedback, a stronger version of your answer, and one thing to practice next.",
  },
];

const FEATURES = [
  {
    icon: BrainCircuit,
    title: "Personalized questions",
    desc: "Claude researches the company, reads your resume, and generates questions you'll actually face.",
  },
  {
    icon: BarChart3,
    title: "7-dimension scoring",
    desc: "Relevance, structure, specificity, impact, clarity, reasoning, and values — calibrated to your level.",
  },
  {
    icon: AudioLines,
    title: "Speech analytics",
    desc: "Pacing, duration, filler words. Know exactly how you sound, not just what you said.",
  },
  {
    icon: MessageSquareText,
    title: "Answers from your background",
    desc: "Not generic examples. Stronger versions built from your actual companies and accomplishments.",
  },
  {
    icon: TrendingUp,
    title: "Session trends",
    desc: "Cross-question patterns: what you consistently do well, and the habits holding you back.",
  },
  {
    icon: UserCheck,
    title: "No signup required",
    desc: "Start practicing immediately. Create an account only when you're ready to see results.",
  },
];

export default function HomePage() {
  return (
    <div className="flex flex-1 flex-col">
      {/* Header */}
      <header className="sticky top-0 z-10 border-b border-[var(--border)] glass">
        <div className="mx-auto flex h-14 w-full max-w-6xl items-center justify-between px-6">
          <span className="text-sm font-bold tracking-tight">
            <span className="text-gradient">Intrvw.ai</span>
          </span>
          <nav className="flex items-center gap-3">
            <Link
              href="/login"
              className="cursor-pointer text-sm text-[var(--fg-muted)] transition-colors duration-200 hover:text-[var(--fg)]"
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
      <section className="relative overflow-hidden">
        <div className="hero-mesh" aria-hidden="true">
          <div className="blob" />
          <div className="blob" />
          <div className="blob" />
        </div>

        <div className="relative mx-auto max-w-4xl px-6 pb-32 pt-36 text-center">
          <div className="animate-fade-up">
            <div className="mx-auto mb-8 inline-flex items-center gap-2.5 rounded-full border border-[var(--border-strong)] bg-[var(--surface-solid)] px-4 py-1.5 text-xs font-medium text-[var(--fg-muted)] shadow-sm">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[var(--success)] opacity-75" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-[var(--success)]" />
              </span>
              AI-powered interview coaching
            </div>

            <h1 className="text-5xl font-extrabold leading-[1.1] tracking-tight text-[var(--fg)] sm:text-6xl lg:text-7xl">
              Stop guessing.
              <br />
              <span className="text-gradient">Start nailing it.</span>
            </h1>

            <p className="mx-auto mt-8 max-w-2xl text-lg leading-relaxed text-[var(--fg-muted)]">
              Upload your resume and a job description. Intrvw.ai generates the
              questions you'll actually face, listens to your answers, and
              coaches you with scored, personalized feedback.
            </p>

            <div className="mt-12 flex flex-wrap justify-center gap-4">
              <Button variant="primary" size="lg" href="/session/new">
                Try it free — no signup
              </Button>
              <Button variant="secondary" size="lg" href="#how-it-works">
                See how it works
              </Button>
            </div>
          </div>

          {/* Preview mockup */}
          <div
            className="mx-auto mt-24 max-w-3xl animate-fade-up text-left"
            style={{ animationDelay: "200ms" }}
          >
            {/* Question card + score */}
            <div className="glass gradient-border cursor-default rounded-3xl p-7 shadow-[var(--shadow-elevated)]">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-br from-[var(--grad-start)] to-[var(--grad-end)] text-white text-xs font-bold shadow-sm">
                      Q1
                    </div>
                    <span className="text-xs font-medium text-[var(--fg-muted)]">
                      Role-Specific · Staff Engineer
                    </span>
                  </div>
                  <p className="mt-4 text-base font-semibold leading-snug text-[var(--fg)] sm:text-lg">
                    Your target company processes millions of API requests per
                    second. Based on the event pipeline you built at your
                    previous role, how would you design their next-gen webhook
                    delivery system?
                  </p>
                </div>
                <div className="shrink-0 text-right">
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-[var(--fg-subtle)]">
                    Score
                  </p>
                  <p className="text-3xl font-extrabold text-gradient">87</p>
                </div>
              </div>
              <div className="mt-5 flex gap-1.5">
                {[85, 70, 45].map((w, i) => (
                  <div
                    key={i}
                    className="h-1.5 flex-1 overflow-hidden rounded-full bg-[var(--surface-raised)]"
                  >
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-[var(--grad-start)] via-[var(--grad-mid)] to-[var(--grad-end)]"
                      style={{ width: `${w}%` }}
                    />
                  </div>
                ))}
              </div>
            </div>

            {/* Feedback cards row */}
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              {/* What worked */}
              <div className="glass gradient-border cursor-default rounded-2xl p-5 shadow-[var(--shadow-card)]">
                <div className="flex items-center gap-2">
                  <div className="h-2 w-2 rounded-full bg-[var(--success)]" />
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-[var(--success)]">
                    What worked
                  </p>
                </div>
                <p className="mt-2.5 text-sm leading-relaxed text-[var(--fg-muted)]">
                  You anchored your answer in your pipeline's 50K events/sec
                  throughput — that kind of specific credibility is exactly
                  what interviewers at this level look for.
                </p>
              </div>

              {/* What needs improvement */}
              <div className="glass gradient-border cursor-default rounded-2xl p-5 shadow-[var(--shadow-card)]">
                <div className="flex items-center gap-2">
                  <div className="h-2 w-2 rounded-full bg-[var(--warning)]" />
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-[var(--warning)]">
                    What to improve
                  </p>
                </div>
                <p className="mt-2.5 text-sm leading-relaxed text-[var(--fg-muted)]">
                  Connect your past experience to their scale — explain why
                  your approach handles 10x more volume, not just how.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section
        id="how-it-works"
        className="border-t border-[var(--border)] bg-[var(--bg-secondary)]"
      >
        <div className="mx-auto max-w-5xl px-6 py-28">
          <div className="text-center">
            <p className="text-sm font-semibold uppercase tracking-widest text-gradient">
              How it works
            </p>
            <h2 className="mt-4 text-3xl font-bold tracking-tight text-[var(--fg)] sm:text-4xl">
              Ready in under 3 minutes
            </h2>
          </div>

          <div className="stagger-children mt-20 grid gap-8 sm:grid-cols-3">
            {STEPS.map((s, i) => {
              const Icon = s.icon;
              return (
                <div
                  key={i}
                  className="gradient-border glass cursor-default rounded-2xl p-7 shadow-[var(--shadow-card)] transition-all duration-250 hover:shadow-[var(--shadow-glow)] hover:-translate-y-1"
                >
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-[var(--grad-start)] to-[var(--grad-end)] text-white shadow-sm">
                    <Icon size={20} strokeWidth={2} />
                  </div>
                  <span className="mt-4 block font-mono text-xs font-semibold text-gradient">
                    Step {String(i + 1).padStart(2, "0")}
                  </span>
                  <h3 className="mt-2 text-base font-semibold text-[var(--fg)]">
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
      <section className="border-t border-[var(--border)]">
        <div className="mx-auto max-w-5xl px-6 py-28">
          <div className="text-center">
            <p className="text-sm font-semibold uppercase tracking-widest text-gradient">
              What you get
            </p>
            <h2 className="mt-4 text-3xl font-bold tracking-tight text-[var(--fg)] sm:text-4xl">
              Coaching that changes how you interview
            </h2>
          </div>

          <div className="stagger-children mt-20 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {FEATURES.map((f) => {
              const Icon = f.icon;
              return (
                <div
                  key={f.title}
                  className="glass gradient-border cursor-default rounded-2xl p-7 shadow-[var(--shadow-card)] transition-all duration-250 hover:shadow-[var(--shadow-glow)] hover:-translate-y-1"
                >
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[var(--surface-raised)]">
                    <Icon
                      size={18}
                      strokeWidth={2}
                      className="text-[var(--accent)]"
                    />
                  </div>
                  <h3 className="mt-4 text-sm font-semibold text-[var(--fg)]">
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
      <section className="relative overflow-hidden border-t border-[var(--border)]">
        <div className="hero-mesh" aria-hidden="true">
          <div className="blob" style={{ opacity: 0.2 }} />
          <div className="blob" style={{ opacity: 0.15 }} />
          <div className="blob" style={{ opacity: 0.12 }} />
        </div>
        <div className="relative mx-auto max-w-3xl px-6 py-28 text-center">
          <h2 className="text-3xl font-bold tracking-tight text-[var(--fg)] sm:text-4xl">
            Your next interview
            <br />
            <span className="text-gradient">deserves real prep.</span>
          </h2>
          <p className="mt-5 text-sm leading-relaxed text-[var(--fg-muted)]">
            Free during early access. No signup needed to start.
          </p>
          <Button
            variant="primary"
            size="lg"
            href="/session/new"
            className="mt-10"
          >
            Start practicing now
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-[var(--border)] py-10">
        <div className="mx-auto max-w-6xl px-6">
          <p className="text-center text-xs text-[var(--fg-subtle)]">
            <span className="text-gradient font-semibold">Intrvw.ai</span>
            {" — "}AI-powered interview coaching.
          </p>
        </div>
      </footer>
    </div>
  );
}
