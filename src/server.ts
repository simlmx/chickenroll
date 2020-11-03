import { Server } from "boardgame.io/server";
import path from "path";
import serve from "koa-static";
import CantStop from "./Game";
import sslify, {xForwardedProtoResolver} from 'koa-sslify';

const server = Server({
  games: [CantStop],
});

const PORT = process.env.PORT ? parseInt(process.env.PORT) : 8000;

server.app.use(sslify({ resolver: xForwardedProtoResolver }));

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
