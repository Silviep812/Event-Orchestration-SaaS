export type FollowUpIssueItem = {
  id: string;
  text: string;
  done: boolean;
};

const KEY = "follow_up_issues" as const;

export type FollowUpIssuesPayload = {
  items: FollowUpIssueItem[];
};

export function parseFollowUpIssuesFromChecklist(
  checklist: unknown,
): FollowUpIssueItem[] {
  if (!checklist || typeof checklist !== "object" || Array.isArray(checklist)) return [];
  const raw = (checklist as Record<string, unknown>)[KEY];
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return [];
  const items = (raw as FollowUpIssuesPayload).items;
  if (!Array.isArray(items)) return [];
  return items
    .filter((x): x is FollowUpIssueItem => x && typeof x === "object" && typeof (x as FollowUpIssueItem).id === "string")
    .map((x) => ({
      id: x.id,
      text: typeof x.text === "string" ? x.text : "",
      done: !!x.done,
    }));
}

export function mergeFollowUpIssuesIntoChecklist(
  base: Record<string, unknown>,
  items: FollowUpIssueItem[],
): void {
  if (!items.length) {
    delete base[KEY];
    return;
  }
  base[KEY] = { items } satisfies FollowUpIssuesPayload;
}
