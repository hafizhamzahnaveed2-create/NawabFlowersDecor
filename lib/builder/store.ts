"use client";

import { create } from "zustand";
import type { BuilderComponent } from "@/lib/repositories/builder";
import type { ComponentKind } from "@/lib/generated/prisma/client";

export type BuilderSelection = Record<string, number>; // componentId -> qty

type BuilderState = {
  step: number;
  selections: BuilderSelection;
  name: string;
  cardMessage: string;
  setStep: (step: number) => void;
  setQty: (componentId: string, qty: number) => void;
  setSingle: (kind: ComponentKind, componentId: string | null) => void;
  setName: (name: string) => void;
  setCardMessage: (msg: string) => void;
  reset: () => void;
};

export const BUILDER_STEPS = [
  { id: "stems", title: "Flowers", kinds: ["STEM"] as ComponentKind[] },
  { id: "greenery", title: "Greenery", kinds: ["GREENERY"] as ComponentKind[] },
  { id: "wrap", title: "Wrap", kinds: ["WRAP"] as ComponentKind[] },
  { id: "ribbon", title: "Ribbon", kinds: ["RIBBON"] as ComponentKind[] },
  { id: "vase", title: "Vase or box", kinds: ["VASE"] as ComponentKind[] },
  { id: "finish", title: "Name & note", kinds: [] as ComponentKind[] },
] as const;

const SINGLE_KINDS = new Set<ComponentKind>(["WRAP", "RIBBON", "VASE", "CARD"]);

export const useBuilderStore = create<BuilderState>((set, get) => ({
  step: 0,
  selections: {},
  name: "",
  cardMessage: "",
  setStep: (step) => set({ step }),
  setQty: (componentId, qty) =>
    set((state) => {
      const selections = { ...state.selections };
      if (qty <= 0) delete selections[componentId];
      else selections[componentId] = qty;
      return { selections };
    }),
  setSingle: (kind, componentId) => {
    // Clear any existing selection of this kind, then set the new one.
    const { selections } = get();
    // Caller passes components list via setQty after clearing — we need kinds.
    // Store only IDs; clearing by kind is done in the UI with the catalog.
    void kind;
    void componentId;
    void selections;
  },
  setName: (name) => set({ name }),
  setCardMessage: (cardMessage) => set({ cardMessage }),
  reset: () => set({ step: 0, selections: {}, name: "", cardMessage: "" }),
}));

export function pickSingle(
  selections: BuilderSelection,
  components: BuilderComponent[],
  kind: ComponentKind,
  componentId: string | null,
): BuilderSelection {
  const next = { ...selections };
  for (const c of components) {
    if (c.kind === kind) delete next[c.id];
  }
  if (componentId) next[componentId] = 1;
  return next;
}

export function runningTotal(
  selections: BuilderSelection,
  components: BuilderComponent[],
): number {
  const byId = new Map(components.map((c) => [c.id, c]));
  return Object.entries(selections).reduce((sum, [id, qty]) => {
    const c = byId.get(id);
    return c ? sum + c.unitPrice * qty : sum;
  }, 0);
}

export function selectedItems(
  selections: BuilderSelection,
  components: BuilderComponent[],
) {
  const byId = new Map(components.map((c) => [c.id, c]));
  return Object.entries(selections)
    .map(([id, quantity]) => {
      const component = byId.get(id);
      if (!component) return null;
      return { component, quantity };
    })
    .filter((x): x is { component: BuilderComponent; quantity: number } => !!x);
}

export function hasStem(
  selections: BuilderSelection,
  components: BuilderComponent[],
): boolean {
  return selectedItems(selections, components).some(
    (s) => s.component.kind === "STEM",
  );
}

export { SINGLE_KINDS };
