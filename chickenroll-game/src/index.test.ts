import { MatchTester, RandomMock, UserId } from "bgkit";

import { CurrentPositions, CheckpointPositions } from "./types";
import {
  game,
  ChickenrollBoard,
  climbOneStep,
  isCurrentPlayerOverlapping,
  roll,
  pick,
  stop,
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

test("happy path", () => {
  const random = new RandomMock();
  const match = new MatchTester<ChickenrollBoard>(game, 3, { random });

  const [p0, p1, p2] = match.board.playerOrder;

  // We'll also check who's turn it is once in a while.
  const checkItsTheirTurn = (userId: UserId): void => {
    match.meta.players.allIds.forEach((otherUserId) => {
      expect(match.meta.players.byId[otherUserId].itsYourTurn).toBe(
        userId === otherUserId
      );
    });
  };

  checkItsTheirTurn(p0);
  random.next([6, 6, 6, 6]);

  match.makeMove(p0, roll());
  checkItsTheirTurn(p0);

  match.makeMove(p0, pick({ diceSplitIndex: 0, choiceIndex: 0 }));
  checkItsTheirTurn(p0);

  random.next([6, 6, 1, 1]);
  match.makeMove(p0, roll());
  match.makeMove(p0, pick({ diceSplitIndex: 0, choiceIndex: 0 }));

  random.next([1, 1, 1, 1]);
  match.makeMove(p0, roll());
  match.makeMove(p0, pick({ diceSplitIndex: 0, choiceIndex: 0 }));

  checkItsTheirTurn(p0);

  expect(match.board.currentPositions).toEqual({ 2: 3, 12: 3 });

  // At this point player p0 has finished column 12 and 2.
  match.makeMove(p0, stop());

  expect(match.board.blockedSums).toEqual({
    2: p0,
    12: p0,
  });

  checkItsTheirTurn(p1);

  // Quickly check the two other "pick" options.
  random.next([2, 3, 4, 5]);
  match.makeMove(p1, roll());
  match.makeMove(p1, pick({ diceSplitIndex: 2, choiceIndex: 0 }));

  expect(match.board.currentPositions).toEqual({ 7: 2 });

  random.next([2, 3, 4, 5]);
  match.makeMove(p1, roll());
  match.makeMove(p1, pick({ diceSplitIndex: 1, choiceIndex: 0 }));

  expect(match.board.currentPositions).toEqual({ 7: 2, 6: 1, 8: 1 });

  // Pick only one number.
  random.next([1, 1, 3, 4]);
  match.makeMove(p1, roll());
  match.makeMove(p1, pick({ diceSplitIndex: 0, choiceIndex: 1 }));

  expect(match.board.currentPositions).toEqual({ 7: 3, 6: 1, 8: 1 });

  checkItsTheirTurn(p1);

  match.makeMove(p1, stop());
  checkItsTheirTurn(p2);

  expect(match.board.currentPositions).toEqual({});
  expect(match.board.checkpointPositions).toEqual({
    [p0]: {},
    [p1]: { 7: 3, 6: 1, 8: 1 },
    [p2]: {},
  });

  random.next([3, 3, 3, 3]);
  match.makeMove(p2, roll());
  match.makeMove(p2, pick({ diceSplitIndex: 0, choiceIndex: 0 }));
  match.makeMove(p2, stop());

  expect(match.board.checkpointPositions).toEqual({
    [p0]: {},
    [p1]: { 7: 3, 6: 1, 8: 1 },
    [p2]: { 6: 2 },
  });

  checkItsTheirTurn(p0);

  // Let's roll 3 double 3s
  for (let i = 0; i < 3; ++i) {
    random.next([1, 2, 1, 2]);
    match.makeMove(p0, roll());
    match.makeMove(p0, pick({ diceSplitIndex: 0, choiceIndex: 0 }));
    checkItsTheirTurn(p0);
  }
  match.makeMove(p0, stop());

  expect(match.matchHasEnded).toEqual(true);
});
