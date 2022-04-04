import { UserId } from "bgkit";
import { ChickenrollBoard } from "chickenroll-game";

export interface State {
  userId: UserId;
  board: ChickenrollBoard;
}
