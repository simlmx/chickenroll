import {
  NUM_COLORS,
  AUTO_NUM_COLS_TO_WIN,
  PLAYER_NAME_MAX_LEN,
} from "./constants";
import { Stage } from "boardgame.io/core";
import { getSumOptions, getNumStepsForSum } from "./math";
import {
  SumOption,
  PlayerID,
  PlayerInfo,
  MountainShape,
  SameSpace,
} from "./types";
import { INVALID_MOVE } from "boardgame.io/core";
import { getAllowedColumns, getOddsCalculator } from "./math/probs";

interface Info {
  // Player that is referred by the message.
  playerID?: PlayerID;
  // Here "start" means we'll only write 'it's your turn' to the starting player.
  code: "bust" | "stop" | "win" | "start";
  // Timestamp at which we got the info. This is treated as an ID to compare two info.
  ts: number;
}

export interface SetupDataType {
  passAndPlay: boolean;
}

export interface Move {
  // Values of the 4 dice.
  diceValues?: number[];
  //0=horzontal, 1=vertical, 2=diagonal
  diceSplitIndex?: number;
  // [0] for the first 2, [1] for the last 2 and [0, 1] for all 4.
  diceUsed?: number[];
  // Did we bust on that move?
  bust?: boolean;
  // Player who made the move.
  playerID: string;
}

export type ShowProbsType = "before" | "after" | "never";

type GameMode = "pass-and-play" | "remote";

export interface GameType {
  diceValues: number[];
  currentPositions: { [key: number]: number };
  checkpointPositions: { [key: string]: { [key: number]: number } };
  diceSumOptions?: SumOption[];
  lastPickedDiceSumOption?: number[];
  blockedSums: { [key: number]: string };
  info?: Info;
  scores: { [key: number]: number };
  // Game mode without the need of a server.
  passAndPlay: boolean;
  // By default we'll set the game to the *maximum* number of players, but maybe less
  // people will join.
  numPlayers: number;
  setupData: SetupDataType;
  // Number of victories for the current match.
  numVictories: { [key: string]: number };
  currentPlayerHasStarted: boolean;
  // PlayerID -> name, color, etc.
  playerInfos: { [key: string]: PlayerInfo };
  // Number of columns to complete to win.
  numColsToWin: number | "auto";
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
}

/*
 * Return the last move in the history of moves.
 */
const getLastMove = (G: GameType): Move => {
  return G.moveHistory[G.moveHistory.length - 1];
};

/*
 * Go to a given stage but taking into account the passAndPlay mode.
 */
const gotoStage = (G: GameType, ctx, newStage: string): void => {
  const activePlayers = G.passAndPlay
    ? { all: newStage }
    : { currentPlayer: newStage, others: Stage.NULL };
  ctx?.events?.setActivePlayers?.(activePlayers);
};

const updateBustProb = (G: GameType, endOfTurn: boolean): void => {
  if (endOfTurn) {
    G.endOfTurnBustProb = G.bustProb;
  }
  const allowedColumns = getAllowedColumns(
    G.currentPositions,
    G.blockedSums,
    G.mountainShape
  );
  G.bustProb = getOddsCalculator().oddsBust(allowedColumns);
};

/*
 * When a player climbs a column of 1 step, this function determines where he will land.
 * This is trivial in "share" mode but not in "jump" mode.
 */
