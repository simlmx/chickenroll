import { ChickenrollBoard } from "chickenroll-game";

import { State } from "./types";

export const fromBoardSelector =
  <T>(func: (board: ChickenrollBoard) => T) =>
  (state: State): T => {
    const { board } = state;
    return func(board);
  };
