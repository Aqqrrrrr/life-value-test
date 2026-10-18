# 情境式生活选择自我测评 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 将现有认同式人格倾向问卷改为覆盖六个生活区域、按人生阶段扩展、输出来源可追溯复盘行动卡的情境式自我测评。

**Architecture:** 题库使用统一的单选情境题 schema，并为每个选项记录仅供内容匹配的处境、复盘与优势信号。v4 快照只保存本次阶段与作答；选择器从同一道题的信号匹配经过人工核对的指南行动，至多输出三张独立的优先复盘卡。结果组件展示生活选择地图和行动卡，不再计算或渲染人格标签、维度分数或跨领域总分。

**Tech Stack:** Next.js/Vinext、React 19、TypeScript、Node.js 内建测试框架、Tailwind CSS、Cloudflare Pages/Workers。

**Spec:** `docs/superpowers/specs/2026-10-18-scenario-self-assessment-design.md`

## Global Constraints

- 产品是基于《高性价比人生指南》的生活选择自我测评，不是 MBTI、人格测试、心理诊断或标准化量表。
- 用户选择 1--3 个生活阶段；全员回答 18 道通用情境题，每个阶段增加 4 道情境题，总题数必须为 22、26 或 30。
- 六个通用生活区域各三题：人身与居住安全、健康睡眠与就医、金钱消费与保障、时间精力与工作、关系家庭与边界、信息权益与法律风险。
- 每题均为同一场景下“通常最可能先怎么做”的 2--4 个行动选项，并提供非惩罚性的“我没遇过 / 目前不确定”。
- 不得在作答过程中显示对错、分数或人格标签；医疗急症、自伤风险、即时危险和进行中的法律程序仍不作为普通测验题。
- 结果最多三张优先复盘行动卡：降低高损失风险、减少资源透支、补上信息/权益/支持缺口；不得输出总分、人格类型、排行榜或跨领域名次。
- 每张行动卡必须来自完整、固定版本的指南条目，展示成本、证据、适用条件、限制与必要时的争议提示；不得编造数字或条件。
- 旧 v3 本地快照不迁移到新语义，必须提示用户重新完成测试；账户、兑换码、报告授权和服务端权限检查不在本次改动范围内。
- 不增加积分、排行榜、连续签到或强制打卡；移动端须能完成测评、查看选择地图并进入小复盘入口。

## Review Focus

- 选择“我没遇过 / 目前不确定”的题不得被解释为风险或生成补位建议；在 Task 1 的 `deriveResponseContexts` 与 Task 2 的 `selectPriorityReviews` 测试中固定。
- 行动匹配不得把不同题、不同阶段的信号拼接为一次处境；在 Task 2 的单响应触发测试中固定。
- 同一行动不得因多阶段或多入口重复显示；在 Task 2 的去重测试和 Task 3 的静态渲染测试中固定。
- 旧版 `life-value-test-v3` 数据不得被当作 v4 测评结果；在 Task 1 的快照解析和 Task 3 的结果页测试中固定。
- 三个优先类别间不得用伪精确总分排序；在 Task 2 的“每类最多一张、无全局分数”测试和 Task 3 的页面断言中固定。

---

## File Structure

- Modify: `lib/life-stage-question-bank.mjs` — 定义六个生活区域、三个展示章节、18 道通用情境题和七组阶段题的统一选项 schema。
- Modify: `lib/life-value-assessment.mjs` — v4 快照校验、旧快照拒绝、逐题响应上下文提取；删除人格/李克特计分接口。
- Modify: `lib/guide-action-catalog.mjs` — 基于完整指南条目的行动目录、逐题触发和最多三类复盘行动的选择器。
- Modify: `components/assessment-results.tsx` — 渲染选择地图、信息不足状态和三张复盘行动卡；移除人格与三镜头/阶段卡页面结构。
- Create: `components/choice-map.tsx` — 只负责渲染六个生活区域的回答状态与“小复盘”链接。
- Modify: `app/test/page.tsx` — 使用章节/区域提示、情境题提示文案和 v4 本地存储流程。
- Modify: `app/result/page.tsx` — 继续读取导出的 v4 存储键，并对旧/无效本地结果显示重新测评入口。
- Modify: `tests/life-stage-question-bank.test.mjs` — 覆盖题数、六区域、章节、单选处境题和不确定选项。
- Modify: `tests/life-value-assessment.test.mjs` — 覆盖 v4 快照、逐题上下文和旧 v3 拒绝。
- Modify: `tests/guide-action-catalog.test.mjs` — 覆盖来源行动、单题触发、信息不足、三类上限和去重。
- Modify: `tests/assessment-flow.test.mjs` — 覆盖题目章节提示、22/26/30 流程和不确定选项的提交。
- Modify: `tests/report-presentation.test.mjs` — 覆盖免费结果/已授权报告的地图、复盘卡、无人格标签和旧快照重测提示。

