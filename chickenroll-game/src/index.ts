import {
  createMove,
  createBoardUpdate,
  Moves,
  BoardUpdates,
  GameOptions,
  GameDef,
  UserId,
  GamePlayerOptions,
  PlayerOptionType,
  endMatch,
  pointsToRank,
  itsYourTurn,
} from "bgkit";

import {
  getSumOptions,
  getNumStepsForSum,
  SumOption,
  getSpaceLeft,
  DICE_INDICES,
} from "./math";

import {
  getAllowedColumns,
  getOddsCalculator,
  OddsCalculator,
} from "./math/probs";

import {
  DiceSum,
  MountainShape,
  SameSpace,
  CurrentPositions,
  CheckpointPositions,
  PlayerInfo,
} from "./types";

import { NUM_STEPS } from "./constants";

// Imports that should also be exported.
export {
  SumOption,
  getNumStepsForSum,
  DICE_INDICES,
  NUM_STEPS,
  DiceSum,
  SameSpace,
  MountainShape,
  PlayerInfo,
};

const ALL_COLS = [2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];

interface Info {
  // Player that is referred by the message.
  userId?: UserId;
  // Here "start" means we'll only write 'it's your turn' to the starting player.
  code: "bust" | "stop" | "win" | "start";
  // Timestamp at which we got the info. This is treated as an ID to compare two info.
  ts: number;
}

export type Move = {
  // Values of the 4 dice.
  diceValues?: number[];
  //0=horzontal, 1=vertical, 2=diagonal
  diceSplitIndex?: number;
  // [0] for the first 2, [1] for the last 2 and [0, 1] for all 4.
  diceUsed?: number[];
  // Did we bust on that move?
  bust?: boolean;
  // Player who made the move.
  userId: string;
};

export type ShowProbsType = "before" | "after" | "never";
type Stage = "moving" | "rolling" | "gameover";

export type ChickenrollBoard = {
  diceValues: number[];
  currentPositions: CurrentPositions;
  checkpointPositions: CheckpointPositions;
  diceSumOptions?: SumOption[];
  lastPickedDiceSumOption?: number[];
  blockedSums: { [diceSum: number]: UserId };
  info?: Info;
  // Number of columns finished for each player.
  scores: { [userId: number]: number };
  // By default we'll set the game to the *maximum* number of players, but maybe less
  // people will join.
  numPlayers: number;
  // Number of victories for the current match.
  currentPlayerHasStarted: boolean;
  // UserId -> color, etc.
  playerInfos: Record<UserId, PlayerInfo>;
  // Number of columns to complete to win.
  // 2 players: 4
  // 3 players: 3
  // 4 players: 3
  // 5 players: 2
  numColsToWin: number;
  // History of all the moves.
  moveHistory: Move[];
  showProbs: ShowProbsType;
  // Probability of busting.
  bustProb: number;
  // Probability of busting at the end of the last turn. This is for the 'after' mode of
  // showing the probabilities.
  endOfTurnBustProb: number;
  mountainShape: MountainShape;
  // What happens when tokens occupy the same spot.
  sameSpace: SameSpace;
  // Id of the previous player;
  previousPlayer?: UserId;
  // How did the last player finish;
  lastOutcome: "stop" | "bust";

  stage: Stage;
  currentPlayer: UserId;
  currentPlayerIndex: number;
  playerOrder: UserId[];
};

/*
 * Return the last move in the history of moves.
 */
const getLastMove = (board: ChickenrollBoard): Move => {
  return board.moveHistory[board.moveHistory.length - 1];
};

const gotoStage = (board: ChickenrollBoard, newStage: Stage): void => {
  // const activePlayers = board.passAndPlay
  //   ? { all: newStage }
  //   : { currentPlayer: newStage, others: Stage.NULL };
  // ctx?.events?.setActivePlayers?.(activePlayers);
  board.stage = newStage;
};

const updateBustProb = (board: ChickenrollBoard, endOfTurn: boolean): void => {
  if (endOfTurn) {
    board.endOfTurnBustProb = board.bustProb;
  }
  const allowedColumns = getAllowedColumns(
    board.currentPositions,
    board.blockedSums,
    board.mountainShape
  );
  board.bustProb = getOddsCalculator().oddsBust(allowedColumns);
};

/*
 * When a player climbs a column of 1 step, this function determines where he will land.
 * This is trivial in "share" mode but not in "jump" mode.
 */
