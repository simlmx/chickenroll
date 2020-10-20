import { Stage } from "boardgame.io/core";
import { getSumOptions, sumSteps } from "./math";

interface Info {
  message: string;
  level: "success" | "danger";
}

interface GameType {
  diceValues: number[];
  currentPositions: { [key: number]: number };
  checkpointPositions: { [key: number]: { [key: number]: number } };
  diceSumOptions: number[][][];
  blockedSums: { [key: number]: number };
  info: Info | null;
}

export const CantStop = {
  setup(ctx): GameType {
    return {
      /*
       * Rows are 1-indexed. This means that
       * 0 == not on the board
       * 1 == first space
       * 3 == end spot for diceSum=2
       */
      diceValues: [1, 2, 3, 4],
      // State of the 3 current climbers.
      currentPositions: {},
      checkpointPositions: {
        0: {
          3: 3,
          7:11,
        },
        1: {
          3: 3,
          5: 4,
          7: 1,
        },
        2: {
          3: 3,
          7: 1,
        },
        3: {
          3: 3,
          5: 4,
          7: 1,
        },
        4: {
          3: 3,
        },
      },
      diceSumOptions: [[], [], []],
      // TODO use it
      // sum -> player
      blockedSums: { 10: 0 },
      info: { message: "Good game!", level: "success" },
    };
  },
  turn: {
    onBegin: (G: GameType, ctx) => {
      G.currentPositions = {};
      // At the beginning of the turn, the current player is in `rolling` mode. All
      // other players can't play.
      ctx.events.setActivePlayers({
        currentPlayer: "rolling",
        others: Stage.NULL,
      });
    },
    stages: {
      rolling: {
        moves: {
          rollDice: (G: GameType, ctx) => {
            // After a roll we remove how the last player finished.
            G.info = null;
            G.diceValues = ctx.random.Die(6, 4);
            G.diceSumOptions = getSumOptions(
              G.diceValues,
              G.currentPositions,
              G.checkpointPositions[ctx.currentPlayer],
              G.blockedSums
            );
            // Check if busted.
            const busted = G.diceSumOptions.every(
              (sums) => sums[0].length === 0
            );
            if (busted) {
              G.info = { message: "Busted!", level: "danger" };
              ctx.events.endTurn();
            }
            ctx.events.endStage();
          },
          stop: (G: GameType, ctx) => {
            // Save current positions as checkpoints.
            Object.entries(G.currentPositions).forEach(([diceSumStr, step]) => {
              const diceSum = parseInt(diceSumStr);
              G.checkpointPositions[ctx.currentPlayer][diceSum] = step;
              if (step === sumSteps(diceSum)) {
                G.blockedSums[diceSum] = parseInt(ctx.currentPlayer);
                // Remove all the checkpoints for that one
                for (let i=0; i < ctx.numPlayers; ++i) {
                  delete G.checkpointPositions[i][diceSum];
                }
              }
            });
            G.info = { message: "Stopped.", level: "success" };
            ctx.events.endTurn();
          },
        },
        next: "moving",
        start: true,
      },
      moving: {
        moves: {
          pickSumOption: (G: GameType, ctx, i, j) => {
            const sumOption = G.diceSumOptions[i][j];
            sumOption.forEach((s) => {
              if (G.currentPositions.hasOwnProperty(s)) {
                G.currentPositions[s]++;
              } else {
                const checkpoint =
                  G.checkpointPositions[ctx.currentPlayer][s] || 0;
                G.currentPositions[s] = checkpoint + 1;
              }
            });
            ctx.events.endStage();
          },
        },
        next: "rolling",
      },
    },
  },
};
