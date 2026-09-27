"use client";

import {
  Activity,
  AlertTriangle,
  ArrowRight,
  Brain,
  Building2,
  CheckCircle2,
  ChevronRight,
  CircleDollarSign,
  FileSearch,
  History,
  LayoutDashboard,
  Loader2,
  MemoryStick,
  RefreshCw,
  Search,
  ShieldCheck,
  Sparkles,
  Target,
  TrendingUp,
} from "lucide-react";
import {
  type FormEvent,
  type ReactNode,
  useMemo,
  useState,
} from "react";

type Commitment = {
  type: string;
  description: string;
  value: string | null;
  condition: string | null;
  deadline: string | null;
  status: string;
};

type InteractionResult = {
  success: boolean;
  extracted?: {
    vendor: string;
    summary: string;
    commitments: Commitment[];
  };
  memory?: {
    retained: boolean;
    bankId: string;
    interactionId: string;
    itemsCount: number;
    interactionCount: number;
    commitmentCount: number;
  };
  error?: string;
};

type Conflict = {
  memoryId: string;
  type: string;
  title: string;
  historicalCommitment: string;
  currentEvidence: string;
  condition: string | null;
  conditionStatus: "met" | "not_met" | "unknown" | "not_applicable";
  status: "potential_conflict" | "honored" | "insufficient_evidence";
  severity: "low" | "medium" | "high";
  explanation: string;
};

type AnalysisResult = {
  success: boolean;
  vendor?: string;
  summary?: string;
  conflicts?: Conflict[];
  recommendation?: string;
  memoryCount?: number;
  financialImpact?: null;
  model?: string | null;
  analysisStatus?: string;
  error?: string;
};

type LedgerRow = {
  vendor: string;
  commitment: string;
  detail?: string;
  status: string;
  tone: "danger" | "warning" | "success" | "neutral";
};

type TimelineItem = {
  title: string;
  description: string;
  label: string;
  tone: "memory" | "event" | "danger" | "success";
};

const VENDOR = "CloudNova";

const demoVendors = [
  {
    name: "CloudNova",
    category: "Cloud Infrastructure",
    spend: "₹4.0L",
    commitments: 3,
    risk: "High",
  },
  {
    name: "SecureStack",
    category: "Cybersecurity",
    spend: "₹7.8L",
    commitments: 4,
    risk: "Low",
  },
  {
    name: "RecruitFlow",
    category: "Recruiting",
    spend: "₹2.4L",
    commitments: 2,
    risk: "Medium",
  },
];

const fallbackLedger: LedgerRow[] = [
  {
    vendor: "CloudNova",
    commitment: "15% renewal discount above 100 seats",
    detail: "Historical Hindsight commitment",
    status: "Promised",
    tone: "neutral",
  },
  {
    vendor: "CloudNova",
    commitment: "Onboarding fee waived",
    detail: "Historical Hindsight commitment",
    status: "Promised",
    tone: "neutral",
  },
  {
    vendor: "SecureStack",
    commitment: "Premium support included for 12 months",
    detail: "Demo portfolio data",
    status: "Honored",
    tone: "success",
  },
];

