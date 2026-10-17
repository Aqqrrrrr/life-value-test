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
  entries.map(([value, label, approach, kind, strengthTopic = topic]) => {
    if (!["review", "strength", "mixed"].includes(kind)) throw new TypeError(`核心选项必须明确标记信号类型：${id}/${value}`);
    return {
      value, label, contextSignals: [...contextSignals, `approach:${approach}`],
      reviewSignals: kind === "review" || kind === "mixed" ? [`review:${topic}`] : [],
      strengthSignals: kind === "strength" || kind === "mixed" ? [`strength:${strengthTopic}`] : [],
    };
  }),
);

export const CORE_QUESTIONS = [
  core("core-safety-1", "safety-home", "safety-health", "打车去赶车，车辆还停着，你发现后排安全带卡住了，同伴催着出发。你最可能先做什么？", ["transport:driving"], "seat-belt", [
    ["adjust-belt", "请司机稍等，自己检查带子是否扭住或被座垫压住", "verify", "strength"],
    ["ask-driver", "请司机一起查看，确认其他座位能否使用", "support", "strength"],
    ["change-car", "查看换车所需时间，同时给接应的人说明可能晚到", "plan", "strength"],
  ]),
  core("core-safety-2", "safety-home", "safety-health", "租住处只有一个方便使用的插座，你想添一台取暖器，今晚只有十分钟准备。你最可能先做什么？", ["housing:electrical"], "electrical-load", [
    ["check-ratings", "查看现有电器和插座标识，弄清能否一起使用", "verify", "strength"],
    ["ask-landlord", "拍下插座与线路情况，请房东确认承载条件", "support", "strength"],
    ["change-heating", "先安排其他保暖方式，腾出时间再处理用电位置", "plan", "strength"],
  ]),
  core("core-safety-3", "safety-home", "safety-health", "刚搬进新住处，纸箱还没整理，睡前只剩十五分钟熟悉环境。你最可能先做什么？", ["housing:escape"], "exit-path", [
    ["walk-route", "从房门走到楼梯出口，认清路线和开门方式", "experiment", "strength"],
    ["clear-boxes", "把房门到走道之间的纸箱移开，留出通行空间", "plan", "strength"],
    ["ask-building", "向物业确认夜间出口和门禁安排，记下位置", "support", "strength"],
  ]),
  core("core-health-1", "health-sleep-care", "time-energy", "连续几天睡得晚，明天仍要早起，今晚还有一项待办和半小时空档。你最可能先做什么？", ["health:sleep"], "sleep-recovery", [
    ["reduce-task", "把待办缩成今晚必须完成的一步，剩余部分另排时间", "plan", "strength"],
    ["prepare-morning", "准备好明早的物品，把起床后的安排简化", "experiment", "strength"],
    ["ask-sharing", "联系相关的人，商量待办能否延期或分担", "support", "strength"],
  ]),
  core("core-health-2", "health-sleep-care", "safety-health", "今天要连续处理几小时材料，场地狭小，也很难留出整段运动时间。你最可能先做什么？", ["health:movement"], "movement-break", [
    ["use-break", "利用下一次接水或取资料的间隙起身走动", "experiment", "strength"],
    ["set-trigger", "在材料分段处标记短暂停顿，安排几次起身", "plan", "strength"],
    ["coordinate-break", "和一起做事的人商量交替休息的时间", "support", "strength"],
  ]),
  core("core-health-3", "health-sleep-care", "safety-health", "家里有几盒常备药，你想周末整理，但现在只有十分钟，部分说明书也找不到。你最可能先做什么？", ["health:medication"], "medication-check", [
    ["sort-labels", "按药盒标识整理名称与有效期，把信息不清的单独放好", "verify", "strength"],
    ["ask-pharmacist", "拍下药盒，列出需要向药师确认的内容", "support", "strength"],
    ["make-list", "先列家人正在使用的药品清单，留待集中核对", "plan", "strength"],
  ]),
  core("core-money-1", "money-protection", "money-rights", "这月收入可能晚到两周，房租和几笔账单快到期，你今晚只有二十分钟理账。你最可能先做什么？", ["resource:money"], "cash-reserve", [
    ["list-essentials", "列出两周内必须支付的金额，和可用余额对照", "verify", "strength"],
    ["ask-payment-date", "联系付款方确认到账日期，便于安排账单", "support", "strength"],
    ["pause-expenses", "逐项查看近期扣款，先暂停能暂停的非必要支出", "plan", "strength"],
  ]),
  core("core-money-2", "money-protection", "money-rights", "常用设备坏了，需要尽快替换，但一次付清会占用大半月预算，店里也提供分期。你最可能先做什么？", ["money:borrowing"], "borrowing-cost", [
    ["compare-total", "把不同付款方式的总支出和日期列在一起比较", "verify", "strength"],
    ["try-temporary", "找可借用或短租的设备，先解决眼前使用需求", "experiment", "strength"],
    ["check-budget", "先留出必要开支并确定月供上限，总费用等有空再核对", "plan", "mixed", "spending-boundary"],
    ["monthly-first", "先按月供选一款能马上使用的，其他费用等下班后再看", "plan", "review"],
  ]),
  core("core-money-3", "money-protection", "money-rights", "收到一份保障续费提醒，手头已有几份不同渠道的保障，今天只能花二十分钟处理。你最可能先做什么？", ["money:coverage"], "coverage-terms", [
    ["gather-policies", "把现有保障的范围、期限和费用汇总到一处", "verify", "strength"],
    ["ask-terms", "请服务方说明续费变化和需要留意的限制", "support", "strength"],
    ["list-needs", "先列近期最需要覆盖的支出风险，再对照已有保障", "plan", "strength"],
  ]),
  core("core-time-1", "time-work-energy", "time-energy", "下午又来一项临时任务，原有两项任务也要今天交，剩余时间只够完成其中两项。你最可能先做什么？", ["resource:time"], "task-capacity", [
    ["confirm-priority", "请提出任务的人一起确认交付顺序和可调整的期限", "support", "strength"],
    ["split-delivery", "拆出每项最低可交付的部分，估算能否分批完成", "plan", "strength"],
    ["check-dependency", "查看哪项会卡住别人的后续工作，先厘清影响", "verify", "strength"],
  ]),
  core("core-time-2", "time-work-energy", "time-energy", "一项生活手续拖了很久，材料分散，今天碰巧空出十五分钟。你最可能先做什么？", ["resource:time"], "task-start", [
    ["find-material", "先找出一份最容易取得的材料，放到固定位置", "experiment", "strength"],
    ["check-process", "查看办理要求，确认缺什么以及是否需要预约", "verify", "strength"],
    ["ask-experience", "联系办过的人，问清最容易卡住的步骤", "support", "strength"],
  ]),
  core("core-time-3", "time-work-energy", "time-energy", "这周很累，周末只有半天空档，但还要买日用品和处理几件家务。你最可能先做什么？", ["resource:energy"], "recovery-time", [
    ["combine-errands", "把采购合并成一次出门，减少来回奔波", "plan", "strength"],
    ["simplify-chores", "选出必须做的家务，其他项目先降频或简化", "verify", "strength"],
    ["share-errands", "和能帮忙的人商量分担一项事务", "support", "strength"],
  ]),
  core("core-relationships-1", "relationships-boundaries", "time-energy", "朋友请你周末帮忙搬家，但你已有安排，只能抽出一小时。你最可能先做什么？", ["relationship:boundaries"], "request-boundary", [
    ["clarify-request", "先问哪一段最缺人，判断自己的一小时能否派上用场", "verify", "strength"],
    ["offer-part", "说明可用时段，提出只协助其中一项具体任务", "plan", "strength"],
    ["suggest-help", "询问朋友是否愿意一起找其他帮手或替代办法", "support", "strength"],
  ]),
  core("core-relationships-2", "relationships-boundaries", "time-energy", "最近有件烦心事想找人谈，熟悉的人都很忙，你也只有今晚一小段空闲。你最可能先做什么？", ["relationship:support"], "support-contact", [
    ["request-time", "给一位信任的人发消息，询问何时方便聊一会儿", "support", "strength"],
    ["write-needs", "先写下最想谈的一件事，以及希望获得哪种帮助", "plan", "strength"],
    ["find-group", "查看常参加的社群或活动，寻找合适的联系机会", "experiment", "strength"],
  ]),
  core("core-relationships-3", "relationships-boundaries", "time-energy", "你和同住的人最近都忙，采购、清洁和缴费常撞在一起，今晚只能聊十分钟。你最可能先做什么？", ["relationship:shared-tasks"], "shared-tasks", [
    ["list-tasks", "一起列出本周事务和各自可用的时间", "verify", "strength"],
    ["trial-division", "先约定本周各自负责的一两项，再找时间复盘", "experiment", "strength"],
    ["choose-outsourcing", "商量哪项可以简化或付费代办，减少总负担", "plan", "strength"],
  ]),
  core("core-information-1", "information-rights", "money-rights", "准备买一项服务，两篇评测结论相反，优惠今晚截止，你只剩二十分钟了解。你最可能先做什么？", ["information:source"], "source-check", [
    ["trace-source", "追查两篇评测依据的来源和测试条件", "verify", "strength"],
    ["try-small", "查看能否试用或先买小份，降低这次决定的成本", "experiment", "strength"],
    ["define-needs", "先列自己必须满足的条件，判断是否需要赶这次优惠", "plan", "strength"],
  ]),
  core("core-information-2", "information-rights", "money-rights", "准备签一份服务约定，销售只留十分钟介绍，文本很长，部分收费名词不熟悉。你最可能先做什么？", ["rights:contract"], "contract-terms", [
    ["locate-terms", "先定位总费用、取消和续费条款，圈出疑问", "verify", "strength"],
    ["request-copy", "索取完整文本，约定稍后答复，留出阅读时间", "plan", "strength"],
    ["ask-explanation", "请对方把不熟悉的费用用具体例子解释并书面确认", "support", "strength"],
  ]),
  core("core-information-3", "information-rights", "money-rights", "一笔服务扣费和预期不同，付款与聊天记录散在几个应用里，午休只剩十五分钟。你最可能先做什么？", ["rights:records"], "purchase-records", [
    ["gather-records", "先保存订单、付款和相关约定，集中到同一处", "verify", "strength"],
    ["ask-breakdown", "联系服务方索取费用明细和对应依据", "support", "strength"],
    ["write-timeline", "先列购买、扣费和沟通的时间线，标出缺少的记录", "plan", "strength"],
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
