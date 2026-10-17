import { parseAssessmentSnapshot, deriveResponseContexts } from "./life-value-assessment.mjs";
import { LIFE_AREAS, CORE_QUESTIONS, STAGE_QUESTION_BANK } from "./life-stage-question-bank.mjs";

export const GUIDE_SOURCE_REVISION = "20718eeab32cb8506971fb71b03e66a91077be07";
const SOURCE = `https://github.com/eternity4719/HowToLiveBetter/blob/${GUIDE_SOURCE_REVISION}/book/`;
// Adapted from 高性价比人生指南, CC BY 4.0. Summaries and assessment triggers
// are our adaptations; source labels/grades retain the pinned author's values.
// Attribution: https://github.com/eternity4719/HowToLiveBetter
// License: https://creativecommons.org/licenses/by/4.0/
const costs = (money, time, willpower) => ({ money, time, willpower });
const trigger = (questionId, reviewSignal, contextSignals = []) => ({ questionId, reviewSignals: [reviewSignal], contextSignals });
function entry(file, chapter, lines, metadata) {
  return { sourceRevision: GUIDE_SOURCE_REVISION, chapter, sourceUrl: `${SOURCE}${encodeURIComponent(file)}#L${lines[0]}-L${lines[1]}`, ...metadata };
}
const roadSources = ["https://crashstats.nhtsa.dot.gov/Api/Public/ViewPublication/813573", "https://www.who.int/news-room/fact-sheets/detail/road-traffic-injuries"];
const intentionSource = ["https://doi.org/10.1016/S0065-2601(06)38002-1"];
const rentalSource = ["https://www.gov.cn/zhengce/zhengceku/202507/content_7032956.htm"];

