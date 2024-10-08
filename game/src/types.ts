import type { UserId } from "@lefun/core";
import type { GameState } from "@lefun/game";

import { SumOption } from "./math";

export type DiceSum = number;

export type PlayerInfo = {
  color: number;
  // Used for bots.
  strategy?: string;
  // Optional for backward compatiblity.
  isBot?: boolean;
};

export type MountainShape = "classic" | "tall" | "debug";

// What to do when players occupy the same space.
// share: tokens can share the same space
// jump: tokens jump over opponents
export type SameSpace = "share" | "jump" | "nostop";

// FIXME use throughout
export type CurrentPositions = { [col: number]: number };
export type CheckpointPositions = { [userId: string]: CurrentPositions };

export type ChickenrollBoard = {
  diceValues: number[];
  currentPositions: CurrentPositions;
  checkpointPositions: CheckpointPositions;
  diceSumOptions?: SumOption[];
  lastPickedDiceSumOption?: number[];
  // What was the last action between roll and stop. Optional for backward compatibility.
  lastAction?: "roll" | "stop" | null;
  blockedSums: Record<number, UserId>;
  info?: Info;
  // Number of columns finished for each player.
  // scores: { [userId: number]: number };
  scores: Record<UserId, number>;
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

export interface Info {
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
export type Stage = "moving" | "rolling" | "gameover";

export type ChickenrollGameState = GameState<ChickenrollBoard>;
