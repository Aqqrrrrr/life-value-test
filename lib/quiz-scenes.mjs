const deathLens = "死亡率";

export const actions = [
  { id: "seatbelt", scene: "road", text: "上车后前排、后排都系安全带", condition: "适用于每次乘坐汽车", costs: ["时间"], benefit: "降低车内致命伤风险", benefitLevel: "大", lens: deathLens, evidence: "A", source: "第1节第1条（系安全带，前排后排都系）" },
  { id: "helmet", scene: "road", text: "骑摩托车或电动自行车戴好并扣紧头盔", condition: "适用于骑摩托车或电动自行车", costs: ["钱", "时间"], benefit: "降低死亡和头部损伤风险", benefitLevel: "大", lens: deathLens, evidence: "A", source: "第1节第2条（骑摩托车、电动自行车戴头盔并扣好）" },
  { id: "no-dui", scene: "road", text: "开车不超速、不酒驾", condition: "适用于自己开车或驾驶其他机动车", costs: ["时间", "毅力"], benefit: "降低道路交通死亡风险", benefitLevel: "大", lens: deathLens, evidence: "B", source: "第1节第9条（开车不超速、不酒驾）" },
  { id: "smoke-alarm", scene: "home", text: "家里安装烟雾报警器，并按需安装一氧化碳报警器", condition: "适用于居家；冬天烧煤或燃气取暖时再考虑一氧化碳报警器", costs: ["钱", "时间"], benefit: "降低住宅火灾死亡风险", benefitLevel: "大", lens: deathLens, evidence: "B", source: "第1节第3条（装烟雾报警器）", note: "一氧化碳报警器本身没有降低死亡率的直接研究" },
  { id: "gas-hose", scene: "home", text: "燃气软管和灶具到期更换，不自行改燃气管道", condition: "适用于使用燃气的家庭", costs: ["钱", "时间"], benefit: "减少燃气事故和违规风险", benefitLevel: "大", lens: deathLens, evidence: "C", source: "第1节第4条（燃气软管和灶具到期就换）", note: "条目没有给出换管能减少多少事故的统计数字" },
  { id: "ebike", scene: "home", text: "电动自行车不进楼道、电梯，也不在家里充电", condition: "适用于有电动自行车的家庭", costs: ["时间", "毅力"], benefit: "避免堵住逃生通道并降低火灾风险", benefitLevel: "大", lens: deathLens, evidence: "A", source: "第1节第6条（电动自行车不推进楼道）" },
  { id: "child-seat", scene: "child", text: "4岁以下儿童乘车使用合规安全座椅", condition: "适用于4岁以下儿童乘车", costs: ["钱", "时间"], benefit: "降低儿童车祸致命伤风险", benefitLevel: "大", lens: deathLens, evidence: "A", source: "第1节第10条（给4岁以下儿童用安全座椅）" },
  { id: "window-lock", scene: "child", text: "家里有小孩时安装窗户和阳台限位器", condition: "适用于家中有会攀爬的儿童", costs: ["钱", "时间"], benefit: "降低儿童坠落风险", benefitLevel: "大", lens: deathLens, evidence: "B", source: "第1节第11条（给窗户和阳台装限位器）", note: "纱窗不算防护；低楼层也可能发生坠落" },
  { id: "life-jacket", scene: "child", text: "儿童近水不离视线，划船或野泳穿救生衣", condition: "适用于儿童近水、划船或野泳", costs: ["钱", "时间"], benefit: "降低溺亡风险", benefitLevel: "大", lens: deathLens, evidence: "A", source: "第1节第12条（儿童近水不离视线，划船、野泳穿救生衣）", note: "A级证据对应救生衣；不离视线单独算是C级" },
  { id: "bp", scene: "baseline-health", text: "先量血压，发现高血压后按医嘱控制", condition: "适用于成年人日常健康检查", costs: ["钱", "时间", "毅力"], benefit: "降低心血管事件和死亡风险", benefitLevel: "大", lens: deathLens, evidence: "A", source: "第1节第7条（量血压，高了就吃药降到达标）" },
  { id: "glucose", scene: "baseline-health", text: "35岁以后超重时查空腹血糖，正常则按周期复查", condition: "适用于35至70岁且超重或肥胖的成年人", costs: ["钱", "时间"], benefit: "更早发现糖尿病前期和2型糖尿病", benefitLevel: "中", lens: deathLens, evidence: "A", source: "第1节第8条（35岁以后只要超重，就去查一次空腹血糖）" },
  { id: "h-pylori", scene: "baseline-health", text: "按适用人群查幽门螺杆菌，阳性后按医嘱根除", condition: "适用于需要按风险与医生建议安排筛查的人", costs: ["钱", "时间", "毅力"], benefit: "降低胃癌风险", benefitLevel: "大", lens: deathLens, evidence: "A", source: "第1节第23条（查幽门螺杆菌，阳性就根除）", note: "研究对象来自胃癌高发区，低发区人群收益可能更小" },
  { id: "hepb", scene: "adult-vaccine", text: "查乙肝两对半，没有抗体时按医嘱补种疫苗", condition: "适用于不确定乙肝抗体状态的成年人", costs: ["钱", "时间"], benefit: "降低乙肝感染和相关肝癌风险", benefitLevel: "大", lens: deathLens, evidence: "A", source: "第1节第14条（查乙肝两对半，没有抗体就打疫苗）", note: "已经感染乙肝的人不能靠接种疫苗解决" },
  { id: "tetanus", scene: "adult-vaccine", text: "被铁钉、木刺扎伤或伤口沾泥土时当天处理并询问破伤风", condition: "适用于有污染伤口或刺伤时", costs: ["钱", "时间"], benefit: "降低破伤风死亡风险", benefitLevel: "大", lens: deathLens, evidence: "B", source: "第1节第15条（伤口当天处理，问破伤风）", note: "是否接种要由医生按伤口和既往接种史判断" },
  { id: "flu", scene: "adult-vaccine", text: "有心血管病的人和老年人每年打流感疫苗", condition: "适用于有心血管病的人和老年人", costs: ["钱", "时间"], benefit: "降低特定人群的死亡和心血管事件风险", benefitLevel: "大", lens: deathLens, evidence: "A", source: "第1节第20条（有心血管病的人和老年人每年打流感疫苗）", note: "健康老人证据较弱且有争议" },
  { id: "hpv", scene: "women-health", text: "女性按年龄和适用条件接种HPV疫苗", condition: "适用于符合接种条件的女性", costs: ["钱", "时间"], benefit: "降低浸润性宫颈癌风险", benefitLevel: "大", lens: deathLens, evidence: "A", source: "第1节第16条（女性接种HPV疫苗，越早越好）", note: "接种不能替代宫颈癌筛查" },
  { id: "breast", scene: "women-health", text: "40至74岁女性按周期做乳腺癌筛查", condition: "适用于40至74岁女性", costs: ["钱", "时间"], benefit: "降低乳腺癌死亡风险", benefitLevel: "中", lens: deathLens, evidence: "A", source: "第1节第17条（女性40岁起做乳腺癌筛查）", note: "高危人群应单独找医生定方案" },
  { id: "cervical", scene: "women-health", text: "30岁以上女性优先做HPV宫颈癌筛查", condition: "适用于30岁以上女性", costs: ["钱", "时间"], benefit: "降低宫颈癌死亡风险", benefitLevel: "大", lens: deathLens, evidence: "A", source: "第1节第18条（30岁以上女性做宫颈癌筛查）" },
  { id: "colon", scene: "age-risk-prevention", text: "45至50岁起按周期做粪便免疫化学检测或肠镜", condition: "适用于45至50岁以上成年人，依当地建议与个人风险确定", costs: ["钱", "时间"], benefit: "降低结直肠癌死亡风险", benefitLevel: "中", lens: deathLens, evidence: "A", source: "第1节第19条（45到50岁起做结直肠癌筛查）", note: "肠镜对死亡率的收益存在争议" },
  { id: "lung-ct", scene: "age-risk-prevention", text: "符合高危吸烟条件时每年做低剂量胸部CT", condition: "仅适用于符合年龄与重度吸烟等高危条件的人", costs: ["钱", "时间"], benefit: "降低高危吸烟者肺癌死亡风险", benefitLevel: "大", lens: deathLens, evidence: "A", source: "第1节第24条（重度吸烟者每年做一次低剂量胸部CT）" },
  { id: "zoster", scene: "age-risk-prevention", text: "50岁以后评估是否接种带状疱疹疫苗", condition: "适用于50岁以上人群", costs: ["钱", "时间"], benefit: "降低带状疱疹发病风险", benefitLevel: "中", lens: deathLens, evidence: "A", source: "第1节第21条（50岁以后打带状疱疹疫苗）", note: "两针自费约3000到4000元，性价比因价格排得靠后" },
  { id: "falls", scene: "family-prevention", text: "60岁以上练平衡和腿部力量，改造浴室和楼梯", condition: "适用于住在自己家里的60岁以上老人", costs: ["钱", "时间", "毅力"], benefit: "减少老人跌倒", benefitLevel: "大", lens: deathLens, evidence: "A", source: "第1节第13条（60岁以上练平衡和腿部力量）" },
  { id: "pneumo", scene: "family-prevention", text: "65岁以上咨询肺炎球菌疫苗", condition: "适用于65岁以上人群", costs: ["钱", "时间"], benefit: "降低部分肺炎球菌感染风险", benefitLevel: "中", lens: deathLens, evidence: "A", source: "第1节第22条（65岁以上打肺炎球菌疫苗）", note: "不能理解成能预防所有肺炎" },
  { id: "mushroom", scene: "family-prevention", text: "不采、不买、不吃野生蘑菇", condition: "适用于有采食野生蘑菇习惯或机会的家庭", costs: ["毅力"], benefit: "避免毒蘑菇中毒死亡风险", benefitLevel: "大", lens: deathLens, evidence: "A", source: "第1节第5条（不采、不买、不吃野生蘑菇）", note: "银针、蒜瓣和虫子鉴别法都不可靠" },
];

