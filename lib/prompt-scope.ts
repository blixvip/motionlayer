export const promptScopes = ["selected-graphic", "selected-range", "graphic-type", "whole-project"] as const;
export type PromptScope = (typeof promptScopes)[number];

export function resolveAffectedIds(scope: PromptScope, selectedId: string, allIds: string[], typeIds: string[] = [], rangeIds: string[] = []) {
  if (scope === "selected-graphic") return [selectedId];
  if (scope === "graphic-type") return typeIds;
  if (scope === "whole-project") return allIds;
  return rangeIds.length ? rangeIds : [selectedId];
}
