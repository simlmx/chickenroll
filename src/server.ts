import { Server } from "boardgame.io/server";
import CantStop from "./Game";

const server = Server({
  games: [CantStop],
});

server.run(8000); //, () => console.log("server running..."));
