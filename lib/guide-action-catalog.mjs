import { parseAssessmentSnapshot } from "./life-value-assessment.mjs";
import { LIFE_STAGES, STAGE_QUESTION_BANK } from "./life-stage-question-bank.mjs";

// Pinned to the public Guide revision used to verify every curated row and its ratio rule.
export const GUIDE_SOURCE_REVISION = "20718eeab32cb8506971fb71b03e66a91077be07";

const SOURCE = `https://github.com/eternity4719/HowToLiveBetter/blob/${GUIDE_SOURCE_REVISION}/book`;
const CHAPTER_1 = `${SOURCE}/01-%E4%B8%8D%E8%A6%81%E6%97%A9%E6%AD%BB.md`;
const CHAPTER_4 = `${SOURCE}/04-%E4%B8%8D%E8%A6%81%E6%B5%AA%E8%B4%B9%E6%97%B6%E9%97%B4.md`;
const CHAPTER_15 = `${SOURCE}/15-%E7%A7%9F%E6%88%BF%E4%B8%8E%E4%B9%B0%E6%88%BF.md`;

// Costs retain the Guide's three machine-readable labels: money 0/少/多,
// time 少/中/多, willpower 否/些/是. Ratio tiers are fixed values from the
// pinned Guide's index.html rule, applied to each row's source labels.
export const ACTION_CATALOG = [
  {
    id: "seatbelt",
    chapter: "第1节第1条",
    title: "系安全带，前排后排都系",
    sourceUrl: `${CHAPTER_1}#L20-L27`,
    lens: "safety-health",
    benefit: "降低乘车时的致命伤风险",
    costs: { money: "0", time: "少", willpower: "否" },
    ratioTier: "极高",
    evidenceGrade: "A",
    firstStep: "下次乘车一上车就系好安全带，前后排都系",
    stageIds: ["partner-parenting"],
    signalRequirements: ["transport:driving"],
    status: "ready",
    caveats: ["来源中的降幅是基于事故资料的估计；后排也要系。"],
  },
  {
    id: "riding-helmet",
    chapter: "第1节第2条",
    title: "骑摩托车、电动自行车戴头盔并扣好",
    sourceUrl: `${CHAPTER_1}#L28-L35`,
    lens: "safety-health",
    benefit: "降低骑摩托车时死亡和头部损伤风险",
    costs: { money: "少", time: "少", willpower: "否" },
    ratioTier: "高",
    evidenceGrade: "A",
    firstStep: "下次骑车前戴好头盔并扣紧扣带",
    stageIds: LIFE_STAGES.map(({ id }) => id),
    signalRequirements: [],
    status: "manual-review",
    caveats: ["问卷未确认摩托车或电动自行车骑行场景，因此只供人工核对。指南引用的研究对象是摩托车骑行者；对电动自行车的结论是类推。"],
  },
  {
    id: "child-car-seat",
    chapter: "第1节第10条",
    title: "给 4 岁以下儿童用安全座椅，不要抱在怀里",
    sourceUrl: `${CHAPTER_1}#L94-L101`,
    lens: "safety-health",
    benefit: "降低 4 岁以下儿童乘车时受致命伤的风险",
    costs: { money: "多", time: "少", willpower: "否" },
    ratioTier: "高",
    evidenceGrade: "A",
    firstStep: "先确认孩子是否未满 4 岁，再按说明书检查安全座椅的安装",
    stageIds: ["partner-parenting"],
    signalRequirements: ["care:child", "transport:driving"],
    status: "manual-review",
    caveats: ["只适用于 4 岁以下儿童；问卷未询问孩子年龄。1 岁以下应反向安装。"],
  },
  {
    id: "elder-fall-prevention",
    chapter: "第1节第13条",
    title: "60 岁以上练平衡和腿部力量，改造家里的浴室和楼梯",
    sourceUrl: `${CHAPTER_1}#L119-L127`,
    lens: "safety-health",
    benefit: "减少住在社区的老年人跌倒",
    costs: { money: "少", time: "多", willpower: "是" },
    ratioTier: "一般",
    evidenceGrade: "A",
    firstStep: "先确认被照护者是否满 60 岁、住在社区，并评估家中浴室和楼梯",
    stageIds: ["elder-family-care"],
    signalRequirements: ["care:elder"],
    status: "manual-review",
    caveats: ["问卷不确认被照护者年龄与居住环境，因此这条只供人工核对。研究直接测量的是跌倒，并非死亡。"],
  },
  {
    id: "implementation-intention",
    chapter: "第4节第1条",
    title: "把「打算做」写成「几点、在哪、遇到什么就做什么」",
    sourceUrl: `${CHAPTER_4}#L6-L13`,
    lens: "time-energy",
    benefit: "提高自己真想完成的目标的达成率",
    costs: { money: "0", time: "少", willpower: "否" },
    ratioTier: "极高",
    evidenceGrade: "A",
    firstStep: "把一件真想做的事写成一句「如果……就……」",
    stageIds: LIFE_STAGES.map(({ id }) => id),
    signalRequirements: ["approach:plan"],
    status: "ready",
    caveats: ["只对自己真想做的事适用；研究多涉及学生与健康习惯，工作场景不一定同样有效。"],
  },
  {
    id: "reduce-meetings",
    chapter: "第4节第6条",
    title: "砍会议数量，能用文字异步解决的不开会",
    sourceUrl: `${CHAPTER_4}#L47-L54`,
    lens: "time-energy",
    benefit: "省下被取消的会议本身占用的时间",
    costs: { money: "0", time: "少", willpower: "些" },
    ratioTier: "高",
    evidenceGrade: "B",
    firstStep: "检查下次会议能否用一段文字说明并取得同事或上级配合",
    stageIds: ["stable-work"],
    signalRequirements: ["focus:work-boundaries"],
    status: "controversial",
    caveats: ["指南标记为争议：会议多少与幸福感的关系因岗位而异；没有研究直接比较文字异步沟通和开会。"],
  },
  {
    id: "renter-payment",
    chapter: "第15节第3条",
    title: "中介不得代收代付租金和押金，钱直接给房东",
    sourceUrl: `${CHAPTER_15}#L22-L29`,
    lens: "money-rights",
    benefit: "减少房租和押金经中介转手带来的风险",
    costs: { money: "0", time: "少", willpower: "些" },
    ratioTier: "高",
    evidenceGrade: "A",
    firstStep: "付款前核对收款人与产权证上的名字",
    stageIds: ["studying-graduating"],
    signalRequirements: ["housing:renting"],
    status: "ready",
    caveats: ["收款人不是产权人时，问清原因并留存书面授权。"],
  },
  {
    id: "renter-deposit",
    chapter: "第15节第1条",
    title: "押金的数额、退还时间和扣减情形，必须写进合同",
    sourceUrl: `${CHAPTER_15}#L6-L13`,
    lens: "money-rights",
    benefit: "减少租房押金被无正当理由扣减的风险",
    costs: { money: "0", time: "少", willpower: "些" },
    ratioTier: "一般",
    evidenceGrade: "A",
    firstStep: "签约前核对合同是否写清押金数额、返还时间和扣减情形",
    stageIds: ["studying-graduating"],
    signalRequirements: ["housing:renting"],
    status: "ready",
    caveats: ["退租时与房东一起留存房屋状况及水、电、燃气表读数。"],
  },
  {
    id: "smoke-alarm",
    chapter: "第1节第3条",
    title: "装烟雾报警器；冬天在室内烧煤、用燃气取暖的再装一氧化碳报警器",
    sourceUrl: `${CHAPTER_1}#L36-L43`,
    lens: "safety-health",
    benefit: "正常工作的烟雾报警器与较低的住宅火灾死亡风险有关",
    costs: { money: "少", time: "少", willpower: "否" },
    ratioTier: "高",
    evidenceGrade: "B",
    firstStep: "检查家中烟雾报警器是否正常工作；冬天室内烧煤或燃气取暖的，再核对一氧化碳报警器",
    stageIds: ["living-alone"],
    signalRequirements: ["focus:home-safety"],
    status: "ready",
    caveats: ["烟雾报警器证据来自单项回顾性研究，非随机试验。", "一氧化碳报警器没有直接降低死亡率的研究；只在室内烧煤或燃气取暖的条件下考虑。装好以后每年换一次电池。"],
  },
  {
    id: "child-window-guards",
    chapter: "第1节第11条",
    title: "家里有小孩就给窗户和阳台装限位器，纱窗不算防护",
    sourceUrl: `${CHAPTER_1}#L102-L110`,
    lens: "safety-health",
    benefit: "窗户护栏与上门讲解项目减少了高风险城区上报的儿童坠落",
    costs: { money: "少", time: "少", willpower: "否" },
    ratioTier: "高",
    evidenceGrade: "B",
    firstStep: "检查儿童活动的窗边和阳台是否有可靠限位器，并移开床、沙发和箱子等攀爬物",
    stageIds: ["partner-parenting"],
    signalRequirements: ["focus:home-child-safety", "care:child"],
    status: "ready",
    caveats: ["项目包含护栏和上门讲解，不能把效果全部归于限位器。", "纱窗不算护栏；多数研究记录的坠落发生在二层或更低。仅适用于有儿童活动的家中。"],
  },
  {
    id: "exit-conditions",
    chapter: "第4节第2条",
    title: "开工前写下退出条件",
    sourceUrl: `${CHAPTER_4}#L14-L21`,
    lens: "time-energy",
    benefit: "帮助从注定做不成的行动中撤出，减少后续时间投入",
    costs: { money: "0", time: "少", willpower: "些" },
    ratioTier: "高",
    evidenceGrade: "B",
    firstStep: "趁开工前情绪冷静，写下「到某月某日没达到某个指标就停」",
    stageIds: ["career-change"],
    signalRequirements: ["focus:transition-plan", "approach:experiment"],
    status: "ready",
    caveats: ["退出条件应在开工前定，事后会被已投入成本带偏。", "撤出是实施意图综述中的分项结论，没有单独测量能省下多少时间。"],
  },
];

