export type BenefitLevel = "大" | "中" | "小";

export type Choice = {
  id: string;
  label: string;
  text: string;
  costs: string[];
  benefit: string;
  benefitLevel: BenefitLevel;
  lens: "死亡率";
  evidence: "A" | "B" | "C";
  source: string;
  note?: string;
};

export type Question = {
  id: string;
  title: string;
  prompt: string;
  choices: Choice[];
};

const actions: Choice[] = [
  { id: "seatbelt", label: "A", text: "上车后前排、后排都系安全带", costs: ["时间"], benefit: "降低车内致命伤风险", benefitLevel: "大", lens: "死亡率", evidence: "A", source: "第1节第1条（系安全带，前排后排都系）" },
  { id: "helmet", label: "B", text: "骑摩托车或电动自行车戴好并扣紧头盔", costs: ["钱", "时间"], benefit: "降低死亡和头部损伤风险", benefitLevel: "大", lens: "死亡率", evidence: "A", source: "第1节第2条（骑摩托车、电动自行车戴头盔并扣好）" },
  { id: "smoke-alarm", label: "C", text: "家里安装烟雾报警器，并按需安装一氧化碳报警器", costs: ["钱", "时间"], benefit: "降低住宅火灾死亡风险", benefitLevel: "大", lens: "死亡率", evidence: "B", source: "第1节第3条（装烟雾报警器）", note: "一氧化碳报警器本身没有降低死亡率的直接研究" },
  { id: "gas-hose", label: "A", text: "燃气软管和灶具到期更换，不自行改燃气管道", costs: ["钱", "时间"], benefit: "减少燃气安全违规和事故风险", benefitLevel: "大", lens: "死亡率", evidence: "C", source: "第1节第4条（燃气软管和灶具到期就换）", note: "条目没有给出换管能减少多少事故的统计数字" },
  { id: "mushroom", label: "B", text: "不采、不买、不吃野生蘑菇", costs: ["毅力"], benefit: "避免毒蘑菇中毒死亡风险", benefitLevel: "大", lens: "死亡率", evidence: "A", source: "第1节第5条（不采、不买、不吃野生蘑菇）", note: "银针、蒜瓣和虫子鉴别法都不可靠" },
  { id: "ebike", label: "C", text: "电动自行车不进楼道、电梯，也不在家里充电", costs: ["时间", "毅力"], benefit: "避免堵住逃生通道并降低火灾风险", benefitLevel: "大", lens: "死亡率", evidence: "A", source: "第1节第6条（电动自行车不推进楼道）" },
  { id: "bp", label: "A", text: "先量血压，发现高血压后按医嘱控制", costs: ["钱", "时间", "毅力"], benefit: "降低心血管事件和死亡风险", benefitLevel: "大", lens: "死亡率", evidence: "A", source: "第1节第7条（量血压，高了就吃药降到达标）" },
  { id: "glucose", label: "B", text: "35岁以后超重时查空腹血糖，正常则按周期复查", costs: ["钱", "时间"], benefit: "更早发现糖尿病前期和2型糖尿病", benefitLevel: "中", lens: "死亡率", evidence: "A", source: "第1节第8条（35岁以后只要超重，就去查一次空腹血糖）", note: "适用条件是年龄和体重符合条目范围" },
  { id: "no-dui", label: "C", text: "开车不超速、不酒驾", costs: ["时间", "毅力"], benefit: "降低道路交通死亡风险", benefitLevel: "大", lens: "死亡率", evidence: "B", source: "第1节第9条（开车不超速、不酒驾）", note: "酒驾风险随血液酒精浓度上升，条目没有核实具体安全线数字" },
  { id: "child-seat", label: "A", text: "4岁以下儿童乘车使用合规安全座椅", costs: ["钱", "时间"], benefit: "降低儿童车祸致命伤风险", benefitLevel: "大", lens: "死亡率", evidence: "A", source: "第1节第10条（给4岁以下儿童用安全座椅）" },
  { id: "window-lock", label: "B", text: "家里有小孩时安装窗户和阳台限位器", costs: ["钱", "时间"], benefit: "降低儿童坠落风险", benefitLevel: "大", lens: "死亡率", evidence: "B", source: "第1节第11条（给窗户和阳台装限位器）", note: "纱窗不算防护；低楼层也可能发生坠落" },
  { id: "life-jacket", label: "C", text: "儿童近水不离视线，划船或野泳穿救生衣", costs: ["钱", "时间"], benefit: "降低溺亡风险", benefitLevel: "大", lens: "死亡率", evidence: "A", source: "第1节第12条（儿童近水不离视线，划船、野泳穿救生衣）", note: "A级证据对应救生衣；不离视线单独算是C级" },
  { id: "falls", label: "A", text: "60岁以上练平衡和腿部力量，改造浴室和楼梯", costs: ["钱", "时间", "毅力"], benefit: "减少老人跌倒", benefitLevel: "大", lens: "死亡率", evidence: "A", source: "第1节第13条（60岁以上练平衡和腿部力量）", note: "适用于住在自己家里的60岁以上老人" },
  { id: "hepb", label: "B", text: "查乙肝两对半，没有抗体时按医嘱补种疫苗", costs: ["钱", "时间"], benefit: "降低乙肝感染和相关肝癌风险", benefitLevel: "大", lens: "死亡率", evidence: "A", source: "第1节第14条（查乙肝两对半，没有抗体就打疫苗）", note: "已经感染乙肝的人不能靠接种疫苗解决" },
  { id: "tetanus", label: "C", text: "被铁钉、木刺扎伤或伤口沾泥土时当天处理并询问破伤风", costs: ["钱", "时间"], benefit: "降低破伤风死亡风险", benefitLevel: "大", lens: "死亡率", evidence: "B", source: "第1节第15条（伤口当天处理，问破伤风）", note: "是否接种要由医生按伤口和既往接种史判断" },
  { id: "hpv", label: "A", text: "女性按年龄和适用条件接种HPV疫苗", costs: ["钱", "时间"], benefit: "降低浸润性宫颈癌风险", benefitLevel: "大", lens: "死亡率", evidence: "A", source: "第1节第16条（女性接种HPV疫苗，越早越好）", note: "接种不能替代宫颈癌筛查" },
  { id: "breast", label: "B", text: "40至74岁女性按周期做乳腺癌筛查", costs: ["钱", "时间"], benefit: "降低乳腺癌死亡风险", benefitLevel: "中", lens: "死亡率", evidence: "A", source: "第1节第17条（女性40岁起做乳腺癌筛查）", note: "高危人群应单独找医生定方案" },
  { id: "cervical", label: "C", text: "30岁以上女性优先做HPV宫颈癌筛查", costs: ["钱", "时间"], benefit: "降低宫颈癌死亡风险", benefitLevel: "大", lens: "死亡率", evidence: "A", source: "第1节第18条（30岁以上女性做宫颈癌筛查）" },
  { id: "colon", label: "A", text: "45至50岁起按周期做粪便免疫化学检测或肠镜", costs: ["钱", "时间"], benefit: "降低结直肠癌死亡风险", benefitLevel: "中", lens: "死亡率", evidence: "A", source: "第1节第19条（45到50岁起做结直肠癌筛查）", note: "条目明确提示肠镜对死亡率的收益存在争议" },
  { id: "flu", label: "B", text: "有心血管病的人和老年人每年打流感疫苗", costs: ["钱", "时间"], benefit: "降低特定人群的死亡和心血管事件风险", benefitLevel: "大", lens: "死亡率", evidence: "A", source: "第1节第20条（有心血管病的人和老年人每年打流感疫苗）", note: "A级证据主要对应有心血管病的人；健康老人证据较弱且有争议" },
  { id: "zoster", label: "C", text: "50岁以后评估是否接种带状疱疹疫苗", costs: ["钱", "时间"], benefit: "降低带状疱疹发病风险", benefitLevel: "中", lens: "死亡率", evidence: "A", source: "第1节第21条（50岁以后打带状疱疹疫苗）", note: "两针自费约3000到4000元，性价比因价格排得靠后" },
  { id: "pneumo", label: "A", text: "65岁以上咨询肺炎球菌疫苗", costs: ["钱", "时间"], benefit: "降低部分肺炎球菌感染风险", benefitLevel: "中", lens: "死亡率", evidence: "A", source: "第1节第22条（65岁以上打肺炎球菌疫苗）", note: "不能理解成能预防所有肺炎；试验疫苗与中国常见疫苗不完全相同" },
  { id: "h-pylori", label: "B", text: "按适用人群查幽门螺杆菌，阳性后按医嘱根除", costs: ["钱", "时间", "毅力"], benefit: "降低胃癌风险", benefitLevel: "大", lens: "死亡率", evidence: "A", source: "第1节第23条（查幽门螺杆菌，阳性就根除）", note: "研究对象来自胃癌高发区，低发区人群收益可能更小" },
  { id: "lung-ct", label: "C", text: "符合高危吸烟条件时每年做低剂量胸部CT", costs: ["钱", "时间"], benefit: "降低高危吸烟者肺癌死亡风险", benefitLevel: "大", lens: "死亡率", evidence: "A", source: "第1节第24条（重度吸烟者每年做一次低剂量胸部CT）", note: "只适用于55至74岁、吸烟史30包年以上且戒烟不超过15年等高危条件" },
];

