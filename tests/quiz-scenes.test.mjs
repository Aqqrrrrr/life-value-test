import assert from "node:assert/strict";
import test from "node:test";
import { buildQuestions } from "../lib/quiz-scenes.mjs";

const actions = [
  { id: "smoke", scene: "home", source: "第1节第3条" },
  { id: "gas", scene: "home", source: "第1节第4条" },
  { id: "bike", scene: "home", source: "第1节第6条" },
  { id: "seatbelt", scene: "road", source: "第1节第1条" },
];

test("buildQuestions keeps a new-home question within the home-safety scene", () => {
  const [question] = buildQuestions(actions, [{
    id: "q1",
    scene: "home",
    prompt: "你刚搬进新家，只有一个下午做安全改造，优先哪件？",
    actionIds: ["smoke", "gas", "bike"],
  }]);

  assert.deepEqual(question.choices.map((choice) => choice.source), ["第1节第3条", "第1节第4条", "第1节第6条"]);
});

test("buildQuestions rejects an action from another scene", () => {
  assert.throws(() => buildQuestions(actions, [{
    id: "q1",
    scene: "home",
    prompt: "你刚搬进新家，只有一个下午做安全改造，优先哪件？",
    actionIds: ["smoke", "gas", "seatbelt"],
  }]), /不属于/);
});
