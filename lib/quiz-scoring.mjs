export function normalizeRanking(input, validIds) {
  const groups = input.toUpperCase().replace(/\s+/g, "").split(">").filter(Boolean).map((group) => group.split("=").filter(Boolean));
  const flattened = groups.flat();
  if (flattened.length !== validIds.length || new Set(flattened).size !== validIds.length || flattened.some((id) => !validIds.includes(id))) {
    throw new Error("请使用 A > B = C 的格式，并且每个选项只出现一次");
  }
  return groups;
}

export function compareRanking(answer, expected) {
  return JSON.stringify(answer) === JSON.stringify(expected);
}
