import React from "react";
import { Client } from "boardgame.io/react";
import CantStop from "./Game";
import { CantStopBoard } from "./components/CantStopBoard";
import { Local } from "boardgame.io/multiplayer";

const CantStopClient = Client({
  game: CantStop,
  numPlayers: 3,
  board: CantStopBoard,
  multiplayer: Local(),
  debug: false,
});

const App = () => (
  <div className="clients">
    <CantStopClient playerID="0" />
    <CantStopClient playerID="1" />
    <CantStopClient playerID="2" />
  </div>
);

export default App;