export const climbOneStep = (
  currentPositions: CurrentPositions,
  checkpointPositions: CheckpointPositions,
  column: number,
  userId: UserId,
  sameSpace: SameSpace
): number => {
  let newStep;

  if (currentPositions.hasOwnProperty(column)) {
    newStep = currentPositions[column] + 1;
  } else {
    const playerCheckpoint = checkpointPositions[userId];
    const checkpoint =
      playerCheckpoint == null ? 0 : playerCheckpoint[column] || 0;
    newStep = checkpoint + 1;
  }

  if (sameSpace === "share" || sameSpace === "nostop") {
    return newStep;
  } else if (sameSpace === "jump") {
    let weJumped = true;

    while (weJumped) {
      // In jump mode we need to check if another player is at that spot.
      const newStep2 = newStep;
      weJumped = Object.entries(checkpointPositions).some(
        ([otherUserId, playerCheckpointPositions]) => {
          // Ignore the current player.
          if (otherUserId === userId) {
            return false;
          }
          // If the step is the same, then we increment the current player's
          // position.
          const step = playerCheckpointPositions[column];
          if (step != null && step === newStep2) {
            return true;
          }
          return false;
        }
      );
      if (weJumped) {
        newStep++;
      }
    }
    return newStep;
  } else {
    throw new Error(`unexpected value for sameSpace: "${sameSpace}"`);
  }
};

const endTurn = (board: ChickenrollBoard, outcome: "bust" | "stop"): void => {
  board.previousPlayer = board.currentPlayer;
  board.lastOutcome = outcome;
  board.currentPlayerIndex++;
  board.currentPlayerIndex %= board.playerOrder.length;
  board.currentPlayer = board.playerOrder[board.currentPlayerIndex];

  board.currentPositions = {};
  gotoStage(board, "rolling");
  board.currentPlayerHasStarted = false;
  updateBustProb(board, /* endOfTurn */ true);
};

export const [ROLL, roll] = createMove("roll");
export const [STOP, stop] = createMove("stop");

type PickPayload = {
  diceSplitIndex: number;
  choiceIndex: number;
};
export const [PICK, pick] = createMove<PickPayload>("pick");

type RolledPayload = {
  // Dice values we rolled.
  diceValues: number[];
  // diceSumOptions after this roll (if any!)
  diceSumOptions: SumOption[];
  // The move to add to the history.
  move: Move;
  // This we bust on that roll or not.
  busted: boolean;
};
export const [ROLLED, rolled] = createBoardUpdate<RolledPayload>("rolled");
export const [PICKED, picked] = createBoardUpdate("picked");
export const [STOPPED, stopped] = createBoardUpdate("stopped");

// Compare the current positions with the checkpoint positions to see if anything
// overlaps. Useful for the "nostop" mode.
export const numCurrentPlayerOverlap = (
  currentPositions: CurrentPositions,
  checkpointPositions: CheckpointPositions
): number => {
  let numOverlap = 0;
  for (let [col, step] of Object.entries(currentPositions)) {
    for (let positions2 of Object.values(checkpointPositions)) {
      if (positions2[col] === step) {
        numOverlap++;
        break;
      }
    }
  }
  return numOverlap;
};

/* Can the current player hit the "Stop" button?
 */
export const canStop = (board: ChickenrollBoard): boolean => {
  // Must be rolling stage.
  if (board.stage !== "rolling") {
    return false;
  }
  // If we haven't rolled yet we can't stop.
  if (!board.currentPlayerHasStarted) {
    return false;
  }

  // Other than that only the "nostop" mode is tricky.
  if (board.sameSpace !== "nostop") {
    return true;
  }

  // In case of the "nostop" mode, we need to check if we are on the same spot
  // as someone else.
  const { currentPositions, checkpointPositions } = board;
  return numCurrentPlayerOverlap(currentPositions, checkpointPositions) === 0;
};

