import { UserId } from "bgkit";
import { Move as BgkitMove } from "bgkit-game";
import {
  ChickenrollBoard,
  pick,
  roll,
  stop,
  CurrentPositions,
  MoveInfo,
} from "./types";

import {
  getSpaceLeft,
  numCurrentPlayerOverlap,
  climbOneStep,
  getNumStepsForSum,
} from "./math";
import {
  OddsCalculator,
  getOddsCalculator,
  getAllowedColumns,
} from "./math/probs";
import { ALL_COLS } from "./constants";
import { canStop } from "./utils";

const dot = (a: number[], b: number[]): number => {
  if (a.length !== b.length) {
    throw new Error(
      `arrays must have same length (${a.length} != ${b.length})`
    );
  }
  return a.map((_, i) => a[i] * b[i]).reduce((m, n) => m + n);
};

// How many columns would we finish if we choose the 2 columns `col`?
const _getFinishCols = ({
  board,
  cols,
}: {
  board: ChickenrollBoard;
  cols: number[];
}): number[] => {
  // Case where the two numbers are the same.
  if (cols.length === 2 && cols[0] === cols[1]) {
    if (
      getSpaceLeft(
        board.currentPositions,
        board.checkpointPositions,
        board.mountainShape,
        board.sameSpace,
        cols[0],
        board.currentPlayer
      ) === 2
    ) {
      return cols;
    } else {
      return [];
    }
  }

  const finishedCols = [];
  for (const col of cols) {
    if (
      getSpaceLeft(
        board.currentPositions,
        board.checkpointPositions,
        board.mountainShape,
        board.sameSpace,
        col,
        board.currentPlayer
      ) === 1
    ) {
      finishedCols.push(col);
    }
  }
  return finishedCols;
};

const getExpectedFinalProb = ({
  cols,
  calculator,
  blockedSums,
}: {
  cols: number[];
  calculator: OddsCalculator;
  blockedSums: Record<string, string>;
}) => {
  // We assume we have 2 number in `cols`.
  const [a, b] = cols;

  // For each potential 3rd column, compute the probability of busting after we choose
  // that column.
  // Then sort in increasing order of bust probability.
  const thirdColInfo: { col: number; probBust: number }[] = ALL_COLS.filter(
    (col) => col !== a && col !== b
  )
    .filter((col) => !blockedSums[col])
    .map((col) => ({
      col,
      probBust: calculator.oddsBust([a, b, col]),
    }))
    .sort((a, b) => a.probBust - b.probBust);

  // We assume that we would choose the 3rd column that gives us the best odds for the
  // subsequent rolls.
  // This means that the odds or taking the first "thirdColInfo" are the odds of getting
  // that value. The odds of taking the second are the odds of being able to take this
  // one *and not the previous one*, etc.
  let expectation = 0;
  const forbidden = new Set<number>();
  for (const info of thirdColInfo) {
    const probBest = calculator.oddsNeedsForbidden(info.col, forbidden);
    expectation += probBest * info.probBust;
    forbidden.add(info.col);
  }

  return expectation;
};

