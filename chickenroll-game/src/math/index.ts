import { UserId } from "bgkit";
import { DiceSum, MountainShape, SameSpace } from "../types";
import { NUM_STEPS } from "../constants";

export const DICE_INDICES = [
  [
    [0, 1],
    [2, 3],
  ],
  [
    [0, 2],
    [1, 3],
  ],
  [
    [0, 3],
    [1, 2],
  ],
];

// For one split of dices.
export type SumOption = {
  // The 2 sums that correspond to the two columns
  diceSums: [number, number];
  // Split-case: can we select each of the sum.
  enabled: [boolean, boolean];
  // Is it two different options?
  split: boolean;
};

/*
 * Given the state of the game, how many spaces are left for player `playerID` on column
 * `column`?
 *
 * This is basically the number of step left minus the number of people in the way, IF
 * in jump mode.
 */
const getSpaceLeft = (
  currentPositions: { [key: string]: number },
  checkpointPositions: { [key: number]: { [key: number]: number } },
  mountainShape: MountainShape,
  sameSpace: SameSpace,
  column: number,
  userId: UserId
) => {
  const startStep =
    currentPositions[column] || checkpointPositions[userId]?.[column] || 0;

  let space = getNumStepsForSum(column, mountainShape) - startStep;

  // Now if we are in 'jump' mode, we need to subtract the number of other players in
  // those spaces.
  if (sameSpace === "jump") {
    Object.values(checkpointPositions).forEach((playerCheckpoints) => {
      const otherPlayerCurrentStep = playerCheckpoints[column.toString()];
      // If that other player is on the same column and more advanced than us, then it's
      // a space we need to remove.
      if (
        otherPlayerCurrentStep != null &&
        otherPlayerCurrentStep > startStep
      ) {
        space--;
      }
    });
  }
  return space;
};

/*
 * Compute the 3 options the current player has given the state of the game and the dice
 * he rolled.
 */
export const getSumOptions = (
  diceValues: DiceSum[],
  currentPositions: { [key: string]: number },
  checkpointPositions: { [key: number]: { [key: number]: number } },
  blockedSums: { [key: number]: string },
  mountainShape: MountainShape,
  sameSpace: SameSpace,
  userId: UserId
): SumOption[] => {
  if (diceValues.length !== 4) {
    throw new Error("Should have 4 values");
  }

  const numClimbersLeft = 3 - Object.keys(currentPositions).length;

  // How many space left for each current climber.
  let currentClimberSpaceLeft = new Map<DiceSum, number>();

  let updatedBlockedSums = new Set(
    Object.keys(blockedSums).map((x) => parseInt(x))
  );

  Object.entries(currentPositions).forEach(([diceSumStr, currentStep]) => {
    const diceSum = parseInt(diceSumStr);
    const space = getSpaceLeft(
      currentPositions,
      checkpointPositions,
      mountainShape,
      sameSpace,
      diceSum,
      userId
    );

    currentClimberSpaceLeft.set(diceSum, space);

    // If there is no space left for some climbers, then those columns are actually
    // blocked.
    if (space === 0) {
      updatedBlockedSums.add(diceSum);
    }
  });

  // First compute all the dice sums.
  const allDiceSums = DICE_INDICES.map((group): SumOption => {
    // Compute the 2 sums.
    const diceSums: [DiceSum, DiceSum] = group.map(
      (twoDiceIndices): DiceSum => {
        return twoDiceIndices.map((i) => diceValues[i]).reduce((a, b) => a + b);
      }
    ) as [DiceSum, DiceSum];

    if (diceSums[0] === diceSums[1]) {
      // Both of the sums are the same.
      const diceSum = diceSums[0];
      // If the column is blocked, there are no options.
      if (updatedBlockedSums.has(diceSum)) {
        return { diceSums, enabled: [false, false], split: false };
      }
      if (currentClimberSpaceLeft.has(diceSum)) {
        // Are we already climbing that "sum"?
        if (currentClimberSpaceLeft.get(diceSum) === 1) {
          // If the columns has one space left, we can choose the sum only once.
          return { diceSums, enabled: [true, true], split: true };
        } else {
          // Otherwise the column is not blocked and we have more than 1 space: we can
          // use both sums.
          return { diceSums, enabled: [true, true], split: false };
        }
      } else {
        // We are not climbing the column. We can play it if we have a climber left.
        if (numClimbersLeft > 0) {
          // Depending on the number of spaces left we can either play only one or
          // both numbers.
          if (
            getSpaceLeft(
              currentPositions,
              checkpointPositions,
              mountainShape,
              sameSpace,
              diceSum,
              userId
            ) === 1
          ) {
            return { diceSums, enabled: [true, true], split: true };
          } else {
            return { diceSums, enabled: [true, true], split: false };
          }
        } else {
          return { diceSums, enabled: [false, false], split: false };
        }
      }
    } else {
      // Both sums are different.
      let climbingAtLeastOne = false;

      // Are they enabled?
      const enabled = diceSums.map((diceSum: DiceSum): boolean => {
        const alreadyClimbingIt = currentPositions.hasOwnProperty(diceSum);

        if (alreadyClimbingIt) {
          // While we are at it note that we are climbing at least one of those
          climbingAtLeastOne = true;
        }

        const isBlocked = updatedBlockedSums.has(diceSum);

        // We can use that number if the column is not blocked and if we have some
        // climbers left or if we are already climbing it.
        return !isBlocked && (numClimbersLeft > 0 || alreadyClimbingIt);
      }) as [boolean, boolean];

      // Now the only tricky case left is if we are allowed for both sums, *but not
      // at the same time*.
      // This happens when we have only one climber left, and if the two sums are new
      // sums that we are not already climbing.
      const split =
        (numClimbersLeft === 1 &&
          !climbingAtLeastOne &&
          enabled.every((x) => x)) ||
        enabled[0] !== enabled[1];

      return {
        diceSums,
        enabled,
        split,
      };
    }
  });

  return allDiceSums;
};

/*
 * Get the number of steps for a given dice sum
 * e.g. 2 -> 3, 3 -> 5, .., 7 -> 13, ..
 */
export function getNumStepsForSum(
  sum: number,
  mountainShape: MountainShape
): number {
  // Using the symetry.
  if (sum >= 7) {
    sum -= (sum - 7) * 2;
  }
  return NUM_STEPS[mountainShape][sum];
}