const moves: Moves<ChickenrollBoard> = {
  [ROLL]: {
    canDo({ userId, board }) {
      return board.currentPlayer === userId && board.stage === "rolling";
    },
    *executeNow() {
      // FIXME we need to set a flag saying we are rolling. This way in the UI we can have
      // something.
    },
    *execute({ board, random }) {
      const diceValues = random.d6(4);

      const move: Move = { diceValues, userId: board.currentPlayer };

      const diceSumOptions = getSumOptions(
        diceValues,
        board.currentPositions,
        board.checkpointPositions,
        board.blockedSums,
        board.mountainShape,
        board.sameSpace,
        board.currentPlayer
      );

      // Check if busted.
      const busted = diceSumOptions.every((sumOption: SumOption) =>
        sumOption.enabled.every((x) => !x)
      );

      yield rolled({ diceValues, diceSumOptions, move, busted });

      if (busted) {
        yield itsYourTurn({ userIds: [board.currentPlayer] });
      }
    },
  },
  [STOP]: {
    canDo({ userId, board }) {
      return board.currentPlayer === userId && canStop(board);
    },
    *executeNow() {
      yield stopped();
    },
    *execute({ board }) {
      if (board.stage === "gameover") {
        yield endMatch({ ranks: pointsToRank(board.scores) });
      } else {
        yield itsYourTurn({ userIds: [board.currentPlayer] });
      }
    },
  },
  [PICK]: {
    canDo({ userId, board, payload }) {
      // FIXME Also check that we can choose *that* move option
      return board.currentPlayer === userId && board.stage === "moving";
    },
    *executeNow({ payload }) {
      // Simply forward the payload from the move.
      yield picked(payload);
    },
  },
};

const boardUpdates: BoardUpdates<ChickenrollBoard> = {
  [ROLLED]: (board, payload: RolledPayload) => {
    const { diceValues, diceSumOptions, move, busted } = payload;
    board.diceValues = diceValues;

    board.lastPickedDiceSumOption = undefined;
    board.diceSumOptions = diceSumOptions;

    if (busted) {
      board.info = {
        code: "bust",
        userId: board.currentPlayer,
        ts: new Date().getTime(),
      };
      endTurn(board, "bust");
      move.bust = true;
    } else {
      board.currentPlayerHasStarted = true;
      gotoStage(board, "moving");
    }

    board.moveHistory.push(move);
  },
  [STOPPED]: (board) => {
    board.lastPickedDiceSumOption = undefined;
    board.diceSumOptions = undefined;
    // Save current positions as checkpoints.
    Object.entries(board.currentPositions).forEach(([diceSumStr, step]) => {
      const diceSum = parseInt(diceSumStr);
      board.checkpointPositions[board.currentPlayer][diceSum] = step;
      if (step === getNumStepsForSum(diceSum, board.mountainShape)) {
        board.blockedSums[diceSum] = board.currentPlayer;
        board.scores[board.currentPlayer] += 1;
        // Remove all the checkpoints for that one
        for (const userId of Object.keys(board.playerInfos)) {
          delete board.checkpointPositions[userId][diceSum];
        }
      }
    });

    // Check if we should end the game,
    if (board.scores[board.currentPlayer] >= board.numColsToWin) {
      // Clean the board a bit.
      board.currentPositions = {};
      board.info = {
        code: "win",
        userId: board.currentPlayer,
        ts: new Date().getTime(),
      };
      gotoStage(board, "gameover");
    } else {
      board.info = {
        code: "stop",
        userId: board.currentPlayer,
        ts: new Date().getTime(),
      };

      endTurn(board, "stop");
    }
  },
  [PICKED]: (board, payload) => {
    const { diceSplitIndex, choiceIndex } = payload;

    const move = getLastMove(board);
    move.diceSplitIndex = diceSplitIndex;

    // Should not happen but makes typescript happy.
    if (board.diceSumOptions == null) {
      throw new Error("assert false");
    }
    const sumOption = board.diceSumOptions[diceSplitIndex];
    const { diceSums, enabled } = sumOption;
    let newDiceSums: number[];

    if (sumOption.split) {
      newDiceSums = [diceSums[choiceIndex]];
      move.diceUsed = [choiceIndex];
    } else {
      newDiceSums = diceSums;
      move.diceUsed = diceSums
        .map((s, i) => (enabled[i] ? i : null))
        .filter((x) => x != null) as number[];
    }
    board.lastPickedDiceSumOption = [diceSplitIndex, choiceIndex];

    newDiceSums.forEach((col, i) => {
      board.currentPositions[col] = climbOneStep(
        board.currentPositions,
        board.checkpointPositions,
        col,
        board.currentPlayer,
        board.sameSpace
      );
    });
    updateBustProb(board, /* endOfTurn */ false);
    gotoStage(board, "rolling");
  },
};

