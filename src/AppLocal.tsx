import React from "react";
import { Client } from "boardgame.io/react";
import CantStop from "./Game";
import { CantStopBoard } from "./components/CantStopBoard";
import { Local } from "boardgame.io/multiplayer";

const numPlayers = 2;

const CantStopClient = Client({
  game: CantStop,
  numPlayers: numPlayers,
  board: CantStopBoard,
  multiplayer: Local(),
  debug: false,
});

const App = () => (
  <div className="clients">
    {Array(numPlayers)
      .fill(null)
      .map((_, i) => (
        <CantStopClient playerID={i.toString()} key={i} />
      ))}
  </div>
);

export default App;