const prompts = [
  "你刚搬进新家，只有一个下午做安全改造，优先哪件？",
  "你每天通勤骑车，准备只买一件安全装备，优先哪件？",
  "家里预算有限，想先处理一项高损失风险，选哪件？",
  "长辈最近想改善健康，你会先建议哪件？",
  "你准备带孩子出门，以下哪项最值得先做？",
  "朋友说‘偶尔一次没关系’，你会优先坚持哪项？",
  "你有一个周末和500元预算，以下哪项优先？",
  "体检前只能选一项低成本检查，你会先选哪项？",
  "你想把家里的逃生风险降下来，先做哪件？",
  "你正在整理家庭健康清单，哪项最先加入？",
  "如果只能坚持一个长期习惯，你会选哪项？",
  "你想给父母做一次健康投入，先考虑哪项？",
  "你被建议做一项筛查，哪项最值得按条件完成？",
  "你在比较一次性花钱和长期坚持，哪项更值得？",
  "面对‘收益大但有条件’的建议，你会先选哪项？",
  "以下都是预防性行动，你最愿意先落实哪项？",
  "你想减少未来大额医疗麻烦，先做哪项？",
  "你有半天空闲，想完成一项可验证的健康行动，选哪项？",
  "家里有人属于高危人群，你会先核对哪项？",
  "面对证据等级不同的建议，你会先做哪项？",
  "你需要在低成本和高收益之间做一次取舍，选哪项？",
  "你准备把指南变成家庭待办清单，第一项是什么？",
  "如果今天只做一件降低死亡风险的事，你选哪项？",
  "你会先为自己还是家人安排哪项预防行动？",
];

export const questions: Question[] = prompts.map((prompt, index) => {
  const start = (index * 3) % actions.length;
  const selected = [0, 1, 2].map((offset) => actions[(start + offset) % actions.length]);
  return {
    id: `q${index + 1}`,
    title: `第 ${index + 1} 题｜先做哪一件？`,
    prompt,
    choices: selected.map((choice, optionIndex) => ({ ...choice, id: String.fromCharCode(65 + optionIndex), label: String.fromCharCode(65 + optionIndex) })),
  };
});

export function getQuestion(id: string) {
  return questions.find((question) => question.id === id) ?? questions[0];
}

export function scoreChoice(choice: Choice) {
  const costScore = choice.costs.length;
  const tier = choice.benefitLevel === "大" ? (costScore === 0 ? "极高" : costScore <= 2 ? "高" : "一般") : choice.benefitLevel === "中" ? (costScore === 0 ? "高" : "一般") : "一般";
  return { costScore, tier };
}