const gameOptions: GameOptions = [
  {
    key: "sameSpace",
    label: "Egg overlap",
    shortLabel: null,
    options: [
      { value: "share", label: "Allow", shortLabel: null },
      { value: "jump", label: "Jump over", shortLabel: "Jump" },
      { value: "nostop", label: "Must roll" },
    ],
    help: "What happens when two eggs end up on the same space.",
  },
  {
    key: "mountainShape",
    label: "Column height",
    shortLabel: null,
    options: [
      { value: "tall", label: "Modern", shortLabel: null },
      { value: "classic", label: "Classic" },
    ],
    help: "Height of the columns. Modern is taller and better calibrated than Classic.",
  },
  {
    key: "showProbs",
    label: "Show probabilities",
    shortLabel: "Probs",
    options: [
      { value: "before", label: "Always" },
      {
        value: "after",
        label: "End of the turn",
        default: true,
        shortLabel: null,
      },
      { value: "never", label: "Never" },
    ],
    help: "When to show the probability of cracking.",
  },
];

/*
 * Determine the number of columns to finish to win
 */
const numPlayersToNumCols = (numPlayers: number): number => {
  const mapping = [null, null, 4, 3, 3, 2];
  const numCols = mapping[numPlayers];
  if (numCols == null) {
    throw new Error("unsuported number of players");
  }
  return numCols;
};

const initialBoard = ({
  players,
  matchOptions,
  matchPlayersOptions,
  random,
}): ChickenrollBoard => {
  const scores: { [userId: string]: number } = {};
  const checkpointPositions: CheckpointPositions = {};

  const playerInfos = {};

  const userIds = players;
  const numPlayers = userIds.length;

  const playerOrder = random.shuffled(userIds);

  const strategies: Record<SameSpace, string> = {
    share:
      "1.329/1.016/1.39/0.01/1.897/-0.009/9.748/0.145/0.006/0.224/0.481/2.436/2.351/0.062/0.14/0.123/0.225/0.189",
    jump: "1.329/1.016/1.39/0.01/1.897/-0.009/9.748/0.145/0.006/0.224/0.481/2.436/2.351/0.062/0.14/0.123/0.225/0.189",
    nostop:
      "0.178/1.897/-0.409/0.693/2.424/-0.105/12.406/-0.001/0.008/0.279/0.453/3.407/3.153/0.016/0.091/0.02/-0.013/0.163",
  };

  userIds.forEach((userId, i) => {
    scores[userId] = 0;
    checkpointPositions[userId] = {};
    const options = matchPlayersOptions[userId];
    const color = options?.color;
    const strategy = options?.strategy;
    playerInfos[userId] = {
      color: color === undefined ? i : parseInt(color),
      strategy: strategy || strategies[matchOptions.sameSpace],
    };
  });

  const blockedSums = {};

  // Those are for quick debugging.
  // const [p0, p1] = userIds;
  // scores[p0] = 2;
  // checkpointPositions[p0][2] = 2;
  // checkpointPositions[p0][3] = 5;
  // checkpointPositions[p0][4] = 7;
  // checkpointPositions[p0][7] = 14;
  // checkpointPositions[p0][6] = 12;
  // checkpointPositions[p1][12] = 2;

  return {
    /*
     * Rows are 1-indexed. This means that
     * 0 == not on the board
     * 1 == first space
     * 3 == end spot for diceSum=2
     */
    diceValues: [1, 2, 3, 6],
    // State of the 3 current climbers. diceSum -> position.
    currentPositions: {},
    checkpointPositions,
    diceSumOptions: undefined,
    lastPickedDiceSumOption: undefined,
    blockedSums,
    scores,
    playerInfos,
    numPlayers,
    // This will contain the details about the last info we want to show to the user.
    info: { code: "start", ts: new Date().getTime() },
    // This tells us if the current player has started playing. When this is true we'll
    // show the players things like "it's your turn" messages.
    currentPlayerHasStarted: false,
    numColsToWin: numPlayersToNumCols(numPlayers),
    moveHistory: [],
    bustProb: 0,
    endOfTurnBustProb: 0,
    // For now we hard-code the shape to our own default.
    mountainShape: matchOptions.mountainShape,
    sameSpace: matchOptions.sameSpace,
    showProbs: matchOptions.showProbs,
    lastOutcome: "stop",

    currentPlayerIndex: 0,
    currentPlayer: playerOrder[0],
    stage: "rolling",
    playerOrder,
  };
};

