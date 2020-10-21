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
 * Return something like
 * [[[8, 10]], [[9]], [[3], [7]]]
 * Which means you can either choose
 * - 8 and 10
 * - 9
 * - 3 or 7
 */
export function getSumOptions(
  diceValues: number[],
  currentPositions: { [key: number]: number },
  checkpointPositions: { [key: number]: number },
  blockedSums: { [key: number]: number }
): number[][][] {
  if (diceValues.length !== 4) {
    throw new Error("Should have 4 values");
  }

  const numClimbersLeft = 3 - Object.keys(currentPositions).length;

  // How many space left for each current climber.
  let currentClimberSpace = new Map<number, number>();

  let updatedBlockedSums = new Set(Object.keys(blockedSums).map((x) => parseInt(x)));

  Object.entries(currentPositions).forEach(([diceSumStr, currentStep]) => {
    const diceSum = parseInt(diceSumStr);
    const space = sumSteps(diceSum) - currentStep;

    currentClimberSpace.set(diceSum, space);

    // If there is no space left for some climbers, then those columns are actually
    // blocked.
    if (space === 0) {
      updatedBlockedSums.add(diceSum);
    }
  });

  // First compute all the dice sums.
  const allDiceSums = DICE_INDICES.map((group): number[][] => {
    // Compute the 2 sums.
    let diceSums = group.map((twoDiceIndices): number => {
      return twoDiceIndices.map((i) => diceValues[i]).reduce((a, b) => a + b);
    });

    if (diceSums[0] === diceSums[1]) {
      // If both of the sums are the same.
      const diceSum = diceSums[0];
      if (updatedBlockedSums.has(diceSum)) {
        // If the column is blocked, there are no options.
        return [[]];
      }
      if (currentClimberSpace.has(diceSum)) {
        // Are we already climbing that "sum"?
        if (currentClimberSpace.get(diceSum) === 1) {
          // If the columns has one space left, we can choose the sum only once.
          return [[diceSum]];
        } else {
          // Otherwise the column is not blocked and we have more than 1 space: we can
          // use both sums.
          return [[diceSum, diceSum]];
        }
      } else {
        // We are not climbing it. We can play it if we have a climber left.
        if (numClimbersLeft > 0) {
          // But we need 2 spaces if we already have a checkpoint there to be able to
          // play both. Otherwise we can only play one.
          if (checkpointPositions[diceSum] === sumSteps(diceSum) - 1) {
            return [[diceSum]];
          } else {
            return [[diceSum, diceSum]];
          }
        } else {
          return [[]];
        }
      }
    } else {
      // Both sums are different.
      let availableDiceSums: number[] = [];
      let climbingAtLeastOne = false;

      diceSums.forEach((diceSum) => {
        const alreadyClimbingIt = currentPositions.hasOwnProperty(diceSum);
        if (
          !updatedBlockedSums.has(diceSum) &&
          (alreadyClimbingIt || numClimbersLeft > 0)
        ) {
          // If it's not blocked and we are already climbing or we have climbers left,
          // then that sum is available.
          availableDiceSums.push(diceSum);
        }
        if (alreadyClimbingIt) {
          climbingAtLeastOne = true;
        }
      });

      // Now the only tricky case left is if we are allowed for both sums, *but not
      // at the same time*.
      // This happens when we have only one climber left, and if the two sums are new
      // sums that we are not already climbing.
      if (numClimbersLeft === 1 && !climbingAtLeastOne && availableDiceSums.length > 0) {
        return availableDiceSums.map((x): number[] => [x]);
      } else {
        return [availableDiceSums];
      }
    }
  });

  return allDiceSums;
}

/*
 * Get the number of steps for a given dice sum
 * e.g. 2 -> 3, 3 -> 5, .., 7 -> 13, ..
 */
// TODO rename getNumStepsForSum
export function sumSteps(sum: number): number {
  return -2 * Math.abs(sum - 7) + 13;
}
