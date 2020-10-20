import { Stage } from "boardgame.io/core";
import { getSumOptions } from "./math";

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
      diceValues: [1, 2, 3, 4],
      // State of the 3 current climbers.
      currentPositions: {},
      checkpointPositions: {
        0: {
          3: 3,
          5: 9,
        },
        1: {
          3: 3,
          5: 4,
        },
        2: {
          3: 3,
        },
        3: {
          3: 4,
          5: 4,
          7: 5,
        },
      },
      diceSumOptions: [[], [], []],
      // TODO use it
      // sum -> player
      blockedSums: {},
      info: { message: "Good game!", level: "success" },
    };
  },
  turn: {
    onBegin: (G: GameType, ctx) => {
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
              G.blockedSums
            );
            // Check if bust
            const bust = G.diceSumOptions.every((sums) => sums[0].length === 0);
            if (bust) {
              G.info = { message: "Busted!", level: "danger" };
              ctx.events.endTurn();
            }
            ctx.events.endStage();
          },
          stop: (G: GameType, ctx) => {
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
                G.currentPositions[s] = 1;
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
