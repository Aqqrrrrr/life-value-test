# Adaptive Life-stage Content Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the fixed 18-question test with a deterministic, 22/26/30-question adaptive assessment that uses 1--3 selected life stages and returns traceable, non-conflicting guidance.

**Architecture:** Keep static content separate from assessment mechanics. `life-stage-question-bank.mjs` owns the stage catalogue and question definitions; `life-value-assessment.mjs` owns validation, deterministic question-set assembly, scoring and v3 snapshots; `guide-action-catalog.mjs` owns source-verified actions and selection. The client test page renders the assembled question set, while the shared results component renders independent lenses plus deduplicated stage sections.

**Tech Stack:** Next.js/Vinext, React 19, TypeScript/TSX, ESM `.mjs` domain modules, Node `node:test`, Cloudflare Workers/Pages.

**Spec:** `docs/superpowers/specs/2026-10-12-adaptive-life-stage-content-design.md`

## Global Constraints

- Life-stage selection is required, permits 1--3 selections, and an optional priority stage must be one of the selected stages.
- The seven stage IDs are `studying-graduating`, `career-start`, `stable-work`, `living-alone`, `career-change`, `partner-parenting`, and `elder-family-care`.
- Each submitted assessment has 18 core questions and exactly four questions per selected stage, producing totals of 22, 26 or 30.
- The question set is deterministic: the same selected stages always yield the same questions and order.
- Do not ask users to self-identify emergency conditions at test start. Emergency, self-harm, immediate-danger and ongoing-legal routes must never be normal scored questions.
- Safety-health, time-energy and money-rights must remain independent; never render a total score, cross-lens rank or personality diagnosis.
- Action copy, costs, evidence and source links are derived only from complete, pinned Guide entries. `todo` and `manual-review` rows cannot auto-recommend; controversial rows keep their caveat.
- Browser snapshots are versioned local data only; report authorization remains server-side through the session user and a non-revoked entitlement.
- Preserve native-anchor navigation required by the Vinext fallback; do not introduce `next/link`.

## Review Focus

- A user who chooses three stages must see exactly 30 questions, with all three stage blocks present once and no duplicate IDs. Covered in Task 1.
- A malformed snapshot, a legacy v2 snapshot, or a priority stage outside the selected stages must offer re-test rather than an invented result. Covered in Task 2 and Task 5.
- A voluntarily opened emergency route must show direct help without creating a local snapshot; regular test start must not show an emergency screening gate. Covered in Task 4.
- An action that matches two stages must render once with merged applicability, and stage ordering must honor the optional priority without changing selection. Covered in Task 3 and Task 5.
- An unclear or non-disclosed context must not receive substitute actions or fabricated source claims. Covered in Task 3 and Task 5.

---

## File Structure

- Create `lib/life-stage-question-bank.mjs` — seven life-stage definitions, 18 core question records, 28 stage question records, and deterministic assembly helpers.
- Modify `lib/life-value-assessment.mjs` — v3 snapshot schema, validation, core style scoring, derived context signals, question-set wrapper and voluntary safety-route metadata.
- Modify `lib/guide-action-catalog.mjs` — vetted stage-aware action metadata and selectors returning independent lens and stage recommendations without duplicates.
- Modify `app/test/page.tsx` — stage/priority intake, low-disruption safety assistance entry, dynamic test rendering and v3 local snapshot persistence.
- Modify `components/assessment-results.tsx` — v3 snapshot rendering, current-stage header, independent lenses and ordered per-stage recommendations.
- Modify `app/report/page.tsx` and `app/result/page.tsx` — read the v3 local-storage key while retaining explicit re-test behaviour.
- Modify `app/page.tsx` and `tests/navigation-fallback.test.mjs` — describe the 22--30 adaptive test without introducing framework navigation.
- Create `tests/life-stage-question-bank.test.mjs` and `tests/assessment-flow.test.mjs` — isolated question-set and client-flow coverage.
- Modify `tests/life-value-assessment.test.mjs`, `tests/guide-action-catalog.test.mjs`, `tests/emergency-routing.test.mjs`, and `tests/report-presentation.test.mjs` — update domain, safety and presentation assertions for v3.

