import { Stage } from "boardgame.io/core";
import { getSumOptions } from "./math";

interface GameType {
  diceValues: number[];
  currentPositions: { [key: number]: number };
  checkpointPositions: { [key: number]: { [key: number]: number } };
  diceSumOptions: number[][][];
  blockedSums: { [key: number]: number };
}

export const CantStop = {
  setup(ctx): GameType {
    return {
      diceValues: [1, 1, 1, 1],
      // State of the 3 current climbers.
      currentPositions: { 7: 11, 3: 3 },
      checkpointPositions: {
        0: {
          3: 3,
          5: 9,
        },
        1: {
          3: 3,
          5:4
        },
        2: {
          3: 3,
        },
        3: {
          3:4,
          5:4,
          7:5
        },
      },
      diceSumOptions: [[], [], []],
      // TODO use it
      // sum -> player
      blockedSums: {},
    };
  },

  // We actually use the playerView to do some computation about the dice.
  playerView: (G: GameType, ctx, playerID): GameType => {
    // TODO add blocked sums

    // const diceSums = DICE_INDICES.map((combo) =>
    //   combo.map((ij) => ij.map((x) => G.diceValues[x]).reduce((a, b) => a + b))
    // );
    // TODO make sure those sums are available, otherwise mark them as such.

    // const H = { ...G};
    // return H;
    return G;
  },
  turn: {
    onBegin: (G: GameType, ctx) => {
      // At the beginning of the turn, the current player is in `rolling` mode. All
      // other players can't play.
      ctx.events.setActivePlayers({
        currentPlayer: "rolling",
        others: Stage.NULL,
      });
      G.diceValues = ctx.random.Die(6, 4);
    },
    stages: {
      rolling: {
        moves: {
          rollDice: (G: GameType, ctx) => {
            G.diceValues = ctx.random.Die(6, 4);
            G.diceSumOptions = getSumOptions(
              G.diceValues,
              G.currentPositions,
              G.blockedSums
            );
            ctx.events.endStage();
          },
          stop: (G: GameType, ctx) => {
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
            sumOption.forEach((s) => G.currentPositions[s]++);
            ctx.events.endStage();
          },
        },
        next: "rolling",
      },
    },
  },
};
