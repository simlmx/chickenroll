import { getNumStepsForSum } from "../math";
import { NUM_COLORS } from "../constants";

type Dice2sums = { [key: string]: Set<number> };

// https://stackoverflow.com/a/12628791/1067132
const _f = (a, b) => [].concat(...a.map((d) => b.map((e) => [].concat(d, e))));
export const cartesian = (...c) => c.reduce(_f);

export const diceValues2sums = (diceValues: number[]): Set<number> => {
  const sums: Set<number> = new Set();
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
  dice2sums: Dice2sums;

  constructor(numDice: number = 4, numSides: number = 6) {
    this.numDice = numDice;
    this.numSides = numSides;
    this.dice2sums = this.buildDice2sums();
  }

  buildDice2sums(): Dice2sums {
    const diceSides: number[] = Array(this.numSides)
      .fill(null)
      .map((_, i) => i + 1);

    // All the possibilities of N dice.
    const allDiceValues = cartesian(...Array(this.numDice).fill(diceSides));

    const dice2sums: Dice2sums = {};

    // For each possibilty, we'll find the set of sums of 2 dice that can be made with those dice.
    allDiceValues.forEach((diceValues) => {
      const sums: Set<number> = new Set();
      for (let i = 0; i < diceValues.length - 1; i++) {
        // This is where you'll capture that last value
        for (let j = i + 1; j < diceValues.length; j++) {
          sums.add(diceValues[i] + diceValues[j]);
        }
      }
      dice2sums[diceValues] = diceValues2sums(diceValues);
    });

    return dice2sums;
  }

  oddsBust(allowedSums: number[]): number {
    const allowedSumsSet = new Set(allowedSums);

    let numSuccess = 0;
    Object.values(this.dice2sums).forEach((sums) => {
      for (let sum of sums) {
        if (allowedSumsSet.has(sum)) {
          numSuccess += 1;
          break;
        }
      }
    });
    return 1 - numSuccess / Math.pow(this.numSides, this.numDice);
  }
}

export function getAllowedColumns(currentPositions, blockedSums) {
  // We start with the blocked columns.
  const blockedSumsSet = new Set(
    Object.keys(blockedSums).map((x) => parseInt(x))
  );
  // To which we add the columns for which the current position is at the last step,
  // which makes them blocked too.
  Object.entries(currentPositions).forEach(([sum, step]) => {
    if (step === getNumStepsForSum(parseInt(sum))) {
      blockedSumsSet.add(parseInt(sum));
    }
  });

  let all: number[];
  if (Object.keys(currentPositions).length < 3) {
    // If not all the runners are there, allowed columns are everything but the blocked
    // columns.

    // this is just [2, 3, ..., 12]
    all = [2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];
  } else {
    // If all the runners are available, then, we only have access to those
    all = Object.keys(currentPositions).map((x) => parseInt(x));
  }

  // Then remove the blocked ones.
  const allowed = all.filter((s) => !blockedSumsSet.has(s));
  return allowed;
}

/* Roll a die */
export const rollDie = (): number => Math.floor(Math.random() * 6) + 1;

/* Roll n dice */
export const rollDice = (n: number): number[] =>
  Array(n).fill(null).map(rollDie);

/* Randomly pick a color */
export const pickColor = (): number => Math.floor(Math.random() * NUM_COLORS);