// RENDU ICI
// q(s, a) == v * w (v=features of after state, w=learned weights)
//
// 0. on commence avec une policy parametrizee par w0
// 1. on a un state donne: s
// 2. on trouve a optimal en trouvant max_a q(s, a)
// 3. on note ca mais on prend l'action selon e-greedy
// 4. on note l'action prise (si differente?) et q(s, a)
// 5. ca nous donne une serie de s0, a0_opt, a0, R0, s1, a1_opt, a1, R1, ...
// 6. ou plutot
//    v0_0, (v0_1), ...,v0_n; (parenth'eses = celui choisi)
//    R0;
//    v1_0, v1_1, ... (v1_j)...v1_n;
//    R1;
//    ...
//
//    i.e. * la liste de tous les (after)states possibles des actions (qu'on a besoin pour faire le max)
//         * celui qui a ete choisi a ce moment-là
//         * le Reward qu'on a recu
//
//    Notre memory replay devient:
//    v0_1, R0, (v1_0, v1_1, ... v1_n)
//    v1_j, R1, (v2_0, ..., v2_n)
//
//    pour le premier:
//    Cost = (R0 * max_i(w * v_i_0) - w * v0_1) **2
//    Et le truc de DQN c'est d'avoir 2 w differents, et le premier on l'update juste une fois de temps en temps
//    Et meme chose pour le w de notre policy qui joue, on l'update de temps en temps.
//
//
// en d'autres mots
// 1. func (s, a) => feature_vector
// 2. pour choisir le meilleur move on fait (s, a_i) => v_i pour chaque possibilite i
// 3. on calculate w * v_i, et on garde le plus gros score.
// 4. on va en fait avoir 2 vecteurs w different, 1 pour calculer le score du "move",
//    et l'autre pour decider si on roll ou stop encore apres
//    PAS besoin de 2 moves pcq c'est en fait une decision (pcq apres avoir choisis un "move" le resultat est deterministe)
//
// Ça ça nous fait jouer des matchs avec une strategie donnee. On va vouloir noter les
// v_i, r_i v_(i+1) (c'est de ca qu`on a besoin right?)
// On va avoir Cost = (w * v_i - r_i - gamma * max_a q(v_(i+1), a) ) ** 2
// (donc on a besoin de tous les (v_(i+1), a) pour faire notre max!)
//
// Et on va deriver ca par rapport a w pour savoir dans quel sens bouger w pour minimiser le cost.
//
// J'imagine (pas sur) que ca converge plus vite si on commence par faire des updates pour des episodes de fin de partie...
// Et que tranquillement on sample des exemples moins tard.. mais j'ai pas vu ca dans les papiers...
// peut-etre meme commencer par des parties hackees pour etre presque finies deja: on met des pastilles de couleurs random
// deja proche du haut avec des colonnes deja reussies meme! PEnser a ca aussi!
//
// On va peut-etre vouloir faire un peu de reward shaping: donner des points quand on fait du progres:
// * weighter le progres pour donner plus de points a monter une meme colonne
// * normaliser par la longueur de la colonne (monter des 12 compte pour plus)
// * qqch comme reward = (position finale - position initiale) ** 2 avec le tout en pourcentage de progres
// * qqch de plus gros quand on finit la colonne
// * qqch de mega quand on gagne la partie
// * idee: changer ces poids la pendant qu'on train (baisser les reward fake tranquillemennt et juste garder la reward final)
//
//

type _PickAction = {
  // arguments for the `pick()` move.
  diceSplitIndex: number;
  choiceIndex: number;
  // data to do some math with
  cols: number[];
};

type _RollOrStopAction = {
  roll: boolean;
};
/*
 * Here an action is defined as picking an option + rolling or stopping.
 */
export type Action = _PickAction & _RollOrStopAction;

/*
 * Return the possible actions for the current player.
 */
const _getPickActions = (board: ChickenrollBoard): _PickAction[] => {
  const actions: _PickAction[] = [];

  board.diceSumOptions.forEach((sumOption, diceSplitIndex) => {
    if (sumOption.split) {
      for (const choiceIndex of [0, 1]) {
        if (sumOption.enabled[choiceIndex]) {
          actions.push({
            diceSplitIndex,
            choiceIndex,
            cols: [sumOption.diceSums[choiceIndex]],
          });
        }
      }
    } else {
      if (sumOption.enabled[0]) {
        actions.push({
          diceSplitIndex,
          choiceIndex: 0,
          cols: sumOption.diceSums,
        });
      }
    }
  });

  return actions;
};

const getActions = (board: ChickenrollBoard): Action[] => {
  const pickActions = _getPickActions(board);
  const actions: Action[] = [];
  for (const pickAction of pickActions) {
    // We can always keep rolling.
    actions.push({ ...pickAction, roll: true });
    // But can we also stop!
    if (canStopAfterPick({ board, pickAction })) {
      actions.push({ ...pickAction, roll: false });
    }
  }
  return actions;
};

