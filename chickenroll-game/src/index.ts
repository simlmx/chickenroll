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

import { getSumOptions, getNumStepsForSum, SumOption } from "./math";

import { getAllowedColumns, getOddsCalculator } from "./math/probs";
export { OddsCalculator } from "./math/probs";
export { DICE_INDICES } from "./math";

import {
  DiceSum,
  PlayerInfo,
  MountainShape,
  SameSpace,
  CurrentPositions,
  CheckpointPositions,
} from "./types";
export { NUM_STEPS } from "./constants";

// Imports that should also be exported.
export {
  DiceSum,
  PlayerInfo,
  MountainShape,
  SameSpace,
  SumOption,
  getNumStepsForSum,
};

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
  blockedSums: { [key: number]: string };
  info?: Info;
  // Number of columns finished for each player.
  scores: { [userId: number]: number };
  // By default we'll set the game to the *maximum* number of players, but maybe less
  // people will join.
  numPlayers: number;
  // Number of victories for the current match.
  currentPlayerHasStarted: boolean;
  // UserId -> color, etc.
  playerInfos: { [key: string]: PlayerInfo };
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
export const isCurrentPlayerOverlapping = (
  currentPositions: CurrentPositions,
  checkpointPositions: CheckpointPositions
): boolean => {
  for (let [col, step] of Object.entries(currentPositions)) {
    for (let positions2 of Object.values(checkpointPositions)) {
      if (positions2[col] === step) {
        return true;
      }
    }
  }
  return false;
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
  return !isCurrentPlayerOverlapping(currentPositions, checkpointPositions);
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

  userIds.forEach((userId, i) => {
    scores[userId] = 0;
    checkpointPositions[userId] = {};
    playerInfos[userId] = {
      color: parseInt(matchPlayersOptions[userId].color),
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
}) => {
  // First roll ever.
  if (!board.currentPlayerHasStarted && board.stage === "rolling") {
    return roll();
  } else if (board.stage === "moving") {
    const options: {
      // arguments for the `pick()` move.
      diceSplitIndex: number;
      choiceIndex;
      // data to do some math with
      cols: number[];
    }[] = [];

    // board.diceSumOptions.forEach((sumOption, diceSplitIndex) => {
    //   if (isSumOptionSplit
    //   options.push({diceSplitIndex})
    // })
    // for (const sumOption of board.diceSumOptions) {
    //   if (isSumOptionSplit(sumOption)) {
    //   }
    //   if (option.enabled) {
    //     return pick({})
    //   }
    // }

    // }
    // Stop otherwise
    // return stop();
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
  // autoMove,
};
