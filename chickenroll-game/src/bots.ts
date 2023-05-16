import { UserId } from "bgkit";
import { ChickenrollBoard } from "./types";
import {
  getSpaceLeft,
  numCurrentPlayerOverlap,
  climbOneStep,
  getNumStepsForSum,
} from "./math";
import { OddsCalculator } from "./math/probs";
import { ALL_COLS } from "./constants";

// FIXME ajouter un feature qui est juste un 1.0!

// A list of criteria we are interested in when choosing an option.
export type OptionCriteria = {
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

export const scoreCriteria = (weights: number[], oc: OptionCriteria) => {
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
// idealement faudrait extraire le code qui fait (s,a) => feature_vector du afterstate
// Ensuite notre job va etre d'apprendre w tel que q(s,a) ~= w * feature_vector
// autrement dit le value function du afterstate.
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
}): OptionCriteria => {
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