/*
 * Willl we be able to stop after a given "pick" action.
 */
const canStopAfterPick = ({
  board,
  pickAction,
}: {
  board: ChickenrollBoard;
  pickAction: _PickAction;
}): boolean => {
  const { cols } = pickAction;
  const currentPositions = _getNewCurrentPositions({ board, cols });

  return (
    board.sameSpace !== "nostop" ||
    numCurrentPlayerOverlap(currentPositions, board.checkpointPositions) === 0
  );
};

/*
 * What will be the new CurrentPosition if the current player climbs on the 2 columns in `col`.
 */
const _getNewCurrentPositions = ({
  board,
  cols,
}: {
  board: ChickenrollBoard;
  cols: number[];
}): CurrentPositions => {
  const userId = board.currentPlayer;

  const out: CurrentPositions = Object.assign({}, board.currentPositions);
  for (const col of cols) {
    out[col] = climbOneStep(
      out,
      board.checkpointPositions,
      col,
      userId,
      board.sameSpace
    );
  }

  return out;
};

const computeFeatures = ({
  board,
  userId,
  action,
  calculator,
}: {
  board: ChickenrollBoard;
  userId: UserId;
  action: Action;
  calculator: OddsCalculator;
}): number[] => {
  // console.log('compute feature for')
  // console.log(action);
  const { cols, roll } = action;

  // * Num of finished columns.

  // Subset of `cols` that would be finished.
  const finishedCols = _getFinishCols({ board, cols });

  // Build the final set of columns.
  const colSet = new Set(
    Object.keys(board.currentPositions).map((col) => parseInt(col))
  );
  const newCols = new Set<number>();
  const numClimbersBefore = colSet.size;

  cols.forEach((col) => {
    if (!colSet.has(col)) {
      newCols.add(col);
      colSet.add(col);
    }
  });

  let even = 0;
  let avgProbCols = 0;
  for (const col of newCols) {
    if (col % 2 === 0) {
      even += 1 / newCols.size;
    }
    avgProbCols += (1 - calculator.oddsBust([col])) / newCols.size;
  }

  const climberCost = colSet.size - numClimbersBefore;

  // To get the prob of busting if we choose this option, we need to know how many
  // columns will be blocked after.

  let allowed: Set<number>; // = new Set(colSet);
  if (colSet.size === 3) {
    allowed = new Set(colSet);
  } else {
    // In the case where we would still have runners left, only blocked columns are
    // not allowed.
    allowed = new Set(ALL_COLS);
  }

  // Remove finished columns if this option is chosen.
  for (const col of finishedCols) {
    allowed.delete(col);
  }

  for (const col of Object.keys(board.blockedSums)) {
    allowed.delete(parseInt(col));
  }

  const probBust = calculator.oddsBust(Array.from(allowed));

  let progress = 0;
  let progressTimesStep = 0;
  let numAhead = 0;
  // Use the current overlap number as the baseline
  let numOverlap = numCurrentPlayerOverlap(
    board.currentPositions,
    board.checkpointPositions
  );

  for (const col of cols) {
    const endsAt = climbOneStep(
      board.currentPositions,
      board.checkpointPositions,
      col,
      userId,
      board.sameSpace
    );
    const startsAt =
      board.currentPositions[col] ||
      board.checkpointPositions[userId][col] ||
      0;

    const numSteps = getNumStepsForSum(col, board.mountainShape);
    const colProgress = (endsAt - startsAt) / numSteps;

    progress += colProgress;

    progressTimesStep += (colProgress * endsAt) / numSteps;

    // Check the people ahead
    for (const checkpoint of Object.values(board.checkpointPositions)) {
      const step = checkpoint[col] || 0;
      if (step === endsAt) {
        numOverlap++;
      } else if (step > endsAt) {
        numAhead++;
      }
    }
  }

  const expectedFinalProb =
    colSet.size === 2
      ? getExpectedFinalProb({
          cols: Array.from(colSet),
          calculator,
          blockedSums: board.blockedSums,
        })
      : 0;

  // Added because it was in the features for the roll/stop in the legacy version.
  const newClimberPositions: CurrentPositions = _getNewCurrentPositions({
    board,
    cols,
  });

  let probHasToOverlap2 = 0;
  let probHasToOverlap3 = 0;
  const numClimbers = Object.keys(newClimberPositions).length;
  if (numClimbers === 3) {
    const colsCouldStuck = new Set<number>();
    for (const [colStr, ourStep] of Object.entries(newClimberPositions)) {
      const col = parseInt(colStr);
      // Check if there is someone on the next step.
      for (const checkpoint of Object.values(board.checkpointPositions)) {
        if ((checkpoint[colStr] || 0) === ourStep + 1) {
          colsCouldStuck.add(col);
          // We found someone, we don't want another one.
          break;
        }
      }
    }
    probHasToOverlap3 = calculator.oddsNoBust(Array.from(colsCouldStuck));
  } else if (numClimbers === 2) {
    // Check for all the starting position ones.
    const colsAtStepOne = new Set<number>();
    for (const checkpoint of Object.values(newClimberPositions)) {
      for (const [colStr, step] of Object.entries(checkpoint)) {
        const col = parseInt(colStr);
        if (
          // !board.currentPositions[colStr] &&
          step ===
          (board.checkpointPositions[userId][colStr] || 0) + 1
        ) {
          colsAtStepOne.add(col);
        }
      }
    }
    probHasToOverlap2 = calculator.oddsNoBust(Array.from(colsAtStepOne));
  } else {
    if (numClimbers != 1) {
      throw Error(`wrong num climbers ${numClimbers}`);
    }
  }

  const oneIfRoll = roll ? 1 : 0;
  const oneIfStop = 1 - oneIfRoll;
  const out = [
    finishedCols.length,
    climberCost,
    probBust,
    progress,
    avgProbCols,
    expectedFinalProb,
    progressTimesStep,
    numOverlap,
    numAhead,
    even,
    oneIfRoll,
    // Some features to be able to recreate the previous bots when choosing roll/stop.
    oneIfStop * finishedCols.length,
    oneIfStop * progress * probBust,
    oneIfStop * finishedCols.length * probBust,
    oneIfStop * progressTimesStep * probBust,
    oneIfStop * probHasToOverlap2,
    oneIfStop * probHasToOverlap3,
  ];

  /*
  {
    const featureNames = [
      "num finishedCols",
      "climberCost",
      "probBust",
      "progress",
      "avProbCols",
      "expectedFinalPRob",
      "progressTimeStep",
      "numOverlap",
      "numAhead",
      "even",
      "oneIfRoll",
      "stop num finished",
      "stop progress * prob_bust",
      "stop num finished * prob_bust",
      "stop progress_time_Step * prob_bust",
      "stop probHasToOverlap2",
      "stop probHasToOverlap3",
    ];

    if (featureNames.length != out.length) {
      throw new Error("length feature names does not match");
    }
    for (let i = 0; i < featureNames.length; ++i) {
      console.log(`${featureNames[i]}   : ${out[i]}`);
    }
  }
  */

  return out;

  // return [
  //   finishedCols.length,
  //   climberCost,
  //   probBust,
  //   progress,
  //   avgProbCols,
  //   expectedFinalProb,
  //   progressTimesStep,
  //   numOverlap,
  //   numAhead,
  //   even,
  //   probHasToOverlap2,
  //   probHasToOverlap3,
  //   roll ? 1 : 0,
  // Some features to be able to recreate the previous bots when choosing roll/stop.
  //   progress * probBust,
  //   finishedCols.length * probBust,
  //   progressTimesStep * probBust,
  // ];
};

