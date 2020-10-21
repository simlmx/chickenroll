import React from "react";
import { Client } from "boardgame.io/react";
import CantStop from "./Game";
import { CantStopBoard } from "./components/CantStopBoard";
import { Local } from "boardgame.io/multiplayer";

const CantStopClient = Client({
  game: CantStop,
  numPlayers: 2,
  board: CantStopBoard,
  multiplayer: Local(),
});

const App = () => (
  <div className="clients">
    <CantStopClient playerID="0" />
    <CantStopClient playerID="1" />
  </div>
);

export default App;