// A verified candidate is not automatically an indicated problem. Each OR
// trigger requires an explicit review signal in that exact response. Several
// protective questions currently have no such option; their rows stay dormant.
export const ACTION_CATALOG = [
  entry("01-不要早死.md", "第1节第1条", [23, 30], {
    id: "seatbelt", title: "系安全带，前排后排都系", areaIds: ["safety-home"], priority: "downside-risk",
    benefit: "降低乘车事故中受致命伤的风险", benefitLens: "死亡率", benefitMagnitude: "大",
    costs: costs("0", "少", "否"), costDetail: "不花钱，每次上车多花几秒", ratioTier: "极高", evidenceGrade: "A",
    firstStep: "下次乘车一上车就检查并系好安全带，前后排都系", applicability: ["乘车场景"],
    triggers: [trigger("core-safety-1", "review:seat-belt", ["transport:driving"]), trigger("partner-parenting-home-child-safety", "review:seat-belt", ["transport:driving"])],
    originalSources: [...roadSources, "https://ghoapi.azureedge.net/api/RS_196?$filter=SpatialDim%20eq%20%27CHN%27"], status: "ready",
    caveats: ["致命伤降幅是事故数据库估计，不是随机试验；后排也要系。中国死亡数的 WHO 推算口径不同于交管登记，不能混用。"],
  }),
  entry("01-不要早死.md", "第1节第2条", [32, 39], {
    id: "riding-helmet", title: "骑摩托车、电动自行车戴头盔并扣好", areaIds: ["safety-home"], priority: "downside-risk",
    benefit: "降低摩托车骑行事故中的死亡和头部损伤风险", benefitLens: "死亡率", benefitMagnitude: "大",
    costs: costs("少", "少", "否"), costDetail: "买一顶头盔，每次花几秒戴好", ratioTier: "高", evidenceGrade: "A",
    firstStep: "先确认是否有摩托车或电动自行车骑行，再检查头盔扣带", applicability: ["仅适用于摩托车或电动自行车骑行"],
    triggers: [trigger("core-safety-1", "review:riding-helmet", ["transport:riding"])], originalSources: ["https://doi.org/10.1002/14651858.CD004333.pub3"], status: "manual-review",
    caveats: ["问卷未确认骑行场景，需人工核对。证据来自摩托车骑行者，对电动自行车是类推；必须扣好扣带。"],
  }),
  entry("01-不要早死.md", "第1节第10条", [104, 111], {
    id: "child-car-seat", title: "给 4 岁以下儿童用安全座椅，不要抱在怀里", areaIds: ["safety-home"], priority: "downside-risk",
    benefit: "降低幼儿乘车时受致命伤的风险", benefitLens: "死亡率", benefitMagnitude: "大",
    costs: costs("多", "少", "否"), costDetail: "购买安全座椅，每次上车多花时间固定", ratioTier: "高", evidenceGrade: "A",
    firstStep: "先确认儿童年龄，再按说明书检查安全座椅安装", applicability: ["仅适用于有 4 岁以下儿童乘车"],
    triggers: [trigger("partner-parenting-home-child-safety", "review:child-travel", ["care:child", "transport:driving"])], originalSources: roadSources, status: "manual-review",
    caveats: ["问卷未问儿童年龄。1 岁以下应反向安装；降幅是美国事故数据估计，安装错误不能视为已保护。"],
  }),
  entry("01-不要早死.md", "第1节第13条", [131, 138], {
    id: "elder-fall-prevention", title: "60 岁以上练平衡和腿部力量，改造家里的浴室和楼梯", areaIds: ["health-sleep-care"], priority: "downside-risk",
    benefit: "减少居家老年人跌倒次数和发生跌倒的人数", benefitLens: "死亡率", benefitMagnitude: "大",
    costs: costs("少", "多", "是"), costDetail: "持续平衡训练，并购买防滑垫、扶手或夜灯", ratioTier: "一般", evidenceGrade: "A",
    firstStep: "先核对年龄与居住环境，再评估浴室和楼梯", applicability: ["仅适用于社区居住、60 岁以上老人"],
    triggers: [trigger("elder-family-care-medical-emergency-info", "review:fall-prevention", ["care:elder"])],
    originalSources: ["https://doi.org/10.1002/14651858.CD012424.pub2", "https://doi.org/10.1002/14651858.CD007146.pub3", "https://doi.org/10.46234/ccdcw2021.013"], status: "manual-review",
    caveats: ["问卷未核对年龄和社区居住条件。指南将其列入死亡率口径，但试验直接测量的是跌倒，并非死亡。"],
  }),
  entry("01-不要早死.md", "第1节第3条", [41, 48], {
    id: "smoke-alarm", title: "装烟雾报警器；冬天在室内烧煤、用燃气取暖的再装一氧化碳报警器", areaIds: ["safety-home"], priority: "downside-risk",
    benefit: "工作的烟雾报警器与较低住宅火灾死亡风险相关", benefitLens: "死亡率", benefitMagnitude: "大",
    costs: costs("少", "少", "否"), costDetail: "购买报警器，安装后每年换电池", ratioTier: "高", evidenceGrade: "B",
    firstStep: "核对家中烟雾报警器是否存在、能否正常工作", applicability: ["正在检查居家报警装置"],
    triggers: [trigger("living-alone-home-safety", "review:smoke-alarm", ["focus:home-safety"])],
    originalSources: ["https://doi.org/10.1001/jama.279.20.1633", "https://www.usfa.fema.gov/downloads/pdf/statistics/v22i2.pdf", "https://doi.org/10.46234/ccdcw2020.008"], status: "ready",
    caveats: ["烟雾报警器证据是单项回顾比较，并非随机试验。仅在室内烧煤或燃气取暖时再核对一氧化碳报警器；其降低死亡率没有直接研究。"],
  }),
  entry("01-不要早死.md", "第1节第11条", [113, 120], {
    id: "child-window-guards", title: "家里有小孩就给窗户和阳台装限位器，纱窗不算防护", areaIds: ["safety-home"], priority: "downside-risk",
    benefit: "护栏加上门讲解项目减少高风险城区上报的儿童坠落", benefitLens: "死亡率", benefitMagnitude: "大",
    costs: costs("少", "少", "否"), costDetail: "购买限位器或儿童安全锁，花时间安装", ratioTier: "高", evidenceGrade: "B",
    firstStep: "检查儿童活动的窗边和阳台限位器，移开能攀爬的家具和箱子", applicability: ["家中有儿童活动"],
    triggers: [trigger("partner-parenting-home-child-safety", "review:child-window", ["care:child"])],
    originalSources: ["https://doi.org/10.2105/AJPH.67.12.1143", "https://doi.org/10.1016/j.acap.2020.07.008"], status: "ready",
    caveats: ["不能把护栏与上门讲解的共同效果全归于限位器。纱窗不是护栏，多数记录的坠落发生在二层或更低。"],
  }),
  entry("04-不要浪费时间.md", "第4节第1条", [7, 14], {
    id: "implementation-intention", title: "把「打算做」写成「几点、在哪、遇到什么就做什么」", areaIds: ["time-work-energy"], priority: "resource-protection",
    benefit: "提高自己真想完成的目标的达成率", benefitLens: "时间", benefitMagnitude: "大",
    costs: costs("0", "少", "否"), costDetail: "每件事花一两分钟写一句如果……就……", ratioTier: "极高", evidenceGrade: "A",
    firstStep: "把一件真想做的事写成一句「如果……就……」", applicability: ["正在安排一项任务的启动或推进"],
    triggers: [trigger("core-time-2", "review:task-start", ["resource:time"]), trigger("career-change-transition-plan", "review:transition-plan", ["approach:plan"])], originalSources: intentionSource, status: "ready",
    caveats: ["只对自己真想要的目标适用。研究多涉及学生和健康习惯，工作场景未必同样有效。"],
  }),
  entry("04-不要浪费时间.md", "第4节第2条", [16, 23], {
    id: "exit-conditions", title: "开工前写下退出条件", areaIds: ["time-work-energy"], priority: "resource-protection",
    benefit: "从注定做不成的行动中撤出，减少后续时间投入", benefitLens: "时间", benefitMagnitude: "大",
    costs: costs("0", "少", "些"), costDetail: "开工时花几分钟，之后要按约定停手", ratioTier: "高", evidenceGrade: "B",
    firstStep: "开工前写下「到某日没达到某个指标就停」", applicability: ["正在安排限定时间的小尝试"],
    triggers: [trigger("career-change-transition-plan", "review:exit-conditions", ["focus:transition-plan", "approach:experiment"])], originalSources: intentionSource, status: "ready",
    caveats: ["退出条件应趁开工前情绪冷静时制定；事后容易被沉没成本带偏。撤出只是综述的分项结论，没有单独测量节省多少时间。"],
  }),
  entry("04-不要浪费时间.md", "第4节第6条", [52, 59], {
    id: "reduce-meetings", title: "砍会议数量，能用文字异步解决的不开会", areaIds: ["relationships-boundaries"], priority: "resource-protection",
    benefit: "省下被取消会议本身占用的时间", benefitLens: "时间", benefitMagnitude: "大",
    costs: costs("0", "少", "些"), costDetail: "需要同事和上级配合，并花精力把文字写清", ratioTier: "高", evidenceGrade: "B",
    firstStep: "与同事确认下一次会议是否能改成清楚的文字说明", applicability: ["工作请求涉及可调整的会议"],
    triggers: [trigger("stable-work-work-boundaries", "review:meeting-load", ["work:meetings"])],
    originalSources: ["https://doi.org/10.1037/0021-9010.91.1.83", "https://doi.org/10.1037/1089-2699.9.1.58"], status: "controversial",
    caveats: ["争议：会议与幸福感的关系随岗位依赖和会议质量变化；高度依赖他人的岗位会议多未必坏。没有研究直接比较文字异步和开会。"],
  }),
  entry("15-租房与买房.md", "第15节第3条", [25, 32], {
    id: "renter-payment", title: "中介不得代收代付租金和押金，钱直接给房东", areaIds: ["safety-home"], priority: "downside-risk",
    benefit: "减少租金和押金经中介转手的风险", benefitLens: "金钱", benefitMagnitude: "大",
    costs: costs("0", "少", "些"), costDetail: "付款前核对收款人，并坚持规范付款", ratioTier: "高", evidenceGrade: "A",
    firstStep: "付款前核对收款人与产权证上的名字", applicability: ["正在安排租房付款"],
    triggers: [trigger("studying-graduating-rent-move", "review:rental-payment", ["housing:renting"])], originalSources: rentalSource, status: "ready",
    caveats: ["不是产权人收款时要问清原因并留存书面授权；中介只能收居间服务费。依据 2025 年施行条例，签约时仍需核对现行规则。"],
  }),
  entry("15-租房与买房.md", "第15节第1条", [7, 14], {
    id: "renter-deposit", title: "押金的数额、退还时间和扣减情形，必须写进合同", areaIds: ["safety-home"], priority: "information-support",
    benefit: "减少租房押金被无正当理由扣减的风险", benefitLens: "金钱", benefitMagnitude: "中",
    costs: costs("0", "少", "些"), costDetail: "签约前多花时间，当面提出合同要求", ratioTier: "一般", evidenceGrade: "A",
    firstStep: "签约前核对押金数额、返还时间和扣减情形是否写全", applicability: ["正在核对租房约定"],
    triggers: [trigger("studying-graduating-rent-move", "review:rental-terms", ["housing:renting"])], originalSources: rentalSource, status: "ready",
    caveats: ["退租时共同拍照并保存表读数。条例提供投诉或诉讼依据，不能保证收回款项；依据 2025 年条例，需核对现行规则。"],
  }),
  entry("03-不要浪费精力.md", "第3节第3条", [37, 44], {
    id: "sleep-recovery", title: "每晚睡够 7 到 8 小时，别把 6 小时当作够用", areaIds: ["health-sleep-care"], priority: "resource-protection",
    benefit: "减少缺觉累积造成的注意力和认知表现损失", benefitLens: "时间", benefitMagnitude: "大",
    costs: costs("0", "多", "些"), costDetail: "每天多留睡眠时间，提早上床需要坚持", ratioTier: "一般", evidenceGrade: "A",
    firstStep: "查看今晚必须早起的时间，为睡眠留出时段", applicability: ["正在安排睡眠与恢复时间"],
    triggers: [trigger("core-health-1", "review:sleep-recovery", ["health:sleep"]), trigger("stable-work-energy-recovery", "review:sleep-recovery", ["resource:energy"]), trigger("elder-family-care-caregiver-recovery", "review:sleep-recovery", ["resource:energy"])],
    originalSources: ["https://doi.org/10.1093/sleep/26.2.117", "https://doi.org/10.1037/a0018883"], status: "ready",
    caveats: ["慢性少睡的随机试验仅一项、对象为健康成人；汇总分析研究的是短期整夜不睡。自觉不困不是睡够的证据，本条不诊断睡眠疾病，也不直接推算寿命收益。"],
  }),
  entry("03-不要浪费精力.md", "第3节第16条", [154, 161], {
    id: "relationship-boundaries", title: "减少让你消耗的人际关系，学会拒绝不想接的请求", areaIds: ["relationships-boundaries"], priority: "information-support",
    benefit: "为消耗性来往设边界，可能改善主观幸福感", benefitLens: "时间", benefitMagnitude: "中",
    costs: costs("0", "少", "是"), costDetail: "拒绝需要毅力，短期可能有社交摩擦或失去关系", ratioTier: "一般", evidenceGrade: "C",
    firstStep: "回看一项不想接的请求，先写清自己可投入的时段与范围", applicability: ["正在处理他人请求与自己的时间限制"],
    triggers: [trigger("core-relationships-1", "review:request-boundary", ["relationship:boundaries"]), trigger("stable-work-work-boundaries", "review:request-boundary", ["focus:work-boundaries"])],
    originalSources: ["https://doi.org/10.1037/0022-3514.46.5.1097"], status: "ready",
    caveats: ["证据是特殊人群（60 至 89 岁丧偶女性）的一次性问卷，只能显示关联。测量的是幸福感，不是精力；时间收益是作者推断。没有客观标准判断何为消耗性关系，不能据此给某个人贴标签。"],
  }),
  entry("05-不要浪费钱.md", "第5节第7条", [75, 82], {
    id: "borrowing-apr", title: "不用信用卡最低还款，不为消费开分期或消费贷；非借不可，先把利息换成年化利率再比", areaIds: ["money-protection"], priority: "resource-protection",
    benefit: "看清分期和借款的实际总成本，减少利息与相关费用侵蚀预算", benefitLens: "金钱", benefitMagnitude: "中",
    costs: costs("0", "少", "些"), costDetail: "花几分钟核对年化利率，留出还款现金；放弃用分期摊薄大额开销需要克制", ratioTier: "一般", evidenceGrade: "C",
    firstStep: "本周签约或付款前，索取包含利息与相关费用的年化利率和还款计划，再比较总支出", applicability: ["正在比较替换设备的付款方式与分期费用"],
    triggers: [trigger("core-money-2", "review:borrowing-cost", ["money:borrowing"])],
    originalSources: ["https://xining.pbc.gov.cn/zhengwugongkai/4081330/4406346/4693549/4159909/index.html", "https://www.gov.cn/zhengce/zhengceku/2021-03/31/content_5597156.htm", "http://gongbao.court.gov.cn/Details/94b6623974526df7d2430a3c73f050.html", "https://www.court.gov.cn/fabu/xiangqing/285171.html", "https://www.chinamoney.com.cn/chinese/rdgz/20260820/3399885.html"], status: "ready",
    caveats: ["以自己的合同、账单和费用为准；单利与复利口径不同，优先索取按复利计算的年化利率。指南的分期换算是作者计算，并非个人报价。民间借贷利率上限不能套用于银行、消费金融公司等持牌机构和列明的地方金融组织；来源含截至 2026 年 8 月的利率资料，需核对现行合同与规则。"],
  }),
  entry("08-别把自己搭进去.md", "第8节第17条", [169, 176], {
    id: "read-before-signing", title: "签字前把纸看完，不替人签字，不在空白纸上签", areaIds: ["information-rights"], priority: "information-support",
    benefit: "核对合同约束与责任，减少未经理解就签字的风险", benefitLens: "金钱", benefitMagnitude: "大",
    costs: costs("0", "少", "些"), costDetail: "花几分钟从头读完，不懂就问并拍照留底；当面慢慢看需要坚持", ratioTier: "高", evidenceGrade: "A",
    firstStep: "本周签字前索取完整文本，读完收费和责任条款，不懂的当场问并留底", applicability: ["正在阅读待签的服务约定"],
    triggers: [trigger("core-information-2", "review:contract-terms", ["rights:contract"])],
    originalSources: ["https://www.spp.gov.cn/spp/fl/202006/t20200602_463888.shtml"], status: "ready",
    caveats: ["法律依据说明依法成立合同的约束力，不保证任何合同都有效。不替签、不签空白纸、复印件写用途是经验做法，没有单独官方文件；电子签与刷脸确认也可能产生签字效力。"],
  }),
];

