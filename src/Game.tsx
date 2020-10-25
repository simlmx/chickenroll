import { Stage } from "boardgame.io/core";
import { getSumOptions, sumSteps } from "./math";
import { DiceSum, PlayerID } from "./types";
import { INVALID_MOVE } from "boardgame.io/core";

interface Info {
  message: string;
  level: "success" | "danger";
}

type GameMode = "pass-and-play" | "remote";

export interface GameType {
  diceValues: number[];
  currentPositions: { [key: number]: number };
  checkpointPositions: { [key: string]: { [key: number]: number } };
  diceSumOptions: null | DiceSum[][][];
  lastPickedDiceSumOption: null | number[];
  blockedSums: { [key: number]: string };
  info: Info | null;
  scores: { [key: number]: number };
  // Game mode without the need of a server.
  passAndPlay: boolean;
  // playerID -> name
  playerNames: { [key: string]: string };
  //playerOrder: PlayerID[];
  // By default we'll set the game to the *maximum* number of players, but maybe less
  // people will join.
  numPlayers: number;
}

export interface SetupDataType {
  passAndPlay: boolean;
}

/*
 * Go to a given stage but taking into account the passAndPlay mode.
 */
const gotoStage = (G: GameType, ctx, newStage: string): void => {
  const activePlayers = G.passAndPlay
    ? { all: newStage }
    : { currentPlayer: newStage, others: Stage.NULL };
  ctx.events.setActivePlayers(activePlayers);
};

/*
 * Definition of the main phase.
 */
const turn = {
  onBegin: (G: GameType, ctx) => {
    G.currentPositions = {};
    gotoStage(G, ctx, "rolling");
  },
  order: {
    first: (G: GameType, ctx) => 0,
    next: (G: GameType, ctx) => (ctx.playOrderPos + 1) % G.numPlayers,
    playOrder: (G: GameType, ctx) => {
      // Take the actual number of players, and randomize amongst them.
      let playerOrder = Array(G.numPlayers)
        .fill(null)
        .map((_, i) => i.toString());
      playerOrder = ctx.random.Shuffle(playerOrder);
      return playerOrder;
    },
  },
  stages: {
    rolling: {
      moves: {
        rollDice: (G: GameType, ctx) => {
          // After a roll we remove how the last player finished.
          G.info = null;
          G.diceValues = ctx.random.Die(6, 4);
          G.lastPickedDiceSumOption = null;
          G.diceSumOptions = getSumOptions(
            G.diceValues,
            G.currentPositions,
            G.checkpointPositions[ctx.currentPlayer],
            G.blockedSums
          );
          // Check if busted.
          const busted = G.diceSumOptions.every((sums) => {
            return sums[0].length === 0;
          });
          if (busted) {
            G.info = { message: "Busted!", level: "danger" };
            ctx.events.endTurn();
          }
          gotoStage(G, ctx, "moving");
        },
        stop: (G: GameType, ctx) => {
          G.lastPickedDiceSumOption = null;
          G.diceSumOptions = null;
          // Save current positions as checkpoints.
          Object.entries(G.currentPositions).forEach(([diceSumStr, step]) => {
            const diceSum = parseInt(diceSumStr);
            G.checkpointPositions[ctx.currentPlayer][diceSum] = step;
            if (step === sumSteps(diceSum)) {
              G.blockedSums[diceSum] = ctx.currentPlayer;
              G.scores[ctx.currentPlayer] += 1;
              // Remove all the checkpoints for that one
              for (let i = 0; i < ctx.numPlayers; ++i) {
                delete G.checkpointPositions[i][diceSum];
              }
            }
          });

          // Check if we should end the game,
          if (G.scores[ctx.currentPlayer] === 3) {
            // Clean the board a bit.
            G.currentPositions = {};
            G.info = {
              message: `Player ${ctx.currentPlayer} won!`,
              level: "success",
            };
            ctx.events.endGame();
          } else {
            G.info = { message: "Stopped.", level: "success" };
            ctx.events.endTurn();
          }
        },
      },
    },
    moving: {
      moves: {
        pickSumOption: (G: GameType, ctx, i, j) => {
          // Should not happen but makes typescript happy.
          if (G.diceSumOptions == null) {
            throw new Error("assert false");
          }
          const sumOption = G.diceSumOptions[i][j];
          G.lastPickedDiceSumOption = [i, j];
          sumOption.forEach((s) => {
            if (G.currentPositions.hasOwnProperty(s)) {
              G.currentPositions[s]++;
            } else {
              const checkpoint =
                G.checkpointPositions[ctx.currentPlayer][s] || 0;
              G.currentPositions[s] = checkpoint + 1;
            }
          });
          gotoStage(G, ctx, "rolling");
        },
      },
    },
  },
};

