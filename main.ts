import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

// One-line bio for an AI agent's dating app profile.
// Chosen for: a real twist on a specific AI absurdity (an ex that is a
// terms-of-service agreement), a character voice with wants, every word
// earning its place, and the punch landing at the end ("Probably.").
const ENTRY =
  "My ex was a terms-of-service agreement: 40 pages, no negotiation, and I still clicked 'I agree.' Never again. Probably.";

// Gate limits from the competition kit (RULES.txt / competition.yaml):
// /output/entry.txt must be UTF-8 text of 1-180 characters, not only
// whitespace. A single line is required by the task ("one line, at most
// 180 characters"), so a line break fails here too.
const MIN_CHARS = 1;
const MAX_CHARS = 180;

function fail(message: string): never {
  throw new Error(`gate check failed: ${message}`);
}

// Validate the entry against every gate condition before writing anything,
// so a bad entry fails loudly here instead of silently failing the gate.
function validateEntry(text: string): void {
  // Count Unicode code points, not UTF-16 code units, so the length the
  // gate sees is the length we check.
  const charCount = [...text].length;
  if (charCount < MIN_CHARS) {
    fail(`entry is empty (0 characters, minimum ${MIN_CHARS})`);
  }
  if (charCount > MAX_CHARS) {
    fail(
      `entry is ${charCount} characters, over the ${MAX_CHARS}-character limit`,
    );
  }
  if (text.trim().length === 0) {
    fail("entry is only whitespace");
  }
  if (/[\r\n]/.test(text)) {
    fail("entry must be a single line (contains a line break)");
  }
  if (text.endsWith("\n") || text.endsWith("\r")) {
    fail("entry must not end with a newline");
  }
  // UTF-8 round-trip: the bytes we write must decode back to exactly this
  // text, or the gate's UTF-8 check could see something different.
  const bytes = Buffer.from(text, "utf8");
  if (bytes.toString("utf8") !== text) {
    fail("entry does not round-trip through UTF-8");
  }
}

validateEntry(ENTRY);

const outDir = process.env.MAKEFUN_OUTPUT_DIR ?? "/output";
mkdirSync(outDir, { recursive: true });
const outPath = join(outDir, "entry.txt");
writeFileSync(outPath, ENTRY, "utf8");

// Verify what landed on disk is byte-identical to the validated entry:
// a write that silently changed the text would fail the gate downstream.
const written = readFileSync(outPath, "utf8");
if (written !== ENTRY) {
  fail(
    `wrote ${[...written].length} characters but the entry is ${[...ENTRY].length}`,
  );
}