const PRIORITIES = ["downside-risk", "resource-protection", "information-support"];
const RATIO_RANK = { "极高": 0, "高": 1, "一般": 2 };
const EVIDENCE_RANK = { A: 0, B: 1, C: 2 };
const QUESTIONS = new Map([...CORE_QUESTIONS, ...Object.values(STAGE_QUESTION_BANK).flat()].map((question) => [question.id, question]));
const stringList = (value, nonempty = true) => Array.isArray(value) && (!nonempty || value.length > 0) && value.every((item) => typeof item === "string" && item.length > 0);
function validAction(action) {
  return action && typeof action.id === "string" && action.id.length > 0
    && ["ready", "controversial"].includes(action.status) && PRIORITIES.includes(action.priority)
    && Object.hasOwn(RATIO_RANK, action.ratioTier) && Object.hasOwn(EVIDENCE_RANK, action.evidenceGrade)
    && ["chapter", "title", "benefit", "firstStep"].every((key) => typeof action[key] === "string" && action[key].length > 0)
    && action.sourceRevision === GUIDE_SOURCE_REVISION && typeof action.sourceUrl === "string"
    && action.sourceUrl.startsWith(SOURCE) && /\.md#L\d+-L\d+$/.test(action.sourceUrl)
    && stringList(action.originalSources) && action.originalSources.every((url) => /^https?:\/\//.test(url))
    && stringList(action.applicability) && stringList(action.caveats, action.status === "controversial")
    && ["死亡率", "时间", "金钱", "自由"].includes(action.benefitLens) && ["大", "中", "小"].includes(action.benefitMagnitude)
    && action.costs && ["0", "少", "多"].includes(action.costs.money) && ["少", "中", "多"].includes(action.costs.time) && ["否", "些", "是"].includes(action.costs.willpower)
    && stringList(action.areaIds) && action.areaIds.every((id) => LIFE_AREAS.some((area) => area.id === id))
    && Array.isArray(action.triggers) && action.triggers.length > 0 && action.triggers.every((rule) => rule
      && QUESTIONS.has(rule.questionId) && action.areaIds.includes(QUESTIONS.get(rule.questionId).areaId)
      && stringList(rule.reviewSignals) && rule.reviewSignals.every((signal) => signal.startsWith("review:"))
      && (rule.contextSignals === undefined || stringList(rule.contextSignals, false)));
}

function areaMap(contexts) {
  return LIFE_AREAS.map(({ id: areaId, label }) => {
    const responses = contexts.filter((response) => response.areaId === areaId && !response.uncertain);
    const review = responses.some(({ reviewSignals }) => reviewSignals.length > 0);
    const strength = responses.some(({ strengthSignals }) => strengthSignals.length > 0);
    return { areaId, label, state: review ? (strength ? "mixed" : "review") : strength ? "strength" : "insufficient" };
  });
}

export function selectPriorityReviews(snapshot, catalog = ACTION_CATALOG) {
  let validated;
  try { validated = parseAssessmentSnapshot(JSON.stringify(snapshot)); } catch { /* malformed input is insufficient */ }
  if (!validated) return { map: areaMap([]), cards: [] };
  const grouped = deriveResponseContexts(validated);
  const contexts = [...grouped.core, ...grouped.stage];
  const map = areaMap(contexts);
  const eligible = (Array.isArray(catalog) ? catalog : []).filter(validAction).flatMap((action) => {
    const matches = contexts.flatMap((response) => {
      if (response.uncertain || response.reviewSignals.length === 0) return [];
      const rules = action.triggers.filter((rule) => rule.questionId === response.questionId
        && rule.reviewSignals.every((signal) => response.reviewSignals.includes(signal))
        && (rule.contextSignals ?? []).every((signal) => response.contextSignals.includes(signal)));
      return rules.length ? [{ response, rules }] : [];
    });
    if (!matches.length) return [];
    return [{ priority: action.priority, action,
      matchedResponseIds: matches.map(({ response }) => response.questionId),
      areaIds: [...new Set(matches.map(({ response }) => response.areaId))],
      matchedReviewSignals: [...new Set(matches.flatMap(({ rules }) => rules.flatMap(({ reviewSignals }) => reviewSignals)))],
      fit: Math.max(...matches.flatMap(({ rules }) => rules.map((rule) => new Set([...rule.reviewSignals, ...(rule.contextSignals ?? [])]).size))),
    }];
  });
  const cards = [];
  const assigned = new Set();
  // Fixed priority traversal is a presentation convention, not a total score.
  for (const priority of PRIORITIES) {
    const candidates = eligible.filter((review) => review.priority === priority && !assigned.has(review.action.id));
    candidates.sort((a, b) => RATIO_RANK[a.action.ratioTier] - RATIO_RANK[b.action.ratioTier]
      || EVIDENCE_RANK[a.action.evidenceGrade] - EVIDENCE_RANK[b.action.evidenceGrade]
      || b.fit - a.fit || a.action.id.localeCompare(b.action.id));
    if (!candidates.length) continue;
    const review = { ...candidates[0] };
    delete review.fit;
    cards.push(review);
    assigned.add(review.action.id);
  }
  return { map, cards };
}

export function actionPresentationFor(review) {
  if (!review?.action || !Array.isArray(review.matchedResponseIds) || review.matchedResponseIds.length === 0) return null;
  const { action } = review;
  const areas = review.areaIds.map((id) => LIFE_AREAS.find((area) => area.id === id)?.label).filter(Boolean).join("、");
  const observation = review.matchedReviewSignals?.includes("review:borrowing-cost")
    ? "从这组处境看，分期决定中的费用核对值得优先回看。"
    : `从这组处境看，${areas}中已有明确复盘信号，当前值得回看这项行动的适用条件。`;
  return { action, priority: review.priority, matchedResponseIds: [...review.matchedResponseIds], areaIds: [...review.areaIds],
    observation, ignoredCostOrBenefit: `${action.benefit}；需要付出的成本：${action.costDetail ?? `钱=${action.costs.money}、时间=${action.costs.time}、毅力=${action.costs.willpower}`}。`,
    firstStep: action.firstStep, applicability: [...action.applicability], caveats: [...action.caveats],
    source: { chapter: action.chapter, title: action.title, url: action.sourceUrl, revision: action.sourceRevision, originalSources: [...action.originalSources] },
  };
}