const scenePrompts = {
  home: ["你刚搬进新家，只有一个下午做安全改造，优先哪件？", "整理家里的火、气、电风险时，你想先落实哪件？", "想减少居家逃生风险，你会先处理哪件？"],
  road: ["你每天通勤，准备先落实一项交通安全习惯，选哪件？", "出门前只能提醒自己一件道路安全规则，你选哪件？", "给家人定一条日常出行规则时，你优先哪件？"],
  child: ["家里有孩子，准备先补一个高损失防护，选哪件？", "带孩子出门或在家活动前，你最先落实哪件？", "整理儿童安全清单时，你会先处理哪类风险？"],
  "baseline-health": ["体检时间有限，面对日常健康筛查你会先核对哪件？", "想提早发现慢性风险时，你会从哪项开始？", "整理自己的健康待办时，你最先安排哪件？"],
  "adult-vaccine": ["整理成年人的感染预防清单时，你会先核对哪件？", "面对一次受伤或一项疫苗记录，你会先处理哪类问题？", "给家人做预防提醒时，你优先哪项行动？"],
  "women-health": ["女性健康预防只能先安排一项时，你会先核对哪件？", "面对年龄与适用条件不同的女性预防项目，你先看哪一项？", "为自己或家人做女性健康计划时，你优先哪件？"],
  "age-risk-prevention": ["面对年龄或风险条件不同的预防项目，你会先核对哪件？", "想减少未来的大病风险时，你优先确认哪项适用条件？", "整理中年后的预防清单时，你最先安排哪件？"],
  "family-prevention": ["整理家庭成员的预防清单时，你会先考虑哪件？", "家庭安全与健康只能先推进一项时，选哪件？", "面对不同家庭成员的常见风险，你最先落实哪项行动？"],
};

