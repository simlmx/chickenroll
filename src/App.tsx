import { Client } from "boardgame.io/react";
import { CantStop } from "./Game";
import { CantStopBoard } from "./components/CantStopBoard";

const App = Client({
  game: CantStop,
  numPlayers: 1,
  board: CantStopBoard,
});

export default App;
