/**
 * Interprets collaborator / CM change-request payloads for the matrix item
 * "Interpret Request Label — Event, Date, Change type, Theme, Category".
 */

export type ChangeRequestInterpretation = {
  changeType: string | null;
  subject: string | null;
  /** When task title uses `[type] subject` from CollaboratorPanel */
  bracketedType: string | null;
};

const BRACKET_PREFIX = /^\s*\[([^\]]+)\]\s*(.*)$/i;

export function parseBracketedTaskTitle(title: string | null | undefined): ChangeRequestInterpretation {
  const raw = (title || "").trim();
  if (!raw) {
    return { changeType: null, subject: null, bracketedType: null };
  }
  const m = raw.match(BRACKET_PREFIX);
  if (!m) {
    return { changeType: null, subject: raw, bracketedType: null };
  }
  const bracketedType = m[1].replace(/_/g, " ").trim();
  const subject = (m[2] || "").trim() || null;
  return {
    changeType: bracketedType,
    subject,
    bracketedType,
  };
}

export type EventContextForInterpretation = {
  eventTitle: string | null;
  eventDate: string | null;
  themeName: string | null;
  categoryName: string | null;
};

export function buildChangeRequestInterpretation(args: {
  taskTitle: string | null | undefined;
  description: string | null | undefined;
  fieldChanged: string | null | undefined;
  event: EventContextForInterpretation;
}): ChangeRequestInterpretation & EventContextForInterpretation {
  const parsed = parseBracketedTaskTitle(args.taskTitle);
  const changeType =
    parsed.bracketedType ||
    (args.fieldChanged ? args.fieldChanged.replace(/_/g, " ") : null) ||
    null;
  const subject = parsed.subject || (args.description || "").split("\n")[0]?.trim() || null;
  return {
    ...parsed,
    changeType,
    subject,
    ...args.event,
  };
}