### Task 1: 题库、v4 快照与逐题处境上下文

**Files:**
- Modify: `lib/life-stage-question-bank.mjs`
- Modify: `lib/life-value-assessment.mjs`
- Modify: `tests/life-stage-question-bank.test.mjs`
- Modify: `tests/life-value-assessment.test.mjs`

**Interfaces:**
- Consumes: `LIFE_STAGES` 和现有阶段题 ID；保留七个阶段 ID 与每阶段四题的稳定顺序。
- Produces: `LIFE_AREAS`, `ASSESSMENT_CHAPTERS`, `CORE_QUESTIONS`, `buildQuestionSet(lifeStages)`, `ASSESSMENT_STORAGE_KEY`, `createAssessmentSnapshot(input)`, `parseAssessmentSnapshot(raw)`, `deriveResponseContexts(snapshot)`。
- `deriveResponseContexts(snapshot)` 返回 `{ core: ResponseContext[], stage: ResponseContext[] }`；每个 `ResponseContext` 为 `{ questionId, group, areaId, stageId, optionValue, contextSignals, reviewSignals, strengthSignals, uncertain }`，并且仅来自该题所选选项。

- [ ] **Step 1: 写出失败的题库与快照迁移测试**

在两个现有测试文件中断言：

```js
assert.equal(CORE_QUESTIONS.length, 18);
assert.deepEqual(LIFE_AREAS.map(({ id }) => id), [
  "safety-home", "health-sleep-care", "money-protection",
  "time-work-energy", "relationships-boundaries", "information-rights",
]);
assert.equal(question.input, "single");
assert.equal(question.options.at(-1).value, "not-sure");
assert.equal(parseAssessmentSnapshot(JSON.stringify(v3Snapshot)), null);
assert.deepEqual(deriveResponseContexts(v4Snapshot).core[0].reviewSignals, ["review:..."]);
```

另加一个用两个不同阶段题拼接信号的反例，断言每个 `ResponseContext` 仍只含自身选项信号。

- [ ] **Step 2: 运行题库与快照测试，确认 RED 状态**

Run: `node --test tests/life-stage-question-bank.test.mjs tests/life-value-assessment.test.mjs`

Expected: FAIL，因为 v3 schema、李克特核心题和新导出接口尚未替换。

- [ ] **Step 3: 实现统一情境题 schema 与 v4 快照接口**

在 `lib/life-stage-question-bank.mjs` 中：

- 定义六个 `LIFE_AREAS`，以及将两个区域组合为一个章节的三个 `ASSESSMENT_CHAPTERS`；
- 将 18 道核心题改为每区三道 `input: "single"` 的短处境题；每个选项带 `contextSignals`、可选 `reviewSignals` / `strengthSignals`，并以 `{ value: "not-sure", label: "我没遇过 / 目前不确定", ... }` 收尾；
- 将阶段题改用同一选项字段和同一不确定出口，保留已存在的稳定题 ID、阶段 ID、数量和顺序；
- 使核心题和阶段题都由一个共享构造器生成，防止字段逐渐漂移。

在 `lib/life-value-assessment.mjs` 中：

