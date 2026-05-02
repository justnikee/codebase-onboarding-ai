// ============================================================================
// Command parser: extract prediction intent from a mention's text.
//
// Supported commands (case-insensitive, after stripping the @handle):
//   viral / pump / yes  → predict the parent post WILL go viral
//   flop  / dump / no   → predict the parent post WILL NOT go viral
//   stats / score       → show the user's prediction stats
//   help  / ?           → show help text
// ============================================================================

export type PredictionCommand =
  | { type: "viral"; predictedViral: boolean }
  | { type: "stats" }
  | { type: "help" }
  | { type: "unknown" };

export function parseCommand(
  text: string,
  botHandle: string
): PredictionCommand {
  // Strip the @handle in all forms (with or without @, escaped regex dots)
  const escapedHandle = botHandle.replace(/^@/, "").replace(/\./g, "\\.");
  const cleaned = text
    .replace(new RegExp(`@?${escapedHandle}`, "gi"), "")
    .trim()
    .toLowerCase();

  // Skip any remaining @mentions or URLs to find the actual command word
  const firstWord =
    cleaned.split(/\s+/).find((w) => w.length > 0 && !w.startsWith("@") && !w.startsWith("http")) ?? "";

  if (firstWord === "viral" || firstWord === "pump" || firstWord === "yes") {
    return { type: "viral", predictedViral: true };
  }
  if (firstWord === "flop" || firstWord === "dump" || firstWord === "no") {
    return { type: "viral", predictedViral: false };
  }
  if (firstWord === "stats" || firstWord === "score") {
    return { type: "stats" };
  }
  if (firstWord === "help" || firstWord === "?") {
    return { type: "help" };
  }
  return { type: "unknown" };
}
