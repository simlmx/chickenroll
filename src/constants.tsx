const { protocol, hostname, port } = window.location;

let server = `${protocol}//${hostname}`;

if (port) {
  server += `:${port}`;
}

export const SERVER = server;
