// FIXME merge inside index?

// FIXME use bgkit's UserId instead.
export type PlayerID = string;
export type DiceSum = number;

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
