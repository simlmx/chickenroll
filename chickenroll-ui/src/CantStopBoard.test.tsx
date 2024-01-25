import { test } from "vitest";
import type { UserId } from "bgkit";
import { MatchTester as MatchTesterOrig } from "bgkit-game";
import { render } from "bgkit-ui-testing";

import { game, ChickenrollBoard } from "chickenroll-game";

import { Board } from "./CantStopBoard";
class MatchTester extends MatchTesterOrig<ChickenrollBoard> {}

let utils: any;
const renderForPlayer = (match: MatchTester, userId: UserId) => {
  // For some reason it's a pain to do multiple renders in the same test. This makes it
  // possible.
  if (utils) {
    utils.unmount();
  }
  utils = render(Board, match.getState(userId));
};

test("render initial board", () => {
  const match = new MatchTester({ gameDef: game, numPlayers: 3 });
  // Render for a player.
  renderForPlayer(match, match.board.playerOrder[0]);
  // Render for a spectator
  renderForPlayer(match, "spectatorId");
});
