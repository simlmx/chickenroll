import { expect, test } from "vitest";

import { getSumOptions, SumOption } from "../math";

/*
 * Convenient function to create a SumOption object
 */
const so = (
  d0: number,
  d1: number,
  enabled0?: boolean,
  enabled1?: boolean,
  forceSplit = false,
): SumOption => {
  const diceSums: [number, number] = [d0, d1];
  const enabled: [boolean, boolean] = [
    enabled0 == null ? true : enabled0,
    enabled1 == null ? true : enabled1,
  ];

  return { diceSums, enabled, split: enabled0 !== enabled1 || forceSplit };
};

test.each<any[]>([
  [[1, 1, 2, 2], {}, {}, {}, [so(2, 4), so(3, 3), so(3, 3)]],
  [[1, 2, 3, 4], {}, {}, {}, [so(3, 7), so(4, 6), so(5, 5)]],
  [
    [1, 2, 3, 4],
    {},
    {},
    { 5: 0 },
    [so(3, 7), so(4, 6), so(5, 5, false, false)],
  ],
  [
    [1, 2, 3, 4],
    { 5: 7 },
    {},
    { 6: 0 },
    [so(3, 7), so(4, 6, true, false), so(5, 5)],
  ],
  [
    [1, 2, 3, 4],
    { 5: 6 },
    {},
    { 6: 0 },
    [so(3, 7), so(4, 6, true, false), so(5, 5)],
  ],
  [
    [1, 2, 3, 4],
    { 4: 1, 12: 1 },
    {},
    { 6: 0 },
    [so(3, 7, true, true, true), so(4, 6, true, false), so(5, 5)],
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
      so(3, 7, true, true, true),
      so(4, 6, true, false),
      so(5, 5, true, true, true),
    ],
  ],
  [
    [1, 2, 3, 4],
    { 4: 1, 12: 1 },
    { 5: 7 },
    { 6: 0 },
    [so(3, 7, true, true, true), so(4, 6, true, false), so(5, 5)],
  ],
  // All climbers on the board, almost done with diceSum=7
  [
    [1, 2, 3, 4],
    { 7: 11, 2: 1, 3: 1 },
    { 1: 2, 3: 4 },
    {},
    [so(3, 7), so(4, 6, false, false), so(5, 5, false, false)],
  ],
  [
    [1, 2, 3, 4],
    // current climbers
    { 7: 12, 2: 1, 3: 4 },
    // checkpoints
    { 1: 2, 3: 3 },
    {},
    [so(3, 7), so(4, 6, false, false), so(5, 5, false, false)],
  ],
  [
    [5, 3, 3, 5],
    // current
    { 7: 1, 12: 1 },
    { 3: 3 },
    { 10: 0 },
    [so(8, 8), so(8, 8), so(10, 6, false, true)],
  ],
  [
    [4, 6, 5, 5],
    {},
    {},
    { 10: 0, 9: 0, 11: 0 },
    [
      so(10, 10, false, false),
      so(9, 11, false, false),
      so(9, 11, false, false),
    ],
  ],
  [
    [3, 3, 4, 4],
    { 2: 1, 3: 1 },
    {},
    { 6: 0, 8: 0 },
    [so(6, 8, false, false), so(7, 7), so(7, 7)],
  ],
  [
    [3, 3, 3, 3],
    {},
    { "6": 10 },
    {},
    [
      so(6, 6, true, true, true),
      so(6, 6, true, true, true),
      so(6, 6, true, true, true),
    ],
  ],
  // A bunch of cases for double-12.
  // [ ] [ ] [ ]
  [[6, 6, 6, 6], {}, {}, {}, [so(12, 12), so(12, 12), so(12, 12)]],
  // [x] [ ] [ ]
  [[6, 6, 6, 6], { "12": 1 }, {}, {}, [so(12, 12), so(12, 12), so(12, 12)]],
  // [ ] [x] [ ]
  [
    [6, 6, 6, 6],
    { "12": 2 },
    {},
    {},
    [
      so(12, 12, true, true, true),
      so(12, 12, true, true, true),
      so(12, 12, true, true, true),
    ],
  ],
  // [X] [ ] [ ]
  [[6, 6, 6, 6], {}, { "12": 1 }, {}, [so(12, 12), so(12, 12), so(12, 12)]],
  // [ ] [X] [ ]
  [
    [6, 6, 6, 6],
    {},
    { "12": 2 },
    {},
    [
      so(12, 12, true, true, true),
      so(12, 12, true, true, true),
      so(12, 12, true, true, true),
    ],
  ],
  // We are already climbing 2 columns.
  [
    [1, 2, 3, 4],
    { "6": 1, "12": 1 },
    {},
    {},
    [
      so(3, 7, true, true, true),
      so(4, 6, true, true, false),
      so(5, 5, true, true, false),
    ],
  ],
])(
  "testGetSumOptions %s %s %s %s",
  (
    diceValues: number[],
    climberPositions: { [col: string]: number },
    checkpointPositions: { [col: string]: number },
    blockedSums: { [col: string]: string },
    expected: SumOption[],
  ) => {
    expect(
      getSumOptions(
        diceValues,
        climberPositions,
        { "0": checkpointPositions },
        blockedSums,
        "classic",
        "share",
        "0",
      ),
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
        "0",
      ),
    ).toEqual(expected);
  },
);

