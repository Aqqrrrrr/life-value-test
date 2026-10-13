# 人生性价比测试 V1 改版 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 将现有 24 道行动选择题改造成 6 道处境筛选、12 道决策风格量表，以及按三个独立收益口径呈现的行动清单。

**Architecture:** 用纯 JavaScript 领域模块保存题目、评分、浏览器会话解析和指南条目筛选规则；React 页面仅负责提问、保存本地快照和呈现结果。指南条目是经过人工核对的静态目录，而非运行时爬取；报告 API 继续只负责服务器端的 `user_id + entitlement` 访问控制，个性化快照在 V1 仍只保留于浏览器。

**Tech Stack:** Next.js 16 / React 19、TypeScript、Node 内置 `node:test`、Cloudflare Workers / D1 / Drizzle、Tailwind CSS。

**Spec:** `docs/superpowers/specs/2026-10-12-life-value-test-redesign-design.md`

## Global Constraints

- 这是自我反思与行动筛选工具；不得表述为心理诊断、医疗建议或正式人格测评。
- 测试共 18 道常规题：6 道处境题不计分，12 道风格题使用“非常不像我 / 比较不像我 / 说不清 / 比较像我 / 非常像我”。
- 不合并安全健康、时间精力、钱与权益为总分，也不跨收益口径总排序。
- 风格只改变行动卡的说明与首步提示，不得改变安全、法律或医学条目的事实优先级或适用门槛。
- 紧急危险、严重自伤想法、医疗急症、正在进行的法律程序必须旁路测试，直接显示首步处置；不得产生普通答题快照。
- 不收集病史、收入、具体住址、身份证件等高敏感信息；免费测试快照默认只存浏览器本地。
- 详细报告访问只由服务端的 `user_id + entitlement` 判定；URL、浏览器参数和客户端状态不能授予权限。
- 每个自动推荐条目都必须带指南章节、条目标题和原始出处链接；不生成指南正文没有的数字。
- `TODO/待核实` 条目不得成为自动推荐；有争议条目可以出现，但必须呈现争议提示；临床病史决定适用性的医疗条目不得自动推荐。
- 本次不新增站内支付、真实邮件服务、自动推送或跨设备保存测评快照的数据库表。

## Review Focus

- 紧急门选择后，页面不得进入题目、写入常规答题结果或展示“继续测试”；由 Task 1 与 Task 3 的旁路测试覆盖。
- 12 题全部选择“说不清”时，结果必须注明倾向不明显，而不能把中性答题伪装为强画像；由 Task 1 覆盖。
- 手动篡改、旧版本或缺失的本地存储快照必须回到测试入口，不得使结果页崩溃；由 Task 1 与 Task 4 覆盖。
- 上下文不匹配、待核实、临床限定和争议条目分别要被排除或带提示，且三个口径互不竞争；由 Task 2 覆盖。
- 已购用户在另一台设备没有本地快照时应仍通过服务器权限校验，但必须看到“在本设备重新完成测试”的说明；未购用户不能查看详细内容；由 Task 4 的 API/浏览器验收覆盖。

---

## File Structure

- Create: `lib/life-value-assessment.mjs` — 常量、18 道题定义、反向计分、画像和本地快照的纯函数。
- Create: `lib/guide-action-catalog.mjs` — 经核对的指南条目目录、来源版本和按处境筛选/排序的纯函数。
- Create: `tests/life-value-assessment.test.mjs` — 题量、反向计分、画像分支、紧急旁路和本地快照测试。
- Create: `tests/guide-action-catalog.test.mjs` — 目录字段完整性、适用性、待核实/争议和分口径推荐测试。
- Modify: `app/page.tsx` — 将首页文案和预览改为 18 题、画像与行动清单。
- Modify: `app/test/page.tsx` — 用新版题目流程替代“场景内三选一”流程。
- Modify: `app/result/page.tsx` — 从本地快照得出画像和三张独立行动卡。
- Modify: `app/report/page.tsx` — 在 entitlement 校验成功后呈现同一快照的扩展复盘；没有本地快照时要求重测。
- Modify: `app/api/me/report/route.ts` — 保留现有服务端授权语义，删除静态的“风险先行型”报告内容，只返回授权状态和 SKU。
- Modify: `tests/navigation-fallback.test.mjs` — 保持 Vinext 环境使用原生锚点的页面导航约束，并覆盖新的测试入口文案。
- Retire from runtime imports: `lib/quiz-data.ts`、`lib/quiz-scenes.mjs`、`lib/quiz-scoring.mjs`；旧的对应测试在新版纯函数测试通过后删除，避免两个评分口径并存。

