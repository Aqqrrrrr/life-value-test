import { actions, buildQuestions, questionSpecs } from "./quiz-scenes.mjs";

export type BenefitLevel = "大" | "中" | "小";

export type Choice = {
  id: string;
  label: string;
  scene: string;
  text: string;
  condition: string;
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

export const questions: Question[] = buildQuestions(actions, questionSpecs);

export function getQuestion(id: string) {
  return questions.find((question) => question.id === id) ?? questions[0];
}

export function scoreChoice(choice: Choice) {
  const costScore = choice.costs.length;
  const tier = choice.benefitLevel === "大" ? (costScore === 0 ? "极高" : costScore <= 2 ? "高" : "一般") : choice.benefitLevel === "中" ? (costScore === 0 ? "高" : "一般") : "一般";
  return { costScore, tier };
}
