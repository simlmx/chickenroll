import { Server } from "boardgame.io/server";
import { PostgresStore } from "bgio-postgres";
import path from "path";
import serve from "koa-static";
import CantStop from "./Game";

const env = process.env;

const serverOptions: any = {
  games: [CantStop],
};

// Add the DB if we have environment variables defining it.
// Otherwise we'll use the default backend.
if (env.CANTSTOP_DB_URI) {
  const db = new PostgresStore(env.CANTSTOP_DB_URI, {logging: false});
  serverOptions.db = db;
}

const server = Server(serverOptions);

const PORT = env.PORT ? parseInt(env.PORT) : 8000;

// Build path relative to the server.js file
const frontEndAppBuildPath = path.resolve(__dirname, "../build");
server.app.use(serve(frontEndAppBuildPath));

server.run(PORT, () => {
  server.app.use(
    async (ctx, next) =>
      await serve(frontEndAppBuildPath)(
        Object.assign(ctx, { path: "index.html" }),
        next
      )
  );
});