### Task 1: Define the deterministic question bank

**Files:**
- Create: `lib/life-stage-question-bank.mjs`
- Create: `tests/life-stage-question-bank.test.mjs`

**Interfaces:**
- Produces: `LIFE_STAGES`, `CORE_QUESTIONS`, `STAGE_QUESTION_BANK`, `buildQuestionSet(lifeStages)` and `questionCountFor(lifeStages)`.
- Consumes: only static ESM data; Task 2 imports these exports for schema validation and snapshot creation.

- [ ] **Step 1: Write failing tests for the stage catalogue and deterministic totals**

```js
assert.deepEqual(LIFE_STAGES.map(({ id }) => id), [
  "studying-graduating", "career-start", "stable-work", "living-alone",
  "career-change", "partner-parenting", "elder-family-care",
]);
assert.equal(CORE_QUESTIONS.length, 18);
assert.equal(STAGE_QUESTION_BANK["stable-work"].length, 4);
assert.equal(questionCountFor(["stable-work"]), 22);
assert.equal(questionCountFor(["stable-work", "living-alone"]), 26);
assert.equal(questionCountFor(["stable-work", "living-alone", "elder-family-care"]), 30);
assert.deepEqual(buildQuestionSet(["stable-work", "living-alone"]), buildQuestionSet(["stable-work", "living-alone"]));
```

- [ ] **Step 2: Run the question-bank test to verify it fails**

Run: `node --test --test-isolation=none tests/life-stage-question-bank.test.mjs`  
Expected: FAIL because the question-bank module does not exist.

- [ ] **Step 3: Implement the static question-bank interfaces in `lib/life-stage-question-bank.mjs`**

Define a question record as `{ id, group, stage?, lens, input, prompt, options, dimension?, reverse?, signals? }`. Create 18 core records covering the five spec categories and four same-scene stage records for each of the seven stages. `buildQuestionSet(lifeStages)` must return all core records followed by stage blocks in canonical `LIFE_STAGES` order, not selection-click order; reject invalid, duplicate or out-of-range stage arrays.

- [ ] **Step 4: Extend tests to pin same-scene and source-ready content metadata**

For every question, assert a unique ID, nonempty prompt, nonempty options and exactly one `lens`; assert stage records carry their owning `stage`, while core records do not. Assert each stage block covers its four spec-defined situation categories through stable `category` metadata.

- [ ] **Step 5: Run the question-bank test to verify it passes**

