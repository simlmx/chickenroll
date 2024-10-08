import { UserId } from "@lefun/core";

import { getNumStepsForSum } from "../math";
import { CurrentPositions, MountainShape } from "../types";

// https://stackoverflow.com/a/43053803/1067132
export const cartesian = <T>(...a: T[][]): T[][] =>
  (a as any).reduce((a: any, b: any) =>
    a.flatMap((d: any) => b.map((e: any) => [d, e].flat())),
  );

export const diceValues2sums = (diceValues: number[]): Set<number> => {
  const sums: Set<number> = new Set();
  // We go through [i, j] in
  // [0, 1] [0, 2], [0, 3]
  // [1, 2] [1, 3],
  // [2, 3]
  for (let i = 0; i < diceValues.length - 1; i++) {
    // This is where you'll capture that last value
    for (let j = i + 1; j < diceValues.length; j++) {
      sums.add(diceValues[i] + diceValues[j]);
    }
  }
  return sums;
};

export class OddsCalculator {
  numDice: number;
  numSides: number;
  // FIXME rename?
  dice2sums: Set<number>[];

  constructor(numDice: number = 4, numSides: number = 6) {
    this.numDice = numDice;
    this.numSides = numSides;
    this.dice2sums = this.buildDice2sums();
  }

  buildDice2sums(): Set<number>[] {
    const diceSides: number[] = Array(this.numSides)
      .fill(null)
      .map((_, i) => i + 1);

    // All the possibilities of N dice.
    const allDiceValues = cartesian<number>(
      ...Array(this.numDice).fill(diceSides),
    );

    return allDiceValues.map((diceValues) => diceValues2sums(diceValues));
  }

  oddsBust(allowedSums: number[]): number {
    return 1 - this.oddsNoBust(allowedSums);
  }

  oddsNoBust(allowedSums: number[]): number {
    const allowedSumsSet = new Set(allowedSums);

    let numSuccess = 0;
    this.dice2sums.forEach((sums) => {
      for (const sum of sums) {
        if (allowedSumsSet.has(sum)) {
          numSuccess += 1;
          break;
        }
      }
    });
    return numSuccess / this.dice2sums.length;
  }

  /*
   * Same as `oddsBust` but also provide a list of columns that are forbidden. If a set
   * of dice lets us move on a forbidden column, that ones counts as a bust.
   */
  oddsNeedsForbidden(
    allowed: number,
    forbidden: Set<number> = new Set(),
  ): number {
    let numSuccess = 0;

    this.dice2sums.forEach((sums) => {
      let foundAllowed = false;
      let foundForbidden = false;

      for (const sum of sums) {
        if (forbidden.has(sum)) {
          foundForbidden = true;
          break;
        } else if (allowed === sum) {
          foundAllowed = true;
        }
      }

      if (foundAllowed && !foundForbidden) {
        numSuccess++;
      }
    });
    return numSuccess / this.dice2sums.length;
  }
}

export function getAllowedColumns(
  currentPositions: CurrentPositions,
  blockedSums: Record<number, UserId>,
  mountainShape: MountainShape,
) {
  // We start with the blocked columns.
  const blockedSumsSet = new Set(
    Object.keys(blockedSums).map((x) => parseInt(x)),
  );
  // To which we add the columns for which the current position is at the last step,
  // which makes them blocked too.
  Object.entries(currentPositions).forEach(([sum, step]) => {
    if (step === getNumStepsForSum(parseInt(sum), mountainShape)) {
      blockedSumsSet.add(parseInt(sum));
    }
  });

  let all: number[];
  if (Object.keys(currentPositions).length < 3) {
    // If not all the runners are there, allowed columns are everything but the blocked
    // columns.

    all = [2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];
  } else {
    // If all the runners are available, then, we only have access to those
    all = Object.keys(currentPositions).map((x) => parseInt(x));
  }

  // Then remove the blocked ones.
  const allowed = all.filter((s) => !blockedSumsSet.has(s));
  return allowed;
}

let oddsCalculator: OddsCalculator | null = null;
/* OddsCalculator Singleton */
export const getOddsCalculator = () => {
  if (oddsCalculator == null) {
    oddsCalculator = new OddsCalculator();
  }
  return oddsCalculator;
};
