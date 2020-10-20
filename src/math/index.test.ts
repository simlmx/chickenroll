import { getSumOptions } from "../math";
import each from "jest-each";

describe("testGetSumOptions", () => {
  each([
    [[1, 1, 2, 2], {}, {}, [[[2, 4]], [[3, 3]], [[3, 3]]]],
    [[1, 2, 3, 4], {}, {}, [[[3, 7]], [[4, 6]], [[5, 5]]]],
    [[1, 2, 3, 4], {}, { 5: 0 }, [[[3, 7]], [[4, 6]], [[]]]],
    [[1, 2, 3, 4], { 5: 7 }, { 6: 0 }, [[[3, 7]], [[4]], [[5]]]],
    [[1, 2, 3, 4], { 5: 6 }, { 6: 0 }, [[[3, 7]], [[4]], [[5, 5]]]],
    [[1, 2, 3, 4], { 4: 1, 12: 1 }, { 6: 0 }, [[[3], [7]], [[4]], [[5, 5]]]],
  ]).it("case '%s'", (diceValues, climberPositions, blockedSums, expected) => {
    expect(getSumOptions(diceValues, climberPositions, blockedSums)).toEqual(
      expected
    );
  });
});
