import {
  createMove,
  createBoardUpdate,
  Moves,
  BoardUpdates,
  GameOptions,
  GameDef,
  UserId,
} from "bgkit";

import {
  getSumOptions,
  getNumStepsForSum,
  SumOption,
  isSumOptionSplit,
} from "./math";

import { PlayerInfo, MountainShape, SameSpace } from "./types";
import { getAllowedColumns, getOddsCalculator } from "./math/probs";

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
  currentPositions: { [key: number]: number };
  checkpointPositions: { [userId: string]: { [key: number]: number } };
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
  numVictories: { [userId: string]: number };
  currentPlayerHasStarted: boolean;
  // UserId -> name, color, etc.
  playerInfos: { [key: string]: PlayerInfo };
  // Number of columns to complete to win.
  // FIXME use something deterministic ,no options
  // 2 palyers: 4
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
  currentPositions: { [key: number]: number },
  checkpointPositions: { [key: string]: { [key: number]: number } },
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

  if (sameSpace === "share") {
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
    throw new Error("unexpected value for sameSpace");
  }
};

const endTurn = (board: ChickenrollBoard, outcome: "bust" | "stop"): void => {
  board.previousPlayer = board.currentPlayer;
  board.lastOutcome = outcome;
  board.currentPlayerIndex++;
  board.currentPlayerIndex %= board.playerOrder.length;
  board.currentPlayer = board.playerOrder[board.currentPlayerIndex];
};

export const [ROLL, roll] = createMove("roll");
export const [STOP, stop] = createMove("stop");

type PickPayload = {
  diceSplitIndex: number;
  choiceIndex: number;
};
export const [PICK, pick] = createMove<PickPayload>("pick");

type RolledPayload = {
  diceValues: number[];
};
export const [ROLLED, rolled] = createBoardUpdate<RolledPayload>("rolled");
export const [PICKED, picked] = createBoardUpdate("picked");
export const [STOPPED, stopped] = createBoardUpdate("stopped");

// FIXME We might want to move that to the platform!
// export const [PLAY_AGAIN, playAgain] = createMove("playAgain");
// export const [PLAYED_AGAIN, playedAgain] = createBoardUpdate("playedAgain");

// FIXME For now we have replaced the ctx.events.endPhase with this.
// We have a winner, we finish the round;
const endRound = (board: ChickenrollBoard): void => {
  // FIXME do something more celver that the old version for the playerOrder
  // FIXME reset a lot of things
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
    *execute({ random }) {
      const diceValues = random.d6(4);
      yield rolled({ diceValues });
    },
  },
  [STOP]: {
    canDo({ userId, board }) {
      return board.currentPlayer === userId && board.stage === "rolling";
    },
    *execute() {
      yield stopped();
    },
  },
  [PICK]: {
    canDo({ userId, board, payload }) {
      // FIXME Also check that we can choose *that* move option
      return board.currentPlayer === userId && board.stage === "moving";
    },
    *execute({ payload }) {
      // Simply forward the payload from the move.
      yield picked(payload);
    },
  },
};

const boardUpdates: BoardUpdates<ChickenrollBoard> = {
  [ROLLED]: (board, payload: RolledPayload) => {
    const { diceValues } = payload;
    board.diceValues = diceValues;

    const move: Move = { diceValues, userId: board.currentPlayer };

    board.lastPickedDiceSumOption = undefined;
    board.diceSumOptions = getSumOptions(
      board.diceValues,
      board.currentPositions,
      board.checkpointPositions,
      board.blockedSums,
      board.mountainShape,
      board.sameSpace,
      board.currentPlayer
    );
    // Check if busted.
    const busted = board.diceSumOptions.every((sumOption: SumOption) =>
      sumOption.enabled.every((x) => !x)
    );
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
      board.numVictories[board.currentPlayer] += 1;
      endRound(board);
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
    let { diceSums, enabled } = sumOption;

    if (isSumOptionSplit(sumOption)) {
      diceSums = [diceSums[choiceIndex]];
      move.diceUsed = [choiceIndex];
    } else {
      move.diceUsed = diceSums
        .map((s, i) => (enabled[i] ? i : null))
        .filter((x) => x != null) as number[];
    }
    board.lastPickedDiceSumOption = [diceSplitIndex, choiceIndex];

    diceSums.forEach((col, i) => {
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

const options: GameOptions = {
  sameSpace: {
    label: "Player Interaction",
    options: [
      { value: "share", label: "None" },
      { value: "jump", label: "Jump over other players" },
    ],
    help: "What happens when two players end up on the same space.",
  },
  showProbs: {
    label: "Show probability of cracking",
    options: [
      { value: "before", label: "Before every roll" },
      { value: "after", label: "At the end of the turn" },
      { value: "never", label: "Never" },
    ],
    help: "When to show the probability of cracking.",
  },
};

/*
 * Determine the number of columns to finish to win
 */
const numPlayersToNumCols = (numPlayers: number): number => {
  switch (numPlayers) {
    case 2:
      return 4;
    case 3:
    case 4:
      return 3;
    case 5:
      return 2;
    default:
      throw new Error("unsuported number of players");
  }
};

const initialBoard = ({ players, matchOptions, random }): ChickenrollBoard => {
  const scores: { [key: number]: number } = {};
  const checkpointPositions = {};
  const numVictories = {};
  const playerInfos = {};

  const userIds = Object.keys(players);
  const numPlayers = userIds.length;

  const playerOrder = random.shuffled(userIds);

  userIds.forEach((userId, i) => {
    scores[userId] = 0;
    checkpointPositions[userId] = {};
    numVictories[userId] = 0;
    playerInfos[userId] = {
      name: players[userId].name,
      color: i,
    };
  });

  const blockedSums = {};

  // Those are for quick debugging.
  // for (let i = 0; i < ctx.numPlayers; ++i) {
  // const id = i.toString();
  // checkpointPositions[id] = { 6: 10, 7: 12, 8: 7 };
  // scores[id] = (i % 2) + 1;

  // playerInfos[id] = { name: `player name ${i + 1}`, color: (i + 1) % 4 };
  // }
  // numVictories[0] = 1;
  // numVictories[2] = 1;
  // numVictories[1] = 7;
  // checkpointPositions["0"][3] = 4;
  // checkpointPositions["2"][7] = 4;
  // checkpointPositions["1"][7] = 2;
  // checkpointPositions["1"][8] = 2;
  // blockedSums[4] = "0";
  // blockedSums[5] = "2";

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
    numVictories,
    // This will contain the details about the last info we want to show to the user.
    info: { code: "start", ts: new Date().getTime() },
    // This tells us if the current player has started playing. When this is true we'll
    // show the players things like "it's your turn" messages.
    currentPlayerHasStarted: false,
    numColsToWin: numPlayersToNumCols(numPlayers),
    moveHistory: [],
    showProbs: "after",
    bustProb: 0,
    endOfTurnBustProb: 0,
    mountainShape: "tall",
    sameSpace: "share",
    lastOutcome: "stop",

    currentPlayerIndex: 0,
    currentPlayer: playerOrder[0],
    stage: "rolling",
    playerOrder,
  };
};

export const game: GameDef<ChickenrollBoard> = {
  initialBoard,
  moves,
  boardUpdates,
  options,
};
