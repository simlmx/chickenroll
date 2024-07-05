import { UserId } from "@lefun/core";

import { ChickenrollBoard } from "chickenroll-game";

export interface State {
  userId: UserId;
  board: ChickenrollBoard;
}