// A list of criteria we are interested in when choosing an option.
type OptionCriteria = {
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

const scoreCriteria = (weights: number[]) => (oc: OptionCriteria) => {
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

// How many columns would we finish if we chose the 2 columns `col`?
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

const autoMove: GameDef<ChickenrollBoard>["autoMove"] = ({
  board,
  userId,
  random,
}) => {
  // First roll ever.
  if (!board.currentPlayerHasStarted && board.stage === "rolling") {
    return roll();
  }

  const strategy = board.playerInfos[userId].strategy;
  const weights = strategy.split("/").map((x) => parseFloat(x));
  const weightsMoving = weights.splice(0, 10);
  const weightsRolling = weights;
  // console.log("weights", weightsMoving, weightsRolling);

  const calculator = getOddsCalculator();

  if (board.stage === "moving") {
    const options: {
      // arguments for the `pick()` move.
      diceSplitIndex: number;
      choiceIndex: number;
      // data to do some math with
      cols: number[];
    }[] = [];

    board.diceSumOptions.forEach((sumOption, diceSplitIndex) => {
      if (sumOption.split) {
        for (const choiceIndex of [0, 1]) {
          if (sumOption.enabled[choiceIndex]) {
            options.push({
              diceSplitIndex,
              choiceIndex,
              cols: [sumOption.diceSums[choiceIndex]],
            });
          }
        }
      } else {
        if (sumOption.enabled[0]) {
          options.push({
            diceSplitIndex,
            choiceIndex: 0,
            cols: sumOption.diceSums,
          });
        }
      }
    });

    // Gather some information for each option.
    const optionCriterias: OptionCriteria[] = options.map(({ cols }) => {
      // * Num of finished columns.

      // Subset of `cols` that would be finished.
      const finishedCols = getFinishCols({ board, cols });

      // console.log("old colset", Object.keys(board.currentPositions));
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

      // console.log("added col", newCols);
      // console.log("final col", colSet);

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
    });

    // Now merge everything and sort.
    const optionsWithCriteria = options.map((opt, i) => ({
      ...opt,
      ...optionCriterias[i],
      score: scoreCriteria(weightsMoving)(optionCriterias[i]),
    }));

    // console.log(optionsWithCriteria);

    const bestOption = optionsWithCriteria.sort((a, b) => b.score - a.score)[0];

    return pick({
      diceSplitIndex: bestOption.diceSplitIndex,
      choiceIndex: bestOption.choiceIndex,
    });
  }

  if (board.bustProb === 0) {
    return roll();
  }

  if (!canStop(board)) {
    return roll();
  }

  // Here we need to choose between stopping and rolling.
  // We'll have the same approach where we do a linear combination of some parameters
  // and we add a cutoff on it.

  let progressSoFar = 0;
  let numFinishedCol = 0;
  Object.entries(board.currentPositions).forEach(([col, step]) => {
    const colInt = parseInt(col);
    const numSteps = getNumStepsForSum(colInt, board.mountainShape);
    progressSoFar +=
      (step - (board.checkpointPositions[userId][colInt] || 0)) / numSteps;

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
    -(w[1] * progressSoFar + w[2] * numFinishedCol) * board.bustProb +
    w[3] * (1 - board.bustProb) +
    w[4] * probHasToOverlap2 +
    w[5] * probHasToOverlap3;

  if (linearComb > 0) {
    return roll();
  } else {
    return stop();
  }
};

const gamePlayerOptions: GamePlayerOptions = {
  color: {
    label: "Color",
    options: [
      // NOTE those colors are duplicated in the game definition
      { label: "#07df9e", value: "0" },
      { label: "#01a4df", value: "1" },
      { label: "#ff7c36", value: "2" },
      { label: "#ffde0a", value: "3" },
      { label: "#c7233f", value: "4" },
      { label: "#f35076", value: "5" },
      { label: "#a32ea3", value: "6" },
    ],
    type: "color" as PlayerOptionType,
    exclusive: true,
  },
};

export const game: GameDef<ChickenrollBoard> = {
  initialBoard,
  initialItsYourTurn({ board }) {
    return [board.currentPlayer];
  },
  moves,
  boardUpdates,
  gameOptions,
  gamePlayerOptions,
  autoMove,
};