export default function Home() {
  const [interaction, setInteraction] = useState(
    "CloudNova agreed to waive the onboarding fee and promised a 15% renewal discount if the account exceeds 100 seats.",
  );

  const [quote, setQuote] = useState(
    "CloudNova renewal quote for 130 seats is ₹460000 annually. The quote does not include any renewal discount.",
  );

  const [interactionResult, setInteractionResult] =
    useState<InteractionResult | null>(null);

  const [analysisResult, setAnalysisResult] =
    useState<AnalysisResult | null>(null);

  const [remembering, setRemembering] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [showBrief, setShowBrief] = useState(false);

  const [activity, setActivity] = useState<string[]>([
    "PactTrace connected to Hindsight memory",
    "CloudNova selected as active vendor",
  ]);

  const conflicts = analysisResult?.conflicts ?? [];

  const potentialConflicts = conflicts.filter(
    (conflict) => conflict.status === "potential_conflict",
  );

  const highRiskConflicts = potentialConflicts.filter(
    (conflict) => conflict.severity === "high",
  );

  const ledgerRows = useMemo<LedgerRow[]>(() => {
    const extracted =
      interactionResult?.success &&
      interactionResult.extracted?.commitments.length
        ? interactionResult.extracted.commitments.map(
            (commitment): LedgerRow => ({
              vendor: VENDOR,
              commitment: commitment.description,
              detail: commitment.condition
                ? `Condition: ${commitment.condition}`
                : commitment.value ?? "Captured from vendor interaction",
              status: "Promised",
              tone: "neutral",
            }),
          )
        : fallbackLedger.filter((item) => item.vendor === VENDOR);

    const updated = extracted.map((row) => {
      const normalized = `${row.commitment} ${row.detail ?? ""}`.toLowerCase();

      const related = conflicts.find((conflict) => {
        const evidence =
          `${conflict.title} ${conflict.historicalCommitment}`.toLowerCase();

        if (normalized.includes("discount")) {
          return evidence.includes("discount");
        }

        if (
          normalized.includes("onboarding") ||
          normalized.includes("fee")
        ) {
          return (
            evidence.includes("onboarding") ||
            evidence.includes("fee waiver")
          );
        }

        return false;
      });

      if (!related) {
        return row;
      }

      if (related.status === "potential_conflict") {
        return {
          ...row,
          status: "Potential conflict",
          tone: "danger" as const,
        };
      }

      if (related.status === "honored") {
        return {
          ...row,
          status: "Honored",
          tone: "success" as const,
        };
      }

      return {
        ...row,
        status: "Needs evidence",
        tone: "warning" as const,
      };
    });

    return [
      ...updated,
      ...fallbackLedger.filter((item) => item.vendor !== VENDOR),
    ];
  }, [interactionResult, conflicts]);

  const timeline = useMemo<TimelineItem[]>(() => {
    const items: TimelineItem[] = [];

    if (interactionResult?.success) {
      items.push({
        label: "Vendor interaction",
        title: "Commitments extracted",
        description:
          interactionResult.extracted?.summary ??
          "Vendor commitments were extracted from the interaction.",
        tone: "event",
      });

      items.push({
        label: "Hindsight retain",
        title: `${interactionResult.memory?.itemsCount ?? 0} memories stored`,
        description:
          "The original interaction and extracted commitments were persisted into the PactTrace Hindsight bank.",
        tone: "memory",
      });
    } else {
      items.push({
        label: "Historical memory",
        title: "CloudNova commitments available",
        description:
          "PactTrace has persistent vendor history available in Hindsight for future comparison.",
        tone: "memory",
      });
    }

    items.push({
      label: "Renewal quote",
      title: "130-seat renewal received",
      description:
        "CloudNova submitted a renewal quote that explicitly includes no renewal discount.",
      tone: "event",
    });

    if (analysisResult?.success) {
      items.push({
        label: "Hindsight recall",
        title: `${analysisResult.memoryCount ?? 0} memories recalled`,
        description:
          "PactTrace retrieved vendor-specific historical context before evaluating the new quote.",
        tone: "memory",
      });

      const primaryConflict = potentialConflicts[0];

      if (primaryConflict) {
        items.push({
          label: "PactTrace analysis",
          title: primaryConflict.title,
          description: primaryConflict.explanation,
          tone: "danger",
        });
      } else {
        items.push({
          label: "PactTrace analysis",
          title: "No material conflict identified",
          description:
            "The quote analysis completed without finding a high-confidence commitment conflict.",
          tone: "success",
        });
      }
    }

    return items;
  }, [
    interactionResult,
    analysisResult,
    potentialConflicts,
  ]);

  async function rememberInteraction(event: FormEvent) {
    event.preventDefault();

    setRemembering(true);
    setInteractionResult(null);

    setActivity((current) => [
      "Analyzing CloudNova interaction with Groq",
      ...current,
    ]);

    try {
      const response = await fetch("/api/interactions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          vendor: VENDOR,
          interaction,
          source: "meeting",
        }),
      });

      const data = (await response.json()) as InteractionResult;

      setInteractionResult(data);

      if (data.success) {
        setActivity((current) => [
          `${data.memory?.itemsCount ?? 0} memories retained in Hindsight`,
          `${data.extracted?.commitments.length ?? 0} commitments extracted from vendor interaction`,
          ...current,
        ]);
      } else {
        setActivity((current) => [
          data.error ?? "Interaction could not be stored",
          ...current,
        ]);
      }
    } catch {
      setInteractionResult({
        success: false,
        error: "Could not connect to the PactTrace API.",
      });

      setActivity((current) => [
        "Interaction request failed",
        ...current,
      ]);
    } finally {
      setRemembering(false);
    }
  }

  async function analyzeQuote(event: FormEvent) {
    event.preventDefault();

    setAnalyzing(true);
    setAnalysisResult(null);
    setShowBrief(false);

    setActivity((current) => [
      "Recalling CloudNova vendor history from Hindsight",
      ...current,
    ]);

    try {
      const response = await fetch("/api/analyze-quote", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          vendor: VENDOR,
          quote,
          source: "renewal_quote",
        }),
      });

      const data = (await response.json()) as AnalysisResult;

      setAnalysisResult(data);

      if (data.success) {
        const returnedConflicts = data.conflicts ?? [];

        const returnedHighRisk = returnedConflicts.some(
          (conflict) =>
            conflict.status === "potential_conflict" &&
            conflict.severity === "high",
        );

        setActivity((current) => [
          returnedHighRisk
            ? "High-risk vendor commitment conflict detected"
            : "Quote analysis completed",
          `${returnedConflicts.length} commitment comparisons completed`,
          `${data.memoryCount ?? 0} relevant memories recalled from Hindsight`,
          ...current,
        ]);
      } else {
        setActivity((current) => [
          data.error ?? "Quote analysis failed",
          ...current,
        ]);
      }
    } catch {
      setAnalysisResult({
        success: false,
        error: "Could not connect to the PactTrace API.",
      });

      setActivity((current) => [
        "Quote analysis request failed",
        ...current,
      ]);
    } finally {
      setAnalyzing(false);
    }
  }

  function resetView() {
    setInteractionResult(null);
    setAnalysisResult(null);
    setShowBrief(false);
    setActivity([
      "PactTrace connected to Hindsight memory",
      "CloudNova selected as active vendor",
    ]);
  }

  return (
    <main className="min-h-screen bg-[#070b14] text-slate-100">
      <div className="flex min-h-screen">
        <aside className="hidden w-64 flex-col border-r border-white/8 bg-[#0a0f1b] lg:flex">
          <div className="flex h-20 items-center border-b border-white/8 px-6">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-500/15">
              <Target className="h-5 w-5 text-indigo-400" />
            </div>

            <div className="ml-3">
              <div className="font-semibold tracking-tight">
                PactTrace
              </div>
              <div className="text-xs text-slate-500">
                Vendor Intelligence
              </div>
            </div>
          </div>

          <nav className="space-y-2 p-4 text-sm">
            <NavItem
              href="#dashboard"
              icon={<LayoutDashboard className="h-4 w-4" />}
              label="Dashboard"
              active
            />

            <NavItem
              href="#vendors"
              icon={<Building2 className="h-4 w-4" />}
              label="Vendors"
            />

            <NavItem
              href="#ledger"
              icon={<ShieldCheck className="h-4 w-4" />}
              label="Commitment Ledger"
            />

            <NavItem
              href="#analyzer"
              icon={<FileSearch className="h-4 w-4" />}
              label="Quote Analyzer"
            />

            <NavItem
              href="#timeline"
              icon={<History className="h-4 w-4" />}
              label="Memory Timeline"
            />
          </nav>

          <div className="mt-auto border-t border-white/8 p-4">
            <div className="rounded-xl border border-emerald-400/15 bg-emerald-400/5 p-4">
              <div className="flex items-center gap-2 text-sm font-medium text-emerald-300">
                <MemoryStick className="h-4 w-4" />
                Hindsight Online
              </div>

              <p className="mt-2 text-xs leading-5 text-slate-500">
                Persistent vendor memory is active.
              </p>
            </div>
          </div>
        </aside>

        <section className="min-w-0 flex-1">
          <header className="sticky top-0 z-30 border-b border-white/8 bg-[#090e19]/92 px-5 py-5 backdrop-blur-xl md:px-8">
            <div className="mx-auto flex max-w-7xl items-center justify-between">
              <div>
                <p className="text-xs font-medium uppercase tracking-[0.22em] text-indigo-400">
                  Procurement Intelligence
                </p>

                <h1 className="mt-1 text-2xl font-semibold tracking-tight">
                  PactTrace Command Center
                </h1>
              </div>

              <div className="flex items-center gap-3">
                <button
                  onClick={resetView}
                  className="hidden items-center gap-2 rounded-xl border border-white/8 bg-white/[0.025] px-3 py-2 text-xs text-slate-400 transition hover:border-white/15 hover:text-slate-200 md:flex"
                >
                  <RefreshCw className="h-3.5 w-3.5" />
                  Reset view
                </button>

                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-indigo-500 text-sm font-semibold">
                  PT
                </div>
              </div>
            </div>
          </header>

          <div
            id="dashboard"
            className="mx-auto max-w-7xl space-y-6 px-5 py-6 md:px-8"
          >
            <section className="rounded-2xl border border-indigo-400/15 bg-gradient-to-br from-indigo-500/[0.09] via-[#0b111e] to-[#0b111e] p-6">
              <div className="grid gap-6 lg:grid-cols-[1fr_auto] lg:items-center">
                <div>
                  <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-indigo-300">
                    <Sparkles className="h-4 w-4" />
                    Institutional vendor memory
                  </div>

                  <h2 className="mt-3 max-w-3xl text-2xl font-semibold tracking-tight md:text-3xl">
                    Every vendor promise. Remembered. Verified.
                    Actionable.
                  </h2>

                  <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-400">
                    PactTrace retains negotiation commitments in
                    Hindsight and compares future vendor quotes
                    against the relationship&apos;s actual history.
                  </p>
                </div>

                <div className="rounded-xl border border-white/8 bg-black/20 px-5 py-4">
                  <div className="text-xs uppercase tracking-[0.16em] text-slate-600">
                    Active relationship
                  </div>
                  <div className="mt-2 text-lg font-medium">
                    CloudNova
                  </div>
                  <div className="mt-1 text-xs text-slate-500">
                    Cloud Infrastructure
                  </div>
                </div>
              </div>
            </section>

            <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              <StatCard
                icon={<Building2 className="h-5 w-5" />}
                title="Active vendors"
                value="3"
                subtitle="Across 3 categories"
              />

              <StatCard
                icon={<ShieldCheck className="h-5 w-5" />}
                title="Tracked commitments"
                value={String(ledgerRows.length + 6)}
                subtitle="Institutional promises retained"
              />

              <StatCard
                icon={<AlertTriangle className="h-5 w-5" />}
                title="Potential conflicts"
                value={String(potentialConflicts.length)}
                subtitle={
                  highRiskConflicts.length
                    ? `${highRiskConflicts.length} high severity`
                    : "No high-risk issues"
                }
              />

              <StatCard
                icon={<Brain className="h-5 w-5" />}
                title="Memories recalled"
                value={String(analysisResult?.memoryCount ?? 0)}
                subtitle={
                  analysisResult?.success
                    ? "Used for current analysis"
                    : "Run analysis to recall"
                }
              />
            </section>

            <section className="grid gap-6 xl:grid-cols-[1.35fr_0.65fr]">
              <div className="space-y-6">
                <Panel>
                  <StepLabel number="1">
                    Capture vendor promise
                  </StepLabel>

                  <div className="mt-4 flex items-start justify-between gap-4">
                    <div>
                      <SectionEyebrow>
                        Live Agent · Retain
                      </SectionEyebrow>

                      <h2 className="mt-1 text-lg font-semibold">
                        Remember a vendor interaction
                      </h2>

                      <p className="mt-1 text-sm text-slate-500">
                        Groq extracts explicit commitments and
                        PactTrace persists them into Hindsight.
                      </p>
                    </div>

                    <Brain className="h-5 w-5 text-indigo-400" />
                  </div>

                  <form
                    onSubmit={rememberInteraction}
                    className="mt-5 space-y-4"
                  >
                    <VendorChip />

                    <textarea
                      value={interaction}
                      onChange={(event) =>
                        setInteraction(event.target.value)
                      }
                      rows={5}
                      className="w-full resize-none rounded-xl border border-white/10 bg-[#090e19] px-4 py-3 text-sm leading-6 text-slate-200 outline-none transition focus:border-indigo-500/60"
                    />

                    <div className="flex flex-wrap items-center gap-3">
                      <button
                        disabled={remembering}
                        className="flex items-center gap-2 rounded-xl bg-indigo-500 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-indigo-400 disabled:opacity-50"
                      >
                        {remembering ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Brain className="h-4 w-4" />
                        )}

                        {remembering
                          ? "Extracting & retaining..."
                          : "Extract & Remember"}
                      </button>

                      <span className="text-xs text-slate-600">
                        For demo recording, retain once only.
                      </span>
                    </div>
                  </form>

                  {interactionResult && (
                    <div className="mt-5">
                      {interactionResult.success ? (
                        <div className="rounded-xl border border-emerald-400/15 bg-emerald-400/5 p-4">
                          <div className="flex items-center gap-2 font-medium text-emerald-300">
                            <CheckCircle2 className="h-4 w-4" />
                            Persistent memory updated
                          </div>

                          <p className="mt-2 text-sm leading-6 text-slate-400">
                            {interactionResult.extracted?.summary}
                          </p>

                          <div className="mt-4 grid gap-3">
                            {interactionResult.extracted?.commitments.map(
                              (commitment, index) => (
                                <div
                                  key={`${commitment.type}-${index}`}
                                  className="rounded-lg border border-white/8 bg-black/20 p-3"
                                >
                                  <div className="flex items-center justify-between gap-3">
                                    <span className="text-xs font-medium uppercase tracking-wide text-indigo-300">
                                      {commitment.type}
                                    </span>

                                    <StatusBadge
                                      tone="neutral"
                                      label={commitment.status}
                                    />
                                  </div>

                                  <p className="mt-2 text-sm text-slate-300">
                                    {commitment.description}
                                  </p>

                                  {commitment.condition && (
                                    <p className="mt-1 text-xs text-slate-500">
                                      Condition:{" "}
                                      {commitment.condition}
                                    </p>
                                  )}
                                </div>
                              ),
                            )}
                          </div>

                          <div className="mt-4 flex items-center gap-2 text-xs text-emerald-400/80">
                            <MemoryStick className="h-3.5 w-3.5" />
                            {interactionResult.memory?.itemsCount ?? 0}{" "}
                            items retained in{" "}
                            {interactionResult.memory?.bankId ??
                              "Hindsight"}
                          </div>
                        </div>
                      ) : (
                        <ErrorBox>
                          {interactionResult.error ??
                            "Interaction could not be retained."}
                        </ErrorBox>
                      )}
                    </div>
                  )}
                </Panel>

                <div id="analyzer">
                  <Panel>
                    <StepLabel number="2">
                      Compare a new quote
                    </StepLabel>

                    <div className="mt-4 flex items-start justify-between gap-4">
                      <div>
                        <SectionEyebrow>
                          Live Agent · Recall
                        </SectionEyebrow>

                        <h2 className="mt-1 text-lg font-semibold">
                          Detect forgotten commitments
                        </h2>

                        <p className="mt-1 text-sm text-slate-500">
                          Retrieve vendor memory first, then compare
                          the current quote against historical
                          commitments.
                        </p>
                      </div>

                      <FileSearch className="h-5 w-5 text-indigo-400" />
                    </div>

                    <form
                      onSubmit={analyzeQuote}
                      className="mt-5 space-y-4"
                    >
                      <textarea
                        value={quote}
                        onChange={(event) =>
                          setQuote(event.target.value)
                        }
                        rows={5}
                        className="w-full resize-none rounded-xl border border-white/10 bg-[#090e19] px-4 py-3 text-sm leading-6 text-slate-200 outline-none transition focus:border-indigo-500/60"
                      />

                      <button
                        disabled={analyzing}
                        className="flex items-center gap-2 rounded-xl bg-white px-4 py-2.5 text-sm font-medium text-slate-950 transition hover:bg-slate-200 disabled:opacity-50"
                      >
                        {analyzing ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Search className="h-4 w-4" />
                        )}

                        {analyzing
                          ? "Recalling & analyzing..."
                          : "Analyze against memory"}
                      </button>
                    </form>

                    {analysisResult && (
                      <div className="mt-5">
                        {analysisResult.success ? (
                          <div className="space-y-4">
                            <div className="rounded-xl border border-indigo-400/15 bg-indigo-400/5 p-4">
                              <div className="flex items-center gap-2 text-sm font-medium text-indigo-300">
                                <MemoryStick className="h-4 w-4" />
                                {analysisResult.memoryCount ?? 0}{" "}
                                relevant memories recalled
                              </div>

                              <p className="mt-2 text-sm leading-6 text-slate-400">
                                {analysisResult.summary}
                              </p>
                            </div>

                            {conflicts.map(
                              (conflict, index) => (
                                <ConflictCard
                                  key={`${conflict.memoryId}-${index}`}
                                  conflict={conflict}
                                />
                              ),
                            )}

                            {analysisResult.recommendation && (
                              <div className="rounded-xl border border-white/8 bg-white/[0.025] p-4">
                                <div className="flex items-center gap-2 font-medium">
                                  <Target className="h-4 w-4 text-indigo-400" />
                                  Immediate recommendation
                                </div>

                                <p className="mt-2 text-sm leading-6 text-slate-400">
                                  {
                                    analysisResult.recommendation
                                  }
                                </p>

                                <button
                                  onClick={() =>
                                    setShowBrief(true)
                                  }
                                  type="button"
                                  className="mt-4 flex items-center gap-2 rounded-lg border border-indigo-400/20 bg-indigo-400/10 px-3 py-2 text-xs font-medium text-indigo-300 transition hover:bg-indigo-400/15"
                                >
                                  <CircleDollarSign className="h-4 w-4" />
                                  Prepare negotiation brief
                                </button>
                              </div>
                            )}
                          </div>
                        ) : (
                          <ErrorBox>
                            {analysisResult.error ??
                              "Quote analysis could not be completed."}
                          </ErrorBox>
                        )}
                      </div>
                    )}
                  </Panel>
                </div>
              </div>

              <div className="space-y-6">
                <Panel>
                  <SectionEyebrow>
                    Agent Activity
                  </SectionEyebrow>

                  <h2 className="mt-1 text-lg font-semibold">
                    Memory execution
                  </h2>

                  <div className="mt-5 space-y-1">
                    {activity.slice(0, 8).map(
                      (item, index) => (
                        <div
                          key={`${item}-${index}`}
                          className="flex gap-3 border-b border-white/6 py-3 last:border-0"
                        >
                          <div className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-indigo-500/10">
                            <Activity className="h-3 w-3 text-indigo-400" />
                          </div>

                          <div>
                            <p className="text-sm text-slate-300">
                              {item}
                            </p>

                            <p className="mt-1 text-[11px] uppercase tracking-wide text-slate-600">
                              Agent event
                            </p>
                          </div>
                        </div>
                      ),
                    )}
                  </div>
                </Panel>

                <Panel>
                  <div className="flex items-center justify-between">
                    <div>
                      <SectionEyebrow>
                        Memory Health
                      </SectionEyebrow>

                      <h2 className="mt-1 text-lg font-semibold">
                        Hindsight
                      </h2>
                    </div>

                    <div className="h-2.5 w-2.5 rounded-full bg-emerald-400 shadow-[0_0_16px_rgba(52,211,153,0.75)]" />
                  </div>

                  <div className="mt-5 space-y-4">
                    <MetricRow
                      label="Bank"
                      value="pacttrace-dev"
                    />

                    <MetricRow
                      label="Recalled now"
                      value={String(
                        analysisResult?.memoryCount ?? 0,
                      )}
                    />

                    <MetricRow
                      label="Model"
                      value={
                        analysisResult?.model ??
                        "openai/gpt-oss-120b"
                      }
                    />

                    <MetricRow
                      label="Analysis"
                      value={
                        analysisResult?.analysisStatus ??
                        "Ready"
                      }
                    />
                  </div>
                </Panel>
              </div>
            </section>

            {showBrief &&
              analysisResult?.success &&
              analysisResult.recommendation && (
                <section>
                  <NegotiationBrief
                    analysis={analysisResult}
                    onClose={() => setShowBrief(false)}
                  />
                </section>
              )}

            <section
              id="ledger"
              className="grid gap-6 xl:grid-cols-2"
            >
              <Panel>
                <div className="flex items-center justify-between">
                  <div>
                    <SectionEyebrow>
                      Commitment Ledger
                    </SectionEyebrow>

                    <h2 className="mt-1 text-lg font-semibold">
                      Promises under watch
                    </h2>
                  </div>

                  <ShieldCheck className="h-5 w-5 text-indigo-400" />
                </div>

                <div className="mt-5 overflow-hidden rounded-xl border border-white/8">
                  {ledgerRows.map((item, index) => (
                    <div
                      key={`${item.vendor}-${index}`}
                      className="flex items-center justify-between gap-4 border-b border-white/8 bg-black/15 px-4 py-4 last:border-0"
                    >
                      <div>
                        <div className="text-sm font-medium">
                          {item.commitment}
                        </div>

                        <div className="mt-1 text-xs text-slate-500">
                          {item.vendor}
                          {item.detail
                            ? ` · ${item.detail}`
                            : ""}
                        </div>
                      </div>

                      <StatusBadge
                        tone={item.tone}
                        label={item.status}
                      />
                    </div>
                  ))}
                </div>
              </Panel>

              <div id="vendors">
                <Panel>
                  <div className="flex items-center justify-between">
                    <div>
                      <SectionEyebrow>
                        Vendor Portfolio
                      </SectionEyebrow>

                      <h2 className="mt-1 text-lg font-semibold">
                        Relationship intelligence
                      </h2>
                    </div>

                    <TrendingUp className="h-5 w-5 text-indigo-400" />
                  </div>

                  <div className="mt-5 space-y-3">
                    {demoVendors.map((vendor) => (
                      <div
                        key={vendor.name}
                        className="group flex items-center justify-between rounded-xl border border-white/8 bg-black/15 p-4 transition hover:border-indigo-400/20 hover:bg-indigo-400/[0.03]"
                      >
                        <div className="flex items-center gap-3">
                          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/5 text-sm font-semibold text-slate-300">
                            {vendor.name
                              .slice(0, 2)
                              .toUpperCase()}
                          </div>

                          <div>
                            <div className="text-sm font-medium">
                              {vendor.name}
                            </div>

                            <div className="mt-1 text-xs text-slate-500">
                              {vendor.category}
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-5">
                          <div className="hidden text-right sm:block">
                            <div className="text-sm">
                              {vendor.spend}
                            </div>

                            <div className="text-xs text-slate-500">
                              annual spend
                            </div>
                          </div>

                          <ChevronRight className="h-4 w-4 text-slate-600 transition group-hover:translate-x-0.5 group-hover:text-indigo-400" />
                        </div>
                      </div>
                    ))}
                  </div>
                </Panel>
              </div>
            </section>

            <section id="timeline">
              <Panel>
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <SectionEyebrow>
                      Memory Timeline
                    </SectionEyebrow>

                    <h2 className="mt-1 text-lg font-semibold">
                      How PactTrace reached this conclusion
                    </h2>

                    <p className="mt-1 text-sm text-slate-500">
                      Persistent relationship context turns isolated
                      vendor messages into institutional memory.
                    </p>
                  </div>

                  <History className="h-5 w-5 text-indigo-400" />
                </div>

                <div className="mt-6">
                  {timeline.map((item, index) => (
                    <TimelineRow
                      key={`${item.title}-${index}`}
                      item={item}
                      last={index === timeline.length - 1}
                    />
                  ))}
                </div>
              </Panel>
            </section>

            <footer className="flex flex-col gap-2 border-t border-white/8 py-5 text-xs text-slate-600 sm:flex-row sm:items-center sm:justify-between">
              <span>
                PactTrace · Persistent procurement intelligence
              </span>

              <span className="flex items-center gap-1.5">
                Memory powered by Hindsight
                <ArrowRight className="h-3 w-3" />
              </span>
            </footer>
          </div>
        </section>
      </div>
    </main>
  );
}