export const climbOneStep = (
  currentPositions: { [key: number]: number },
  checkpointPositions: { [key: string]: { [key: number]: number } },
  column: number,
  playerID: PlayerID,
  sameSpace: SameSpace
): number => {
  let newStep;

  if (currentPositions.hasOwnProperty(column)) {
    newStep = currentPositions[column] + 1;
  } else {
    const playerCheckpoint = checkpointPositions[playerID];
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
        ([otherPlayerID, playerCheckpointPositions]) => {
          // Ignore the current player.
          if (otherPlayerID === playerID) {
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

/*
 * Definition of the main phase.
 */
const turn = {
  onBegin: (G: GameType, ctx) => {
    G.currentPositions = {};
    gotoStage(G, ctx, "rolling");
    G.currentPlayerHasStarted = false;
    updateBustProb(G, /* endOfTurn */ true);
  },
  order: {
    first: (G: GameType, ctx) => 0,
    next: (G: GameType, ctx) => (ctx.playOrderPos + 1) % G.numPlayers,
    playOrder: (G: GameType, ctx) => {
      // Take the actual number of players, and randomize amongst them.
      let playOrder = Array(G.numPlayers)
        .fill(null)
        .map((_, i) => i.toString());
      playOrder = ctx.random.Shuffle(playOrder);
      return playOrder;
    },
  },
  stages: {
    rolling: {
      moves: {
        rollDice: (G: GameType, ctx) => {
          // After a roll we remove how the last player finished.
          const diceValues = ctx.random.Die(6, 4);

          G.diceValues = diceValues;

          const move: Move = { diceValues, playerID: ctx.currentPlayer };

          G.lastPickedDiceSumOption = undefined;
          G.diceSumOptions = getSumOptions(
            G.diceValues,
            G.currentPositions,
            G.checkpointPositions,
            G.blockedSums,
            G.mountainShape,
            G.sameSpace,
            ctx.currentPlayer
          );
          // Check if busted.
          const busted = G.diceSumOptions.every((sumOption: SumOption) => {
            return sumOption.diceSums.every((x) => x == null);
          });
          if (busted) {
            G.info = {
              code: "bust",
              playerID: ctx.currentPlayer,
              ts: new Date().getTime(),
            };
            ctx.events.endTurn();
            move.bust = true;
          } else {
            G.currentPlayerHasStarted = true;
            gotoStage(G, ctx, "moving");
          }

          G.moveHistory.push(move);
        },
        stop: (G: GameType, ctx) => {
          G.lastPickedDiceSumOption = undefined;
          G.diceSumOptions = undefined;
          // Save current positions as checkpoints.
          Object.entries(G.currentPositions).forEach(([diceSumStr, step]) => {
            const diceSum = parseInt(diceSumStr);
            G.checkpointPositions[ctx.currentPlayer][diceSum] = step;
            if (step === getNumStepsForSum(diceSum, G.mountainShape)) {
              G.blockedSums[diceSum] = ctx.currentPlayer;
              G.scores[ctx.currentPlayer] += 1;
              // Remove all the checkpoints for that one
              for (let i = 0; i < ctx.numPlayers; ++i) {
                delete G.checkpointPositions[i][diceSum];
              }
            }
          });

          // Check if we should end the game,
          if (G.scores[ctx.currentPlayer] >= G.numColsToWin) {
            // Clean the board a bit.
            G.currentPositions = {};
            G.info = {
              code: "win",
              playerID: ctx.currentPlayer,
              ts: new Date().getTime(),
            };
            G.numVictories[ctx.currentPlayer] += 1;
            ctx.events.endPhase();
          } else {
            G.info = {
              code: "stop",
              playerID: ctx.currentPlayer,
              ts: new Date().getTime(),
            };
            ctx.events.endTurn();
          }
        },
      },
    },
    moving: {
      moves: {
        /*
         * Pick one of the sums in option.
         * diceSplitIndex: One of the possible dice splits
         * choiceIndex: 0 or 1, for "split' dice ([3] [5]) it means either the first or
         * second one. For non split dice (e.g. [3 - 5]) it should always be 0.
         */
        pickSumOption: (
          G: GameType,
          ctx,
          diceSplitIndex: number,
          choiceIndex: number
        ) => {
          const move = getLastMove(G);
          move.diceSplitIndex = diceSplitIndex;
          // Should not happen but makes typescript happy.
          if (G.diceSumOptions == null) {
            throw new Error("assert false");
          }
          const sumOption = G.diceSumOptions[diceSplitIndex];
          let { diceSums } = sumOption;

          if (sumOption?.split) {
            diceSums = [diceSums[choiceIndex]];
            move.diceUsed = [choiceIndex];
          } else {
            move.diceUsed = diceSums
              .map((s, i) => (s == null ? null : i))
              .filter((x) => x != null) as number[];
          }
          G.lastPickedDiceSumOption = [diceSplitIndex, choiceIndex];

          diceSums.forEach((col) => {
            if (col == null) {
              return;
            }
            G.currentPositions[col] = climbOneStep(
              G.currentPositions,
              G.checkpointPositions,
              col,
              ctx.currentPlayer,
              G.sameSpace
            );
          });
          updateBustProb(G, /* endOfTurn */ false);
          gotoStage(G, ctx, "rolling");
        },
      },
    },
  },
};

const setup = (ctx, setupData: SetupDataType): GameType => {
  let passAndPlay = true;
  if (setupData?.passAndPlay != null) {
    passAndPlay = setupData.passAndPlay;
  }

  const scores: { [key: number]: number } = {};
  const checkpointPositions = {};
  const numVictories = {};

  for (let i = 0; i < ctx.numPlayers; ++i) {
    scores[i] = 0;
    checkpointPositions[i] = {};
    numVictories[i] = 0;
  }

  const playerInfos = {};
  // For pass-and-play games we set default player names.
  if (passAndPlay) {
    for (let i = 0; i < ctx.numPlayers; ++i) {
      playerInfos[i.toString()] = {
        name: `Player ${i + 1}`,
        color: i,
        ready: false,
      };
    }
  }

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
    passAndPlay,
    playerInfos,
    numPlayers: ctx.numPlayers,
    setupData,
    numVictories,
    // This will contain the details about the last info we want to show to the user.
    info: { code: "start", ts: new Date().getTime() },
    // This tells us if the current player has started playing. When this is true we'll
    // show the players things like "it's your turn" messages.
    currentPlayerHasStarted: false,
    numColsToWin: "auto",
    moveHistory: [],
    showProbs: "after",
    bustProb: 0,
    endOfTurnBustProb: 0,
    mountainShape: "tall",
    sameSpace: "share",
  };
};

const setName = (G: GameType, ctx, name: string, playerID: PlayerID = "0") => {
  // Nothing happens if the name is empty.
  // This way we make sure a player without a name is not ready.
  if (!name) {
    return;
  }

  playerID = G.passAndPlay ? playerID : ctx.playerID;

  G.playerInfos[playerID].name = name.substring(0, PLAYER_NAME_MAX_LEN);
};

const setColor = (
  G: GameType,
  ctx,
  color: number,
  playerID: PlayerID = "0"
) => {
  playerID = G.passAndPlay ? playerID : ctx.playerID;

  // If we are not actually changing the color we can ignore this.
  // This happens when we click on the same color we already have.
  if (G.playerInfos[playerID].color === color) {
    return;
  }

  // It's an invalid move if someone else already has that color.
  if (Object.values(G.playerInfos).some((info) => info.color === color)) {
    return INVALID_MOVE;
  }
  G.playerInfos[playerID].color = color;
};

const CantStop = {
  name: "cantstop",
  setup,
  phases: {
    // Phase where we wait for everyone to join, choose a name, colors, etc.
    setup: {
      start: true,
      next: "main",
      turn: {
        onBegin: (G: GameType, ctx) => {
          ctx.events.setActivePlayers({ all: "setup" });
        },
        // There is only one stage, but we need it for all the players to be able to
        // interact in any order.
        stages: {
          setup: {
            moves: {
              // Join a new game with potentially a prefered name and color.
              join: (
                G: GameType,
                ctx,
                playerName: string | undefined,
                playerColor: number | undefined
              ) => {
                if (G.passAndPlay) {
                  return INVALID_MOVE;
                }
                // If we have already joined, we ignore this.
                if (G.playerInfos.hasOwnProperty(ctx.playerID)) {
                  return;
                }
                // Find the next available color.
                const availableColors = Array(NUM_COLORS).fill(true);

                Object.values(G.playerInfos).forEach(
                  (playerInfo) => (availableColors[playerInfo.color] = false)
                );

                // We shouldn't need this fallback because there as more colors than
                // players.
                let newColor = 0;

                if (playerColor != null && availableColors[playerColor]) {
                  // If we supplied a prefered color and if it's available, we use that.
                  newColor = playerColor;
                } else {
                  // Otherwise we take the next available color.
                  availableColors.some((available, color) => {
                    if (available) {
                      newColor = color;
                      return true;
                    }
                    return false;
                  });
                }

                if (!playerName) {
                  playerName = `Player ${parseInt(ctx.playerID) + 1}`;
                }

                G.playerInfos[ctx.playerID] = {
                  name: playerName,
                  color: newColor,
                  ready: false,
                };
              },
              setName,
              setColor,
              setReady: (
                G: GameType,
                ctx,
                playerID: PlayerID,
                ready: boolean
              ) => {
                if (G.passAndPlay) {
                  return INVALID_MOVE;
                }
                G.playerInfos[playerID].ready = ready;
              },
              startMatch: (G: GameType, ctx) => {
                if (ctx.playerID !== "0") {
                  return INVALID_MOVE;
                }

                // If some players are not ready, we can't start the game. Not ready is
                // the same as writing down your name, at least for now.
                if (Object.values(G.playerInfos).some((info) => !info.name)) {
                  return INVALID_MOVE;
                }

                // Set the number of players
                G.numPlayers = G.passAndPlay
                  ? ctx.numPlayers
                  : Object.keys(G.playerInfos).length;

                // Convert 'auto' number of columns to win to a number
                if (G.numColsToWin === "auto") {
                  G.numColsToWin = AUTO_NUM_COLS_TO_WIN.get(G.numPlayers) || 3;
                }

                ctx.events.endPhase();
              },
              setNumColsToWin: (
                G: GameType,
                ctx,
                numColsToWin: number | "auto"
              ) => {
                if (ctx.playerID !== "0") {
                  return INVALID_MOVE;
                }
                G.numColsToWin = numColsToWin;
              },
              setShowProbs: (G: GameType, ctx, showProbs: ShowProbsType) => {
                if (ctx.playerID !== "0") {
                  return INVALID_MOVE;
                }
                G.showProbs = showProbs;
              },
              setMountainShape: (
                G: GameType,
                ctx,
                mountainShape: MountainShape
              ) => {
                if (ctx.playerID !== "0") {
                  return INVALID_MOVE;
                }
                G.mountainShape = mountainShape;
              },
              setSameSpace: (G: GameType, ctx, sameSpace: SameSpace) => {
                if (ctx.playerID !== "0") {
                  return INVALID_MOVE;
                }
                G.sameSpace = sameSpace;
              },
            },
          },
        },
      },
    },
    // Main phase where we actually play the game.
    main: {
      turn,
      next: "gameover",
    },
    gameover: {
      onBegin: (G, ctx) => {
        ctx.events.setActivePlayers({ all: "gameover" });
      },
      turn: {
        // Make sure the order doesn't change when it's gameover. We'll change it at the
        // beginning of a new game.
        order: {
          first: (G: GameType, ctx) => ctx.playOrderPos,
          next: (G: GameType, ctx) => 0,
          playOrder: (G: GameType, ctx) => ctx.playOrder,
        },
      },
      moves: {
        /* Reset the game to initial state */
        playAgain: (G, ctx) => {
          // We need to keep some of the fields that were entered during the game, in the "setup"
          // phase.
          const keepFields = [
            "playerInfos",
            "numPlayers",
            "numVictories",
            "numColsToWin",
            "showProbs",
            "mountainShape",
            "sameSpace",
          ];

          // Create an object like G but with only the fields to keep.
          const GKeep = Object.keys(G)
            .filter((key) => keepFields.indexOf(key) >= 0)
            .reduce((G2, key) => Object.assign(G2, { [key]: G[key] }), {});

          Object.assign(G, setup(ctx, G.setupData), GKeep);

          ctx.events.setPhase("main");
        },
      },
      stages: {
        gameover: {},
      },
    },
  },
};

export default CantStop;
