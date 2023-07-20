// The bundled ESM version ends up being broken, I only got it to work with `require`.
let ort;
if (process.env.BACKEND) {
  ort = require("onnxruntime-node");
}

import { UserId, Move as BgkitMove } from "bgkit";
import {
  ChickenrollBoard,
  pick,
  roll,
  stop,
  CurrentPositions,
  MoveInfo,
  CheckpointPositions,
  MountainShape,
} from "./types";

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

type _PickAction = {
  // arguments for the `pick()` move.
  diceSplitIndex: number;
  choiceIndex: number;
  // data to do some math with
  cols: number[];
};

type _RollOrStopAction = {
  roll: boolean;
};
/*
 * Here an action is defined as picking an option + rolling or stopping.
 */
export type Action = _PickAction & _RollOrStopAction;

/*
 * Return the possible actions for the current player.
 */
const _getPickActions = (board: ChickenrollBoard): _PickAction[] => {
  const actions: _PickAction[] = [];

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

const getActions = (board: ChickenrollBoard): Action[] => {
  const pickActions = _getPickActions(board);
  const actions: Action[] = [];
  const actionKeys = new Set<string>();
  for (const pickAction of pickActions) {
    // We note in a set the actions that we have already listed.
    // We save some computation time by not having duplicated actions.
    const key = JSON.stringify([...pickAction.cols].sort());
    if (actionKeys.has(key)) {
      continue;
    }
    // We can always keep rolling.
    actions.push({ ...pickAction, roll: true });
    // But can we also stop!
    if (canStopAfterPick({ board, pickAction })) {
      actions.push({ ...pickAction, roll: false });
    }

    actionKeys.add(key);
  }
  return actions;
};

/*
 * Willl we be able to stop after a given "pick" action.
 */
const canStopAfterPick = ({
  board,
  pickAction,
}: {
  board: ChickenrollBoard;
  pickAction: _PickAction;
}): boolean => {
  const { cols } = pickAction;
  const currentPositions = _getNewCurrentPositions({ board, cols });

  return (
    board.sameSpace !== "nostop" ||
    numCurrentPlayerOverlap(currentPositions, board.checkpointPositions) === 0
  );
};

/*
 * What will be the new CurrentPosition if the current player climbs on the 2 columns in `col`.
 */
const _getNewCurrentPositions = ({
  board,
  cols,
}: {
  board: ChickenrollBoard;
  cols: number[];
}): CurrentPositions => {
  const userId = board.currentPlayer;

  const out: CurrentPositions = Object.assign({}, board.currentPositions);
  for (const col of cols) {
    out[col] = climbOneStep(
      out,
      board.checkpointPositions,
      col,
      userId,
      board.sameSpace
    );
  }

  return out;
};

const toNum = (b: boolean): number => {
  return b ? 1 : 0;
};

const currentPositionsToMap = (
  currentPositions: CurrentPositions
): Map<number, number> => {
  const map = new Map();
  for (const [colStr, step] of Object.entries(currentPositions)) {
    const col = parseInt(colStr);
    map.set(col, step);
  }
  return map;
};

const getFinishedSet = (
  pos: Map<number, number>,
  mountainShape: MountainShape
): Set<number> => {
  const finished = new Set<number>();
  for (const [col, step] of pos) {
    const numStep = getNumStepsForSum(col, mountainShape);
    if (step === numStep) {
      finished.add(col);
    }
  }
  return finished;
};

/*
 * Return keys that are in map2 but not in map1
 */
const mapKeyDiff = <T>(map1: Map<T, any>, map2: Map<T, any>): Set<T> => {
  const keys = new Set<T>();
  for (const [key] of map2) {
    if (!map1.has(key)) {
      keys.add(key);
    }
  }
  return keys;
};

/*
 * Same as `numCurrentPlayerOverlap` but with a `Map` object.
 */
const countOverlap = (
  currentPositions: Map<number, number>,
  checkpointPositions: CheckpointPositions
): number => {
  let n = 0;
  for (const [col, step] of currentPositions) {
    for (const positions2 of Object.values(checkpointPositions)) {
      if (positions2[col] === step) {
        n++;
        break;
      }
    }
  }
  return n;
};

const computeFeatures = ({
  board,
  userId,
  action,
  calculator,
}: {
  board: ChickenrollBoard;
  userId: UserId;
  action: Action;
  calculator: OddsCalculator;
}): [string, number][] => {
  // Definitions:
  //   checkpoint: before this turn
  //   before: everything before the current action
  //   action: this action
  //   after: everything including the current action

  const { cols: colsAction, roll } = action;

  // Build `Map`s of the columns and steps for this turn.
  const colsCheckpoint = currentPositionsToMap(
    board.checkpointPositions[userId]
  );
  const colsBefore = currentPositionsToMap(board.currentPositions);
  const colsAfter = new Map(colsBefore);
  for (const col of colsAction) {
    const stepBefore = colsAfter.get(col) || colsCheckpoint.get(col) || 0;
    colsAfter.set(col, stepBefore + 1);
  }

  // Num of finished columns.
  const finishedAfter = getFinishedSet(colsAfter, board.mountainShape);
  const finishedBefore = getFinishedSet(colsBefore, board.mountainShape);

  // Columns that are new in this action.
  const colsNew = mapKeyDiff(colsBefore, colsAfter);

  const isDouble = colsAction.length === 2 && colsAction[0] === colsAction[1];
  const isSingle = colsAction.length === 1;

  // Get some info about the new columns that this action adds.
  let numEven = 0;
  let num678 = 0;
  let avgProbCols = 0;
  {
    for (const col of colsNew) {
      if (col % 2 === 0) {
        numEven++;
      }

      // We only care about bust probabilities if we roll.
      if (roll) {
        avgProbCols += calculator.oddsNoBust([col]) / colsNew.size;
      }

      if (col === 6 || col === 7 || col === 8) {
        num678++;
      }
    }
  }

  const climbersBefore = colsBefore.size;
  const climbersAfter = colsAfter.size;
  const climberCost = climbersAfter - climbersBefore;

  // To get the prob of busting if we choose this option, we need to know how many
  // columns will be blocked after.
  let probBust = 0;

  {
    let allowed: Set<number>;

    if (climbersAfter === 3) {
      allowed = new Set(colsAfter.keys());
    } else {
      // In the case where we would still have runners left, only blocked columns are
      // not allowed.
      allowed = new Set(ALL_COLS);
    }

    // Remove finished columns if this option is chosen.
    for (const col of finishedAfter) {
      allowed.delete(col);
    }

    for (const col of Object.keys(board.blockedSums)) {
      allowed.delete(parseInt(col));
    }

    probBust = calculator.oddsBust(Array.from(allowed));
  }

  // Compute what progress we would keep if we stopped.
  let progressRatioAfter = 0;
  let progressRatioAfter2 = 0;
  let progressRatioAfterSq = 0;
  let progressAfter = 0;
  {
    for (const [col, step] of colsAfter) {
      const numSteps = getNumStepsForSum(col, board.mountainShape);
      // Compare with
      const diff = step - (colsCheckpoint.get(col) || 0);
      progressRatioAfter += diff / numSteps;
      progressRatioAfter2 += (diff / numSteps) ** 2;
      progressRatioAfterSq += Math.sqrt(diff / numSteps);
      progressAfter += diff;
    }
  }

  // Progress of this action.
  let progressRatioAction = 0;
  let progressRatioAction2 = 0;
  let progressAction = 0;
  {
    for (const [col, step] of colsAfter) {
      const numSteps = getNumStepsForSum(col, board.mountainShape);
      const diff = step - (colsBefore.get(col) || colsCheckpoint.get(col) || 0);
      progressRatioAction += diff / numSteps;
      progressRatioAction2 += (diff / numSteps) ** 2;
      progressAction += diff;
    }
  }

  // Diff of overlap for this action.
  const overlapBefore = countOverlap(colsBefore, board.checkpointPositions);
  const overlapAfter = countOverlap(colsAfter, board.checkpointPositions);

  const expectedFinalProb =
    colsAfter.size === 2
      ? getExpectedFinalProb({
          cols: Array.from(colsAfter.keys()),
          calculator,
          blockedSums: board.blockedSums,
        })
      : 0;

  // TODO Add a feature that gives us an idea of how likely we are of getting stuck on the next roll.
  // We had something like that for the previous bot.

  const had3climbers = climbersBefore === 3;
  const now3climbers = !had3climbers && climbersAfter === 3;

  return [
    // Features to decide on the action.
    // if we have 3 cols, how much progress do we make with the option
    // progress = finished, steps, how close to the end those steps are
    // if we don't have our 3 cols yet, we need to know what are the probs we'll end up with, and in general what columns we'll end up with
    //
    [
      "num_finished>=1_3c",
      toNum(roll && finishedAfter.size >= 1 && had3climbers),
    ],
    [
      "num_finished>=2_3c",
      toNum(roll && finishedAfter.size >= 2 && had3climbers),
    ],
    [
      "num_finished>=1_no3c",
      toNum(roll && finishedAfter.size >= 1 && !had3climbers),
    ],
    [
      "num_finished>=2_no3c",
      toNum(roll && finishedAfter.size >= 2 && !had3climbers),
    ],
    ["progress", progressAction * toNum(roll && !had3climbers)],
    ["progress_3c", progressAction * toNum(roll && had3climbers)],
    ["progress_ratio_no3c", progressRatioAction * toNum(roll && !had3climbers)],
    ["progress_ratio_3c", progressRatioAction * toNum(roll && had3climbers)],
    [
      "progress_ratio2_no3c",
      progressRatioAction2 * toNum(roll && !had3climbers),
    ],
    ["progress_ratio2_3c", progressRatioAction2 * toNum(roll && had3climbers)],
    //
    ["progress_after", toNum(roll) * progressAfter],
    ["progress_ratio_after", toNum(roll) * progressRatioAfter],
    ["progress_ratio_after2", toNum(roll) * progressRatioAfter2],
    ["progress_ratio_after_sq", toNum(roll) * progressRatioAfterSq],
    //
    ["climber_cost=1", toNum(roll && climberCost === 1)],
    ["climber_cost=2", toNum(roll && climberCost === 2)],
    //
    ["bust", toNum(roll) * probBust],
    ["bust_now3c", probBust * toNum(roll && now3climbers)],
    ["bust>0", toNum(roll && probBust > 0)],
    //
    ["had3climbers", toNum(roll && had3climbers)],
    ["now3c", toNum(roll && now3climbers)],
    ["avg_prob_cols_3c", avgProbCols * toNum(!had3climbers)],
    ["overlap_diff", toNum(roll) * (overlapAfter - overlapBefore)],
    ["overlap_after=0", toNum(roll && overlapAfter === 0)],
    ["overlap_after=1", toNum(roll && overlapAfter === 1)],
    ["overlap_after>=2", toNum(roll && overlapAfter >= 2)],
    ["expected_final_prob", toNum(roll) * expectedFinalProb],
    ["expected_final_prob", toNum(roll && !had3climbers) * expectedFinalProb],
    //
    ["even=0", toNum(roll && numEven === 0 && !had3climbers)],
    ["even=1", toNum(roll && numEven === 1 && !had3climbers)],
    ["even=2", toNum(roll && numEven === 2 && !had3climbers)],
    ["single", toNum(roll && isSingle && !had3climbers)],
    ["double", toNum(roll && isDouble && !had3climbers)],
    ["678=0", toNum(roll && num678 === 0 && !had3climbers)],
    ["678=1", toNum(roll && num678 === 1 && !had3climbers)],
    ["678=2", toNum(roll && num678 === 2 && !had3climbers)],
    //
    //
    ["is_stop", toNum(!roll)],
    //
    // Features to decide if we roll or stop.
    ["stop_bust", toNum(!roll) * probBust],
    ["stop_progress_after", progressAfter * toNum(!roll)],
    ["stop_progress_ratio_after", progressRatioAfter * toNum(!roll)],
    ["stop_progress_ratio_after2", progressRatioAfter2 * toNum(!roll)],
    ["stop_progress_ratio_after_sq", progressRatioAfterSq * toNum(!roll)],
    ["stop_progress_ratio_bust", toNum(!roll) * progressRatioAfter * probBust],
    [
      "stop_progress_ratio2_bust",
      toNum(!roll) * progressRatioAfter2 * probBust,
    ],
    [
      "stop_progress_ratio_sq_bust",
      toNum(!roll) * progressRatioAfterSq * probBust,
    ],
    ["stop_progress_bust", toNum(!roll) * progressAfter * probBust],
    ["stop_num_finished_bust", toNum(!roll) * finishedAfter.size * probBust],
    ["stop_total_finish>=1", toNum(!roll) * toNum(finishedAfter.size >= 1)],
    ["stop_total_finish>=2", toNum(!roll) * toNum(finishedAfter.size >= 2)],
  ];
};

const argMax = (arr: number[]): number => {
  let idx = -1;
  let max = -Infinity;
  for (let i = 0; i < arr.length; ++i) {
    const value = arr[i];
    if (value > max) {
      max = value;
      idx = i;
    }
  }

  if (idx === -1) {
    throw new Error("arg max not found");
  }

  return idx;
};

// https://stackoverflow.com/a/28933315/1067132
const getRandomIndex = (weights: number[]): number => {
  const num = Math.random();
  let s = 0;
  const lastIndex = weights.length - 1;

  for (let i = 0; i < lastIndex; ++i) {
    s += weights[i];
    if (num < s) {
      return i;
    }
  }

  if (s > 1) {
    throw new Error("weights sum to greater than 1");
  }

  return lastIndex;
};

const getProbs = async (
  features: number[][],
  onnxSession: any
): Promise<number[]> => {
  if (features.length === 1) {
    return [1];
  }

  const flat = features.flat();

  const input = new ort.Tensor("float64", flat, [
    features.length,
    features[0].length,
  ]);

  const { output } = await onnxSession.run({ input });

  return output.data;
};

const getPositionStats = (
  pos: CurrentPositions,
  mountainShape: MountainShape
): { avg: number; max: number } => {
  let max = 0;
  let avg = 0;
  let n = 0;
  for (const [colStr, step] of Object.entries(pos)) {
    const col = parseInt(colStr);
    const numSteps = getNumStepsForSum(col, mountainShape);
    const progress = step / numSteps;
    if (progress > max) {
      max = progress;
    }
    avg += progress;
    n++;
  }

  if (n > 0) {
    avg /= n;
  }

  return { max, avg };
};

const computeStateFeatures = ({
  board,
  userId,
}: {
  board: ChickenrollBoard;
  userId: UserId;
}): [string, number][] => {
  const numFinished = board.scores[userId];

  const maxNumFinished = Math.max(...Object.values(board.scores));

  const { max: maxProgress, avg: avgProgress } = getPositionStats(
    board.checkpointPositions[userId],
    board.mountainShape
  );

  const { max: maxProgressCurrent, avg: avgProgressCurrent } = getPositionStats(
    board.currentPositions,
    board.mountainShape
  );

  return [
    ["numFinished", numFinished / board.numColsToWin],
    ["numFinished/max", numFinished ? numFinished / maxNumFinished : 0],
    ["maxProgress", maxProgress],
    ["avgProgress", avgProgress],
    ["maxProgressCur", maxProgressCurrent],
    ["avgProgressCur", avgProgressCurrent],
  ];
};

export const botMove = async ({
  board,
  userId,
  onnxSession,
  stochastic,
  verbose = false,
}: {
  board: ChickenrollBoard;
  userId: UserId;
  onnxSession: any;
  stochastic: boolean;
  verbose?: boolean;
}): Promise<{ moves: BgkitMove[]; moveInfo: MoveInfo | null }> => {
  if (board.stage !== "moving") {
    return { moves: [roll()], moveInfo: null };
  }
  const calculator = getOddsCalculator();

  // TODO when there is only one possible action, we shouldn't have any computation nor any Transition
  const actions = getActions(board);
  // if (verbose) {
  // console.log("possible actions");
  // console.log(actions);
  // }

  // Gather some information for each option.
  const namedFeatures = actions.map((action) =>
    computeFeatures({ board, userId, action, calculator })
  );

  // console.log("features");
  // console.log(namedFeatures);

  const features = namedFeatures.map((featuresForAction) =>
    featuresForAction.map((row) => row[1])
  );

  let bestActionIdx: number;

  // console.log('features', features);
  const probs = await getProbs(features, onnxSession);

  // if (verbose) {
  // console.log(probs);
  // }

  if (stochastic) {
    bestActionIdx = getRandomIndex(probs);
  } else {
    bestActionIdx = argMax(probs);
  }

  // console.log('chosen actino', bestActionIdx)

  const bestAction = actions[bestActionIdx];

  const stateFeatures = computeStateFeatures({ board, userId });

  return {
    moves: [
      pick({
        diceSplitIndex: bestAction.diceSplitIndex,
        choiceIndex: bestAction.choiceIndex,
      }),
      bestAction.roll ? roll() : stop(),
    ],
    moveInfo: {
      userId,
      actionFeatures: namedFeatures,
      chosenAction: bestActionIdx,
      state: stateFeatures,
      probs,
    },
  };
};
