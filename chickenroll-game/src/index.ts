import {
  GameOptions,
  UserId,
  GamePlayerOptions,
  PlayerOptionType,
  endMatch,
  itsYourTurn,
} from "bgkit";

import { Moves, BoardUpdates, GameDef, Move as BgkitMove } from "bgkit-game";

import {
  getSumOptions,
  getNumStepsForSum,
  getSpaceLeft,
  DICE_INDICES,
  numCurrentPlayerOverlap,
  climbOneStep,
} from "./math";

import { canStop } from "./utils";

import { getAllowedColumns, getOddsCalculator } from "./math/probs";

import {
  DiceSum,
  MountainShape,
  SameSpace,
  CurrentPositions,
  CheckpointPositions,
  PlayerInfo,
  ChickenrollBoard,
  SumOption,
  Move,
  Stage,
  ROLL,
  roll,
  rolled,
  STOP,
  STOPPED,
  stopped,
  PICK,
  PICKED,
  picked,
  ROLLED,
  RolledPayload,
} from "./types";

import {
  Action,
  computeFeatures,
  Features,
  scoreFeatures,
  legacyBot,
} from "./bots";

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
  ChickenrollBoard,
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
        yield endMatch({ scores: board.scores });
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
      { value: "share", label: "Allow", shortLabel: null, default: true },
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
      { value: "tall", label: "Modern", shortLabel: null, default: true },
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
      "17.769/0.03/11.849/0.009/0.837/0.024/11.441/0.011/0.002/0.122/0.22/4.895/2.687/0.732/0.001/0.155/0.003",
    jump: "100.289/0.829/22.664/0.004/2.116/0.213/17.662/0.078/0.001/0.79/0.23/0.159/9.081/0.091/0.019/0.266/-0.075",
    nostop:
      "24.613/2.384/33.085/0.026/5.329/0.01/45.865/0.001/-0.007/0.305/0.805/5.149/2.816/0.036/1.073/2.142/0.037",
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

const autoMove: GameDef<ChickenrollBoard>["autoMove"] = ({
  board,
  userId,
  random,
}): BgkitMove => {
  // First roll.
  if (!board.currentPlayerHasStarted && board.stage === "rolling") {
    return roll();
  }

  return legacyBot({ board, userId });

  // FIXME when everything works then split it in 2
  // if (board.stage !== "moving") {
  // We always roll/stop right after we move, so we should only get autoMove for stage="moving".
  //   throw Error('autoMove should always be calling for stage="moving"');
  // }
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
  playerScoreType: "integer",
};