### Task 1: 新版测评领域模型与评分

**Files:**
- Create: `lib/life-value-assessment.mjs`
- Create: `tests/life-value-assessment.test.mjs`
- Delete: `tests/quiz-scenes.test.mjs`
- Delete: `tests/quiz-scoring.test.mjs`

**Interfaces:**
- Produces `EMERGENCY_OPTIONS`, `CONTEXT_QUESTIONS`, `STYLE_QUESTIONS`, `LIKERT_OPTIONS` for `app/test/page.tsx`.
- Produces `isEmergencySelection(selection: string): boolean`, `scoreStyleAnswers(answers: Record<string, number>): StyleResult`, `createAssessmentSnapshot(context: ContextAnswers, answers: Record<string, number>): AssessmentSnapshot`, and `parseAssessmentSnapshot(raw: string | null): AssessmentSnapshot | null` for results pages.
- `StyleResult` contains `{ dimensions, profile, auxiliaryTags, tendencyIsClear }`; `profile.id` is one of `steady-verify`, `steady-act`, `opportunity-verify`, `opportunity-act`.

- [ ] **Step 1: Write failing tests for the fixed questionnaire shape and emergency branch**

```js
assert.equal(CONTEXT_QUESTIONS.length, 6);
assert.equal(STYLE_QUESTIONS.length, 12);
assert.equal(isEmergencySelection("medical-emergency"), true);
assert.equal(isEmergencySelection("safe-to-continue"), false);
```

- [ ] **Step 2: Run the new test file to verify it fails**

Run: `node --test tests/life-value-assessment.test.mjs`

Expected: FAIL because `lib/life-value-assessment.mjs` does not exist.

- [ ] **Step 3: Define the six context questions, the emergency choices, and the 12 exact style statements in `lib/life-value-assessment.mjs`**

Use the approved wording in the spec. Model only coarse stage, priorities (at most two), household responsibility, residence/transport and scarce resource; provide a non-disclosing choice wherever an answer would otherwise be required. Mark multi-select maximums on the question object so the UI does not duplicate the rule.

- [ ] **Step 4: Add failing scoring tests for reverse items, four primary profiles, auxiliary tags, and neutral answers**

```js
assert.equal(scoreStyleAnswers(allFiveAnswers).dimensions.protection, 5);
assert.equal(scoreStyleAnswers(steadyVerifyAnswers).profile.id, "steady-verify");
assert.equal(scoreStyleAnswers(opportunityActAnswers).profile.id, "opportunity-act");
assert.deepEqual(scoreStyleAnswers(collaborativeAnswers).auxiliaryTags, ["协作求助倾向"]);
assert.equal(scoreStyleAnswers(allNeutralAnswers).tendencyIsClear, false);
```

- [ ] **Step 5: Implement `scoreStyleAnswers(answers)` and `createAssessmentSnapshot(context, answers)`**

Each response is `1..5`; reverse items score as `6 - response`. Average each three-item dimension. Use protection/opportunity and evidence/quick-judgement dimensions to select the four approved primary IDs; a primary-axis average within `0.5` of `3` sets `tendencyIsClear: false` and the UI must append “倾向尚不明显”. Add `协作求助倾向` when collaboration is at least `3.5`, `自主推进倾向` when at most `2.5`, and `系统规划倾向` when low-friction action is at most `2.5`.

- [ ] **Step 6: Add failing snapshot validation tests**

```js
assert.equal(parseAssessmentSnapshot(JSON.stringify(validSnapshot)).version, 2);
assert.equal(parseAssessmentSnapshot("not json"), null);
assert.equal(parseAssessmentSnapshot(JSON.stringify({ version: 1 })), null);
```

