import { UserId, Move as BgkitMove } from "bgkit";
import { ChickenrollBoard, pick, roll, stop, CurrentPositions } from "./types";
import {
  getSpaceLeft,
  numCurrentPlayerOverlap,
  climbOneStep,
  getNumStepsForSum,
  getAllowedColumns,
} from "./math";
import { OddsCalculator, getOddsCalculator } from "./math/probs";
import { ALL_COLS } from "./constants";
import { canStop } from "./utils";

// A list of features we are interested in when choosing an action.
export type Features = {
  // How many columns would we finish?
  numFinish: number;
  // Number of new climbers this option will add on the board.
  climberCost: number;
  // Prob of bust for next roll if we choose the option.
  probBust: number;
  // How much progress on the board would we make.
  progress: number;
  // Average (on the 1 or 2 numbers) of the probability to get those numbers. This is
  // the same number we use to determine the height of the columns.
  avgProbCols: number;
  // Expected final prob if we have climbers if 1 climber left else 0.
  expectedFinalProb: number;

  // progress times (relative) steps - this means steps higher up are worth more.
  progressTimesStep: number;

  // number of players over if we choose this option.
  // This should always be 0 for jump but very useful for must-roll!
  numOverlap: number;
  // Number of players ahead of us in the columns for that choice
  numAhead: number;

  // New columns are even
  // 0 if not adding any columns
  // 1 if adding even columns
  // 0 if adding odd columns
  // 0.5 if both
  even: number;
};

export const scoreFeatures = (weights: number[], oc: Features) => {
  return (
    oc.numFinish * weights[0] -
    oc.climberCost * weights[1] -
    oc.probBust * weights[2] +
    oc.progress * weights[3] +
    oc.avgProbCols * weights[4] -
    oc.expectedFinalProb * weights[5] +
    oc.progressTimesStep * weights[6] +
    oc.numAhead * weights[7] +
    oc.numOverlap * weights[8] +
    oc.even * weights[9]
  );
};

// How many columns would we finish if we choose the 2 columns `col`?
const getFinishCols = ({
  board,
  cols,
}: {
  board: ChickenrollBoard;
  cols: number[];
}): number[] => {
  // Case where the two numbers are the same.
  if (cols.length === 2 && cols[0] === cols[1]) {
    if (
      getSpaceLeft(
        board.currentPositions,
        board.checkpointPositions,
        board.mountainShape,
        board.sameSpace,
        cols[0],
        board.currentPlayer
      ) === 2
    ) {
      return cols;
    } else {
      return [];
    }
  }

  const finishedCols = [];
  for (const col of cols) {
    if (
      getSpaceLeft(
        board.currentPositions,
        board.checkpointPositions,
        board.mountainShape,
        board.sameSpace,
        col,
        board.currentPlayer
      ) === 1
    ) {
      finishedCols.push(col);
    }
  }
  return finishedCols;
};

const getExpectedFinalProb = ({
  cols,
  calculator,
  blockedSums,
}: {
  cols: number[];
  calculator: OddsCalculator;
  blockedSums: Record<string, string>;
}) => {
  // We assume we have 2 number in `cols`.
  const [a, b] = cols;

  // For each potential 3rd column, compute the probability of busting after we choose
  // that column.
  // Then sort in increasing order of bust probability.
  const thirdColInfo: { col: number; probBust: number }[] = ALL_COLS.filter(
    (col) => col !== a && col !== b
  )
    .filter((col) => !blockedSums[col])
    .map((col) => ({
      col,
      probBust: calculator.oddsBust([a, b, col]),
    }))
    .sort((a, b) => a.probBust - b.probBust);

  // We assume that we would choose the 3rd column that gives us the best odds for the
  // subsequent rolls.
  // This means that the odds or taking the first "thirdColInfo" are the odds of getting
  // that value. The odds of taking the second are the odds of being able to take this
  // one *and not the previous one*, etc.
  let expectation = 0;
  const forbidden = new Set<number>();
  for (const info of thirdColInfo) {
    const probBest = calculator.oddsNeedsForbidden(info.col, forbidden);
    expectation += probBest * info.probBust;
    forbidden.add(info.col);
  }

  return expectation;
};

export type Action = {
  // arguments for the `pick()` move.
  diceSplitIndex: number;
  choiceIndex: number;
  // data to do some math with
  cols: number[];
};

