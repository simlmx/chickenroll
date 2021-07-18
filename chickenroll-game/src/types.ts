export type DiceSum = number;

export type PlayerInfo = {
  name: string;
  color: number;
  ready: boolean;
};

export type MountainShape = "classic" | "tall" | "debug";

// What to do when players occupy the same space.
// share: tokens can share the same space
// jump: tokens jump over opponents
export type SameSpace = "share" | "jump" | "nostop";

// FIXME use throughout
export type CurrentPositions = { [col: number]: number };
export type CheckpointPositions = { [userId: string]: CurrentPositions };
