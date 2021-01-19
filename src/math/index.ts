import {
  DiceSum,
  SumOption,
  MountainShape,
  SameSpace,
  PlayerID,
} from "../types";
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
  playerID: PlayerID
) => {
  const startStep =
    currentPositions[column] || checkpointPositions[playerID]?.[column] || 0;

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
 * Return something like
 * [[[8, 10]], [[9]], [[3], [7]]]
 * Which means you can either choose
 * - 8 and 10
 * - 9
 * - 3 or 7
 */
export const getSumOptions = (
  diceValues: DiceSum[],
  currentPositions: { [key: string]: number },
  checkpointPositions: { [key: number]: { [key: number]: number } },
  blockedSums: { [key: number]: string },
  mountainShape: MountainShape,
  sameSpace: SameSpace,
  playerID: PlayerID
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
      playerID
    );

    currentClimberSpaceLeft.set(diceSum, space);

    // If there is no space left for some climbers, then those columns are actually
    // blocked.
    if (space === 0) {
      updatedBlockedSums.add(diceSum);
    }
  });

  // First compute all the dice sums.
  const allDiceSums = DICE_INDICES.map(
    (group): SumOption => {
      // Compute the 2 sums.
      const diceSums: DiceSum[] = group.map(
        (twoDiceIndices): DiceSum => {
          return twoDiceIndices
            .map((i) => diceValues[i])
            .reduce((a, b) => a + b);
        }
      );

      if (diceSums[0] === diceSums[1]) {
        // Both of the sums are the same.
        const diceSum = diceSums[0];
        // If the column is blocked, there are no options.
        if (updatedBlockedSums.has(diceSum)) {
          return { diceSums: [null, null] };
        }
        if (currentClimberSpaceLeft.has(diceSum)) {
          // Are we already climbing that "sum"?
          if (currentClimberSpaceLeft.get(diceSum) === 1) {
            // If the columns has one space left, we can choose the sum only once.
            return { diceSums: [diceSum, null] };
          } else {
            // Otherwise the column is not blocked and we have more than 1 space: we can
            // use both sums.
            return { diceSums: [diceSum, diceSum] };
          }
        } else {
          // We are not climbing it. We can play it if we have a climber left.
          if (numClimbersLeft > 0) {
            // But we need 2 spaces if we already have a checkpoint there to be able to
            // play both. Otherwise we can only play one.
            //
            if (
              getSpaceLeft(
                currentPositions,
                checkpointPositions,
                mountainShape,
                sameSpace,
                diceSum,
                playerID
              ) === 1
            ) {
              return { diceSums: [diceSum, null] };
            } else {
              return { diceSums: [diceSum, diceSum] };
            }
          } else {
            return { diceSums: [null, null] };
          }
        }
      } else {
        // Both sums are different.
        let climbingAtLeastOne = false;
        let numNonNull = 0;

        // Change the unavailable dice sums to `null`.
        const newDiceSums = diceSums.map((diceSum: DiceSum): DiceSum | null => {
          const alreadyClimbingIt = currentPositions.hasOwnProperty(diceSum);

          if (alreadyClimbingIt) {
            // While we are at it note that we are climbing at least one of those
            climbingAtLeastOne = true;
          }

          if (
            updatedBlockedSums.has(diceSum) ||
            (numClimbersLeft === 0 && !alreadyClimbingIt)
          ) {
            // It could be blocked or we could not be climbing it and have no climbers
            // left.
            return null;
          } else {
            numNonNull += 1;
            return diceSum;
          }
        });

        // Now the only tricky case left is if we are allowed for both sums, *but not
        // at the same time*.
        // This happens when we have only one climber left, and if the two sums are new
        // sums that we are not already climbing.

        const sumOption: SumOption = { diceSums: newDiceSums };
        if (numClimbersLeft === 1 && !climbingAtLeastOne && numNonNull === 2) {
          sumOption.split = true;
        }
        return sumOption;
      }
    }
  );

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
