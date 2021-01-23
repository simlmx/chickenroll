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

// Chat message.
export type Message = {
  playerID: PlayerID;
  text: string;
  ts: number;
};
