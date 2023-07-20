import { UserId } from "bgkit";
import { MatchTester, RandomMock } from "bgkit-game";

import { CurrentPositions, CheckpointPositions } from "./types";
import { game, ChickenrollBoard, climbOneStep, roll, pick, stop } from ".";

import { numCurrentPlayerOverlap } from "./math";

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
  [{}, {}, 0],
  [{ 2: 4 }, { 1: { 2: 4 } }, 1],
  [{ 2: 4, 3: 5 }, { 1: { 2: 5 }, 2: { 3: 5 } }, 1],
  [{ 2: 4, 3: 5, 4: 5 }, { 1: { 2: 5 }, 2: { 3: 5, 4: 5 } }, 2],
  [{ 2: 4, 3: 5, 4: 5 }, { 1: { 2: 5 }, 2: { 3: 5, 4: 5 }, 3: { 3: 5 } }, 2],
  [{ 2: 4, 3: 5 }, { 1: { 2: 3 }, 2: { 4: 5 } }, 0],
])(
  "test numCurrentPlayerOverlap %s %s %s",
  (
    currentPositions: CurrentPositions,
    checkpointPositions: CheckpointPositions,
    expected: number
  ) => {
    expect(
      numCurrentPlayerOverlap(currentPositions, checkpointPositions)
    ).toEqual(expected);
  }
);

test("happy path", () => {
  const random = new RandomMock();
  const match = new MatchTester<ChickenrollBoard>({
    gameDef: game,
    numPlayers: 3,
    random,
  });

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

test("when only one step left because of jump, option is split", () => {
  const random = new RandomMock();

  const match = new MatchTester<ChickenrollBoard>({
    gameDef: game,
    numPlayers: 3,
    random,
    matchOptions: {
      sameSpace: "jump",
      mountainShape: "classic",
      showProbs: "after",
    },
  });

  const [p0, p1, p2] = match.board.playerOrder;

  // p0 climbs on 2
  random.next([1, 1, 3, 4]);
  match.makeMove(p0, roll());
  match.makeMove(p0, pick({ diceSplitIndex: 0, choiceIndex: 0 }));
  match.makeMove(p0, stop());
  expect(match.board.checkpointPositions[p0][2]).toEqual(1);

  // p1 climbs on 2
  random.next([1, 1, 3, 4]);
  match.makeMove(p1, roll());
  match.makeMove(p1, pick({ diceSplitIndex: 0, choiceIndex: 0 }));
  match.makeMove(p1, stop());
  expect(match.board.checkpointPositions[p1][2]).toEqual(2);

  // p2 should have a split option because he can get to the top in only one step.
  random.next([1, 1, 1, 1]);
  match.makeMove(p2, roll());
  const option = { diceSums: [2, 2], enabled: [true, true], split: true };
  expect(match.board.diceSumOptions).toEqual([option, option, option]);
});

test("when only one step left because of jump, option is split - already climbing", () => {
  const random = new RandomMock();

  const match = new MatchTester<ChickenrollBoard>({
    gameDef: game,
    numPlayers: 3,
    random,
    matchOptions: {
      sameSpace: "jump",
      mountainShape: "classic",
      showProbs: "after",
    },
  });

  const [p0, p1, p2] = match.board.playerOrder;

  // p0 climbs on 2
  random.next([1, 1, 3, 4]);
  match.makeMove(p0, roll());
  match.makeMove(p0, pick({ diceSplitIndex: 0, choiceIndex: 0 }));
  match.makeMove(p0, stop());
  expect(match.board.checkpointPositions[p0][2]).toEqual(1);

  // p1 climbs on 2
  random.next([1, 1, 3, 4]);
  match.makeMove(p1, roll());
  match.makeMove(p1, pick({ diceSplitIndex: 0, choiceIndex: 0 }));
  match.makeMove(p1, stop());
  expect(match.board.checkpointPositions[p1][2]).toEqual(2);

  // p2 should have a split option because he can get to the top in only one step.
  random.next([1, 1, 1, 1]);
  match.makeMove(p2, roll());
  const option = { diceSums: [2, 2], enabled: [true, true], split: true };
  expect(match.board.diceSumOptions).toEqual([option, option, option]);
});

test("when only one step left because of jump, option is split - already climbing", () => {
  const random = new RandomMock();

  const match = new MatchTester<ChickenrollBoard>({
    gameDef: game,
    numPlayers: 3,
    random,
    matchOptions: {
      sameSpace: "jump",
      mountainShape: "classic",
      showProbs: "after",
    },
  });

  const [p0, p1, p2] = match.board.playerOrder;

  // p0 climbs 2 steps on 3
  random.next([1, 2, 1, 2]);
  match.makeMove(p0, roll());
  match.makeMove(p0, pick({ diceSplitIndex: 0, choiceIndex: 0 }));
  match.makeMove(p0, stop());

  // p1 climbs on 2 steps
  random.next([1, 2, 1, 2]);
  match.makeMove(p1, roll());
  match.makeMove(p1, pick({ diceSplitIndex: 0, choiceIndex: 0 }));
  match.makeMove(p1, stop());

  // p2 same
  random.next([1, 2, 1, 2]);
  match.makeMove(p2, roll());
  match.makeMove(p2, pick({ diceSplitIndex: 0, choiceIndex: 0 }));
  match.makeMove(p2, stop());

  expect(match.board.checkpointPositions[p0][3]).toEqual(2);
  expect(match.board.checkpointPositions[p1][3]).toEqual(3);
  expect(match.board.checkpointPositions[p2][3]).toEqual(4);

  // There is only one step left for player 0
  random.next([1, 2, 1, 2]);
  match.makeMove(p0, roll());
  const option = { diceSums: [3, 3], enabled: [true, true], split: true };
  expect(match.board.diceSumOptions).toEqual([
    { diceSums: [3, 3], enabled: [true, true], split: true },
    { diceSums: [2, 4], enabled: [true, true], split: false },
    { diceSums: [3, 3], enabled: [true, true], split: true },
  ]);
});

const botTestConfigs = [];

for (const numBots of [2, 3, 4, 5]) {
  for (const mountainShape of ["debug"]) {
    for (const sameSpace of ["share", "jump", "nostop"]) {
      for (const showProbs of ["before", "after", "never"]) {
        botTestConfigs.push([numBots, { mountainShape, sameSpace, showProbs }]);
      }
    }
  }
}

test.each(botTestConfigs)("bot games %s %s", async (numBots, matchOptions) => {
  const match = new MatchTester<ChickenrollBoard>({
    gameDef: game,
    numPlayers: 0,
    numBots,
    matchOptions,
  });
  match.start();

  await match.waitUntilEnd();
  expect(match.matchHasEnded).toBe(true);
});