const argMax = (arr: number[]): number => {
  // FIXME
  let idx = 0;
  let max = -Infinity;
  for (let i=0; i < arr.length; ++i) {
    const value = arr[i];
    if (value > max) {
      max = value;
      idx = i;
    }
  }

  return idx;
}

// https://stackoverflow.com/a/28933315/1067132
const getRandomIndex = (weights: number[]): number => {
  const num = Math.random();
  let s = 0;
  const lastIndex = weights.length - 1;

  for (let i = 0; i < lastIndex; ++i) {
    s += weights[i];
    if (num < s) {
      return i;
    }
  }

  if (s > 1) {
    throw new Error("weights sum to greater than 1");
  }

  return lastIndex;
};

const getProbs = (features: number[][], weights: number[]): number[] => {
  const exps: number[] = [];
  for (let i = 0; i < features.length; ++i) {
    let dotp = 0;
    for (let j = 0; j < weights.length; ++j) {
      dotp += features[i][j] * weights[j];
    }
    exps.push(Math.exp(dotp));
  }

  const sum_ = exps.reduce((a, b) => a + b);

  return exps.map((x) => x / sum_);
};

// const findBestFeatures = (features: number[][], weights: number[]): number => {
//   let bestFeatureIdx: number;
//   let bestScore = -Infinity;
// console.log('weights')
// console.log(weights)
//   features.forEach((f, i) => {
// console.log('feature', i)
//     const score = dot(weights, f);
// console.log(f)
//     if (score > bestScore) {
//       console.log("best score", score);
//       console.log("at", i);
//       bestScore = score;
//       bestFeatureIdx = i;
//     }
//   });
//   return bestFeatureIdx;
// };

