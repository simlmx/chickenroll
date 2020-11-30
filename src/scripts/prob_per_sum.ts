/*
 * Compute the prob of getting each number
 */

// RENDU ici a faire rouler ca...
// ca va nous dire combien de case on devrait avoir pour chaque somme!!
import { OddsCalculator } from "../math/probs";

const calculator = new OddsCalculator();

[2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].forEach((diceSum) => {
  // Rationale: prob to bust if only X is allowed == 1 - prob(get X)
  const prob = calculator.oddsBust([diceSum]);
  console.log(`prob(${diceSum}) = ${1 - prob}`);
});
