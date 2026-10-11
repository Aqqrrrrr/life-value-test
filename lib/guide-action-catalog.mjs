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
    sourceUrl: `${CHAPTER_1}#L19-L26`,
    lens: "safety-health",
    benefit: "降低乘车时的致命伤风险",
    costs: { money: "0", time: "少", willpower: "否" },
    ratioTier: "极高",
    evidenceGrade: "A",
    firstStep: "下次乘车一上车就系好安全带，前后排都系",
    requirements: { transport: ["driving"] },
    status: "ready",
    caveats: ["来源中的降幅是基于事故资料的估计；后排也要系。"],
  },
  {
    id: "riding-helmet",
    chapter: "第1节第2条",
    title: "骑摩托车、电动自行车戴头盔并扣好",
    sourceUrl: `${CHAPTER_1}#L27-L34`,
    lens: "safety-health",
    benefit: "降低骑摩托车时死亡和头部损伤风险",
    costs: { money: "少", time: "少", willpower: "否" },
    ratioTier: "高",
    evidenceGrade: "A",
    firstStep: "下次骑车前戴好头盔并扣紧扣带",
    requirements: { transport: ["electric-motorcycle"] },
    status: "ready",
    caveats: ["指南引用的研究对象是摩托车骑行者；对电动自行车的结论是类推。"],
  },
  {
    id: "child-car-seat",
    chapter: "第1节第10条",
    title: "给 4 岁以下儿童用安全座椅，不要抱在怀里",
    sourceUrl: `${CHAPTER_1}#L93-L100`,
    lens: "safety-health",
    benefit: "降低 4 岁以下儿童乘车时受致命伤的风险",
    costs: { money: "多", time: "少", willpower: "否" },
    ratioTier: "高",
    evidenceGrade: "A",
    firstStep: "先确认孩子是否未满 4 岁，再按说明书检查安全座椅的安装",
    requirements: { householdResponsibilities: ["minor-children"], transport: ["driving"] },
    status: "manual-review",
    caveats: ["只适用于 4 岁以下儿童；问卷未询问孩子年龄。1 岁以下应反向安装。"],
  },
  {
    id: "elder-fall-prevention",
    chapter: "第1节第13条",
    title: "60 岁以上练平衡和腿部力量，改造家里的浴室和楼梯",
    sourceUrl: `${CHAPTER_1}#L118-L126`,
    lens: "safety-health",
    benefit: "减少住在社区的老年人跌倒",
    costs: { money: "少", time: "多", willpower: "是" },
    ratioTier: "一般",
    evidenceGrade: "A",
    firstStep: "先确认被照护者是否满 60 岁、住在社区，并评估家中浴室和楼梯",
    requirements: { householdResponsibilities: ["elder-care"] },
    status: "manual-review",
    caveats: ["问卷不确认被照护者年龄与居住环境，因此这条只供人工核对。研究直接测量的是跌倒，并非死亡。"],
  },
  {
    id: "implementation-intention",
    chapter: "第4节第1条",
    title: "把「打算做」写成「几点、在哪、遇到什么就做什么」",
    sourceUrl: `${CHAPTER_4}#L5-L12`,
    lens: "time-energy",
    benefit: "提高自己真想完成的目标的达成率",
    costs: { money: "0", time: "少", willpower: "否" },
    ratioTier: "极高",
    evidenceGrade: "A",
    firstStep: "把一件真想做的事写成一句「如果……就……」",
    requirements: { priorities: ["time-energy"] },
    status: "ready",
    caveats: ["只对自己真想做的事适用；研究多涉及学生与健康习惯，工作场景不一定同样有效。"],
  },
  {
    id: "reduce-meetings",
    chapter: "第4节第6条",
    title: "砍会议数量，能用文字异步解决的不开会",
    sourceUrl: `${CHAPTER_4}#L46-L53`,
    lens: "time-energy",
    benefit: "省下被取消的会议本身占用的时间",
    costs: { money: "0", time: "少", willpower: "些" },
    ratioTier: "高",
    evidenceGrade: "B",
    firstStep: "检查下次会议能否用一段文字说明并取得同事或上级配合",
    requirements: {
      currentStage: ["new-worker", "stable-worker", "increased-family-responsibility"],
      priorities: ["time-energy"],
    },
    status: "controversial",
    caveats: ["指南标记为争议：会议多少与幸福感的关系因岗位而异；没有研究直接比较文字异步沟通和开会。"],
  },
  {
    id: "renter-payment",
    chapter: "第15节第3条",
    title: "中介不得代收代付租金和押金，钱直接给房东",
    sourceUrl: `${CHAPTER_15}#L21-L28`,
    lens: "money-rights",
    benefit: "减少房租和押金经中介转手带来的风险",
    costs: { money: "0", time: "少", willpower: "些" },
    ratioTier: "高",
    evidenceGrade: "A",
    firstStep: "付款前核对收款人与产权证上的名字",
    requirements: { residence: ["renting"], priorities: ["money-rights"] },
    status: "ready",
    caveats: ["收款人不是产权人时，问清原因并留存书面授权。"],
  },
  {
    id: "renter-deposit",
    chapter: "第15节第1条",
    title: "押金的数额、退还时间和扣减情形，必须写进合同",
    sourceUrl: `${CHAPTER_15}#L5-L12`,
    lens: "money-rights",
    benefit: "减少租房押金被无正当理由扣减的风险",
    costs: { money: "0", time: "少", willpower: "些" },
    ratioTier: "一般",
    evidenceGrade: "A",
    firstStep: "签约前核对合同是否写清押金数额、返还时间和扣减情形",
    requirements: { residence: ["renting"], priorities: ["money-rights"] },
    status: "ready",
    caveats: ["退租时与房东一起留存房屋状况及水、电、燃气表读数。"],
  },
];