- 设定 `ASSESSMENT_STORAGE_KEY = "life-value-test-v4"` 与 `version: 4`；
- 按每道题的允许 option value 校验答案，不再接受任何李克特数字；
- 移除 `LIKERT_OPTIONS`、`scoreCoreAnswers`、`PROFILE_DETAILS` 及其人格维度；
- 实现 `deriveResponseContexts(snapshot)`，遇到 `not-sure` 时设置 `uncertain: true` 且三个信号数组为空；
- 保留现有阶段选择校验、可选紧急协助路由与严格快照字段白名单。

- [ ] **Step 4: 运行题库与快照测试，确认 GREEN 状态**

Run: `node --test tests/life-stage-question-bank.test.mjs tests/life-value-assessment.test.mjs`

Expected: PASS，且只接受 v4、22/26/30 道情境题和逐题隔离的上下文。

- [ ] **Step 5: 提交题库和快照迁移**

```bash
git add lib/life-stage-question-bank.mjs lib/life-value-assessment.mjs tests/life-stage-question-bank.test.mjs tests/life-value-assessment.test.mjs
git commit -m "feat: add scenario assessment question model"
```

### Task 2: 来源可追溯的复盘行动选择器

**Files:**
- Modify: `lib/guide-action-catalog.mjs`
- Modify: `tests/guide-action-catalog.test.mjs`

**Interfaces:**
- Consumes: Task 1 的 `parseAssessmentSnapshot`, `deriveResponseContexts`, `LIFE_AREAS` 与稳定题 ID。
- Produces: `ACTION_CATALOG`, `selectPriorityReviews(snapshot, catalog = ACTION_CATALOG)`, `actionPresentationFor(review)`。
- `selectPriorityReviews` 返回 `{ map: AreaMapEntry[], cards: PriorityReview[] }`；`cards` 至多三项，每项含 `priority`（`downside-risk` / `resource-protection` / `information-support`）、`action`、`matchedResponseIds` 和 `areaIds`。`map` 对每个区域提供 `state: "review" | "strength" | "insufficient" | "mixed"`，但没有数字分数。

- [ ] **Step 1: 写出失败的行动目录与选择器测试**

为每个行动目录行断言固定版本来源、完整章节/条目、成本、证据、适用条件、限制和状态。新增以下关键断言：

```js
const result = selectPriorityReviews(snapshotWithUncertainMoneyAnswer);
assert.equal(result.map.find(({ areaId }) => areaId === "money-protection").state, "insufficient");
assert.ok(result.cards.length <= 3);
assert.equal(new Set(result.cards.map(({ priority }) => priority)).size, result.cards.length);
assert.equal(result.cards.every(({ matchedResponseIds }) => matchedResponseIds.length >= 1), true);
```

加入反例：两个不同 question ID 的信号不能共同满足同一行动；`todo`、`manual-review` 不可推荐；`controversial` 保留 caveat；同一行动经多阶段匹配只返回一次。

- [ ] **Step 2: 运行行动目录测试，确认 RED 状态**

Run: `node --test tests/guide-action-catalog.test.mjs`

Expected: FAIL，因为现有选择器输出 `lenses/stages` 并依赖 v3 与人格风格。

- [ ] **Step 3: 审核并扩展完整指南条目，再实现行动目录与选择器**

先逐条读取固定 `GUIDE_SOURCE_REVISION` 的完整指南正文，或在本地没有正文时浅克隆该 revision；每个新增/改写目录行必须记录准确章节、标题、稳定 URL、成本、收益口径、证据等级、适用条件和 caveat。不得从标题或二手概述推断数值。

然后在 `lib/guide-action-catalog.mjs` 中：

- 为六个通用区域分别至少准备一个可推荐的、来源核实完成的行动方向，并保留已核实的阶段行动；不能核实的内容明确标为 `todo` 或 `manual-review`；
- 将行动触发定义为同一 `ResponseContext` 的 question ID + 所需复盘信号，不能汇总多个题或多个阶段的信号；
- 先计算六个 `map` 状态：全部 `not-sure` 为 `insufficient`，仅优势信号为 `strength`，仅复盘信号为 `review`，两者都有为 `mixed`；
- 分别在三种 `priority` 中选出零或一张行动卡；只在同一 priority 内按指南性价比档位、证据等级和触发贴合度排序，不跨 priority 制造总排名；
- 对无合格行动或信息不足的区域返回明确状态，不用无关条目填充；
- 将 `actionPresentationFor` 改为只基于复盘卡的事实信息生成解释，不再接收人格风格。

