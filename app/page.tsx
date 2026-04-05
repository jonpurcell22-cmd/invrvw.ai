import Link from "next/link";
import { Button } from "@/components/ui/Button";

const STEPS = [
  {
    num: "01",
    title: "Upload your materials",
    desc: "Drop in your resume and paste a job description. Takes 30 seconds.",
    icon: "📄",
  },
  {
    num: "02",
    title: "Practice out loud",
    desc: "Answer tailored questions using your mic. We record delivery and transcribe in real time.",
    icon: "🎙️",
  },
  {
    num: "03",
    title: "Get coached",
    desc: "Scored feedback, a stronger version of your answer, and one thing to practice next.",
    icon: "🎯",
  },
];

const FEATURES = [
  {
    title: "Personalized questions",
    desc: "Claude researches the company, reads your resume, and generates questions you'll actually face.",
  },
  {
    title: "7-dimension scoring",
    desc: "Relevance, structure, specificity, impact, clarity, reasoning, and values — calibrated to your level.",
  },
  {
    title: "Speech analytics",
    desc: "Pacing, duration, filler words. Know exactly how you sound, not just what you said.",
  },
  {
    title: "Answers from your background",
    desc: "Not generic examples. Stronger versions built from your actual companies and accomplishments.",
  },
  {
    title: "Session trends",
    desc: "Cross-question patterns: what you consistently do well, and the habits holding you back.",
  },
  {
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
            <span className="text-gradient">PrepIQ</span>
          </span>
          <nav className="flex items-center gap-3">
            <Link
              href="/login"
              className="text-sm text-[var(--fg-muted)] transition-colors hover:text-[var(--fg)]"
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
        {/* Animated gradient mesh */}
        <div className="hero-mesh" aria-hidden="true">
          <div className="blob" />
          <div className="blob" />
          <div className="blob" />
        </div>

        <div className="relative mx-auto max-w-4xl px-6 pb-28 pt-32 text-center">
          <div className="animate-fade-up">
            <div className="mx-auto mb-6 inline-flex items-center gap-2 rounded-full border border-[var(--border-strong)] bg-[var(--surface-solid)] px-4 py-1.5 text-xs font-medium text-[var(--fg-muted)] shadow-sm">
              <span className="h-1.5 w-1.5 rounded-full bg-[var(--success)]" />
              AI-powered interview coaching
            </div>

            <h1 className="text-5xl font-extrabold tracking-tight text-[var(--fg)] sm:text-6xl lg:text-7xl">
              Stop guessing.
              <br />
              <span className="text-gradient">Start nailing it.</span>
            </h1>

            <p className="mx-auto mt-7 max-w-2xl text-lg leading-relaxed text-[var(--fg-muted)]">
              Upload your resume and a job description. PrepIQ generates the
              questions you'll actually face, listens to your answers, and
              coaches you with scored, personalized feedback.
            </p>

            <div className="mt-10 flex flex-wrap justify-center gap-4">
              <Button variant="primary" size="lg" href="/session/new">
                Try it free — no signup
              </Button>
              <Button variant="secondary" size="lg" href="#how-it-works">
                See how it works
              </Button>
            </div>
          </div>

          {/* Floating preview cards */}
          <div
            className="mx-auto mt-20 max-w-2xl animate-fade-up"
            style={{ animationDelay: "200ms" }}
          >
            <div className="relative">
              {/* Main card */}
              <div className="glass gradient-border rounded-3xl p-8 shadow-[var(--shadow-elevated)] text-left">
                <div className="flex items-center gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-br from-[var(--grad-start)] to-[var(--grad-end)] text-white text-xs font-bold">
                    Q1
                  </div>
                  <span className="text-xs font-medium text-[var(--fg-muted)]">
                    Behavioral · Senior Engineer
                  </span>
                </div>
                <p className="mt-4 text-lg font-semibold text-[var(--fg)]">
                  Tell me about a time you led a complex technical project under
                  tight deadlines.
                </p>
                <div className="mt-5 flex gap-2">
                  <div className="h-1.5 flex-1 rounded-full bg-gradient-to-r from-[var(--grad-start)] to-[var(--grad-mid)]" />
                  <div className="h-1.5 flex-1 rounded-full bg-gradient-to-r from-[var(--grad-mid)] to-[var(--grad-end)]" />
                  <div className="h-1.5 flex-1 rounded-full bg-[var(--surface-raised)]" />
                </div>
              </div>

              {/* Floating score card */}
              <div
                className="absolute -right-4 -top-4 animate-float glass rounded-2xl border border-[var(--border)] px-4 py-3 shadow-[var(--shadow-color)]"
                style={{ animationDelay: "-2s" }}
              >
                <p className="text-xs font-medium text-[var(--fg-muted)]">
                  Score
                </p>
                <p className="text-2xl font-bold text-gradient">87</p>
              </div>

              {/* Floating feedback card */}
              <div
                className="absolute -bottom-6 -left-4 animate-float glass rounded-2xl border border-[var(--border)] px-4 py-3 shadow-[var(--shadow-color)] max-w-[220px]"
                style={{ animationDelay: "-4s" }}
              >
                <p className="text-xs font-medium text-[var(--success)]">
                  + What worked
                </p>
                <p className="mt-1 text-xs text-[var(--fg-muted)]">
                  Strong quantified results — the 60% incident reduction built
                  immediate credibility.
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
            <h2 className="mt-3 text-3xl font-bold tracking-tight text-[var(--fg)] sm:text-4xl">
              Ready in under 3 minutes
            </h2>
          </div>

          <div className="stagger-children mt-16 grid gap-8 sm:grid-cols-3">
            {STEPS.map((s) => (
              <div
                key={s.num}
                className="gradient-border glass rounded-2xl p-6 shadow-[var(--shadow-card)] transition-all duration-300 hover:shadow-[var(--shadow-glow)] hover:-translate-y-1"
              >
                <span className="text-3xl">{s.icon}</span>
                <span className="mt-3 block font-mono text-xs font-semibold text-gradient">
                  Step {s.num}
                </span>
                <h3 className="mt-2 text-base font-semibold text-[var(--fg)]">
                  {s.title}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-[var(--fg-muted)]">
                  {s.desc}
                </p>
              </div>
            ))}
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
            <h2 className="mt-3 text-3xl font-bold tracking-tight text-[var(--fg)] sm:text-4xl">
              Coaching that changes how you interview
            </h2>
          </div>

          <div className="stagger-children mt-16 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {FEATURES.map((f) => (
              <div
                key={f.title}
                className="glass gradient-border rounded-2xl p-6 shadow-[var(--shadow-card)] transition-all duration-300 hover:shadow-[var(--shadow-glow)] hover:-translate-y-1"
              >
                <h3 className="text-sm font-semibold text-[var(--fg)]">
                  {f.title}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-[var(--fg-muted)]">
                  {f.desc}
                </p>
              </div>
            ))}
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
          <p className="mt-4 text-sm leading-relaxed text-[var(--fg-muted)]">
            Free during early access. No signup needed to start.
          </p>
          <Button
            variant="primary"
            size="lg"
            href="/session/new"
            className="mt-8"
          >
            Start practicing now
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-[var(--border)] py-8">
        <div className="mx-auto max-w-6xl px-6">
          <p className="text-center text-xs text-[var(--fg-subtle)]">
            <span className="text-gradient font-semibold">PrepIQ</span>
            {" — "}AI-powered interview coaching.
          </p>
        </div>
      </footer>
    </div>
  );
}
