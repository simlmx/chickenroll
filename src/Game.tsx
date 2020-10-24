import { Stage } from "boardgame.io/core";
import { getSumOptions, sumSteps } from "./math";

interface Info {
  message: string;
  level: "success" | "danger";
}

type GameMode = "pass-and-play" | "remote";

export interface GameType {
  diceValues: number[];
  currentPositions: { [key: number]: number };
  checkpointPositions: { [key: number]: { [key: number]: number } };
  diceSumOptions: null | number[][][];
  lastPickedDiceSumOption: null | number[];
  blockedSums: { [key: number]: number };
  info: Info | null;
  scores: { [key: number]: number };
  // Game mode without the need of a server.
  passAndPlay: boolean;
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

const CantStop = {
  name: "cantstop",
  setup(ctx, setupData: SetupDataType): GameType {
    let passAndPlay = true;
    if (setupData?.passAndPlay != null) {
      passAndPlay = setupData.passAndPlay;
    }
    const scores: { [key: number]: number } = {};
    const checkpointPositions = {};
    for (let i = 0; i < ctx.numPlayers; ++i) {
      scores[i] = 0;
      checkpointPositions[i] = {};
    }
    /*
    checkpointPositions["0"] = { 7: 1 };
    checkpointPositions["1"] = { 7: 1 };
    checkpointPositions["2"] = { 7: 1 };
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
    };
  },
  turn: {
    onBegin: (G: GameType, ctx) => {
      G.currentPositions = {};
      gotoStage(G, ctx, "rolling");
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
                G.blockedSums[diceSum] = parseInt(ctx.currentPlayer);
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
  },
};

export default CantStop;
