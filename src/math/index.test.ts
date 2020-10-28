import { getSumOptions } from "../math";
import each from "jest-each";

describe("testGetSumOptions", () => {
  each([
    [
      [1, 1, 2, 2],
      {},
      {},
      {},
      [{ sums: [2, 4] }, { sums: [3, 3] }, { sums: [3, 3] }],
    ],
    [
      [1, 2, 3, 4],
      {},
      {},
      {},
      [{ sums: [3, 7] }, { sums: [4, 6] }, { sums: [5, 5] }],
    ],
    [
      [1, 2, 3, 4],
      {},
      {},
      { 5: 0 },
      [{ sums: [3, 7] }, { sums: [4, 6] }, { sums: [null, null] }],
    ],
    [
      [1, 2, 3, 4],
      { 5: 7 },
      {},
      { 6: 0 },
      [{ sums: [3, 7] }, { sums: [4, null] }, { sums: [5, 5] }],
    ],
    [
      [1, 2, 3, 4],
      { 5: 6 },
      {},
      { 6: 0 },
      [{ sums: [3, 7] }, { sums: [4, null] }, { sums: [5, 5] }],
    ],
    [
      [1, 2, 3, 4],
      { 4: 1, 12: 1 },
      {},
      { 6: 0 },
      [{ sums: [3, 7], split: true }, { sums: [4, null] }, { sums: [5, 5] }],
    ],
    [
      [1, 2, 3, 4],
      // current climbers
      { 4: 1, 12: 1 },
      // checkpoints
      { 5: 8 },
      // blocked
      { 6: 0 },
      [{ sums: [3, 7], split: true }, { sums: [4, null] }, { sums: [5, null] }],
    ],
    [
      [1, 2, 3, 4],
      { 4: 1, 12: 1 },
      { 5: 7 },
      { 6: 0 },
      [{ sums: [3, 7], split: true }, { sums: [4, null] }, { sums: [5, 5] }],
    ],
    // All climbers on the board, almost done with diceSum=7
    [
      [1, 2, 3, 4],
      { 7: 11, 2: 1, 3: 1 },
      { 1: 2, 3: 4 },
      {},
      [{ sums: [3, 7] }, { sums: [null, null] }, { sums: [null, null] }],
    ],
    [
      [1, 2, 3, 4],
      // current climbers
      { 7: 12, 2: 1, 3: 4 },
      // checkpoints
      { 1: 2, 3: 3 },
      {},
      [{ sums: [3, 7] }, { sums: [null, null] }, { sums: [null, null] }],
    ],
    [
      [5, 3, 3, 5],
      // current
      { 7: 1, 12: 1 },
      { 3: 3 },
      { 10: 0 },
      [{ sums: [8, 8] }, { sums: [8, 8] }, { sums: [null, 6] }],
    ],
    [
      [4, 6, 5, 5],
      {},
      {},
      { 10: 0, 9: 0, 11: 0 },
      [{ sums: [null, null] }, { sums: [null, null] }, { sums: [null, null] }],
    ],
    [
      [3, 3, 4, 4],
      { 2: 1, 3: 1 },
      {},
      { 6: 0, 8: 0 },
      [{ sums: [null, null] }, { sums: [7, 7] }, { sums: [7, 7] }],
    ],
  ]).it(
    "case '%s %s %s %s'",
    (
      diceValues,
      climberPositions,
      checkpointPositions,
      blockedSums,
      expected
    ) => {
      expect(
        getSumOptions(
          diceValues,
          climberPositions,
          checkpointPositions,
          blockedSums
        )
      ).toEqual(expected);
    }
  );
});