function NegotiationBrief({
  analysis,
  onClose,
}: {
  analysis: AnalysisResult;
  onClose: () => void;
}) {
  const conflicts = analysis.conflicts ?? [];

  const primary =
    conflicts.find(
      (conflict) =>
        conflict.status === "potential_conflict" &&
        conflict.severity === "high",
    ) ??
    conflicts.find(
      (conflict) =>
        conflict.status === "potential_conflict",
    );

  return (
    <div className="overflow-hidden rounded-2xl border border-indigo-400/20 bg-gradient-to-br from-indigo-500/[0.1] via-[#0b111e] to-[#0b111e]">
      <div className="flex items-center justify-between border-b border-white/8 px-6 py-5">
        <div>
          <SectionEyebrow>
            Negotiation Brief
          </SectionEyebrow>

          <h2 className="mt-1 text-xl font-semibold">
            CloudNova Renewal
          </h2>
        </div>

        <button
          onClick={onClose}
          className="rounded-lg border border-white/8 px-3 py-2 text-xs text-slate-500 transition hover:text-slate-200"
        >
          Close
        </button>
      </div>

      <div className="grid gap-6 p-6 lg:grid-cols-3">
        <BriefBlock
          label="Primary risk"
          value={
            primary?.title ??
            "No high-confidence conflict"
          }
          accent
        />

        <BriefBlock
          label="Memory evidence"
          value={
            primary?.historicalCommitment ??
            `${analysis.memoryCount ?? 0} historical memories were reviewed.`
          }
        />

        <BriefBlock
          label="Current evidence"
          value={
            primary?.currentEvidence ??
            "No conflicting current evidence identified."
          }
        />
      </div>

      <div className="border-t border-white/8 px-6 py-5">
        <div className="flex items-start gap-3">
          <Target className="mt-0.5 h-5 w-5 shrink-0 text-indigo-400" />

          <div>
            <div className="text-sm font-medium">
              Recommended negotiation position
            </div>

            <p className="mt-2 max-w-4xl text-sm leading-6 text-slate-400">
              {analysis.recommendation}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

function BriefBlock({
  label,
  value,
  accent = false,
}: {
  label: string;
  value: string;
  accent?: boolean;
}) {
  return (
    <div className="rounded-xl border border-white/8 bg-black/20 p-4">
      <div className="text-[10px] font-semibold uppercase tracking-[0.17em] text-slate-600">
        {label}
      </div>

      <p
        className={`mt-3 text-sm leading-6 ${
          accent ? "text-red-300" : "text-slate-300"
        }`}
      >
        {value}
      </p>
    </div>
  );
}

function TimelineRow({
  item,
  last,
}: {
  item: TimelineItem;
  last: boolean;
}) {
  const styles = {
    memory:
      "border-indigo-400/30 bg-indigo-400/10 text-indigo-300",
    event:
      "border-slate-400/20 bg-slate-400/5 text-slate-300",
    danger:
      "border-red-400/30 bg-red-400/10 text-red-300",
    success:
      "border-emerald-400/30 bg-emerald-400/10 text-emerald-300",
  };

  return (
    <div className="relative flex gap-4 pb-6 last:pb-0">
      {!last && (
        <div className="absolute left-[17px] top-9 h-[calc(100%-20px)] w-px bg-white/8" />
      )}

      <div
        className={`relative z-10 flex h-9 w-9 shrink-0 items-center justify-center rounded-full border ${styles[item.tone]}`}
      >
        {item.tone === "memory" ? (
          <MemoryStick className="h-4 w-4" />
        ) : item.tone === "danger" ? (
          <AlertTriangle className="h-4 w-4" />
        ) : item.tone === "success" ? (
          <CheckCircle2 className="h-4 w-4" />
        ) : (
          <Activity className="h-4 w-4" />
        )}
      </div>

      <div className="min-w-0 pt-0.5">
        <div className="text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-600">
          {item.label}
        </div>

        <div className="mt-1 text-sm font-medium">
          {item.title}
        </div>

        <p className="mt-1 max-w-4xl text-sm leading-6 text-slate-500">
          {item.description}
        </p>
      </div>
    </div>
  );
}

function VendorChip() {
  return (
    <div className="flex items-center gap-3 rounded-xl border border-white/8 bg-black/20 px-4 py-3">
      <Building2 className="h-4 w-4 text-slate-500" />

      <div>
        <div className="text-sm font-medium">
          CloudNova
        </div>

        <div className="text-xs text-slate-500">
          Cloud Infrastructure
        </div>
      </div>
    </div>
  );
}

function NavItem({
  href,
  icon,
  label,
  active = false,
}: {
  href: string;
  icon: ReactNode;
  label: string;
  active?: boolean;
}) {
  return (
    <a
      href={href}
      className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 transition ${
        active
          ? "bg-indigo-500/10 text-indigo-300"
          : "text-slate-500 hover:bg-white/[0.03] hover:text-slate-300"
      }`}
    >
      {icon}
      {label}
    </a>
  );
}

function Panel({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-white/8 bg-[#0b111e] p-5 shadow-2xl shadow-black/10">
      {children}
    </div>
  );
}

function SectionEyebrow({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-600">
      {children}
    </div>
  );
}

function StepLabel({
  number,
  children,
}: {
  number: string;
  children: ReactNode;
}) {
  return (
    <div className="flex items-center gap-2">
      <div className="flex h-6 w-6 items-center justify-center rounded-full bg-indigo-500/15 text-[11px] font-semibold text-indigo-300">
        {number}
      </div>

      <span className="text-xs font-medium text-slate-500">
        {children}
      </span>
    </div>
  );
}

function StatCard({
  icon,
  title,
  value,
  subtitle,
}: {
  icon: ReactNode;
  title: string;
  value: string;
  subtitle: string;
}) {
  return (
    <div className="rounded-2xl border border-white/8 bg-[#0b111e] p-5">
      <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-500/10 text-indigo-400">
        {icon}
      </div>

      <div className="mt-5 text-2xl font-semibold">
        {value}
      </div>

      <div className="mt-1 text-sm text-slate-300">
        {title}
      </div>

      <div className="mt-1 text-xs text-slate-600">
        {subtitle}
      </div>
    </div>
  );
}

function ConflictCard({
  conflict,
}: {
  conflict: Conflict;
}) {
  const danger =
    conflict.status === "potential_conflict";

  const honored = conflict.status === "honored";

  return (
    <div
      className={`rounded-xl border p-4 ${
        danger
          ? "border-red-400/20 bg-red-400/[0.055]"
          : honored
            ? "border-emerald-400/15 bg-emerald-400/[0.035]"
            : "border-white/8 bg-white/[0.025]"
      }`}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex gap-3">
          <div
            className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${
              danger
                ? "bg-red-400/10 text-red-300"
                : honored
                  ? "bg-emerald-400/10 text-emerald-300"
                  : "bg-slate-400/10 text-slate-300"
            }`}
          >
            {danger ? (
              <AlertTriangle className="h-4 w-4" />
            ) : (
              <CheckCircle2 className="h-4 w-4" />
            )}
          </div>

          <div>
            <h3 className="font-medium">
              {conflict.title}
            </h3>

            <p className="mt-2 text-sm leading-6 text-slate-400">
              {conflict.explanation}
            </p>
          </div>
        </div>

        <StatusBadge
          tone={
            danger
              ? "danger"
              : honored
                ? "success"
                : "warning"
          }
          label={conflict.severity}
        />
      </div>

      <div className="mt-4 grid gap-3 md:grid-cols-2">
        <EvidenceBox
          label="Historical memory"
          value={conflict.historicalCommitment}
        />

        <EvidenceBox
          label="Current quote"
          value={conflict.currentEvidence}
        />
      </div>

      {conflict.condition && (
        <div className="mt-3 rounded-lg border border-white/6 bg-black/20 px-3 py-2 text-xs text-slate-500">
          Condition:{" "}
          <span className="text-slate-300">
            {conflict.condition}
          </span>
          {" · "}
          <span
            className={
              conflict.conditionStatus === "met"
                ? "text-emerald-300"
                : "text-indigo-300"
            }
          >
            {conflict.conditionStatus.replace("_", " ")}
          </span>
        </div>
      )}
    </div>
  );
}

function EvidenceBox({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-lg border border-white/6 bg-black/20 p-3">
      <div className="text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-600">
        {label}
      </div>

      <p className="mt-2 text-xs leading-5 text-slate-400">
        “{value}”
      </p>
    </div>
  );
}

function StatusBadge({
  tone,
  label,
}: {
  tone: "danger" | "warning" | "success" | "neutral";
  label: string;
}) {
  const className =
    tone === "danger"
      ? "bg-red-400/10 text-red-300"
      : tone === "success"
        ? "bg-emerald-400/10 text-emerald-300"
        : tone === "warning"
          ? "bg-amber-400/10 text-amber-300"
          : "bg-indigo-400/10 text-indigo-300";

  return (
    <span
      className={`shrink-0 rounded-full px-2.5 py-1 text-[11px] font-medium capitalize ${className}`}
    >
      {label}
    </span>
  );
}

function MetricRow({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center justify-between gap-4 border-b border-white/6 pb-3 text-sm last:border-0 last:pb-0">
      <span className="text-slate-500">
        {label}
      </span>

      <span className="max-w-[190px] truncate text-right text-slate-300">
        {value}
      </span>
    </div>
  );
}

function ErrorBox({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <div className="rounded-xl border border-red-400/20 bg-red-400/5 p-4 text-sm text-red-300">
      {children}
    </div>
  );
}