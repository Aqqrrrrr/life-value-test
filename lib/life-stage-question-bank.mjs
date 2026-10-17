export const LIFE_STAGES = [
  { id: "studying-graduating", label: "在校/毕业过渡" },
  { id: "career-start", label: "职场起步" },
  { id: "stable-work", label: "稳定工作" },
  { id: "living-alone", label: "独居" },
  { id: "career-change", label: "转职/失业/重大变动" },
  { id: "partner-parenting", label: "伴侣/育儿" },
  { id: "elder-family-care", label: "照护父母/家庭责任增加" },
];

export const LIFE_AREAS = [
  { id: "safety-home", label: "安全与居家" },
  { id: "health-sleep-care", label: "健康、睡眠与照护" },
  { id: "money-protection", label: "金钱与保障" },
  { id: "time-work-energy", label: "时间、工作与精力" },
  { id: "relationships-boundaries", label: "关系与边界" },
  { id: "information-rights", label: "信息与权益" },
];

export const ASSESSMENT_CHAPTERS = [
  { id: "daily-foundations", label: "安顿日常生活", areaIds: ["safety-home", "health-sleep-care"] },
  { id: "resources-rhythm", label: "安排资源与节奏", areaIds: ["money-protection", "time-work-energy"] },
  { id: "connections-decisions", label: "处理关系与判断", areaIds: ["relationships-boundaries", "information-rights"] },
];

// Both groups use the same option schema. Signals describe this response only.
const scenarioQuestion = (metadata, prompt, options) => ({
  ...metadata, input: "single", prompt,
  options: [
    ...options.map((option) => ({ ...option, contextSignals: [...option.contextSignals] })),
    { value: "not-sure", label: "我没遇过 / 目前不确定", contextSignals: [], reviewSignals: [], strengthSignals: [] },
  ],
});

const core = (id, areaId, lens, prompt, contextSignals, topic, entries) => scenarioQuestion(
  { id, group: "core", areaId, lens }, prompt,
  entries.map(([value, label, kind]) => ({
    value, label, contextSignals,
    ...(kind === "review" ? { reviewSignals: [`review:${topic}`] } : {}),
    ...(kind === "strength" ? { strengthSignals: [`strength:${topic}`] } : {}),
  })),
);