const LENSES = ["safety-health", "time-energy", "money-rights"];
const RATIO_RANK = { "极高": 0, "高": 1, "一般": 2 };
const EVIDENCE_RANK = { A: 0, B: 1, C: 2 };
const STAGE_IDS = new Set(LIFE_STAGES.map(({ id }) => id));
const OPTION_SIGNALS = new Set(Object.values(STAGE_QUESTION_BANK).flat()
  .flatMap(({ options }) => options.flatMap(({ signals }) => signals)));

function withinLensOrder(a, b) {
  return RATIO_RANK[a.ratioTier] - RATIO_RANK[b.ratioTier]
    || EVIDENCE_RANK[a.evidenceGrade] - EVIDENCE_RANK[b.evidenceGrade]
    || b.matchedSignals.length - a.matchedSignals.length;
}

export function selectRecommendations(snapshot, catalog = ACTION_CATALOG) {
  const lenses = Object.fromEntries(LENSES.map((lens) => [lens, null]));
  let validated;
  try {
    validated = parseAssessmentSnapshot(JSON.stringify(snapshot));
  } catch {
    return { lenses, stages: {} };
  }
  if (!validated) return { lenses, stages: {} };
  const stages = Object.fromEntries(validated.lifeStages.map((id) => [id, []]));
  // Keep each option attached to its question and stage: pooled signals can
  // falsely disclose a withheld stage or combine unrelated question answers.
  const disclosedContexts = Object.fromEntries(validated.lifeStages.map((stageId) => [stageId,
    STAGE_QUESTION_BANK[stageId].map((question) => question.options
      .find(({ value }) => value === validated.answers[question.id]).signals)
      .filter((signals) => signals.length > 0),
  ]));
  const eligible = (Array.isArray(catalog) ? catalog : []).flatMap((action) => {
    if (!action || !action.id || !LENSES.includes(action.lens)
      || !["ready", "controversial"].includes(action.status)
      || !Object.hasOwn(RATIO_RANK, action.ratioTier) || !Object.hasOwn(EVIDENCE_RANK, action.evidenceGrade)
      || !Array.isArray(action.stageIds) || action.stageIds.length === 0
      || !action.stageIds.every((id) => STAGE_IDS.has(id))
      || !Array.isArray(action.signalRequirements)
      || !action.signalRequirements.every((signal) => OPTION_SIGNALS.has(signal))) return [];
    const matchedStageIds = validated.lifeStages.filter((id) => action.stageIds.includes(id)
      && disclosedContexts[id].some((signals) => action.signalRequirements.every((signal) => signals.includes(signal))));
    if (matchedStageIds.length === 0) return [];
    return [{ ...action, matchedStageIds, matchedSignals: [...new Set(action.signalRequirements)] }];
  });
  const byLens = Object.fromEntries(LENSES.map((lens) => [lens,
    eligible.filter((action) => action.lens === lens).sort(withinLensOrder),
  ]));
  for (const lens of LENSES) lenses[lens] = byLens[lens][0] ?? null;

  // Canonical stage ownership and fixed lens traversal are allocation rules,
  // not comparisons between lenses. Priority affects presentation only.
  const assigned = new Set();
  for (const stageId of validated.lifeStages) {
    const queues = LENSES.map((lens) => byLens[lens].filter((action) => action.matchedStageIds.includes(stageId)));
    while (stages[stageId].length < 2) {
      let added = false;
      for (const queue of queues) {
        while (queue.length && assigned.has(queue[0].id)) queue.shift();
        if (!queue.length) continue;
        const action = queue.shift();
        stages[stageId].push(action);
        assigned.add(action.id);
        added = true;
        if (stages[stageId].length === 2) break;
      }
      if (!added) break;
    }
  }
  return { lenses, stages };
}