Run: `node --test --test-isolation=none tests/life-stage-question-bank.test.mjs`  
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add lib/life-stage-question-bank.mjs tests/life-stage-question-bank.test.mjs
git commit -m "feat: add life-stage question bank"
```

### Task 2: Upgrade assessment validation, scoring and snapshots to v3

**Files:**
- Modify: `lib/life-value-assessment.mjs`
- Modify: `tests/life-value-assessment.test.mjs`

**Interfaces:**
- Consumes: `LIFE_STAGES`, `CORE_QUESTIONS`, `buildQuestionSet()` from Task 1.
- Produces: `ASSESSMENT_STORAGE_KEY`, `validateStageSelection(lifeStages, priorityStage)`, `createAssessmentSnapshot(input)`, `parseAssessmentSnapshot(raw)`, `scoreCoreAnswers(answers)`, `deriveContextSignals(snapshot)`, `questionSetForSnapshotInput(input)`, and voluntary `SAFETY_ROUTE_OPTIONS` / `isSafetyRoute()`.
- Consumed by: Tasks 3--5.

- [ ] **Step 1: Write failing v3 schema tests**

```js
const input = { lifeStages: ["stable-work", "living-alone"], priorityStage: "living-alone", answers };
const snapshot = createAssessmentSnapshot(input);
assert.equal(snapshot.version, 3);
assert.deepEqual(snapshot.lifeStages, ["stable-work", "living-alone"]);
assert.equal(snapshot.priorityStage, "living-alone");
assert.equal(questionSetForSnapshotInput(input).length, 26);
assert.equal(parseAssessmentSnapshot(JSON.stringify({ version: 2 })), null);
assert.throws(() => createAssessmentSnapshot({ ...input, priorityStage: "career-change" }), /优先阶段/);
```

- [ ] **Step 2: Run the assessment tests to verify they fail**

Run: `node --test --test-isolation=none tests/life-value-assessment.test.mjs`  
Expected: FAIL because the v3 API is absent.

- [ ] **Step 3: Implement v3 assessment mechanics in `lib/life-value-assessment.mjs`**

Replace the fixed context-question schema with the Task 1 question set. Validate every answer against its generated question record, including all 18 core answers and four answers per selected stage. Keep the existing four decision-style dimensions for the appropriate core records and preserve their profile labels; stage answers must feed only `deriveContextSignals`, never profile scoring. Snapshots contain only `version`, `completedAt`, `lifeStages`, `priorityStage`, and `answers`.

- [ ] **Step 4: Add safety and disclosure regression tests**

Assert that `SAFETY_ROUTE_OPTIONS` is not part of any generated question set, safety route IDs cannot be stored as answers, `prefer-not-to-say` produces no invented signal, and all malformed/legacy snapshots parse to `null`.

- [ ] **Step 5: Run the assessment tests to verify they pass**

Run: `node --test --test-isolation=none tests/life-value-assessment.test.mjs`  
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add lib/life-value-assessment.mjs tests/life-value-assessment.test.mjs
git commit -m "feat: add adaptive assessment snapshots"
```

### Task 3: Curate stage-aware actions and select them without cross-lens ranking

**Files:**
- Modify: `lib/guide-action-catalog.mjs`
- Modify: `tests/guide-action-catalog.test.mjs`

**Interfaces:**
- Consumes: Task 2 `deriveContextSignals(snapshot)` and the selected stage IDs.
- Produces: `selectRecommendations(snapshot, catalog?)` returning `{ lenses, stages }`, where `lenses` has the three fixed lens IDs and `stages` has at most two deduplicated actions per selected stage.
- Consumed by: Task 5 results rendering.

- [ ] **Step 1: Write failing selection tests for stage coverage, source fidelity and deduplication**

```js
const result = selectRecommendations(snapshotFor(["stable-work", "living-alone"], "living-alone"));
assert.deepEqual(Object.keys(result.lenses), ["safety-health", "time-energy", "money-rights"]);
assert.ok(result.stages["stable-work"].length <= 2);
assert.ok(result.stages["living-alone"].length <= 2);
assert.equal(new Set(Object.values(result.stages).flat().map(({ id }) => id)).size,
  Object.values(result.stages).flat().length);
```

Also assert every automatic row has a pinned complete Guide source URL, cost labels, evidence grade, applicability/caveat fields and a nonempty stage mapping; `todo` and `manual-review` rows remain excluded.

- [ ] **Step 2: Run the action-catalog tests to verify they fail**

Run: `node --test --test-isolation=none tests/guide-action-catalog.test.mjs`  
Expected: FAIL because `selectRecommendations` and stage mappings are absent.

- [ ] **Step 3: Add only source-verified action records and the recommendation selector**

Read the complete relevant entries from the pinned Guide revision before adding a row. Extend each curated row with `stageIds` and context-signal requirements; do not add an action merely because a stage category exists. Implement `selectRecommendations` to select within each lens by the existing ratio/evidence/fit order, build up to two eligible stage actions, deduplicate IDs across all stage sections, and preserve controversial caveats. Selection order must not become a score or change the chosen rows; `priorityStage` is presentation metadata only.