export const CORE_QUESTIONS = [
  core("core-safety-1", "safety-home", "safety-health", "最近一次乘车出发前，你的安全带是什么情况？", ["transport:driving"], "seat-belt", [
    ["secured", "已系好并确认位置合适", "strength"], ["unsecured", "短途或赶时间，没有系好", "review"],
  ]),
  core("core-safety-2", "safety-home", "safety-health", "最近使用大功率电器时，插座和电线的情况怎样？", ["housing:electrical"], "electrical-load", [
    ["checked", "核对过功率和插座承载，没有串接", "strength"], ["unchecked", "多个电器共用插排，还没核对负荷", "review"],
  ]),
  core("core-safety-3", "safety-home", "safety-health", "如果晚上需要从住处离开，你对出口的情况了解多少？", ["housing:escape"], "exit-path", [
    ["clear", "知道可走的出口，通道也畅通", "strength"], ["blocked", "出口不熟悉或通道有堆物", "review"],
  ]),
  core("core-health-1", "health-sleep-care", "time-energy", "最近一周，睡眠对第二天的影响更接近哪种？", ["health:sleep"], "sleep-recovery", [
    ["rested", "多数时候睡后能恢复精力", "strength"], ["tired", "经常没睡够，白天受影响", "review"],
  ]),
  core("core-health-2", "health-sleep-care", "safety-health", "最近一次持续坐着工作或学习时，你怎样安排活动？", ["health:movement"], "movement-break", [
    ["breaks", "中间有起身活动的时段", "strength"], ["continuous", "连续坐了很久，几乎没起身", "review"],
  ]),
  core("core-health-3", "health-sleep-care", "safety-health", "最近一次使用药品前，你能确认哪些信息？", ["health:medication"], "medication-check", [
    ["checked", "核对过用法、禁忌和已有用药", "strength"], ["unchecked", "主要凭经验或他人推荐，还没核对", "review"],
  ]),
  core("core-money-1", "money-protection", "money-rights", "如果下个月收入延迟，你目前如何应付必要开支？", ["resource:money"], "cash-reserve", [
    ["reserve", "已有可动用的备用资金", "strength"], ["shortfall", "可能需要借款或推迟必要支出", "review"],
  ]),
  core("core-money-2", "money-protection", "money-rights", "最近考虑分期付款时，你看过哪些费用？", ["money:borrowing"], "borrowing-cost", [
    ["total", "比较过总费用和还款安排", "strength"], ["monthly", "主要看每月金额，还没算总费用", "review"],
  ]),
  core("core-money-3", "money-protection", "money-rights", "最近整理保障安排时，你对已有保障了解多少？", ["money:coverage"], "coverage-terms", [
    ["known", "能找到保障范围、限制和申请方式", "strength"], ["unclear", "知道有保障，但不清楚适用条件", "review"],
  ]),
  core("core-time-1", "time-work-energy", "time-energy", "最近一周，临时任务加入后你的日程怎样变化？", ["resource:time"], "task-capacity", [
    ["adjusted", "重新确认优先级，调整原有安排", "strength"], ["overloaded", "任务继续叠加，只能压缩休息", "review"],
  ]),
  core("core-time-2", "time-work-energy", "time-energy", "面对一件拖延的日常待办，你最近做到了哪一步？", ["approach:plan"], "task-start", [
    ["started", "拆出一个小步骤并开始了", "strength"], ["stuck", "一直等有整段时间，还没开始", "review"],
  ]),
  core("core-time-3", "time-work-energy", "time-energy", "最近安排下班或放学后的时间时，恢复精力的空间怎样？", ["resource:energy"], "recovery-time", [
    ["protected", "能保留一段休息或喜欢的活动时间", "strength"], ["crowded", "大多被其他安排占满", "review"],
  ]),
  core("core-relationships-1", "relationships-boundaries", "time-energy", "最近收到超出自己余力的请求时，你怎么回应？", ["relationship:boundaries"], "request-boundary", [
    ["discussed", "说明限制，商量能承担的部分", "strength"], ["accepted", "难以拒绝，答应后感到负担", "review"],
  ]),
  core("core-relationships-2", "relationships-boundaries", "time-energy", "最近遇到烦心事时，你身边的支持是什么情况？", ["approach:support"], "support-contact", [
    ["available", "有愿意联系、也能信任的人", "strength"], ["isolated", "想找人聊聊，却不知道找谁", "review"],
  ]),
  core("core-relationships-3", "relationships-boundaries", "time-energy", "最近和别人共同承担事务时，分工怎样确定？", ["relationship:shared-tasks"], "shared-tasks", [
    ["agreed", "说清了各自任务和可投入的时间", "strength"], ["unclear", "主要靠临时补位，承担范围不清楚", "review"],
  ]),
  core("core-information-1", "information-rights", "money-rights", "最近看到影响自己决定的网络建议时，你查到了哪一步？", ["information:source"], "source-check", [
    ["checked", "看过原始来源和适用条件", "strength"], ["popular", "主要看转发量或熟人的推荐", "review"],
  ]),
  core("core-information-2", "information-rights", "money-rights", "最近一次签订服务约定前，你怎样处理取消和收费条款？", ["rights:contract"], "contract-terms", [
    ["read", "已看清费用、取消条件，并保留文本", "strength"], ["skipped", "主要听口头介绍，还没核对文本", "review"],
  ]),
  core("core-information-3", "information-rights", "money-rights", "最近一次消费后，相关凭证是什么状态？", ["rights:records"], "purchase-records", [
    ["saved", "订单、付款和服务约定能一起找到", "strength"], ["scattered", "记录分散或缺失，需要时不易找到", "review"],
  ]),
];

const stageAreas = {
  "job-choice": "time-work-energy", "rent-move": "safety-home", "first-large-purchase": "money-protection", "support-network": "relationships-boundaries",
  "employment-rights": "information-rights", "feedback-learning": "time-work-energy", "overtime-commute": "time-work-energy", "career-experiment": "time-work-energy",
  "work-boundaries": "relationships-boundaries", "energy-recovery": "health-sleep-care", "savings-protection": "money-protection", "career-development": "time-work-energy",
  "home-safety": "safety-home", "emergency-plan": "safety-home", "living-costs": "money-protection", "daily-support": "relationships-boundaries",
  "cash-flow": "money-protection", "information-check": "information-rights", "transition-plan": "time-work-energy", "stress-support": "relationships-boundaries",
  "shared-decisions": "relationships-boundaries", "family-budget": "money-protection", "home-child-safety": "safety-home", "time-division": "relationships-boundaries",
  "care-division": "relationships-boundaries", "medical-emergency-info": "health-sleep-care", "family-finance-rights": "money-protection", "caregiver-recovery": "health-sleep-care",
};

