export const REPORT_CATEGORIES = [
  { value: "cheating", label: "Trampas / Cheats" },
  { value: "troll", label: "Jhordan/Shiro" },
  { value: "other", label: "Otro" },
] as const;

export type ReportCategory = (typeof REPORT_CATEGORIES)[number]["value"];

export function categoryLabel(value: string) {
  return REPORT_CATEGORIES.find((c) => c.value === value)?.label ?? value;
}