- [ ] **Step 4: 运行行动目录测试，确认 GREEN 状态**

Run: `node --test tests/guide-action-catalog.test.mjs`

Expected: PASS，且目录中没有无来源、跨题拼接、待核实或人工审核的自动推荐。

- [ ] **Step 5: 提交行动目录和选择器**

```bash
git add lib/guide-action-catalog.mjs tests/guide-action-catalog.test.mjs
git commit -m "feat: select source-backed priority reviews"
```

### Task 3: 测试流程与地图式结果界面

**Files:**
- Modify: `app/test/page.tsx`
- Modify: `app/result/page.tsx`
- Create: `components/choice-map.tsx`
- Modify: `components/assessment-results.tsx`
- Modify: `tests/assessment-flow.test.mjs`
- Modify: `tests/report-presentation.test.mjs`

**Interfaces:**
- Consumes: Task 1 的 `ASSESSMENT_CHAPTERS`, `ASSESSMENT_STORAGE_KEY`, v4 快照 API；Task 2 的 `selectPriorityReviews` 和 `actionPresentationFor`。
- Produces: 可在移动端使用的阶段选择、情境题分页、选择地图、免费结果与已授权报告的一致复盘卡展示。

- [ ] **Step 1: 写出失败的流程与展示测试**

在 `tests/assessment-flow.test.mjs` 断言每个题页展示当前章节和生活区域，而非“决策风格”；第一道核心题使用情境提示；选择 `我没遇过 / 目前不确定` 可以继续并产生 v4 快照。

在 `tests/report-presentation.test.mjs` 断言：

```js
assert.match(html, /本次生活选择地图/);
assert.match(html, /优先复盘/);
assert.doesNotMatch(html, /稳健验证型|机会推进型|总分|第.?名|决策风格/);
assert.match(render({ rawSnapshot: legacyV3 }), /重新完成测试/);
assert.equal((html.match(/data-priority-review=/g) ?? []).length <= 3, true);
```

另断言缺少有效回答的区域显示“信息不足”，有争议行动保留真实 caveat，且免费结果与授权报告指向同一行动 identity。

- [ ] **Step 2: 运行流程与展示测试，确认 RED 状态**

Run: `node --test tests/assessment-flow.test.mjs tests/report-presentation.test.mjs`

Expected: FAIL，因为页面仍显示李克特选项、人格倾向、三镜头和阶段行动分栏。

- [ ] **Step 3: 实现章节式答题和选择地图结果**

在 `app/test/page.tsx` 中：

- 保留 1--3 阶段选择与可选优先阶段；将开始页文案改为“18 道通用生活选择 + 每阶段 4 道处境题”；
- 从 `ASSESSMENT_CHAPTERS` 派生当前章节/区域名称，在题目页显示“按你通常最可能先做的第一步选择”和当前进度；不显示对错、分数或人格反馈；
- 继续保留后退、完成后一次性写入 `ASSESSMENT_STORAGE_KEY`、紧急协助的独立入口与无障碍焦点行为。

新建 `components/choice-map.tsx`，以六个区域渲染 `review`、`strength`、`mixed`、`insufficient` 的纯文字/图例状态，并为每个区域提供 `/test` 的“重新做这一区域复盘”入口文案；不引入积分、排行榜、连续签到或分数。

在 `components/assessment-results.tsx` 中：

- 删除 `scoreCoreAnswers`、人格标题、辅助标签、三个 lens 分栏和按阶段行动列表；
- 顶部明确结果是本次处境快照；渲染 `ChoiceMap`；
- 以固定顺序渲染 Task 2 的至多三张 `data-priority-review` 行动卡，展示观察、可能遗漏的成本/收益、本周第一步、来源、成本、证据、适用条件、限制与争议；
- 在没有行动卡或区域信息不足时使用诚实的“暂不下结论/重新复盘”状态；
- 免费与已授权报告继续共享本地 v4 结果，但详细报告仅增加现有权限内的核对清单，不改变服务端授权。

