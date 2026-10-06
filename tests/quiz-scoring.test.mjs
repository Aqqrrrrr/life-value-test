import test from "node:test";
import assert from "node:assert/strict";
import { normalizeRanking } from "../lib/quiz-scoring.mjs";

test("accepts ties and normalizes whitespace", () => {
  assert.deepEqual(normalizeRanking("A > B = C", ["A", "B", "C"]), [["A"], ["B", "C"]]);
});

test("rejects duplicate or unknown choices", () => {
  assert.throws(() => normalizeRanking("A > A > C", ["A", "B", "C"]));
});
