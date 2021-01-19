import { getSumOptions } from "../math";
import each from "jest-each";

describe("testGetSumOptions", () => {
  each([
    [
      [1, 1, 2, 2],
      {},
      {},
      {},
      [{ diceSums: [2, 4] }, { diceSums: [3, 3] }, { diceSums: [3, 3] }],
    ],
    [
      [1, 2, 3, 4],
      {},
      {},
      {},
      [{ diceSums: [3, 7] }, { diceSums: [4, 6] }, { diceSums: [5, 5] }],
    ],
    [
      [1, 2, 3, 4],
      {},
      {},
      { 5: 0 },
      [{ diceSums: [3, 7] }, { diceSums: [4, 6] }, { diceSums: [null, null] }],
    ],
    [
      [1, 2, 3, 4],
      { 5: 7 },
      {},
      { 6: 0 },
      [{ diceSums: [3, 7] }, { diceSums: [4, null] }, { diceSums: [5, 5] }],
    ],
    [
      [1, 2, 3, 4],
      { 5: 6 },
      {},
      { 6: 0 },
      [{ diceSums: [3, 7] }, { diceSums: [4, null] }, { diceSums: [5, 5] }],
    ],
    [
      [1, 2, 3, 4],
      { 4: 1, 12: 1 },
      {},
      { 6: 0 },
      [
        { diceSums: [3, 7], split: true },
        { diceSums: [4, null] },
        { diceSums: [5, 5] },
      ],
    ],
    [
      [1, 2, 3, 4],
      // current climbers
      { 4: 1, 12: 1 },
      // checkpoints
      { 5: 8 },
      // blocked
      { 6: 0 },
      [
        { diceSums: [3, 7], split: true },
        { diceSums: [4, null] },
        { diceSums: [5, null] },
      ],
    ],
    [
      [1, 2, 3, 4],
      { 4: 1, 12: 1 },
      { 5: 7 },
      { 6: 0 },
      [
        { diceSums: [3, 7], split: true },
        { diceSums: [4, null] },
        { diceSums: [5, 5] },
      ],
    ],
    // All climbers on the board, almost done with diceSum=7
    [
      [1, 2, 3, 4],
      { 7: 11, 2: 1, 3: 1 },
      { 1: 2, 3: 4 },
      {},
      [
        { diceSums: [3, 7] },
        { diceSums: [null, null] },
        { diceSums: [null, null] },
      ],
    ],
    [
      [1, 2, 3, 4],
      // current climbers
      { 7: 12, 2: 1, 3: 4 },
      // checkpoints
      { 1: 2, 3: 3 },
      {},
      [
        { diceSums: [3, 7] },
        { diceSums: [null, null] },
        { diceSums: [null, null] },
      ],
    ],
    [
      [5, 3, 3, 5],
      // current
      { 7: 1, 12: 1 },
      { 3: 3 },
      { 10: 0 },
      [{ diceSums: [8, 8] }, { diceSums: [8, 8] }, { diceSums: [null, 6] }],
    ],
    [
      [4, 6, 5, 5],
      {},
      {},
      { 10: 0, 9: 0, 11: 0 },
      [
        { diceSums: [null, null] },
        { diceSums: [null, null] },
        { diceSums: [null, null] },
      ],
    ],
    [
      [3, 3, 4, 4],
      { 2: 1, 3: 1 },
      {},
      { 6: 0, 8: 0 },
      [{ diceSums: [null, null] }, { diceSums: [7, 7] }, { diceSums: [7, 7] }],
    ],
    [
      [3, 3, 3, 3],
      {},
      { "6": 10 },
      {},
      [
        { diceSums: [6, null] },
        { diceSums: [6, null] },
        { diceSums: [6, null] },
      ],
    ],
    // A bunch of cases for double-12.
    // [ ] [ ] [ ]
    [
      [6, 6, 6, 6],
      {},
      {},
      {},
      [{ diceSums: [12, 12] }, { diceSums: [12, 12] }, { diceSums: [12, 12] }],
    ],
    // [x] [ ] [ ]
    [
      [6, 6, 6, 6],
      { "12": 1 },
      {},
      {},
      [{ diceSums: [12, 12] }, { diceSums: [12, 12] }, { diceSums: [12, 12] }],
    ],
    // [ ] [x] [ ]
    [
      [6, 6, 6, 6],
      { "12": 2 },
      {},
      {},
      [
        { diceSums: [12, null] },
        { diceSums: [12, null] },
        { diceSums: [12, null] },
      ],
    ],
    // [X] [ ] [ ]
    [
      [6, 6, 6, 6],
      {},
      { "12": 1 },
      {},
      [{ diceSums: [12, 12] }, { diceSums: [12, 12] }, { diceSums: [12, 12] }],
    ],
    // [ ] [X] [ ]
    [
      [6, 6, 6, 6],
      {},
      { "12": 2 },
      {},
      [
        { diceSums: [12, null] },
        { diceSums: [12, null] },
        { diceSums: [12, null] },
      ],
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
          { "0": checkpointPositions },
          blockedSums,
          "classic",
          "share",
          "0"
        )
      ).toEqual(expected);

      // In jump mode it should be the same since we don't have opponents in these
      // tests.
      expect(
        getSumOptions(
          diceValues,
          climberPositions,
          { "0": checkpointPositions },
          blockedSums,
          "classic",
          "jump",
          "0"
        )
      ).toEqual(expected);
    }
  );
});

