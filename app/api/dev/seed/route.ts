import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase-server";

/**
 * POST /api/dev/seed
 *
 * Creates a fully-completed session with questions, responses, scores, and
 * feedback so you can jump straight to the results page without uploading
 * resumes or recording answers.
 *
 * Only available when NODE_ENV !== "production".
 *
 * Returns: { sessionId, resultsUrl }
 */
export async function POST() {
  if (process.env.NODE_ENV === "production") {
    return NextResponse.json({ error: "Not available in production" }, { status: 403 });
  }

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  // --- Session ---
  const { data: session, error: sessionErr } = await supabase
    .from("sessions")
    .insert({
      user_id: user.id,
      company_name: "Acme Corp",
      role_title: "Senior Software Engineer",
      interview_stage: "First Round",
      seniority_level: "senior",
      resume_text: "Sample resume text for seed data.",
      job_description_text:
        "Sample job description for a Senior Software Engineer at Acme Corp.",
      company_research:
        "Acme Corp is a mid-size SaaS company focused on developer tools. Founded in 2015, ~500 employees, Series C funded.",
      status: "completed",
      overall_score: 68,
      summary: JSON.stringify({
        headline: "You demonstrate strong technical depth and ownership, but your answers would land harder with more structure and quantified results.",
        strengths: [
          "You consistently ground your answers in real, specific technical experiences — naming tools, architectures, and throughput numbers. In 5 of 8 answers, you provided concrete technical detail that would build credibility with an interviewer.",
          "When you talk about projects you led (the microservices migration, the feature flag system), your ownership and initiative come through clearly. These are the kind of answers that make interviewers want to hire you.",
        ],
        improvements: [
          "In 4 of 8 answers, you jumped straight into what you did without setting up the stakes first. Lead with why it mattered — the business problem, the cost of inaction, the customer impact — before describing your approach.",
          "Your answers tend to end abruptly after describing the result. Adding a single sentence about what you learned or what you'd do differently signals the kind of reflective thinking that separates senior engineers from mid-level ones.",
          "When asked about collaboration or culture ('Why Acme?', 'How do you handle disagreements?'), your answers became noticeably more generic. Prepare 2-3 specific stories about working with people, not just systems.",
        ],
      }),
    })
    .select("id")
    .single();

  if (sessionErr || !session) {
    return NextResponse.json(
      { error: sessionErr?.message ?? "Failed to create session" },
      { status: 500 },
    );
  }

  const sessionId = session.id;

  // --- Questions + Responses ---
  const seed = SEED_QUESTIONS.map((q, i) => ({ ...q, order: i + 1 }));

  for (const item of seed) {
    const { data: question, error: qErr } = await supabase
      .from("questions")
      .insert({
        session_id: sessionId,
        question_order: item.order,
        question_text: item.questionText,
        question_category: item.category,
        rubric: makeRubric(item.weights),
      })
      .select("id")
      .single();

    if (qErr || !question) {
      return NextResponse.json(
        { error: `Question insert failed: ${qErr?.message}` },
        { status: 500 },
      );
    }

    const dims = item.dimensionScores;
    const weights = item.weights;
    const weightedSum = Object.entries(dims).reduce(
      (sum, [k, v]) => sum + v * (weights[k] ?? 1 / 7),
      0,
    );
    const avg1to5 = Math.round(weightedSum * 10) / 10;
    const score100 = Math.round(((avg1to5 - 1) / 4) * 100);

    const feedback = JSON.stringify({
      dimensions: {
        relevance: { score: dims.relevance, feedback: item.feedback.relevance },
        structure: { score: dims.structure, feedback: item.feedback.structure },
        specificity: { score: dims.specificity, feedback: item.feedback.specificity },
        impact_articulation: { score: dims.impact_articulation, feedback: item.feedback.impact_articulation },
        communication_clarity: { score: dims.communication_clarity, feedback: item.feedback.communication_clarity },
        analytical_reasoning: { score: dims.analytical_reasoning, feedback: item.feedback.analytical_reasoning },
        values_culture_signal: { score: dims.values_culture_signal, feedback: item.feedback.values_culture_signal },
      },
      overallScore1To5: avg1to5,
    });

    const { error: rErr } = await supabase.from("responses").insert({
      question_id: question.id,
      session_id: sessionId,
      transcript: item.transcript,
      score: score100,
      feedback,
      model_answer: item.modelAnswer,
    });

    if (rErr) {
      return NextResponse.json(
        { error: `Response insert failed: ${rErr.message}` },
        { status: 500 },
      );
    }
  }

  return NextResponse.json({
    sessionId,
    resultsUrl: `/session/${sessionId}/results`,
  });
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeRubric(weights: Record<string, number>) {
  return {
    scaleMin: 1,
    scaleMax: 5,
    dimensions: [
      { key: "relevance", label: "Relevance", description: "Did they answer what was actually asked?", weight: weights.relevance ?? 0.10 },
      { key: "structure", label: "Structure", description: "STAR or equivalent logical flow", weight: weights.structure ?? 0.10 },
      { key: "specificity", label: "Specificity", description: "Concrete, personal examples vs. vague generalities", weight: weights.specificity ?? 0.15 },
      { key: "impact_articulation", label: "Impact Articulation", description: "Quantified or qualified outcomes tied to their actions", weight: weights.impact_articulation ?? 0.20 },
      { key: "communication_clarity", label: "Communication Clarity", description: "Conciseness, precision of language, narrative efficiency", weight: weights.communication_clarity ?? 0.10 },
      { key: "analytical_reasoning", label: "Analytical Reasoning", description: "Problem-framing, decision logic, root cause thinking", weight: weights.analytical_reasoning ?? 0.15 },
      { key: "values_culture_signal", label: "Values and Culture Signal", description: "Collaboration, ownership, growth mindset, ethical reasoning", weight: weights.values_culture_signal ?? 0.20 },
    ],
  };
}

// ---------------------------------------------------------------------------
// Seed data — 8 questions with 7 dimensions and varied scores
// ---------------------------------------------------------------------------

type SeedQ = {
  questionText: string;
  category: string;
  transcript: string;
  dimensionScores: Record<string, number>;
  weights: Record<string, number>;
  feedback: Record<string, string>;
  modelAnswer: string;
};

const SEED_QUESTIONS: SeedQ[] = [
  {
    questionText: "Tell me about a time you led a complex technical project from start to finish.",
    category: "behavioral",
    transcript: "So um at my last company I led the migration of our monolith to microservices. I started by like mapping all the service boundaries with the team, and then um created a phased rollout plan. We moved the auth service first since it had the fewest dependencies, you know. Over six months we basically migrated eight services, reduced deploy times from 45 minutes to under 5, and um cut incident rates by 60%.",
    dimensionScores: { relevance: 5, structure: 4, specificity: 4, impact_articulation: 5, communication_clarity: 4, analytical_reasoning: 4, values_culture_signal: 3 },
    weights: { relevance: 0.10, structure: 0.15, specificity: 0.20, impact_articulation: 0.20, communication_clarity: 0.10, analytical_reasoning: 0.15, values_culture_signal: 0.10 },
    feedback: {
      relevance: "Directly addresses the question with a clear, relevant project example.",
      structure: "Good chronological flow with clear phases. Could benefit from a more explicit hook and a reflection at the end.",
      specificity: "Strong detail on service count, timeline, and approach. Could name specific tools or the decision criteria for starting with auth.",
      impact_articulation: "Excellent quantified outcomes: deploy time 45→5 min, 60% incident reduction. Adding revenue or customer impact would earn a 5.",
      communication_clarity: "Clear and efficient delivery. Each sentence advances the narrative without filler.",
      analytical_reasoning: "Shows strategic thinking in choosing auth service first due to lowest coupling. Could articulate the trade-offs considered more explicitly.",
      values_culture_signal: "Mentions working with the team but uses 'we' broadly without distinguishing personal ownership from team collaboration.",
    },
    modelAnswer: "When I joined Acme, our monolithic Rails app had grown to 2M LOC and deploys took 45 minutes — we were averaging three incidents per week from deploy-related issues. I proposed a microservices migration and secured buy-in from the VP of Engineering by presenting a risk-phased plan that quantified the cost of inaction at $200K/year in engineering time. I led a team of 6 engineers through three key phases: first, I built a shared observability layer so we could compare performance pre- and post-migration; second, I identified 8 bounded contexts and sequenced them by coupling analysis, starting with auth; third, I established a parallel-run protocol so we could validate each service under production load before cutting over. Over 6 months we shipped all 8 services. Deploy time dropped to 4 minutes, incidents fell 60%, and developer satisfaction scores rose from 3.2 to 4.5. Looking back, I would have invested in the observability layer even earlier — it became the foundation that made every subsequent migration safe.",
  },
  {
    questionText: "How do you handle disagreements with a colleague about a technical approach?",
    category: "behavioral",
    transcript: "Um so I try to like listen first and understand their perspective I guess. Usually I suggest we like write up the trade-offs of each approach and um compare them objectively sort of. If we still disagree I kind of propose a time-boxed spike to um validate assumptions, you know.",
    dimensionScores: { relevance: 3, structure: 2, specificity: 1, impact_articulation: 1, communication_clarity: 3, analytical_reasoning: 2, values_culture_signal: 3 },
    weights: { relevance: 0.10, structure: 0.15, specificity: 0.20, impact_articulation: 0.20, communication_clarity: 0.10, analytical_reasoning: 0.15, values_culture_signal: 0.10 },
    feedback: {
      relevance: "Addresses the question topic but stays entirely generic without a real example.",
      structure: "No STAR structure. Presents a list of hypothetical approaches rather than a narrative.",
      specificity: "No specific example given — entirely hypothetical. Uses 'I try to...' and 'Usually I...' throughout. Cannot score above 2 without a real scenario.",
      impact_articulation: "No outcome described. What happened after the spike? Did the approach work? Zero results articulated.",
      communication_clarity: "Clear and concise language, but brevity here signals lack of depth rather than efficiency.",
      analytical_reasoning: "Mentions trade-off comparison which shows awareness, but no evidence of actually applying structured analysis to a real disagreement.",
      values_culture_signal: "The collaborative instinct is present — listening first, objective comparison. But without a real story, this reads as aspirational rather than demonstrated.",
    },
    modelAnswer: "Last quarter, my colleague and I disagreed fundamentally on whether to use GraphQL or REST for a new internal API serving 12 microservices. Rather than debating in a meeting, I suggested we each write a one-page RFC covering four criteria: performance at our expected query patterns, team learning curve, tooling maturity, and long-term maintenance cost. I organized a 30-minute review with the team where we scored each option against those criteria. GraphQL won on flexibility, but REST won 3 of 4 categories given our team's experience. I proposed a pragmatic middle ground: REST with a schema design that would be GraphQL-compatible if we needed to migrate later. My colleague appreciated that I'd genuinely considered both options rather than advocating for my preference. We shipped the API two weeks ahead of schedule, and the team avoided a steep learning curve during a critical launch window. The key lesson was that structured decision frameworks remove ego from technical disagreements.",
  },
  {
    questionText: "Describe your experience with system design at scale.",
    category: "technical",
    transcript: "I designed a real-time event processing pipeline at my previous company. We used Kafka for ingestion, a Flink cluster for transformations, and wrote results to both Postgres and a Redis cache for low-latency reads. The system handled about 50,000 events per second at peak. I also set up circuit breakers and dead-letter queues for fault tolerance.",
    dimensionScores: { relevance: 5, structure: 3, specificity: 5, impact_articulation: 3, communication_clarity: 4, analytical_reasoning: 4, values_culture_signal: 2 },
    weights: { relevance: 0.10, structure: 0.05, specificity: 0.25, impact_articulation: 0.15, communication_clarity: 0.15, analytical_reasoning: 0.25, values_culture_signal: 0.05 },
    feedback: {
      relevance: "Spot-on — describes a real large-scale distributed system with specific technology choices.",
      structure: "Component-by-component walkthrough works for technical questions. Missing the problem statement upfront and the result at the end.",
      specificity: "Excellent technical depth: specific technologies (Kafka, Flink, Postgres, Redis), throughput numbers (50K eps), and fault-tolerance patterns named.",
      impact_articulation: "Good throughput number, but missing the business context: what did this system enable? What was the before state?",
      communication_clarity: "Technically precise and accessible. Good density of information without jargon overload.",
      analytical_reasoning: "Shows strong systems thinking: dual-write for different access patterns, circuit breakers, dead-letter queues. Could articulate WHY Kafka over alternatives.",
      values_culture_signal: "No signals of collaboration, stakeholder management, or team dynamics in this response.",
    },
    modelAnswer: "Our analytics product needed real-time dashboards but our batch ETL had a 15-minute lag, which was costing us enterprise deals. I designed an event-streaming pipeline after evaluating three approaches: polling-based CDC, log-based CDC with Debezium, and native event streaming. I chose Kafka with native producers because our services already had event contracts, making Debezium unnecessary overhead. The architecture was Kafka (3 brokers, partitioned by tenant for isolation) → Flink (stateful windowed aggregations with exactly-once semantics) → dual-write to Postgres (durable analytics) and Redis (sub-10ms dashboard reads). I designed the fault tolerance layer with circuit breakers per downstream service, dead-letter queues with automated alerting, and auto-scaling Flink task slots based on consumer lag. The system sustained 50K events/sec with p99 latency under 200ms. It unlocked a real-time analytics tier that drove $2M ARR in its first year. If I were to rebuild it today, I'd evaluate ClickHouse instead of the Postgres+Redis dual-write to reduce operational complexity.",
  },
  {
    questionText: "Why are you interested in this role at Acme Corp?",
    category: "culture",
    transcript: "Um yeah I like the company and like the role seems interesting I guess. I basically want to work on um challenging problems and sort of grow as an engineer, you know.",
    dimensionScores: { relevance: 2, structure: 1, specificity: 1, impact_articulation: 1, communication_clarity: 2, analytical_reasoning: 1, values_culture_signal: 1 },
    weights: { relevance: 0.10, structure: 0.05, specificity: 0.10, impact_articulation: 0.10, communication_clarity: 0.15, analytical_reasoning: 0.10, values_culture_signal: 0.40 },
    feedback: {
      relevance: "Touches on the question but does not address Acme Corp specifically at all.",
      structure: "Three disconnected sentences with no narrative structure.",
      specificity: "Completely generic — could apply to any company. No mention of Acme's products, mission, tech stack, or market position.",
      impact_articulation: "No connection between the candidate's skills and what they would contribute to the role.",
      communication_clarity: "Brevity here signals lack of preparation rather than conciseness.",
      analytical_reasoning: "No evidence of research, reasoning, or deliberate career thinking behind this decision.",
      values_culture_signal: "No values alignment demonstrated. A senior candidate must articulate why THIS company's mission resonates with their career trajectory and what they specifically bring.",
    },
    modelAnswer: "I've been following Acme's developer tools since you open-sourced your CLI framework last year — I even contributed a small PR to the plugin system, which gave me a window into how your team thinks about extensibility. The Senior Engineer role appeals to me because it sits at the intersection of infrastructure and developer experience, which is exactly where I've focused the last four years building internal platforms. I'm particularly excited about two things: first, the challenge of scaling the platform from hundreds to thousands of enterprise customers, where my experience with multi-tenant SaaS isolation patterns would be directly applicable; and second, your recent blog post about investing in observability tooling, which aligns with a problem I've been passionate about solving. I believe I can contribute meaningfully from day one while learning from a team that clearly prioritizes engineering craft.",
  },
  {
    questionText: "Tell me about a time you had to make a difficult trade-off under time pressure.",
    category: "situational",
    transcript: "During a product launch we discovered a race condition in our payment flow two days before release. Fixing it properly would take a week. I decided to add an idempotency check as a short-term guard, documented the tech debt, and scheduled the full fix for the next sprint. The launch went smoothly with zero duplicate charges. We completed the proper fix two weeks later.",
    dimensionScores: { relevance: 5, structure: 5, specificity: 4, impact_articulation: 4, communication_clarity: 5, analytical_reasoning: 4, values_culture_signal: 4 },
    weights: { relevance: 0.10, structure: 0.05, specificity: 0.10, impact_articulation: 0.20, communication_clarity: 0.10, analytical_reasoning: 0.25, values_culture_signal: 0.20 },
    feedback: {
      relevance: "Perfectly matches the question — clear trade-off with genuine time pressure and stakes.",
      structure: "Excellent natural STAR flow: situation (race condition 2 days before launch), task (fix vs. ship), action (idempotency guard), result (zero incidents), follow-up (proper fix).",
      specificity: "Good detail on the technical solution and timeline. Could add the scale (transaction volume, revenue at risk) for a 5.",
      impact_articulation: "Zero duplicate charges is strong and directly tied to the action. Adding the revenue at risk or transaction volume would amplify this.",
      communication_clarity: "Exceptionally clear and concise. Every sentence advances the narrative. No filler or hedging.",
      analytical_reasoning: "Shows clear decision logic: evaluated proper fix timeline vs. deadline, chose pragmatic guard with documented follow-through. Could articulate why idempotency specifically was the right short-term approach.",
      values_culture_signal: "Strong ownership signals: made the call, documented the debt, followed through on the proper fix. Shows accountability and pragmatic leadership.",
    },
    modelAnswer: "Two days before our Black Friday launch — our highest-traffic day processing $3.2M in transactions — load testing revealed a race condition in the payment flow that could cause duplicate charges. A proper distributed lock solution would take ~5 days. I assessed three options: delay the launch (rejected — $800K revenue risk), deploy with the bug and monitor (rejected — unacceptable customer trust risk), or implement a targeted guard. I chose an idempotency-key check at the API gateway level — a 4-hour fix that would prevent duplicates without touching the core payment logic. I got sign-off from the payments lead, wrote the guard with comprehensive test coverage, and added real-time monitoring alerts for any idempotency-key collisions. Launch processed $3.2M in transactions with zero duplicate charges and zero customer complaints. I filed an RFC for the full distributed locking solution the following Monday, and we shipped it in the next sprint with proper integration testing. The lesson I carry forward is that the best engineering decisions aren't always the most elegant — they're the ones that match the risk profile of the moment.",
  },
  {
    questionText: "How do you approach mentoring junior engineers?",
    category: "leadership",
    transcript: "I pair-program with them regularly and do thorough code reviews. I try to explain the why behind decisions, not just the what. I also set up a weekly 1:1 where we discuss their goals. One junior I mentored was promoted to mid-level within a year.",
    dimensionScores: { relevance: 4, structure: 2, specificity: 2, impact_articulation: 3, communication_clarity: 3, analytical_reasoning: 2, values_culture_signal: 4 },
    weights: { relevance: 0.05, structure: 0.05, specificity: 0.15, impact_articulation: 0.20, communication_clarity: 0.10, analytical_reasoning: 0.15, values_culture_signal: 0.30 },
    feedback: {
      relevance: "Addresses mentoring well with multiple concrete activities listed.",
      structure: "List format rather than a narrative arc. Missing a specific story that would bring these activities to life.",
      specificity: "Activities are named (pair programming, code reviews, 1:1s) but lack detail. What specific skills did you help them develop? What was the 1:1 structure?",
      impact_articulation: "The promotion outcome is solid. Adding team-level impact (did this person take on a key project? Did team velocity improve?) would strengthen this significantly.",
      communication_clarity: "Clear and professional but reads as a list of activities rather than a compelling narrative.",
      analytical_reasoning: "No evidence of a deliberate mentoring framework or assessment of what the junior engineer needed. Appears reactive rather than structured.",
      values_culture_signal: "Strong collaborative instinct — investing time in others' growth, focusing on understanding not just execution. The promotion outcome demonstrates genuine investment.",
    },
    modelAnswer: "When a new junior engineer joined my team last year, I noticed during her first week that she had strong algorithmic skills but struggled with production systems thinking — she'd write correct code but miss error handling, observability, and failure modes. I created a 30-60-90 day development plan focused on closing that gap. In the first month, we pair-programmed daily on production code — I'd let her drive and ask guiding questions like 'what happens if this service is down?' rather than prescribing solutions. By month two, I shifted to async code reviews with detailed written explanations of architectural decisions, which built her ability to reason independently. I also helped her identify a high-visibility project — migrating our logging library — that she could own end-to-end, because I believed she needed a confidence-building win as much as technical growth. She shipped the migration on schedule, presented the decision framework at our engineering all-hands, and was promoted to mid-level at her next review cycle. I've since templated this phased onboarding approach for all new hires on the team, and two other seniors have adopted it.",
  },
  {
    questionText: "What questions do you have for me about the team or role?",
    category: "closing",
    transcript: "What does the team structure look like? How many engineers are on the team? What's the tech stack? What does a typical sprint look like?",
    dimensionScores: { relevance: 3, structure: 2, specificity: 1, impact_articulation: 1, communication_clarity: 3, analytical_reasoning: 1, values_culture_signal: 2 },
    weights: { relevance: 0.15, structure: 0.05, specificity: 0.15, impact_articulation: 0.10, communication_clarity: 0.20, analytical_reasoning: 0.15, values_culture_signal: 0.20 },
    feedback: {
      relevance: "These are reasonable logistical questions but surface-level for a senior candidate.",
      structure: "Rapid-fire list without prioritization or context for why these questions matter to the candidate.",
      specificity: "Completely generic questions that could apply to any company. No reference to Acme's products, challenges, or anything from the interview conversation.",
      impact_articulation: "Does not demonstrate research into Acme or connect questions to the candidate's own expertise and goals.",
      communication_clarity: "Clear questions but the machine-gun format suggests lack of preparation rather than efficiency.",
      analytical_reasoning: "No evidence of research or strategic thinking about the role. A senior candidate should ask about challenges, technical debt, growth trajectory — not basic logistics.",
      values_culture_signal: "Missed opportunity to demonstrate genuine curiosity and engagement with the company's mission.",
    },
    modelAnswer: "I have three questions, prioritized by what would most help me understand if this is the right mutual fit. First, I saw Acme recently launched multi-region support — what were the biggest architectural challenges, and are there follow-on projects in that area I might contribute to? I ask because distributed systems at that scale is where I do my best work. Second, how does the team balance feature work versus technical debt — is there a dedicated budget, a rotation, or is it ad hoc? This matters to me because I've seen both approaches succeed and fail, and I want to understand the team's philosophy. Third, what does success look like for this role in the first six months — are there specific projects or outcomes you're hoping the new hire will own? I want to make sure my strengths align with what the team actually needs right now.",
  },
  {
    questionText: "Describe a system you built that you're particularly proud of.",
    category: "role_specific",
    transcript: "I built an internal feature flagging system that replaced our use of LaunchDarkly and saved us about $80K per year. It supported percentage rollouts, user targeting, and A/B test integration. I designed it with a React SDK and a Go backend with sub-millisecond evaluation times. The whole company adopted it within two months and it's still running three years later.",
    dimensionScores: { relevance: 5, structure: 4, specificity: 5, impact_articulation: 5, communication_clarity: 4, analytical_reasoning: 4, values_culture_signal: 4 },
    weights: { relevance: 0.10, structure: 0.10, specificity: 0.20, impact_articulation: 0.20, communication_clarity: 0.10, analytical_reasoning: 0.20, values_culture_signal: 0.10 },
    feedback: {
      relevance: "Directly answers with a concrete, impressive system that demonstrates senior-level initiative.",
      structure: "Good flow from motivation (cost) to implementation to adoption to longevity. Adding a reflection on what they'd do differently would complete it.",
      specificity: "Excellent detail: cost savings ($80K/yr), tech stack (React SDK + Go backend), performance (sub-ms), adoption timeline (2 months), longevity (3 years).",
      impact_articulation: "Strong multi-level impact: $80K annual savings, company-wide adoption, 3-year durability. Exceptional for demonstrating ownership and business awareness.",
      communication_clarity: "Efficient and well-paced. Each sentence adds new information. Could lead with the business problem rather than the solution.",
      analytical_reasoning: "Shows cost-awareness and initiative in identifying the problem. Could articulate why building vs. buying was the right call and what alternatives were evaluated.",
      values_culture_signal: "Demonstrates strong ownership mentality and cost-consciousness — building for the organization, not just the team. Company-wide adoption shows ability to drive change beyond immediate scope.",
    },
    modelAnswer: "I noticed we were paying $80K/year for LaunchDarkly but only using about 20% of its features — primarily percentage rollouts and basic user targeting. I proposed building an internal feature flag service and made the case to my engineering director with a cost-benefit analysis showing breakeven in 4 months. I evaluated three approaches: forking an open-source solution (rejected — maintenance burden), a thin wrapper around LaunchDarkly's API (rejected — still paying the license), or a purpose-built service. I chose to build a Go evaluation engine optimized for our use case, achieving sub-1ms p99 evaluation time. I paired it with a React SDK for frontend flags, PostgreSQL for flag configuration with a clean admin UI, and integration hooks for our existing A/B testing framework. I ran both systems in parallel for a month to validate parity, then migrated all 200+ flags with zero downtime. The whole company switched over within two months. Three years later it handles 10M evaluations per day, has saved over $240K cumulatively, and two other teams in the org have contributed features to it. The lesson was that sometimes the best platform investment is the one that removes a recurring cost while giving you exactly the capabilities you need — nothing more.",
  },
];