const sceneActionIds = {
  home: ["smoke-alarm", "gas-hose", "ebike"], road: ["seatbelt", "helmet", "no-dui"], child: ["child-seat", "window-lock", "life-jacket"], "baseline-health": ["bp", "glucose", "h-pylori"], "adult-vaccine": ["hepb", "tetanus", "flu"], "women-health": ["hpv", "breast", "cervical"], "age-risk-prevention": ["colon", "lung-ct", "zoster"], "family-prevention": ["falls", "pneumo", "mushroom"],
};

export const questionSpecs = Object.entries(scenePrompts).flatMap(([scene, prompts], sceneIndex) => prompts.map((prompt, index) => ({ id: `q${sceneIndex * 3 + index + 1}`, scene, prompt, actionIds: sceneActionIds[scene] })));

export function buildQuestions(actionList, specs) {
  const actionById = new Map(actionList.map((action) => [action.id, action]));
  return specs.map((spec) => {
    const choices = spec.actionIds.map((id) => actionById.get(id));
    if (choices.some((choice) => !choice)) throw new Error(`题目 ${spec.id} 引用了不存在的行动`);
    if (choices.some((choice) => choice.scene !== spec.scene)) throw new Error(`题目 ${spec.id} 的选项不属于 ${spec.scene} 场景`);
    return { id: spec.id, title: `第 ${spec.id.slice(1)} 题｜先做哪一件？`, prompt: spec.prompt, choices: choices.map((choice, index) => ({ ...choice, id: String.fromCharCode(65 + index), label: String.fromCharCode(65 + index) })) };
  });
}