test.each([
  // Opponents on the other columns.
  [
    [3, 4, 3, 4],
    { "7": 12 },
    { "1": { "7": 10 } },
    {},
    [so(7, 7, true, true, true), so(6, 8), so(7, 7, true, true, true)],
  ],
  // Opponents on the same column
  [
    [3, 4, 3, 4],
    { "7": 11 },
    { "1": { "7": 12 } },
    {},
    [so(7, 7, true, true, true), so(6, 8), so(7, 7, true, true, true)],
  ],
  [
    [3, 4, 3, 4],
    { "7": 10 },
    { "1": { "7": 12 }, "2": { "7": 11 } },
    {},
    [so(7, 7, true, true, true), so(6, 8), so(7, 7, true, true, true)],
  ],
  [
    [3, 4, 3, 4],
    { "7": 9 },
    { "1": { "7": 12 }, "2": { "7": 10 } },
    {},
    [so(7, 7), so(6, 8), so(7, 7)],
  ],
  [
    [3, 3, 3, 3],
    {},
    { "0": { "6": 10 } },
    {},
    [
      so(6, 6, true, true, true),
      so(6, 6, true, true, true),
      so(6, 6, true, true, true),
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
      so(12, 12, true, true, true),
      so(12, 12, true, true, true),
      so(12, 12, true, true, true),
    ],
  ],
  // [X] [o] []
  [
    [6, 6, 6, 6],
    {},
    { "0": { "12": 1 }, "1": { "12": 2 } },
    {},
    [
      so(12, 12, true, true, true),
      so(12, 12, true, true, true),
      so(12, 12, true, true, true),
    ],
  ],
  // [o] [ ] []
  [
    [6, 6, 6, 6],
    {},
    { "1": { "12": 1 } },
    {},
    [so(12, 12), so(12, 12), so(12, 12)],
  ],
  // [ ] [o] []
  [
    [6, 6, 6, 6],
    {},
    { "1": { "12": 2 } },
    {},
    [so(12, 12), so(12, 12), so(12, 12)],
  ],
  // [o] [o] []
  [
    [6, 6, 6, 6],
    {},
    { "1": { "12": 2 }, "2": { "12": 1 } },
    {},
    [
      so(12, 12, true, true, true),
      so(12, 12, true, true, true),
      so(12, 12, true, true, true),
    ],
  ],
  // [o] [x] []
  [
    [6, 6, 6, 6],
    {},
    { "1": { "12": 2 }, "2": { "12": 1 } },
    {},
    [
      so(12, 12, true, true, true),
      so(12, 12, true, true, true),
      so(12, 12, true, true, true),
    ],
  ],

  // Double with [x] [o] [ ] [o] [ ]
  [
    [5, 6, 5, 6],
    { "11": 1 },
    { "2": { "11": 2 }, "3": { "11": 4 } },
    {},
    [so(11, 11), so(10, 12), so(11, 11)],
  ],

  // Double with [x] [o] [o] [ ] [o] [o] [ ]
  [
    [4, 5, 4, 5],
    { "9": 1 },
    { "2": { "9": 2 }, "3": { "9": 3 }, "4": { "9": 5 }, "5": { "9": 6 } },
    {},
    [so(9, 9), so(8, 10), so(9, 9)],
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
    [so(10, 10, true, true, true), so(8, 12), so(10, 10, true, true, true)],
  ],
])(
  "testGetSumOptionsJump %s %s %s %s %s",
  (
    diceValues: number[],
    climberPositions: { [col: string]: number },
    checkpointPositions: { [userId: string]: { [col: string]: number } },
    blockedSums: { [col: string]: string },
    expected: SumOption[],
  ) => {
    expect(
      getSumOptions(
        diceValues,
        climberPositions,
        checkpointPositions,
        blockedSums,
        "classic",
        "jump",
        "0",
      ),
    ).toEqual(expected);
  },
);
