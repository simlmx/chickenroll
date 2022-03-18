import React from "react";
import CantStop from "../Game";
import { CantStopBoard } from "./CantStopBoard";
import { Client } from "boardgame.io/react";
import { SocketIO } from "boardgame.io/multiplayer";
import { PlayerID } from "../types";
import Loading from "./Loading";
import localStorage from "../utils/localStorage";
import { LobbyClient } from "boardgame.io/client";
import { URL_PREFIX, MAX_PLAYERS } from "../constants";

export default class Match extends React.Component<
  { matchID: string; lobbyClient: LobbyClient },
  { playerID?: PlayerID; playerCredentials?: string }
> {
  CantStopClient;

  constructor(props) {
    super(props);
    this.joinMatch(props.matchID);
    this.state = {
      playerID: undefined,
      playerCredentials: undefined,
    };
    this.CantStopClient = Client({
      game: CantStop,
      numPlayers: MAX_PLAYERS,
      board: CantStopBoard,
      multiplayer: SocketIO({ server: "http://localhost:6001" }),
      // debug: { impl: Debug },
    });
  }

  async joinMatch(matchID: string): Promise<void> {
    // Get the game to know how many players have joined already.
    let match;
    try {
      match = await this.props.lobbyClient.getMatch("cantstop", matchID);
    } catch (e) {
      alert(
        "There was a problem. Make sure you have the right url and try again."
      );
      window.location.replace(`${URL_PREFIX}`);
      return;
    }

    let playerID: string | undefined;
    let playerCredentials: string | undefined;

    // Try to get our login information from the local store if it's there
    playerID = localStorage.getItem(`playerID for matchID=${matchID}`);
    playerCredentials = localStorage.getItem(
      `playerCredentials for matchID=${matchID}`
    );
    if (playerID != null && playerCredentials != null) {
      this.setState({
        playerID,
        playerCredentials,
      });
      return;
    }

    // If we didn't find it in local store, it's because we are not part of this game
    // yet.
    // Find the next free playerID.
    playerID = "0";
    const thereIsRoom = match.players.some((player, i) => {
      playerID = i.toString();
      return !player.hasOwnProperty("name");
    });

    if (!thereIsRoom) {
      alert("This game is full!");
      return;
    }

    // Now we can actually join that match.
    let resp;
    try {
      resp = await this.props.lobbyClient.joinMatch("cantstop", matchID, {
        playerID,
        playerName: playerID,
      });
    } catch (e) {
      alert("Could not join the game. Try again.");
    }

    // If we get here it means we successfully joined the match.
    playerCredentials = resp.playerCredentials as string;
    this.setState({
      playerCredentials,
      playerID,
    });
    localStorage.setItem(`playerID for matchID=${matchID}`, playerID);
    localStorage.setItem(
      `playerCredentials for matchID=${matchID}`,
      playerCredentials
    );
  }

  render() {
    if (this.state.playerID == null) {
      return <Loading />;
    } else {
      return (
        <this.CantStopClient
          playerID={this.state.playerID}
          matchID={this.props.matchID}
          credentials={this.state.playerCredentials}
        />
      );
    }
  }
}
