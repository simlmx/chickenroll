import { render } from "@lefun/dev-server";

import { game } from "chickenroll-game";

render({
  board: async () => {
    const { Board } = await import("./CantStopBoard");
    // @ts-expect-error the import is there even if TS does not see it!
    await import("../dist/index.css");
    return <Board />;
  },
  game,
  messages: {},
  gameId: "chickenroll",
});
