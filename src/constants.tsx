const { protocol, hostname, port } = window.location;

export const SERVER = `${protocol}//${hostname}:${port}`;