export const computeFeatures = ({
  board,
  userId,
  action,
  calculator,
}: {
  board: ChickenrollBoard;
  userId: UserId;
  action: Action;
  calculator: OddsCalculator;
}): Features => {
  const { cols } = action;

  // * Num of finished columns.

  // Subset of `cols` that would be finished.
  const finishedCols = getFinishCols({ board, cols });

  // Build the final set of columns.
  const colSet = new Set(
    Object.keys(board.currentPositions).map((col) => parseInt(col))
  );
  const newCols = new Set<number>();
  const numClimbersBefore = colSet.size;

  cols.forEach((col) => {
    if (!colSet.has(col)) {
      newCols.add(col);
      colSet.add(col);
    }
  });

  let even = 0;
  let avgProbCols = 0;
  for (const col of newCols) {
    if (col % 2 === 0) {
      even += 1 / newCols.size;
    }
    avgProbCols += (1 - calculator.oddsBust([col])) / newCols.size;
  }

  const climberCost = colSet.size - numClimbersBefore;

  // To get the prob of busting if we choose this option, we need to know how many
  // columns will be blocked after.

  let allowed: Set<number>; // = new Set(colSet);
  if (colSet.size === 3) {
    allowed = new Set(colSet);
  } else {
    // In the case where we would still have runners left, only blocked columns are
    // not allowed.
    allowed = new Set([2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]);
  }

  // Remove finished columns if this option is chosen.
  for (const col of finishedCols) {
    allowed.delete(col);
  }

  for (const col of Object.keys(board.blockedSums)) {
    allowed.delete(parseInt(col));
  }

  const probBust = calculator.oddsBust(Array.from(allowed));

  let progress = 0;
  let progressTimesStep = 0;
  let numAhead = 0;
  // Use the current overlap number as the baseline
  let numOverlap = numCurrentPlayerOverlap(
    board.currentPositions,
    board.checkpointPositions
  );
  for (const col of cols) {
    const endsAt = climbOneStep(
      board.currentPositions,
      board.checkpointPositions,
      col,
      userId,
      board.sameSpace
    );
    const startsAt =
      board.currentPositions[col] ||
      board.checkpointPositions[userId][col] ||
      0;

    const numSteps = getNumStepsForSum(col, board.mountainShape);
    const colProgress = (endsAt - startsAt) / numSteps;

    progress += colProgress;

    progressTimesStep += (colProgress * endsAt) / numSteps;

    // Check the people ahead
    for (const checkpoint of Object.values(board.checkpointPositions)) {
      const step = checkpoint[col] || 0;
      if (step === endsAt) {
        numOverlap++;
      } else if (step > endsAt) {
        numAhead++;
      }
    }
  }
  const expectedFinalProb =
    colSet.size === 2
      ? getExpectedFinalProb({
          cols: Array.from(colSet),
          calculator,
          blockedSums: board.blockedSums,
        })
      : 0;

  return {
    numFinish: finishedCols.length,
    climberCost,
    probBust,
    progress,
    avgProbCols,
    expectedFinalProb,
    progressTimesStep,
    numOverlap,
    numAhead,
    even,
  };
};