- [ ] **Step 7: Implement the versioned snapshot parser and run all assessment tests**

Persist only `{ version: 2, completedAt, context, styleAnswers }`; reject malformed values, unknown question IDs, missing answers, non-numeric Likert values and emergency selections. Do not put email, order number or entitlement data in this object.

Run: `node --test tests/life-value-assessment.test.mjs`

Expected: PASS.

- [ ] **Step 8: Commit the self-contained domain model**

```powershell
git add lib/life-value-assessment.mjs tests/life-value-assessment.test.mjs tests/quiz-scenes.test.mjs tests/quiz-scoring.test.mjs
git commit -m "feat: add life value assessment model"
```

### Task 2: 可追溯指南条目目录与分口径推荐

**Files:**
- Create: `lib/guide-action-catalog.mjs`
- Create: `tests/guide-action-catalog.test.mjs`

**Interfaces:**
- Consumes `ContextAnswers` shape from `lib/life-value-assessment.mjs`.
- Produces `GUIDE_SOURCE_REVISION`, `ACTION_CATALOG`, `selectActions(context: ContextAnswers, catalog?: ActionCandidate[]): Record<BenefitLens, Recommendation | null>` and `actionPresentationFor(styleResult, recommendation): ActionPresentation` for result/report pages.
- `ActionCandidate` has `id`, `chapter`, `title`, `sourceUrl`, `lens`, `benefit`, `costs`, `ratioTier`, `evidenceGrade`, `firstStep`, `requirements`, `status`, and `caveats`; valid `lens` values are `safety-health`, `time-energy`, `money-rights`.

- [ ] **Step 1: Acquire and pin the Guide source revision before authoring catalog rows**

Record the exact public repository commit/URL consulted in `GUIDE_SOURCE_REVISION`. Read complete candidate entries, not titles alone. Do not add a row if its costs, benefit lens, evidence, source location, or applicability cannot be verified from the guide.

- [ ] **Step 2: Write failing data-quality and recommendation tests**

```js
for (const action of ACTION_CATALOG) {
  assert.ok(action.chapter && action.title && action.sourceUrl);
  assert.match(action.sourceUrl, /^https:\/\//);
  assert.ok(["safety-health", "time-energy", "money-rights"].includes(action.lens));
}
assert.equal(selectActions(renterContext, fixtureCatalog)["money-rights"].id, "renter-rights");
assert.equal(selectActions(noMatchContext, fixtureCatalog)["time-energy"], null);
```

- [ ] **Step 3: Build `ACTION_CATALOG` from source-verified, non-clinical Guide entries**

Start with a deliberately small catalog with candidates for each of the three benefit lenses, with no claims beyond the guide’s wording. Store the guide’s already-derived ratio tier; do not recompute a ratio from invented numerical weights. Preserve all three named costs even when a cost is absent, preserve the evidence grade, and expose the original chapter/title/source link. Encode renter, transport, child, elder-care, work-stage and priority applicability as coarse requirements. Mark clinical-history-dependent entries `manual-review`, contested entries `controversial`, and incomplete/`TODO` entries `todo`.

- [ ] **Step 4: Implement `selectActions(context, catalog)` and its tests**

First exclude `todo`, `manual-review`, and nonmatching requirements. Partition by `lens`; within each partition sort source-provided ratio tier (`极高`, `高`, `一般`), then evidence (`A`, `B`, `C`), then number of matched coarse context tags. Return at most one row per lens and `null` when none applies. Never compare candidates across lenses. Keep `controversial` rows eligible but carry their caveat into the returned recommendation.

Run: `node --test tests/guide-action-catalog.test.mjs`

Expected: PASS, including fixtures for incompatible context, `todo`, `manual-review`, a controversial selected row, same-tier evidence order, and one result per lens.

- [ ] **Step 5: Implement `actionPresentationFor(styleResult, recommendation)` without changing recommendation identity**

Return the same candidate plus a rendering emphasis: evidence/conditions for `steady-verify`, a concrete first step for low-friction action, a follow-up checklist for system planning, and a support-channel prompt for collaboration. Test that two opposite styles receive the same `action.id` for the same context.

