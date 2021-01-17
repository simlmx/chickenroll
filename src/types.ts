export type PlayerID = string;
export type DiceSum = number;

export type SumOption = {
  // The 2-dice sums. There can be 0, 1 or 2.
  diceSums: (DiceSum | null)[];
  // In case there are 2, can we use both.
  split?: boolean;
};

export type PlayerInfo = {
  name: string;
  color: number;
  ready: boolean;
};

export type MountainShape = "classic" | "tall";

// What to do when players occupy the same space.
// share: tokens can share the same space
// jump: tokens jump over opponents
export type SameSpace = "share" | "jump";