describe("testGetSumOptionsJump", () => {
  each([
    // Opponents on the other columns.
    [
      [3, 4, 3, 4],
      { "7": 12 },
      { "1": { "7": 10 } },
      {},
      [{ diceSums: [7, null] }, { diceSums: [6, 8] }, { diceSums: [7, null] }],
    ],
    // Opponents on the same column
    [
      [3, 4, 3, 4],
      { "7": 11 },
      { "1": { "7": 12 } },
      {},
      [{ diceSums: [7, null] }, { diceSums: [6, 8] }, { diceSums: [7, null] }],
    ],
    [
      [3, 4, 3, 4],
      { "7": 10 },
      { "1": { "7": 12 }, "2": { "7": 11 } },
      {},
      [{ diceSums: [7, null] }, { diceSums: [6, 8] }, { diceSums: [7, null] }],
    ],
    [
      [3, 4, 3, 4],
      { "7": 9 },
      { "1": { "7": 12 }, "2": { "7": 10 } },
      {},
      [{ diceSums: [7, 7] }, { diceSums: [6, 8] }, { diceSums: [7, 7] }],
    ],
    [
      [3, 3, 3, 3],
      {},
      { "0": { "6": 10 } },
      {},
      [
        { diceSums: [6, null] },
        { diceSums: [6, null] },
        { diceSums: [6, null] },
      ],
    ],
    // A bunch of cases for double-12.
    // [x] [o] []
    [
      [6, 6, 6, 6],
      { "12": 1 },
      { "1": { "12": 2 } },
      {},
      [
        { diceSums: [12, null] },
        { diceSums: [12, null] },
        { diceSums: [12, null] },
      ],
    ],
    // [X] [o] []
    [
      [6, 6, 6, 6],
      {},
      { "0": { "12": 1 }, "1": { "12": 2 } },
      {},
      [
        { diceSums: [12, null] },
        { diceSums: [12, null] },
        { diceSums: [12, null] },
      ],
    ],
    // [o] [ ] []
    [
      [6, 6, 6, 6],
      {},
      { "1": { "12": 1 } },
      {},
      [{ diceSums: [12, 12] }, { diceSums: [12, 12] }, { diceSums: [12, 12] }],
    ],
    // [ ] [o] []
    [
      [6, 6, 6, 6],
      {},
      { "1": { "12": 2 } },
      {},
      [{ diceSums: [12, 12] }, { diceSums: [12, 12] }, { diceSums: [12, 12] }],
    ],
    // [o] [o] []
    [
      [6, 6, 6, 6],
      {},
      { "1": { "12": 2 }, "2": { "12": 1 } },
      {},
      [
        { diceSums: [12, null] },
        { diceSums: [12, null] },
        { diceSums: [12, null] },
      ],
    ],
    // [o] [x] []
    [
      [6, 6, 6, 6],
      {},
      { "1": { "12": 2 }, "2": { "12": 1 } },
      {},
      [
        { diceSums: [12, null] },
        { diceSums: [12, null] },
        { diceSums: [12, null] },
      ],
    ],

    // Double with [x] [o] [ ] [o] [ ]
    [
      [5, 6, 5, 6],
      { "11": 1 },
      { "2": { "11": 2 }, "3": { "11": 4 } },
      {},
      [{ diceSums: [11, 11] }, { diceSums: [10, 12] }, { diceSums: [11, 11] }],
    ],

    // Double with [x] [o] [o] [ ] [o] [o] [ ]
    [
      [4, 5, 4, 5],
      { "9": 1 },
      { "2": { "9": 2 }, "3": { "9": 3 }, "4": { "9": 5 }, "5": { "9": 6 } },
      {},
      [{ diceSums: [9, 9] }, { diceSums: [8, 10] }, { diceSums: [9, 9] }],
    ],

    // Double with [x] [o] [o] [o] [o] [o] [ ]
    [
      [4, 6, 4, 6],
      { "10": 1 },
      {
        "2": { "10": 2 },
        "3": { "10": 3 },
        "6": { "10": 4 },
        "4": { "10": 5 },
        "5": { "10": 6 },
      },
      {},
      [
        { diceSums: [10, null] },
        { diceSums: [8, 12] },
        { diceSums: [10, null] },
      ],
    ],
  ]).it(
    "case '%s %s %s %s %s'",
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
          blockedSums,
          "classic",
          "jump",
          "0"
        )
      ).toEqual(expected);
    }
  );
});
