"use client";

import { useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Progress } from "@/components/ui/progress";
import { useAssessmentStore } from "@/stores/assessment";
import {
  loadTree,
  getNode,
  getOutcome,
  isTerminal,
  estimateProgress,
} from "@/lib/decision-tree/engine";
import QuestionCard from "@/components/assessment/QuestionCard";
import SeekCareScreen from "@/components/assessment/SeekCareScreen";
import type { InjuryType } from "@/types";

const DISPLAY_NAMES: Record<InjuryType, string> = {
  ankle_sprain:       "Ankle Sprain",
  knee_sprain:        "Knee Sprain",
  hamstring_strain:   "Hamstring Strain",
  groin_strain:       "Groin Strain",
  shoulder_sprain:    "Shoulder Sprain",
  lower_back_strain:  "Lower Back Strain",
  shin_splints:       "Shin Splints",
  wrist_sprain:       "Wrist Sprain",
  finger_sprain:      "Finger Sprain",
};

interface Props {
  injuryType: InjuryType;
}

export default function AssessmentFlow({ injuryType }: Props) {
  const router = useRouter();
  const {
    tree,
    traversal,
    loading,
    error,
    reset,
    setInjuryType,
    setTree,
    setLoading,
    setError,
    chooseOption,
    navigateBack,
  } = useAssessmentStore();

  // ── Init: load tree on mount ──────────────────────────────────────────────

  useEffect(() => {
    reset();
    setInjuryType(injuryType);
    setLoading(true);

    loadTree(injuryType)
      .then((t) => {
        setTree(t);
        setLoading(false);
      })
      .catch((e: Error) => {
        setError(e.message);
        setLoading(false);
      });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [injuryType]);

  // ── Terminal: navigate to plan generation ─────────────────────────────────

  useEffect(() => {
    if (!tree || !traversal) return;
    if (!isTerminal(tree, traversal.currentNodeId)) return;

    const outcome = getOutcome(tree, traversal.currentNodeId);
    if (outcome.seek_care) return; // handled in render

    // Store flags in sessionStorage, generate guest token, navigate
    const token = crypto.randomUUID();
    sessionStorage.setItem(
      `plan_flags_${token}`,
      JSON.stringify({ ...traversal.collectedFlags, outcome })
    );
    router.push(`/plan/generating?token=${token}`);
  }, [tree, traversal, router]);

  // ── Back navigation ───────────────────────────────────────────────────────

  const handleBack = useCallback(() => {
    if (!traversal || traversal.history.length === 0) {
      router.push("/");
    } else {
      navigateBack();
    }
  }, [traversal, navigateBack, router]);

  // ── Render: loading ───────────────────────────────────────────────────────

  if (loading || !tree || !traversal) {
    return (
      <main className="flex min-h-svh flex-col items-center justify-center gap-4 px-6">
        <div className="w-8 h-8 rounded-full border-2 border-blue-500 border-t-transparent animate-spin" />
        <p className="text-sm text-gray-400">Loading assessment…</p>
      </main>
    );
  }

  // ── Render: error ─────────────────────────────────────────────────────────

  if (error) {
    return (
      <main className="flex min-h-svh flex-col items-center justify-center gap-4 px-6 text-center">
        <p className="text-gray-500 text-sm">Something went wrong loading the assessment.</p>
        <button onClick={() => router.push("/")} className="text-blue-500 text-sm font-medium">
          Go back
        </button>
      </main>
    );
  }

  const currentNode = getNode(tree, traversal.currentNodeId);

  // ── Render: seek care terminal ────────────────────────────────────────────

  if (currentNode.terminal) {
    const outcome = getOutcome(tree, traversal.currentNodeId);
    if (outcome.seek_care) {
      return (
        <main className="flex flex-col min-h-svh px-6 pt-10 pb-10">
          <SeekCareScreen outcome={outcome} />
        </main>
      );
    }
    // Non-seek-care terminal: navigated via useEffect above — show loading
    return (
      <main className="flex min-h-svh flex-col items-center justify-center gap-4">
        <div className="w-8 h-8 rounded-full border-2 border-blue-500 border-t-transparent animate-spin" />
        <p className="text-sm text-gray-400">Building your recovery plan…</p>
      </main>
    );
  }

  // ── Render: question ──────────────────────────────────────────────────────

  const progress = estimateProgress(traversal);
  const displayName = DISPLAY_NAMES[injuryType] ?? injuryType.replace(/_/g, " ");
  const questionNumber = traversal.history.length + 1;

  return (
    <main className="flex flex-col min-h-svh bg-white">

      {/* Nav bar */}
      <div className="flex items-center gap-3 px-4 pt-10 pb-3">
        <button
          onClick={handleBack}
          aria-label="Go back"
          className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-gray-100 text-gray-500 text-lg transition-colors"
        >
          ←
        </button>
        <span className="flex-1 text-center text-sm font-semibold text-gray-700 truncate">
          {displayName}
        </span>
        {/* Spacer to balance the back button */}
        <div className="w-10" aria-hidden="true" />
      </div>

      {/* Progress bar */}
      <div className="px-6 pb-4">
        <Progress value={progress} className="h-1.5 rounded-full" />
      </div>

      {/* Question — key forces re-mount + animation on each new question */}
      <div
        key={traversal.currentNodeId}
        className="flex-1 px-6 pt-2 pb-10"
      >
        <QuestionCard
          prompt={currentNode.prompt!}
          options={currentNode.options!}
          onSelect={chooseOption}
          questionNumber={questionNumber}
        />
      </div>
    </main>
  );
}