const stageQuestion = (stage, category, lens, prompt, entries) => scenarioQuestion(
  { id: `${stage}-${category}`, group: "stage", stage, category, lens, areaId: stageAreas[category] }, prompt,
  entries.map(([value, label, ...signals]) => ({ value, label, contextSignals: [`focus:${category}`, ...signals] })),
);

export const STAGE_QUESTION_BANK = {
  "studying-graduating": [
    stageQuestion("studying-graduating", "job-choice", "time-energy", "毕业前面对两个都感兴趣的求职方向，你想先投入哪一步？", [
      ["compare", "整理岗位要求，比较与已有能力的距离", "approach:verify"],
      ["try", "各做一次小项目，看看实际工作内容", "approach:experiment"],
      ["talk", "找从业者聊日常工作，再缩小范围", "approach:support"],
    ]),
    stageQuestion("studying-graduating", "rent-move", "money-rights", "为毕业后的搬迁找租房时，你更想先确认什么？", [
      ["terms", "租期、押金与提前退租的约定", "housing:renting", "approach:verify"],
      ["budget", "房租加通勤后的每月负担", "housing:renting", "resource:money"],
      ["location", "住处与工作地点的距离和日常便利", "housing:renting", "resource:time"],
    ]),
    stageQuestion("studying-graduating", "first-large-purchase", "money-rights", "准备购买第一件较贵的工作或学习设备时，你优先比较哪项？", [
      ["use", "实际会用到的功能与使用频率", "approach:verify"],
      ["cost", "总价和购买后剩余的生活预算", "resource:money"],
      ["trial", "先借用或短租，确认是否值得买", "approach:experiment"],
    ]),
    stageQuestion("studying-graduating", "support-network", "time-energy", "毕业后可能离开熟悉的同学圈，你想怎样维持日常支持？", [
      ["regular", "与几位熟悉的人约定固定联系时间", "approach:support"],
      ["local", "参加新住处附近的固定活动", "approach:experiment"],
      ["list", "整理遇到具体困难时可以联系的人", "approach:plan"],
    ]),
  ],
  "career-start": [
    stageQuestion("career-start", "employment-rights", "money-rights", "准备接受第一份工作时，你更想先核对哪部分约定？", [
      ["pay", "工资构成、发薪日期与试用期安排", "approach:verify"],
      ["hours", "工作时间、加班安排与休假方式", "resource:time"],
      ["records", "合同副本和入职资料如何留存", "approach:plan"],
    ]),
    stageQuestion("career-start", "feedback-learning", "time-energy", "入职后收到一条比较笼统的改进意见，你想先怎么跟进？", [
      ["example", "请对方举一个具体例子，确认目标", "approach:support"],
      ["practice", "选一项能改的工作，在下一次交付中尝试", "approach:experiment"],
      ["review", "整理几次交付记录，寻找反复出现的问题", "approach:verify"],
    ]),
    stageQuestion("career-start", "overtime-commute", "time-energy", "新工作的通勤和晚下班挤占了休息，你最想先调整哪部分？", [
      ["commute", "比较通勤路线与出发时间", "resource:time"],
      ["workload", "和负责人确认任务的优先级与交付时间", "approach:support"],
      ["recovery", "为下班后的睡眠和恢复留固定时段", "resource:energy"],
    ]),
    stageQuestion("career-start", "career-experiment", "time-energy", "想知道另一类岗位是否适合自己，你准备先做哪种小尝试？", [
      ["task", "做一个接近该岗位工作的练习任务", "approach:experiment"],
      ["shadow", "请熟悉的人介绍一次真实的工作流程", "approach:support"],
      ["requirements", "比较几个招聘要求和自己的经验", "approach:verify"],
    ]),
  ],
  "stable-work": [
    stageQuestion("stable-work", "work-boundaries", "time-energy", "工作任务之外又收到一项临时请求，你通常更想先谈清什么？", [
      ["priority", "新请求与手头任务哪个更优先", "approach:plan"],
      ["scope", "自己具体负责哪部分、何时完成", "approach:verify"],
      ["support", "是否有人可以分担或提供资源", "approach:support"],
    ]),
    stageQuestion("stable-work", "energy-recovery", "time-energy", "最近工作节奏稳定但总觉得疲惫，你想先留出哪种恢复空间？", [
      ["sleep", "规律的睡眠时间", "resource:energy"],
      ["break", "工作日中短而固定的休息", "resource:time"],
      ["weekend", "减少周末安排，留出没有任务的时段", "resource:energy"],
    ]),
    stageQuestion("stable-work", "savings-protection", "money-rights", "收入相对稳定后整理长期财务安排，你最想先看哪一项？", [
      ["reserve", "可动用的储蓄能覆盖多少日常开支", "resource:money"],
      ["coverage", "已有保障的适用条件与缺口", "approach:verify"],
      ["regular", "每月能持续执行的储蓄安排", "approach:plan"],
    ]),
    stageQuestion("stable-work", "career-development", "time-energy", "工作一段时间后觉得成长变慢，你准备先怎样判断下一步？", [
      ["feedback", "与负责人聊下一阶段的能力要求", "approach:support"],
      ["project", "争取一个能练新能力的小项目", "approach:experiment"],
      ["market", "对照外部岗位要求，检查能力缺口", "approach:verify"],
    ]),
  ],
  "living-alone": [
    stageQuestion("living-alone", "home-safety", "safety-health", "独自居住，准备安排一次日常居家安全检查，你先看哪部分？", [
      ["devices", "电器与燃气设备的维护记录", "approach:verify"],
      ["paths", "出入口与走道是否便于通行", "approach:plan"],
      ["alarms", "家中报警装置的位置与日常检查方式", "approach:verify"],
    ]),
    stageQuestion("living-alone", "emergency-plan", "safety-health", "平时为独居生活准备联系预案，你想先补齐哪一项？", [
      ["contact", "一位可信联系人及平时的联系约定", "approach:support"],
      ["info", "住址、重要电话与必要信息的保存位置", "approach:plan"],
      ["access", "需要他人帮助时如何找到和进入住处的约定", "approach:plan"],
    ]),
    stageQuestion("living-alone", "living-costs", "money-rights", "独居后的每月开支比预计高，你最想先弄清哪笔成本？", [
      ["fixed", "房租、水电和订阅等固定支出", "resource:money"],
      ["food", "买菜、外食和外卖的实际花费", "resource:money"],
      ["convenience", "为了省时间付出的配送和服务费用", "resource:time"],
    ]),
    stageQuestion("living-alone", "daily-support", "time-energy", "独居时有些日常小事想有人一起商量，你更愿意建立哪种联系？", [
      ["friends", "与熟悉的朋友定期通话或见面", "approach:support"],
      ["neighbors", "逐步认识附近可信的邻居或社区人员", "approach:support"],
      ["activity", "加入一个能持续参加的兴趣活动", "approach:experiment"],
    ]),
  ],
  "career-change": [
    stageQuestion("career-change", "cash-flow", "money-rights", "收入可能在过渡期减少，你想先如何安排接下来几个月的开支？", [
      ["baseline", "列出必需开支，估计现有资金可支撑多久", "resource:money"],
      ["reduce", "找出可以暂停或缩减的固定支出", "resource:money"],
      ["bridge", "比较短期收入来源的条件和投入", "approach:verify"],
    ]),
    stageQuestion("career-change", "information-check", "money-rights", "转职期间看到一个收费培训机会，你想先核实什么？", [
      ["outcomes", "宣传的就业结果来自哪些可核实的记录", "approach:verify"],
      ["terms", "收费、退款与课程服务的书面约定", "approach:verify"],
      ["fit", "课程内容与目标岗位实际要求是否接近", "approach:experiment"],
    ]),
    stageQuestion("career-change", "transition-plan", "time-energy", "下一步方向还未确定时，你更愿意怎样安排过渡期？", [
      ["routine", "保持每日基本作息和可执行的求职时段", "resource:energy"],
      ["milestones", "按周设置少量目标并复盘进度", "approach:plan"],
      ["experiments", "给几个可逆的小尝试分别限定时间", "approach:experiment"],
    ]),
    stageQuestion("career-change", "stress-support", "time-energy", "生活变动让你最近压力偏大，你想先获得哪种日常支持？", [
      ["listen", "找可信的人谈谈近况与感受", "approach:support"],
      ["practical", "请人一起梳理求职或生活中的具体待办", "approach:support"],
      ["rest", "减少非必要安排，留出恢复精力的时间", "resource:energy"],
    ]),
  ],
  "partner-parenting": [
    stageQuestion("partner-parenting", "shared-decisions", "time-energy", "与伴侣对一项家庭安排看法不同，你想先怎样推进讨论？", [
      ["needs", "分别说清各自最在意的需求", "approach:support"],
      ["constraints", "一起列出可用时间和预算限制", "approach:verify"],
      ["trial", "约定一个短期试行安排，再一起复盘", "approach:experiment"],
    ]),
    stageQuestion("partner-parenting", "family-budget", "money-rights", "准备调整家庭预算，你最想先和家人看清哪部分？", [
      ["essentials", "共同生活的固定与必要支出", "resource:money"],
      ["reserve", "为未来变化保留的可用资金", "resource:money"],
      ["agreement", "个人与共同支出的承担方式", "approach:support"],
    ]),
    stageQuestion("partner-parenting", "home-child-safety", "safety-health", "整理家庭的日常防护计划时，你目前更关注哪个生活场景？", [
      ["home", "家中用电、燃气和出入口的日常检查", "approach:plan"],
      ["child-home", "有儿童活动的窗边、家具和物品收纳", "care:child"],
      ["child-travel", "有儿童同行时的乘车安排", "care:child", "transport:driving"],
    ]),
    stageQuestion("partner-parenting", "time-division", "time-energy", "家庭日常任务总挤占个人时间，你想先怎样讨论分工？", [
      ["list", "把照料、家务和安排事务的时间都列出来", "approach:verify"],
      ["rotate", "试行轮换任务，再看双方负担", "approach:experiment"],
      ["help", "商量哪些任务可以请人协助或简化", "approach:support"],
    ]),
  ],
  "elder-family-care": [
    stageQuestion("elder-family-care", "care-division", "time-energy", "家中照护事务增加，准备与家人重新分工，你更想先谈哪项？", [
      ["tasks", "谁负责陪同、采购和日常联系等具体任务", "care:elder", "approach:plan"],
      ["availability", "每个人现实可投入的时间与精力", "care:elder", "resource:time"],
      ["backup", "主要照护者有事时谁可以替换", "care:elder", "approach:support"],
    ]),
    stageQuestion("elder-family-care", "medical-emergency-info", "safety-health", "平时整理父母的就医与联系资料，你想先补齐什么？", [
      ["records", "用药、过敏和既往就医记录的保存位置", "care:elder", "approach:verify"],
      ["contacts", "家人和常用医疗机构的联系方式", "care:elder", "approach:support"],
      ["sharing", "谁更新资料、如何让参与照护的人取得", "care:elder", "approach:plan"],
    ]),
    stageQuestion("elder-family-care", "family-finance-rights", "money-rights", "照护支出开始增加，你想先与家人整理哪部分财务信息？", [
      ["expenses", "日常照护费用与家庭承担能力", "care:elder", "resource:money"],
      ["coverage", "已有保障和可申请支持的适用条件", "care:elder", "approach:verify"],
      ["records", "支出记录、票据和分摊约定", "care:elder", "approach:plan"],
    ]),
    stageQuestion("elder-family-care", "caregiver-recovery", "time-energy", "照护安排持续了一段时间，你想先为自己争取哪种恢复空间？", [
      ["sleep", "稳定的睡眠和休息时段", "care:elder", "resource:energy"],
      ["replacement", "由可信的人接替一部分照护时间", "care:elder", "approach:support"],
      ["personal", "保留一项能持续的个人活动", "care:elder", "resource:time"],
    ]),
  ],
};

function canonicalStages(lifeStages) {
  if (!Array.isArray(lifeStages) || lifeStages.length < 1 || lifeStages.length > 3) {
    throw new TypeError("请选择 1 至 3 个生活阶段");
  }
  const selected = new Set(lifeStages);
  if (selected.size !== lifeStages.length || [...selected].some((id) => !LIFE_STAGES.some((stage) => stage.id === id))) {
    throw new TypeError("生活阶段必须是有效且不重复的阶段 ID");
  }
  return LIFE_STAGES.filter(({ id }) => selected.has(id)).map(({ id }) => id);
}

export function buildQuestionSet(lifeStages) {
  return [...CORE_QUESTIONS, ...canonicalStages(lifeStages).flatMap((id) => STAGE_QUESTION_BANK[id])];
}

export function questionCountFor(lifeStages) {
  return CORE_QUESTIONS.length + canonicalStages(lifeStages).length * 4;
}
