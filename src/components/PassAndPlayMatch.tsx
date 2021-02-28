import React from "react";
import { Local } from "boardgame.io/multiplayer";
import { Client } from "boardgame.io/react";
import { CantStopBoard } from "./CantStopBoard";
import CantStop from "../Game";

const PassAndPlayMatch = (props: { numPlayers: number }) => {
  // We use playerID=0 but we will let all the players play for everyone,
  // because we are assuming players are passing the device around
  //
  const { numPlayers } = props;
  const CantStopClient = Client({
    game: CantStop,
    numPlayers: numPlayers,
    board: CantStopBoard,
    multiplayer: Local(),
    debug: false,
    // debug: true,
    // enhancer: applyMiddleware(logger),
  });

  return <CantStopClient playerID="0" />;
};

export default PassAndPlayMatch;