在 `app/result/page.tsx` 中继续只读取导出的 v4 key；v3 或其他无效内容走现有重新测评空状态。

- [ ] **Step 4: 运行流程与展示测试，确认 GREEN 状态**

Run: `node --test tests/assessment-flow.test.mjs tests/report-presentation.test.mjs`

Expected: PASS，页面无人格类型/分数，且情境作答、地图和最多三张来源行动卡按 v4 快照工作。

- [ ] **Step 5: 提交界面与结果呈现**

```bash
git add app/test/page.tsx app/result/page.tsx components/choice-map.tsx components/assessment-results.tsx tests/assessment-flow.test.mjs tests/report-presentation.test.mjs
git commit -m "feat: present scenario choice map results"
```

### Task 4: 全量回归、移动端验收与发布准备

**Files:**
- Modify only when an observed failure requires it: affected production/test files from Tasks 1--3
- Verify: `tests/*.test.mjs`, production build, 390px viewport manual smoke

**Interfaces:**
- Consumes: Tasks 1--3 的已提交 v4 题库、选择器和界面。
- Produces: 可部署的构建产物与已记录的验收证据；不修改支付、账户、兑换或邮件供应商。

- [ ] **Step 1: 先运行完整回归测试并记录失败项**

Run: `node --test tests/*.test.mjs`

Expected: PASS；若失败，只修复与 v4 语义冲突的测试或生产实现，不能通过删除来源、权限或紧急协助断言来绕过。

- [ ] **Step 2: 运行静态检查和生产构建**

Run: `npm run lint && npm run build`

Expected: 两项均以 exit code 0 结束，且没有 TypeScript 隐式类型或未使用的旧人格接口。

- [ ] **Step 3: 在 390px 宽度执行手工冒烟测试**

Run: `npm run dev -- --port 5173`

检查：选择一个和三个阶段均分别显示 22 与 30 题；章节/区域提示可见；选择不确定可完成；旧 v3 localStorage 值显示重新测评；有效 v4 结果至多显示三张卡；免费与已登录/授权报告均不显示人格或总分；紧急协助入口不写入答案。

- [ ] **Step 4: 提交仅由回归修复产生的改动**

```bash
git add <verified-fixed-files>
git commit -m "fix: verify scenario assessment release"
```

若没有修复，不创建空提交。

- [ ] **Step 5: 交付前复核 Git 状态与部署条件**

Run: `git diff --check && git status --short && git log --oneline -4`

Expected: 无空白错误；工作区无未说明的改动；说明本地通过的测试、尚未执行或已执行的 Cloudflare 部署动作，以及旧本地快照需要重测的发布说明。

## Self-Review

- **Spec coverage:** Task 1 覆盖题量、六区域、阶段扩展、单场景与不确定出口；Task 2 覆盖来源、成本/证据、信息不足、争议与三类行动；Task 3 覆盖无人格/总分、地图、轻量回访、免费/报告展示；Task 4 覆盖移动端和发布验证。账户、兑换和支付被明确排除。
- **Step scan:** 每个任务以失败测试、RED、实现、GREEN、提交结束；接口在相邻任务间只通过已命名导出传递。
- **Type consistency:** `ResponseContext` 由 Task 1 产生，Task 2 消费；`PriorityReview` 和 `AreaMapEntry` 由 Task 2 产生，Task 3 消费；没有继续引用已删除的 `scoreCoreAnswers` 或 `lenses`。
- **Review Focus:** 五条风险均分别绑定到 Task 1--3 的明确测试步骤；Task 4 进行整套回归，避免局部测试掩盖路由、权限或紧急协助回归。
- **Proportion:** 计划只确定题库/快照/选择器/界面的边界、导出和验收，不预先编写题目正文、指南条目正文或组件实现。