// Migration compatibility retains the name, but requires a validated v3 snapshot.
export function selectActions(snapshot, catalog = ACTION_CATALOG) {
  return selectRecommendations(snapshot, catalog).lenses;
}

export function actionPresentationFor(styleResult, recommendation) {
  if (!recommendation) return null;
  const { profile, dimensions = {} } = styleResult ?? {};
  const systemPlanning = dimensions.lowFriction <= 2.5;
  const collaboration = dimensions.collaboration >= 3.5;
  let focus = "first-step";
  let text = `先做这一小步：${recommendation.firstStep}`;
  if (profile?.id === "steady-verify") {
    focus = "evidence-conditions";
    text = `先看证据 ${recommendation.evidenceGrade} 级与适用条件，再做这一步：${recommendation.firstStep}`;
  } else if (systemPlanning) {
    focus = "follow-up";
    text = `把首步放进计划：${recommendation.firstStep}`;
  } else if (collaboration && dimensions.lowFriction < 3.5) {
    focus = "support-channel";
    text = `找一个合适的支持对象一起确认：${recommendation.firstStep}`;
  }
  return {
    action: recommendation,
    emphasis: {
      focus,
      text,
      followUpChecklist: systemPlanning ? [recommendation.firstStep, "核对适用条件与指南备注", "完成后记录结果与下一次检查时间"] : [],
      supportPrompt: collaboration ? "需要时向可信任的人或相关制度渠道求助，一起核对适用条件。" : null,
    },
  };
}