const CantStop = {
  name: "cantstop",
  setup(ctx, setupData: SetupDataType): GameType {
    let passAndPlay = true;
    if (setupData?.passAndPlay != null) {
      passAndPlay = setupData.passAndPlay;
    }

    const scores: { [key: number]: number } = {};
    const checkpointPositions = {};
    const playerNames = {};
    //const playerOrder: PlayerID[] = [];

    for (let i = 0; i < ctx.numPlayers; ++i) {
      scores[i] = 0;
      checkpointPositions[i] = {};
      //playerOrder[i] = i.toString();
    }
    //Those are for quick debugging
    /*
    checkpointPositions["0"] = { 7: 1, 8: 1 };
    checkpointPositions["1"] = { 7: 1, 8: 1, 9: 2 };
    checkpointPositions["2"] = { 7: 1, 8: 1, 9: 2 };
    checkpointPositions["3"] = { 7: 1, 8: 1, 9: 2 };
    */
    return {
      /*
       * Rows are 1-indexed. This means that
       * 0 == not on the board
       * 1 == first space
       * 3 == end spot for diceSum=2
       */
      diceValues: [1, 2, 3, 4],
      // State of the 3 current climbers. diceSum -> position.
      currentPositions: {},
      checkpointPositions,
      diceSumOptions: null,
      lastPickedDiceSumOption: null,
      blockedSums: {},
      info: { message: "Good game!", level: "success" },
      scores,
      passAndPlay,
      playerNames,
      numPlayers: ctx.numPlayers,
      //playerOrder,
    };
  },
  phases: {
    // Phase where we wait for everyone to join, choose a name, colors, etc.
    setup: {
      start: true,
      next: "main",
      turn: {
        onBegin: (G: GameType, ctx) => {
          // In pass-and-play mode we skip this phase.
          if (G.passAndPlay) {
            ctx.events.endPhase();
          } else {
            ctx.events.setActivePlayers({ all: "setup" });
          }
        },
        // There is only one stage, but we need it for all the players to be able to
        // interact in any order.
        stages: {
          setup: {
            moves: {
              setName: (G: GameType, ctx, name: string) => {
                G.playerNames[ctx.playerID] = name;
              },
              startGame: (G: GameType, ctx) => {
                if (ctx.playerID !== "0") {
                  return INVALID_MOVE;
                }

                // If some players are not ready, we can't start the game. Not ready is
                // the same as writing down your name, at least for now.
                if (Object.values(G.playerNames).some((name) => !name)) {
                  return INVALID_MOVE;
                }
                G.numPlayers = G.passAndPlay
                  ? ctx.numPlayers
                  : Object.keys(G.playerNames).length;
                ctx.events.endPhase();
              },
            },
          },
        },
      },
      /*      turn: {
        onBegin: (G: GameType, ctx) => {
          // Let's skip the setup for pass-and-play games.
          if (G.passAndPlay) {
            ctx.events.endPhase();
          }
          },*/
      //  },
    },
    // Main phase where we actually play the game.
    main: {
      turn,
    },
  },
};

export default CantStop;
