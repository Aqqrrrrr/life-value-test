export const LIFE_STAGES = [
  { id: "studying-graduating", label: "在校/毕业过渡" },
  { id: "career-start", label: "职场起步" },
  { id: "stable-work", label: "稳定工作" },
  { id: "living-alone", label: "独居" },
  { id: "career-change", label: "转职/失业/重大变动" },
  { id: "partner-parenting", label: "伴侣/育儿" },
  { id: "elder-family-care", label: "照护父母/家庭责任增加" },
];

const likertOptions = [
  { value: 1, label: "非常不像我" }, { value: 2, label: "比较不像我" },
  { value: 3, label: "说不清" }, { value: 4, label: "比较像我" }, { value: 5, label: "非常像我" },
];

const core = (id, lens, dimension, prompt, reverse = false) => ({
  id, group: "core", lens, input: "likert", prompt, options: likertOptions, dimension, reverse,
});

// Four safety, four health/recovery, four money/rights, three evidence and three execution/support scenes.
export const CORE_QUESTIONS = [
  core("core-safety-1", "safety-health", "protection", "准备乘车出行时，即使行程很短，我也会给检查安全带留一点时间。"),
  core("core-safety-2", "safety-health", "protection", "买家用电器时，我会把使用环境和安全限制放在外观与便利之前考虑。"),
  core("core-safety-3", "safety-health", "protection", "尝试一项陌生户外活动前，我会先想清楚哪些后果是自己承受不了的。"),
  core("core-safety-4", "safety-health", "protection", "安排长途出行时，为了少花时间，我愿意压缩原本预留的休息时间。", true),
  core("core-health-1", "time-energy", "lowFriction", "连续几天睡得偏晚时，我更容易先调整一个固定的睡前步骤，再考虑整套作息计划。"),
  core("core-health-2", "time-energy", "lowFriction", "发现自己久坐后，我会把起身活动安排到一个日常固定的触发点。"),
  core("core-health-3", "safety-health", "evidence", "整理日常体检计划时，我会先核对某项检查是否适合自己的年龄与情况。"),
  core("core-health-4", "time-energy", "protection", "一周安排已经很满时，我通常仍会把休息时间让给新增的任务。", true),
  core("core-money-1", "money-rights", "evidence", "考虑一笔分期消费时，我会先核对总费用，再判断每月付款是否轻松。"),
  core("core-money-2", "money-rights", "protection", "打算买一件较贵的物品时，我会先确认买完后是否还留有应付日常开支的余地。"),
  core("core-money-3", "money-rights", "evidence", "签订一份日常服务合同时，我会先看取消条件与额外费用，再决定是否接受。"),
  core("core-money-4", "money-rights", "lowFriction", "整理消费凭证时，我会把保存记录设成付款后的固定步骤。"),
  core("core-evidence-1", "money-rights", "evidence", "看到一个省钱方案时，身边很多人都在用，通常就足够让我开始尝试。", true),
  core("core-evidence-2", "safety-health", "evidence", "看到两条相互冲突的日常健康建议时，我愿意花时间查它们各自依据的来源。"),
  core("core-evidence-3", "time-energy", "lowFriction", "想试一种新的时间管理方法时，我更愿意先试一周，再决定是否长期采用。"),
  core("core-support-1", "time-energy", "lowFriction", "推进一项拖了很久的个人待办时，我倾向等到完整计划成形才开始。", true),
  core("core-support-2", "money-rights", "collaboration", "准备一份看不懂的日常合同前，我愿意找熟悉该类合同的人一起核对。"),
  core("core-support-3", "time-energy", "collaboration", "一个生活习惯总是坚持不下来时，我愿意请可信的人帮忙提醒或一起复盘。"),
];

// Signals live on options only. They describe the selected focus/constraints, never personality scores.
const stageQuestion = (stage, category, lens, prompt, entries) => ({
  id: `${stage}-${category}`, group: "stage", stage, category, lens, input: "single", prompt,
  options: [
    ...entries.map(([value, label, ...signals]) => ({ value, label, signals: [`focus:${category}`, ...signals] })),
    { value: "prefer-not-to-say", label: "暂不说明", signals: [] },
  ],
});

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
