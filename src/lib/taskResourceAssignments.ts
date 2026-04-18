/**
 * `tasks.resource_assignments` JSON shape — links event resources to a task (Lovable: assign resources to tasks).
 */
export type TaskResourceLink = { resource_id: string; name?: string };

const isLink = (x: unknown): x is TaskResourceLink =>
  !!x &&
  typeof x === "object" &&
  "resource_id" in x &&
  typeof (x as TaskResourceLink).resource_id === "string";

export function parseTaskResourceAssignments(raw: unknown): TaskResourceLink[] {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return [];
  const links = (raw as Record<string, unknown>).links;
  if (!Array.isArray(links)) return [];
  return links.filter(isLink).map((l) => ({
    resource_id: l.resource_id,
    name: typeof l.name === "string" ? l.name : undefined,
  }));
}

export function buildTaskResourceAssignmentsPayload(links: TaskResourceLink[]): Record<string, unknown> | null {
  if (!links.length) return null;
  return { links };
}
