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

export const MAX_PLAYERS = 4;

export const NUM_COLORS = 7;