- [ ] **Step 4: Add tests for incomplete or conflicting context**

Assert that no-stage/`prefer-not-to-say` context yields explicit empty stage arrays, an action mapped to two selected stages appears only once, a priority stage does not alter eligibility, and a missing approved Guide action produces no substitute recommendation.

- [ ] **Step 5: Run the action-catalog tests to verify they pass**

Run: `node --test --test-isolation=none tests/guide-action-catalog.test.mjs`  
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add lib/guide-action-catalog.mjs tests/guide-action-catalog.test.mjs
git commit -m "feat: add stage-aware guide recommendations"
```

### Task 4: Replace the opening safety gate with stage intake and dynamic test flow

**Files:**
- Modify: `app/test/page.tsx`
- Create: `tests/assessment-flow.test.mjs`
- Modify: `tests/emergency-routing.test.mjs`

**Interfaces:**
- Consumes: Task 2 selection/snapshot APIs and `ASSESSMENT_STORAGE_KEY`.
- Produces: a client flow with stage intake, optional priority selection, voluntary safety route and a dynamic progress denominator.
- Consumed by: result/report pages through the stored v3 snapshot.

- [ ] **Step 1: Write failing flow tests for the new initial state and dynamic progress**

Test-render `app/test/page.tsx` to assert it begins with the life-stage selector (not emergency options), prevents zero or fourth-stage selection, only offers priority choices from selected stages, displays `1 / 22`, `1 / 26` or `1 / 30` after intake, and calls `createAssessmentSnapshot` only after every generated question is answered.

- [ ] **Step 2: Run the flow and emergency tests to verify they fail**

Run: `node --test --test-isolation=none tests/assessment-flow.test.mjs tests/emergency-routing.test.mjs`  
Expected: FAIL because the existing page begins with a safety gate and has a fixed denominator.

- [ ] **Step 3: Implement stage intake and dynamic rendering in `app/test/page.tsx`**

Use a dedicated intake state before scoring. Require 1--3 stage selections, let the user set zero or one priority stage after selection, construct questions through `buildQuestionSet`, and maintain answers by question ID. Replace fixed index/18 copy with the generated set length. Persist only a valid v3 snapshot under `ASSESSMENT_STORAGE_KEY`; Back returns to the previous generated question or the intake state without losing answers.

- [ ] **Step 4: Implement the low-disruption voluntary safety route**

Show a short emergency note and a user-triggered “需要紧急协助” control, not an opening screening question. When opened, present the existing direct medical, self-harm, immediate-danger and legal assistance cards. These controls must not appear in `buildQuestionSet`, cannot update assessment answers and never call snapshot creation.

- [ ] **Step 5: Update emergency-route tests and run the UI tests to verify they pass**

Run: `node --test --test-isolation=none tests/assessment-flow.test.mjs tests/emergency-routing.test.mjs`  
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add app/test/page.tsx tests/assessment-flow.test.mjs tests/emergency-routing.test.mjs
git commit -m "feat: add adaptive assessment flow"
```

### Task 5: Render stage-aware free and detailed results

**Files:**
- Modify: `components/assessment-results.tsx`
- Modify: `app/result/page.tsx`
- Modify: `app/report/page.tsx`
- Modify: `app/page.tsx`
- Modify: `tests/report-presentation.test.mjs`
- Modify: `tests/navigation-fallback.test.mjs`

**Interfaces:**
- Consumes: Task 2 parsed v3 snapshot and Task 3 `selectRecommendations` result.
- Produces: free/detailed result UI with `data-lens` and `data-stage` sections; report access remains an input gate, not an authority source.

- [ ] **Step 1: Write failing presentation tests for stages, priority, empty states and v3 storage**

```js
const html = render({ rawSnapshot: threeStageSnapshot, reportAccess: true });
assert.match(html, /当前生活阶段/);
assert.match(html, /稳定工作/);
assert.match(html, /独居/);
assert.ok(html.indexOf("独居") < html.indexOf("稳定工作")); // selected priority
assert.match(html, /data-lens="safety-health"/);
assert.match(html, /data-stage="living-alone"/);
assert.doesNotMatch(html, /总分|第.?名/);
```

