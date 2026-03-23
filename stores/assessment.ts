import { create } from "zustand";
import type { DecisionTree, InjuryType } from "@/types";
import type { TraversalState } from "@/lib/decision-tree/engine";
import { initTraversal, selectOption, goBack } from "@/lib/decision-tree/engine";

interface AssessmentStore {
  injuryType: InjuryType | null;
  tree: DecisionTree | null;
  traversal: TraversalState | null;
  loading: boolean;
  error: string | null;

  setInjuryType: (type: InjuryType) => void;
  setTree: (tree: DecisionTree) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  chooseOption: (optionIndex: number) => void;
  navigateBack: () => void;
  reset: () => void;
}

export const useAssessmentStore = create<AssessmentStore>((set, get) => ({
  injuryType: null,
  tree: null,
  traversal: null,
  loading: false,
  error: null,

  setInjuryType: (type) => set({ injuryType: type }),

  setTree: (tree) => {
    const injuryType = get().injuryType;
    if (!injuryType) return;
    set({ tree, traversal: initTraversal(injuryType, tree) });
  },

  setLoading: (loading) => set({ loading }),

  setError: (error) => set({ error }),

  chooseOption: (optionIndex) => {
    const { tree, traversal } = get();
    if (!tree || !traversal) return;
    try {
      const next = selectOption(traversal, tree, optionIndex);
      set({ traversal: next });
    } catch (e) {
      set({ error: e instanceof Error ? e.message : "Unknown error" });
    }
  },

  navigateBack: () => {
    const { traversal } = get();
    if (!traversal) return;
    const prev = goBack(traversal);
    if (prev) set({ traversal: prev });
  },

  reset: () =>
    set({
      injuryType: null,
      tree: null,
      traversal: null,
      loading: false,
      error: null,
    }),
}));