const LENSES = ["safety-health", "time-energy", "money-rights"];
const RATIO_RANK = { "极高": 0, "高": 1, "一般": 2 };
const EVIDENCE_RANK = { A: 0, B: 1, C: 2 };
const CONTEXT_FIELDS = new Set(["currentStage", "priorities", "householdResponsibilities", "residence", "transport", "scarceResource"]);

function matchedTags(context, requirements) {
  if (!requirements || typeof requirements !== "object" || Array.isArray(requirements)) return null;
  const matched = [];
  for (const [field, accepted] of Object.entries(requirements)) {
    if (!CONTEXT_FIELDS.has(field) || !Array.isArray(accepted) || accepted.length === 0) return null;
    const supplied = context?.[field];
    const values = Array.isArray(supplied) ? supplied : [supplied];
    const hits = values.filter((value) => value !== "prefer-not-to-say" && accepted.includes(value));
    if (hits.length === 0) return null;
    matched.push(...hits.map((value) => ({ field, value })));
  }
  return matched;
}

export function selectActions(context, catalog = ACTION_CATALOG) {
  const selected = Object.fromEntries(LENSES.map((lens) => [lens, null]));
  for (const lens of LENSES) {
    const eligible = catalog
      .filter((action) => action.lens === lens && ["ready", "controversial"].includes(action.status))
      .map((action) => ({ action, matchedContextTags: matchedTags(context, action.requirements) }))
      .filter(({ matchedContextTags }) => matchedContextTags !== null)
      .sort((a, b) =>
        (RATIO_RANK[a.action.ratioTier] ?? Infinity) - (RATIO_RANK[b.action.ratioTier] ?? Infinity)
        || (EVIDENCE_RANK[a.action.evidenceGrade] ?? Infinity) - (EVIDENCE_RANK[b.action.evidenceGrade] ?? Infinity)
        || b.matchedContextTags.length - a.matchedContextTags.length);
    if (eligible.length > 0) {
      const { action, matchedContextTags } = eligible[0];
      selected[lens] = { ...action, matchedContextTags };
    }
  }
  return selected;
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