Assert malformed/v2 snapshots offer a re-test; an empty stage recommendation renders “暂不自动推荐”; an action shared by stages appears once; all source/cost/evidence/caveat content remains visible; and `app/report/page.tsx` reads `ASSESSMENT_STORAGE_KEY` rather than the v2 literal.

- [ ] **Step 2: Run presentation and navigation tests to verify they fail**

Run: `node --test --test-isolation=none tests/report-presentation.test.mjs tests/navigation-fallback.test.mjs`  
Expected: FAIL because results currently expect v2 context and no stage sections.

- [ ] **Step 3: Implement result and report rendering**

Parse the v3 snapshot once, render a current-stage header plus the existing qualified decision-style explanation, then the three independent lens sections. Render selected stage sections in priority-first/canonical order with a maximum of two actions each. Use an explicit empty state when a stage has no eligible action. Preserve `ActionCard` source, cost, evidence, caveat and detailed checklist content; merge duplicate actions instead of rendering the same card twice. Keep detailed content behind the existing report-access prop.

- [ ] **Step 4: Update landing and storage references**

Describe the adaptive 22--30 question range and multi-stage matching on `app/page.tsx`; update result/report storage lookups to the exported v3 key; update navigation assertions while preserving native anchors and the emergency disclaimer.

- [ ] **Step 5: Run presentation and navigation tests to verify they pass**

Run: `node --test --test-isolation=none tests/report-presentation.test.mjs tests/navigation-fallback.test.mjs`  
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add components/assessment-results.tsx app/result/page.tsx app/report/page.tsx app/page.tsx tests/report-presentation.test.mjs tests/navigation-fallback.test.mjs
git commit -m "feat: present life-stage results"
```

### Task 6: Run end-to-end verification and prepare the updated preview

**Files:**
- Modify only if verification reveals a scoped defect in a Task 1--5 file.
- Test: `tests/*.test.mjs`

**Interfaces:**
- Consumes: all completed task interfaces.
- Produces: verified branch state ready for review and preview deployment.

- [ ] **Step 1: Run the complete Node test suite**

Run: `node --test --test-isolation=none tests/*.test.mjs`  
Expected: all tests PASS with no skips introduced by this feature.

- [ ] **Step 2: Run lint and production build**

Run: `npm run lint`  
Expected: no new lint errors; document any pre-existing warnings separately.

Run: `npm run build`  
Expected: production build succeeds.

- [ ] **Step 3: Perform the mobile preview smoke test**

At a 390 px viewport, verify stage selection limit/priority selection, 22/26/30 progress, voluntary safety route, final free result, the no-match state, report locked state and report unlocked state with a valid local v3 snapshot.

- [ ] **Step 4: Commit only a necessary scoped verification fix**

If a scoped verification fix is necessary, stage only the files changed by that fix and commit it as `fix: verify adaptive life-stage assessment`. Do not create an empty verification commit.

## Plan Self-Review

- **Spec coverage:** Tasks 1--2 implement selection, counts, deterministic sets, v3 snapshots and score isolation; Task 3 implements sourced action selection and conflict rules; Task 4 implements the non-disruptive safety behavior; Task 5 implements free/detailed output and ordering; Task 6 covers full verification and mobile behaviour.
- **Type consistency:** Question data is built by `buildQuestionSet`, validated and snapshotted by Task 2, selected by Task 3 and rendered by Tasks 4--5. `lifeStages`, `priorityStage`, `answers` and v3 are used consistently.
- **Review Focus coverage:** Each listed user-risk condition has a named owning task and a concrete test.
- **Proportion:** The plan specifies interfaces, file responsibilities, tests and exact constraints without transcribing component implementations or Guide content.
