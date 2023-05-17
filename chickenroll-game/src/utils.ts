import { numCurrentPlayerOverlap } from "./math";
import { ChickenrollBoard, pick, roll } from "./types";

/* Can the current player hit the "Stop" button?
 */
export const canStop = (board: ChickenrollBoard): boolean => {
  // Must be rolling stage.
  if (board.stage !== "rolling") {
    return false;
  }
  // If we haven't rolled yet we can't stop.
  if (!board.currentPlayerHasStarted) {
    return false;
  }

  // Other than that only the "nostop" mode is tricky.
  if (board.sameSpace !== "nostop") {
    return true;
  }

  // In case of the "nostop" mode, we need to check if we are on the same spot
  // as someone else.
  const { currentPositions, checkpointPositions } = board;
  return numCurrentPlayerOverlap(currentPositions, checkpointPositions) === 0;
};