const argSample = <T>(arr: T[]): number => {
  const len = arr == null ? 0 : arr.length;
  return len ? Math.floor(Math.random() * len) : undefined;
};

export const botMove = ({
  board,
  userId,
  policy,
  stochastic,
}: {
  board: ChickenrollBoard;
  userId: UserId;
  policy: number[];
  stochastic: boolean;
}): { moves: BgkitMove[]; moveInfo: MoveInfo | null } => {
  if (board.stage !== "moving") {
    return { moves: [roll()], moveInfo: null };
    // We always roll/stop right after we move, so we should only get autoMove for stage="moving".
    // throw Error('autoMove should always be calling for stage="moving"');
  }

  // The first element of `policy` is the epsilon for the epsilon-greedy algorithm.
  // let epsilon: number;
  // [epsilon, ...policy] = policy;

  // if (epsilon > 1.0 || epsilon < 0.0) {
  //   throw new Error(`weird epsilon ${epsilon}`);
  // }

  const calculator = getOddsCalculator();

  const actions = getActions(board);
  // console.log("possibl actions");
  // console.log(actions);

  // Gather some information for each option.
  const features = actions.map((action) =>
    computeFeatures({ board, userId, action, calculator })
  );

  // console.log("features");
  // console.log(features);

  // console.log('policy')
  // console.log(policy)

  let bestActionIdx: number;

  // if (epsilon > 0 && Math.random() < epsilon) {
  //   bestActionIdx = argSample(actions);
  // } else {
  // bestActionIdx = findBestFeatures(features, policy);
  const probs = getProbs(features, policy);
  // console.log('probs', probs)
  if (stochastic) {
    bestActionIdx = getRandomIndex(probs);
  } else {
    bestActionIdx = argMax(probs);
  }
  // console.log("bestaction", bestActionIdx);
  // }

  // FIXME FIXME
  const bestAction = actions[bestActionIdx] || actions[0];

  return {
    moves: [
      pick({
        diceSplitIndex: bestAction.diceSplitIndex,
        choiceIndex: bestAction.choiceIndex,
      }),
      bestAction.roll ? roll() : stop(),
    ],
    moveInfo: {
      userId,
      actionFeatures: features,
      chosenAction: bestActionIdx,
    },
  };
};
