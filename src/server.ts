import { Server } from "boardgame.io/server";
import { PostgresStore } from "bgio-postgres";
import path from "path";
import serve from "koa-static";
import CantStop from "./Game";
import sslify, { xForwardedProtoResolver } from "koa-sslify";

const env = process.env;

const serverOptions: any = {
  games: [CantStop],
};

// Add the DB if we have environment variables defining it.
// Otherwise we'll use the default backend.
if (env.CANTSTOP_DB_URI) {
  const db = new PostgresStore(env.CANTSTOP_DB_URI, {
    // Without this option the ORM used by PostgresStore ends up printing all the moves
    // in the database for every move.
    logging: false,
  });
  serverOptions.db = db;
}

const server = Server(serverOptions);

const PORT = env.PORT ? parseInt(env.PORT) : 8000;

// Redirect to CANTSTOP_HOST if the environment variable is defined.
// In prod we set this to 'CANTSTOP_HOST=chickenroll.fun' so that people with
// the herokuapp address get redirected there.
const CANTSTOP_HOST = env.CANTSTOP_HOST || undefined;

if (!(env?.SKIP_SSLIFY === 'true')) {
  server.app.use(
    sslify({ resolver: xForwardedProtoResolver, hostname: CANTSTOP_HOST })
  );
} else {
  console.log('Skipping sslify');
}

server.app.use(async (ctx, next) => {
  // If the hostname doesn't match the environment variable, we redirect there.
  if (CANTSTOP_HOST && ctx.request.header.host !== CANTSTOP_HOST) {
    ctx.status = 301;
    ctx.redirect("https://" + CANTSTOP_HOST + ctx.request.url);
    return;
  }
  await next();
});

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