- [ ] **Step 6: Commit the curated catalog and selector**

```powershell
git add lib/guide-action-catalog.mjs tests/guide-action-catalog.test.mjs
git commit -m "feat: add guide action recommendations"
```

### Task 3: 18 题测试流程与安全旁路

**Files:**
- Modify: `app/page.tsx`
- Modify: `app/test/page.tsx`
- Modify: `tests/navigation-fallback.test.mjs`

**Interfaces:**
- Consumes `EMERGENCY_OPTIONS`, `CONTEXT_QUESTIONS`, `STYLE_QUESTIONS`, `LIKERT_OPTIONS`, `isEmergencySelection`, and `createAssessmentSnapshot` from Task 1.
- Produces browser `localStorage["life-value-test-v2"]` only after all 18 ordinary answers pass validation, then navigates to `/result`.

- [ ] **Step 1: Update the navigation/content test to describe the new public entry point**

Assert the homepage still uses a native anchor to `/test` and contains `6 道处境筛选 + 12 道决策风格题`; keep the existing prohibition on `next/link` imports.

- [ ] **Step 2: Run the navigation test to verify it fails**

Run: `node --test tests/navigation-fallback.test.mjs`

Expected: FAIL because the old homepage advertises 24 questions.

- [ ] **Step 3: Update `app/page.tsx` for the new promise and transparent limitations**

Replace every `24 题`/`01 / 24` claim with the 6+12 structure. Explain that results are a changing decision-style snapshot and separate safety health, time energy, and money rights; retain the self-reflection/non-diagnostic disclaimer and the existing `/test`, `/redeem`, `/account` links.

- [ ] **Step 4: Replace `app/test/page.tsx` with the ordered safety, context and scale-question state machine**

Start with the safety gate. Selecting any emergency option replaces the form with a direct first-step card: immediate danger/medical emergency tells the visitor to contact local emergency services (China mainland: 110/120 where applicable), serious self-harm thoughts tells them not to stay alone and to seek immediate emergency/trusted-person help, and active legal proceedings tells them to preserve materials and promptly use a lawyer or local legal-aid channel. Do not save a normal assessment for this branch.

For ordinary flow show all six context questions before the 12 style questions, one screen at a time, with a visible `n / 18` progress indicator, Back/Continue controls, and checkbox maximum enforcement for priorities. Store in component state only until completion, then write the Task 1 snapshot and navigate with `window.location.assign("/result")`.

- [ ] **Step 5: Run source-level tests and perform a local browser smoke check**

Run: `node --test tests/navigation-fallback.test.mjs`

Expected: PASS.

Run: `npm run dev`

Manual check: complete a normal 18-question path, refresh `/result`, and verify the snapshot survives; repeat with each emergency choice and verify no normal result is stored.

- [ ] **Step 6: Commit the test-flow replacement**

```powershell
git add app/page.tsx app/test/page.tsx tests/navigation-fallback.test.mjs
git commit -m "feat: add context and decision style test flow"
```

### Task 4: 免费结果、付费报告门槛与可解释行动卡

**Files:**
- Modify: `app/result/page.tsx`
- Modify: `app/report/page.tsx`
- Modify: `app/api/me/report/route.ts`
- Create: `tests/report-presentation.test.mjs`

**Interfaces:**
- Consumes Task 1 `parseAssessmentSnapshot`/`scoreStyleAnswers` and Task 2 `selectActions`/`actionPresentationFor`.
- Consumes `GET /api/me/report` response `{ reportAccess: true, sku: string }` only after the existing D1 entitlement check.
- Produces a free `/result` page and a paid `/report` page that derive presentation from local snapshot; no URL parameters carry answers, email, order reference, code or entitlement.

- [ ] **Step 1: Write failing presentation and API-shape tests**

