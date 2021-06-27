import { climbOneStep } from ".";

test.each([
  ["share", {}, {}, 1],
  ["jump", {}, {}, 1],
  ["share", { 7: 2 }, {}, 3],
  ["jump", { 7: 2 }, {}, 3],
  ["share", { 7: 2 }, { 7: 3 }, 3],
  ["jump", { 7: 2 }, { 1: { 7: 3 } }, 4],
  ["jump", { 7: 2 }, { 1: { 7: 4 } }, 3],
  ["jump", { 7: 2 }, { 1: { 7: 3 }, 2: { 7: 4 } }, 5],
  ["jump", { 7: 2 }, { 1: { 7: 3 }, 2: { 7: 5 } }, 4],
  ["jump", {}, { 1: { 7: 3 } }, 1],
  ["jump", {}, { 1: { 7: 1 } }, 2],
])(
  "testClimbOneStep %s %s %s %s",
  (
    sameSpace: "share" | "jump",
    currentPositions: { [col: string]: number },
    checkpointPositions: { [userId: string]: { [col: string]: number } },
    expected: number
  ) => {
    expect(
      climbOneStep(currentPositions, checkpointPositions, 7, "0", sameSpace)
    ).toEqual(expected);
  }
);