export const botMove = ({
  board,
  userId,
}: {
  board: ChickenrollBoard;
  userId: UserId;
}): BgkitMove => {
  const strategy = board.playerInfos[userId].strategy;
  if (strategy.type !== "weights") {
    throw new Error(
      `old bot strategy should be of type weights but it "${strategy.type}"`
    );
  }
  const weights = [...strategy.values];

  const weightsMoving = weights.splice(0, 10);
  const weightsRolling = weights;
  // console.log("weights", weightsMoving, weightsRolling);

  const calculator = getOddsCalculator();

  if (board.stage === "moving") {
    const actions = getActions(board);

    // Gather some information for each option.
    const features: Features[] = actions.map((action) =>
      computeFeatures({ board, userId, action, calculator })
    );

    // console.log(features)
    // console.log(weightsMoving);

    let bestAction: Action;
    let bestScore = -Infinity;
    features.forEach((f, i) => {
      const score = scoreFeatures(weightsMoving, f);
      if (score > bestScore) {
        bestScore = score;
        bestAction = actions[i];
      }
    });

    return pick({
      diceSplitIndex: bestAction.diceSplitIndex,
      choiceIndex: bestAction.choiceIndex,
    });
  }

  if (board.bustProb === 0) {
    // console.error('roll 2')
    return roll();
  }

  if (!canStop(board)) {
    // console.error('roll 3')
    return roll();
  }

  // Here we need to choose between stopping and rolling.
  // We'll have the same approach where we do a linear combination of some parameters
  // and we add a cutoff on it.

  let progressSoFar = 0;
  let progressInSteps = 0;
  let numFinishedCol = 0;
  Object.entries(board.currentPositions).forEach(([col, step]) => {
    const colInt = parseInt(col);
    const numSteps = getNumStepsForSum(colInt, board.mountainShape);
    progressSoFar +=
      (step - (board.checkpointPositions[userId][colInt] || 0)) / numSteps;
    progressInSteps += step - (board.checkpointPositions[userId][colInt] || 0);

    if (step === numSteps) {
      numFinishedCol++;
    }
  });

  const allowed = getAllowedColumns(
    board.currentPositions,
    board.blockedSums,
    board.mountainShape
  );

  // Special case: if we can win by stopping we stop.
  if (numFinishedCol + board.scores[userId] >= board.numColsToWin) {
    // console.error('stop 4 ')
    return stop();
  }

  // Compute the probabily of getting a number that can make us stuck - this is a proxy
  // to the probability of getting stuck. We do it twice, once if we have 3 climbers and
  // once if we have 2 climbers (0 otherwise).
  let probHasToOverlap2 = 0;
  let probHasToOverlap3 = 0;
  const numClimbers = Object.keys(board.currentPositions).length;
  const cols = Object.keys(Object.entries(board.currentPositions)).map((x) =>
    parseInt(x)
  );
  if (numClimbers === 3) {
    const colsCouldStuck = new Set();
    for (const [colStr, ourStep] of Object.entries(board.currentPositions)) {
      const col = parseInt(colStr);
      // Check if there is someone on the next step.
      for (const checkpoint of Object.values(board.checkpointPositions)) {
        if ((checkpoint[colStr] || 0) === ourStep + 1) {
          colsCouldStuck.add(col);
          // We found someone, we don't want another one.
          break;
        }
      }
    }
    probHasToOverlap3 = calculator.oddsNoBust(colsCouldStuck);
  } else if (numClimbers === 2) {
    // Check for all the starting position ones.
    const colsAtStepOne = new Set<number>();
    for (const checkpoint of Object.values(board.checkpointPositions)) {
      for (const [colStr, step] of Object.entries(checkpoint)) {
        const col = parseInt(colStr);
        if (
          // !board.currentPositions[colStr] &&
          step ===
          (board.checkpointPositions[userId][colStr] || 0) + 1
        ) {
          colsAtStepOne.add(col);
        }
      }
    }
    probHasToOverlap2 = calculator.oddsNoBust(colsAtStepOne);
  }

  // console.log("should we roll");
  // console.log("progressSoFar * board.bustProb", progressSoFar * board.bustProb);
  // console.log("numFinished * prob", numFinishedCol * board.bustProb);
  // console.log("probHasToOverlap2", probHasToOverlap2);
  // console.log("probHasToOverlap3", probHasToOverlap3);

  // Note that we combine progressSoFar with board.probBust, as a measure of "how much
  // do we stand to lose".
  const w = weightsRolling;
  const linearComb =
    w[0] +
    // Expected progress : probBust * (what we stand to lose) + probNoBust * (what we stand to win)
    -(w[1] * progressSoFar + w[2] * numFinishedCol + w[6] * progressInSteps) *
      board.bustProb +
    w[3] * (1 - board.bustProb) +
    w[4] * probHasToOverlap2 +
    w[5] * probHasToOverlap3;
  if (linearComb > 0) {
    // console.error('roll 5')
    return roll();
  } else {
    // console.error('stop')
    return stop();
  }
};

/*
 * Return the possible actions for the current player.
 */
const getActions = (board: ChickenrollBoard) => {
  const actions: Action[] = [];

  board.diceSumOptions.forEach((sumOption, diceSplitIndex) => {
    if (sumOption.split) {
      for (const choiceIndex of [0, 1]) {
        if (sumOption.enabled[choiceIndex]) {
          actions.push({
            diceSplitIndex,
            choiceIndex,
            cols: [sumOption.diceSums[choiceIndex]],
          });
        }
      }
    } else {
      if (sumOption.enabled[0]) {
        actions.push({
          diceSplitIndex,
          choiceIndex: 0,
          cols: sumOption.diceSums,
        });
      }
    }
  });

  return actions;
};
