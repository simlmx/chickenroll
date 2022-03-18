export const URL_PREFIX = process.env.PUBLIC_URL;

let origin;
// We also use the constants on the backend server, for which `window` is not defined.
if (typeof window !== "undefined") {
  ({ origin } = window.location);
}

export const ORIGIN = origin;

export const MAX_PLAYERS = 5;

export const NUM_COLORS = 7;

export const PLAYER_NAME_MAX_LEN = 16;

// TODO and warning: changing those is not enough, you need to also fix the possibles
// options in GameSetup.tsx
export const AUTO_NUM_COLS_TO_WIN = new Map([
  [1, 5],
  [2, 5],
  [3, 3],
  [4, 3],
  [5, 2],
]);

// Number of steps for each columns for the different modes.
export const NUM_STEPS = {
  classic: {
    2: 3,
    3: 5,
    4: 7,
    5: 9,
    6: 11,
    7: 13,
  },
  tall: {
    2: 3,
    3: 6,
    4: 9,
    5: 11,
    6: 14,
    7: 16,
  },
};
