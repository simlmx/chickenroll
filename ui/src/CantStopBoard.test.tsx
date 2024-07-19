import type { UserId } from "@lefun/core";
import { MatchTester as _MatchTester } from "@lefun/game";
import { render } from "@lefun/ui-testing";
import { test } from "vitest";

import { ChickenrollGame, ChickenrollGameState, game } from "chickenroll-game";

import { Board } from "./CantStopBoard";
class MatchTester extends _MatchTester<ChickenrollGameState, ChickenrollGame> {}

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
  const match = new MatchTester({ game, numPlayers: 3 });
  // Render for a player.
  renderForPlayer(match, match.board.playerOrder[0]);
  // Render for a spectator
  renderForPlayer(match, "spectatorId");
});
