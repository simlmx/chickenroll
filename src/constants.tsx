let server;

// We also use the constants on the backend server, for which `window` is not defined.
if (typeof window !== "undefined") {
  const { protocol, hostname, port } = window.location;

  server = `${protocol}//${hostname}`;

  if (port) {
    server += `:${port}`;
  }
}
export const SERVER = server;

export const MAX_PLAYERS = 5;

export const NUM_COLORS = 7;

export const AUTO_NUM_COLS_TO_WIN = new Map([
  [1, 5],
  [2, 5],
  [3, 3],
  [4, 3],
  [5, 2],
]);
