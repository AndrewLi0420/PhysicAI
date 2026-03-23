import type {
  DecisionTree,
  TreeNode,
  CollectedFlags,
  TerminalOutcome,
  InjuryType,
} from "@/types";

// ─── Tree Loading ─────────────────────────────────────────────────────────────

const treeCache: Partial<Record<InjuryType, DecisionTree>> = {};

export async function loadTree(injuryType: InjuryType): Promise<DecisionTree> {
  if (treeCache[injuryType]) return treeCache[injuryType]!;

  const res = await fetch(`/decision-trees/${injuryType}.json`);
  if (!res.ok) throw new Error(`Tree not found: ${injuryType}`);

  const tree: DecisionTree = await res.json();
  treeCache[injuryType] = tree;
  return tree;
}

// ─── Traversal ────────────────────────────────────────────────────────────────

export interface TraversalState {
  currentNodeId: string;
  collectedFlags: CollectedFlags;
  history: string[]; // node IDs visited, for back navigation
}

export function getNode(tree: DecisionTree, nodeId: string): TreeNode {
  const node = tree.nodes[nodeId];
  if (!node) throw new Error(`Node not found: ${nodeId} in ${tree.injury_type}`);
  return node;
}

export function initTraversal(
  injuryType: InjuryType,
  tree: DecisionTree
): TraversalState {
  return {
    currentNodeId: tree.start,
    collectedFlags: { injury_type: injuryType },
    history: [],
  };
}

export function selectOption(
  state: TraversalState,
  tree: DecisionTree,
  optionIndex: number
): TraversalState {
  const node = getNode(tree, state.currentNodeId);
  if (node.terminal) throw new Error("Cannot advance from a terminal node");
  if (!node.options) throw new Error(`Node ${state.currentNodeId} has no options`);

  const option = node.options[optionIndex];
  if (!option) throw new Error(`Option index ${optionIndex} out of range`);

  const newFlags: CollectedFlags = {
    ...state.collectedFlags,
    ...option.set_flags,
  };

  const nextNodeId = option.next_node_id ?? state.currentNodeId;

  const nextNode = getNode(tree, nextNodeId);
  if (!nextNode) throw new Error(`next_node_id '${nextNodeId}' not found`);

  return {
    currentNodeId: nextNodeId,
    collectedFlags: newFlags,
    history: [...state.history, state.currentNodeId],
  };
}

export function goBack(
  state: TraversalState
): TraversalState | null {
  if (state.history.length === 0) return null;

  const previous = state.history[state.history.length - 1];
  return {
    currentNodeId: previous,
    collectedFlags: state.collectedFlags, // flags stay — acceptable for MVP
    history: state.history.slice(0, -1),
  };
}

export function isTerminal(tree: DecisionTree, nodeId: string): boolean {
  return !!tree.nodes[nodeId]?.terminal;
}

export function getOutcome(
  tree: DecisionTree,
  nodeId: string
): TerminalOutcome {
  const node = getNode(tree, nodeId);
  if (!node.terminal || !node.outcome) {
    throw new Error(`Node ${nodeId} is not a terminal node`);
  }
  return node.outcome;
}

// ─── Progress ─────────────────────────────────────────────────────────────────

/**
 * Rough progress estimate: steps taken / (steps taken + estimated remaining).
 * We don't know depth ahead of time, so we use history length vs. a per-tree
 * max heuristic. Good enough for a progress bar.
 */
export function estimateProgress(
  state: TraversalState,
  estimatedMaxDepth = 7
): number {
  const steps = state.history.length;
  return Math.min(Math.round((steps / estimatedMaxDepth) * 100), 95);
}
