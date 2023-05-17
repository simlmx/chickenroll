import { UserId } from "bgkit";
import { Move as BgkitMove } from "bgkit-game";
import { ChickenrollBoard, pick, roll, stop } from "./types";
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

// FIXME ajouter un feature qui est juste un 1.0!

// A list of features we are interested in when choosing an action.
export type Features = {
  // How many columns would we finish?
  numFinish: number;
  // Number of new climbers this option will add on the board.
  climberCost: number;
  // Prob of bust for next roll if we choose the option.
  probBust: number;
  // How much progress on the board would we make.
  progress: number;
  // Average (on the 1 or 2 numbers) of the probability to get those numbers. This is
  // the same number we use to determine the height of the columns.
  avgProbCols: number;
  // Expected final prob if we have climbers if 1 climber left else 0.
  expectedFinalProb: number;

  // progress times (relative) steps - this means steps higher up are worth more.
  progressTimesStep: number;

  // number of players over if we choose this option.
  // This should always be 0 for jump but very useful for must-roll!
  numOverlap: number;
  // Number of players ahead of us in the columns for that choice
  numAhead: number;

  // New columns are even
  // 0 if not adding any columns
  // 1 if adding even columns
  // 0 if adding odd columns
  // 0.5 if both
  even: number;
};

export const scoreFeatures = (weights: number[], oc: Features) => {
  return (
    oc.numFinish * weights[0] -
    oc.climberCost * weights[1] -
    oc.probBust * weights[2] +
    oc.progress * weights[3] +
    oc.avgProbCols * weights[4] -
    oc.expectedFinalProb * weights[5] +
    oc.progressTimesStep * weights[6] +
    oc.numAhead * weights[7] +
    oc.numOverlap * weights[8] +
    oc.even * weights[9]
  );
};

// How many columns would we finish if we chose the 2 columns `col`?
const getFinishCols = ({
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

export type Action = {
  // arguments for the `pick()` move.
  diceSplitIndex: number;
  choiceIndex: number;
  // data to do some math with
  cols: number[];
};

export const computeFeatures = ({
  board,
  userId,
  action,
  calculator,
}: {
  board: ChickenrollBoard;
  userId: UserId;
  action: Action;
  calculator: OddsCalculator;
}): Features => {
  const { cols } = action;

  // * Num of finished columns.

  // Subset of `cols` that would be finished.
  const finishedCols = getFinishCols({ board, cols });

  // console.log("old colset", Object.keys(board.currentPositions));
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

  // console.log("added col", newCols);
  // console.log("final col", colSet);

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
    allowed = new Set([2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]);
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

  return {
    numFinish: finishedCols.length,
    climberCost,
    probBust,
    progress,
    avgProbCols,
    expectedFinalProb,
    progressTimesStep,
    numOverlap,
    numAhead,
    even,
  };
};

export const legacyBot = ({
  board,
  userId,
}: {
  board: ChickenrollBoard;
  userId: UserId;
}): BgkitMove => {
  const strategy = board.playerInfos[userId].strategy;
  const weights = strategy.split("/").map((x) => parseFloat(x));
  const weightsMoving = weights.splice(0, 10);
  const weightsRolling = weights;
  // console.log("weights", weightsMoving, weightsRolling);

  const calculator = getOddsCalculator();

  if (board.stage === "moving") {
    const actions: Action[] = [];

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

    // Gather some information for each option.
    const features: Features[] = actions.map((action) =>
      computeFeatures({ board, userId, action, calculator })
    );

    let bestAction: Action;
    let bestScore = -Infinity;
    features.forEach((f, i) => {
      const score = scoreFeatures(weightsMoving, f);
      if (score > bestScore) {
        bestScore = score;
        bestAction = actions[i];
      }
    });

    return pick({
      diceSplitIndex: bestAction.diceSplitIndex,
      choiceIndex: bestAction.choiceIndex,
    });
  }

  if (board.bustProb === 0) {
    // console.error('roll 2')
    return roll();
  }

  if (!canStop(board)) {
    // console.error('roll 3')
    return roll();
  }

  // Here we need to choose between stopping and rolling.
  // We'll have the same approach where we do a linear combination of some parameters
  // and we add a cutoff on it.

  let progressSoFar = 0;
  let progressInSteps = 0;
  let numFinishedCol = 0;
  Object.entries(board.currentPositions).forEach(([col, step]) => {
    const colInt = parseInt(col);
    const numSteps = getNumStepsForSum(colInt, board.mountainShape);
    progressSoFar +=
      (step - (board.checkpointPositions[userId][colInt] || 0)) / numSteps;
    progressInSteps += step - (board.checkpointPositions[userId][colInt] || 0);

    if (step === numSteps) {
      numFinishedCol++;
    }
  });

  const allowed = getAllowedColumns(
    board.currentPositions,
    board.blockedSums,
    board.mountainShape
  );

  // Special case: if we can win by stopping we stop.
  if (numFinishedCol + board.scores[userId] >= board.numColsToWin) {
    // console.error('stop 4 ')
    return stop();
  }

  // Compute the probabily of getting a number that can make us stuck - this is a proxy
  // to the probability of getting stuck. We do it twice, once if we have 3 climbers and
  // once if we have 2 climbers (0 otherwise).
  let probHasToOverlap2 = 0;
  let probHasToOverlap3 = 0;
  const numClimbers = Object.keys(board.currentPositions).length;
  const cols = Object.keys(Object.entries(board.currentPositions)).map((x) =>
    parseInt(x)
  );
  if (numClimbers === 3) {
    const colsCouldStuck = new Set();
    for (const [colStr, ourStep] of Object.entries(board.currentPositions)) {
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
    probHasToOverlap3 = calculator.oddsNoBust(colsCouldStuck);
  } else if (numClimbers === 2) {
    // Check for all the starting position ones.
    const colsAtStepOne = new Set<number>();
    for (const checkpoint of Object.values(board.checkpointPositions)) {
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
    probHasToOverlap2 = calculator.oddsNoBust(colsAtStepOne);
  }

  // console.log("should we roll");
  // console.log("progressSoFar * board.bustProb", progressSoFar * board.bustProb);
  // console.log("numFinished * prob", numFinishedCol * board.bustProb);
  // console.log("probHasToOverlap2", probHasToOverlap2);
  // console.log("probHasToOverlap3", probHasToOverlap3);

  // Note that we combine progressSoFar with board.probBust, as a measure of "how much
  // do we stand to lose".
  const w = weightsRolling;
  const linearComb =
    w[0] +
    // Expected progress : probBust * (what we stand to lose) + probNoBust * (what we stand to win)
    -(w[1] * progressSoFar + w[2] * numFinishedCol + w[6] * progressInSteps) *
      board.bustProb +
    w[3] * (1 - board.bustProb) +
    w[4] * probHasToOverlap2 +
    w[5] * probHasToOverlap3;
  if (linearComb > 0) {
    // console.error('roll 5')
    return roll();
  } else {
    // console.error('stop')
    return stop();
  }
};

// RENDU ICI
// faire une fonction newBot qui remplace legacyBot
// le but c'est de comparer le nouveau truc avec l'ancien!
