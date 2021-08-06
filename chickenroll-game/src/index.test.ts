import { MatchTester, RandomMock } from "bgkit";

import { CurrentPositions, CheckpointPositions } from "./types";
import {
  game,
  climbOneStep,
  isCurrentPlayerOverlapping,
  roll,
  pick,
  stop,
  playAgain,
} from ".";

test.each([
  ["share", {}, {}, 1],
  ["jump", {}, {}, 1],
  ["share", { 7: 2 }, {}, 3],
  ["jump", { 7: 2 }, {}, 3],
  ["share", { 7: 2 }, { 7: 3 }, 3],
  ["jump", { 7: 2 }, { 1: { 7: 3 } }, 4],
  ["jump", { 7: 2 }, { 1: { 7: 4 } }, 3],
  ["jump", { 7: 2 }, { 1: { 7: 3 }, 2: { 7: 4 } }, 5],
  ["jump", { 7: 2 }, { 1: { 7: 3 }, 2: { 7: 5 } }, 4],
  ["jump", {}, { 1: { 7: 3 } }, 1],
  ["jump", {}, { 1: { 7: 1 } }, 2],
])(
  "testClimbOneStep %s %s %s %s",
  (
    sameSpace: "share" | "jump",
    currentPositions: { [col: string]: number },
    checkpointPositions: { [userId: string]: { [col: string]: number } },
    expected: number
  ) => {
    expect(
      climbOneStep(currentPositions, checkpointPositions, 7, "0", sameSpace)
    ).toEqual(expected);
  }
);

test.each([
  [{}, {}, false],
  [{ 2: 4 }, { 1: { 2: 4 } }, true],
  [{ 2: 4, 3: 5 }, { 1: { 2: 5 }, 2: { 3: 5 } }, true],
  [{ 2: 4, 3: 5 }, { 1: { 2: 3 }, 2: { 4: 5 } }, false],
])(
  "test isCurrentPlayerOverlapping %s %s %s",
  (
    currentPositions: CurrentPositions,
    checkpointPositions: CheckpointPositions,
    expected: boolean
  ) => {
    expect(
      isCurrentPlayerOverlapping(currentPositions, checkpointPositions)
    ).toEqual(expected);
  }
);

test("can not stop after rematch", () => {
  const random = new RandomMock();
  const match = new MatchTester(game, 5, {
    matchOptions: { mountainShape: "classic" },
    random,
  });

  const [p0, p1, p2] = match.board.playerOrder;

  // Let's make sure we get 2-2-2, 12-12-12
  random.next([1, 1, 1, 1]);
  random.next([1, 1, 6, 6]);
  random.next([6, 6, 6, 6]);

  match.makeMove(p0, roll());
  match.makeMove(p0, pick({ diceSplitIndex: 0, choiceIndex: 0 }));
  match.makeMove(p0, roll());
  match.makeMove(p0, pick({ diceSplitIndex: 0, choiceIndex: 0 }));
  match.makeMove(p0, roll());
  match.makeMove(p0, pick({ diceSplitIndex: 0, choiceIndex: 0 }));
  match.makeMove(p0, stop());

  // We should have won by now.
  expect(match.board.numVictories[p0]).toEqual(1);

  match.makeMove(p0, playAgain());

  expect(match.board.currentPlayerHasStarted).toEqual(false);
});