```js
assert.match(renderableResult.emptyState, /重新完成测试/);
assert.equal(renderableResult.actions["safety-health"].lens, "safety-health");
assert.equal(renderableResult.actions["time-energy"].lens, "time-energy");
assert.equal(renderableResult.actions["money-rights"].lens, "money-rights");
assert.doesNotMatch(reportRouteSource, /风险先行型/);
assert.match(reportRouteSource, /userIdFromCookie/);
assert.match(reportRouteSource, /entitlements/);
```

- [ ] **Step 2: Change `GET /api/me/report` to return authorization state rather than a fabricated static profile**

Keep its `401` unauthenticated, `403` no-entitlement, and `503` unavailable-database semantics. On success return only `{ reportAccess: true, sku }`; do not return answers or treat a request parameter as proof of purchase.

- [ ] **Step 3: Rebuild `app/result/page.tsx` from the local snapshot**

If `parseAssessmentSnapshot` returns `null`, show a calm empty state and a `/test` link. Otherwise render the primary profile, the “倾向尚不明显” qualifier when needed, auxiliary labels, and a non-diagnostic/change-over-time statement. Render three independently labelled sections, never a ranked list: safety-health, time-energy, money-rights. Each candidate card must show why it matches, its first step, three cost labels, evidence grade, applicability restrictions, controversy notice when present, and a clickable chapter/title source. A `null` lens shows `暂不自动推荐` rather than a substitute action.

- [ ] **Step 4: Rebuild `app/report/page.tsx` as entitlement-gated detail on the same snapshot**

Fetch `/api/me/report` first. Do not render detailed cards until it succeeds. When it succeeds and a valid local snapshot exists, show the extended explanation and all source/caveat information from the same selector. When it succeeds but no local snapshot exists, say “已解锁详细报告；请在本设备重新完成测试以生成个性化内容” and link to `/test`. This explicit V1 limitation preserves the approved browser-local-data constraint and avoids silently saving context to D1.

- [ ] **Step 5: Run tests, build, and perform entitlement smoke checks**

Run: `node --test tests/life-value-assessment.test.mjs tests/guide-action-catalog.test.mjs tests/navigation-fallback.test.mjs tests/report-presentation.test.mjs`

Expected: PASS.

Run: `npm run lint; npm run build`

Expected: both exit `0`.

Manual check: no cookie gets the existing 401 experience, a verified account without entitlement gets 403, an entitled account gets the detailed page only after a local snapshot is present, and manually editing the URL never changes access.

- [ ] **Step 6: Commit the result and report work**

```powershell
git add app/result/page.tsx app/report/page.tsx app/api/me/report/route.ts tests/report-presentation.test.mjs
git commit -m "feat: show personalized life value results"
```

### Task 5: Final regression verification and release handoff

**Files:**
- Modify only if verification exposes a defect in one of the files above.

**Interfaces:**
- Consumes the completed Tasks 1–4 behavior and existing redemption/account endpoints.
- Produces a buildable branch ready for existing Cloudflare deployment workflow; no payment/email/provider configuration change.

- [ ] **Step 1: Run the complete automated suite from a clean working tree**

Run: `node --test tests/*.test.mjs`

Expected: PASS with no old `quiz-scenes` or `quiz-scoring` test files remaining.

- [ ] **Step 2: Run lint and production build**

Run: `npm run lint; npm run build`

Expected: both exit `0` and the build has no route compilation errors.

- [ ] **Step 3: Perform mobile-width regression checks**

Manual check at narrow viewport: home copy does not claim 24 questions; multi-select and Likert controls remain tappable; emergency cards are readable; each result card shows its lens rather than a cross-lens rank; redeem/account paths retain their existing links.

- [ ] **Step 4: Inspect the final diff and commit any verification-only fixes**

Run: `git diff --check; git status --short`

Expected: no whitespace errors; only intentional files are staged if a fix was needed.

```powershell
git add -- app/page.tsx app/test/page.tsx app/result/page.tsx app/report/page.tsx app/api/me/report/route.ts lib/life-value-assessment.mjs lib/guide-action-catalog.mjs tests/life-value-assessment.test.mjs tests/guide-action-catalog.test.mjs tests/navigation-fallback.test.mjs tests/report-presentation.test.mjs
git commit -m "fix: verify life value test redesign"
```

Do not create an empty commit when no verification fix was required.
