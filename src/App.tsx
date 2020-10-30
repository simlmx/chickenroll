import React from "react";
import CantStop from "./Game";
import { CantStopBoard } from "./components/CantStopBoard";
import { LobbyClient } from "boardgame.io/client";
import { Client } from "boardgame.io/react";
import { SocketIO, Local } from "boardgame.io/multiplayer";
import { PlayerID } from "./types";
import { Background } from "./components/Die";
// import { Debug } from 'boardgame.io/debug';

const { protocol, hostname, port } = window.location;

const SERVER = `${protocol}//${hostname}:${port}`;

const MAX_PLAYERS = 4;

/*
class Choices extends React.Component<{ setId: any }> {
  render() {
    return (
      <div>
        <div>
          <button
            onClick={() => this.props.setId("0")}
            className="btn bgcolor0"
          >
            0
          </button>
          <button
            onClick={() => this.props.setId("1")}
            className="btn bgcolor1"
          >
            1
          </button>
        </div>
        <div>
          <button
            onClick={() => this.props.setId("2")}
            className="btn bgcolor2"
          >
            2
          </button>
          <button
            onClick={() => this.props.setId("3")}
            className="btn bgcolor3"
          >
            3
          </button>
        </div>
      </div>
    );
  }
}
*/

class MainMenu extends React.Component<
  {
    onCreate: () => void;
    onJoin: (string) => void;
    onCreatePassAndPlay: (number) => void;
  },
  { matchID: string }
> {
  constructor(props) {
    super(props);
    this.state = {
      matchID: "",
    };
  }
  render() {
    return (
      <div>
        <h1>Play on one device</h1>
        <div>
          Choose the number of players:
          {Array(MAX_PLAYERS)
            .fill(null)
            .map((_, i) => (
              <button
                className="btn btn-primary"
                onClick={() => this.props.onCreatePassAndPlay(i + 1)}
                key={i}
              >
                {i + 1}
              </button>
            ))}
        </div>
        <h1> Play over the internet </h1>
        <div>
          <button
            className="btn btn-primary"
            onClick={() => this.props.onCreate()}
          >
            Create a new match
          </button>
        </div>
        <div>
          <input
            onChange={(event) => this.setState({ matchID: event.target.value })}
            placeholder="Enter the code here"
          />
          <button
            className="btn btn-primary"
            onClick={() => this.props.onJoin(this.state.matchID)}
          >
            Join a match
          </button>
        </div>
      </div>
    );
  }
}

interface AppState {
  choice?: string;
  playerName: string;
  // Current joined match
  currentMatch?: {
    matchID: string;
    playerCredentials: string;
    playerID: PlayerID;
  };
  passAndPlayMatch?: any;
}

class App extends React.Component<{}, AppState> {
  client: LobbyClient;

  constructor(props) {
    super(props);
    this.state = {
      playerName: "",
    };
    this.client = new LobbyClient({ server: SERVER });
  }

  async createMatch(): Promise<void> {
    const { matchID } = await this.client.createMatch("cantstop", {
      // This is the maximum number of players. We will adjust the turns if less players
      // join.
      numPlayers: MAX_PLAYERS,
      setupData: {
        passAndPlay: false,
      },
    });
    await this.joinMatch(matchID);
  }

  createPassAndPlayMatch(numPlayers: number) {
    const CantStopClient = Client({
      game: CantStop,
      numPlayers: numPlayers,
      board: CantStopBoard,
      multiplayer: Local(),
      debug: false,
      // debug: true,
    });

    this.setState({
      passAndPlayMatch: CantStopClient,
      currentMatch: undefined,
    });
  }

  async joinMatch(matchID: string): Promise<void> {
    // Get the game to know how many players have joined already.
    let match;
    try {
      match = await this.client.getMatch("cantstop", matchID);
    } catch (e) {
      alert(
        "There was a problem. Make sure you have the right code and try again."
      );
      return;
    }

    // Find the next free playerID.
    let playerID = "0";
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
      resp = await this.client.joinMatch("cantstop", matchID, {
        playerID,
        playerName: playerID,
      });
    } catch (e) {
      alert("Could not join the game. Try again.");
    }

    // If we get here it means we successfully joined the match.
    const { playerCredentials } = resp;
    this.setState({
      currentMatch: { matchID, playerCredentials, playerID },
      passAndPlayMatch: undefined,
    });
  }

  render() {
    if (this.state.passAndPlayMatch != null) {
      return (
        <div>
          <Background />
          {/* We use playerID=0 but we will let all the players play for everyone,
            because we are assuming players are passing the device around */}
          <this.state.passAndPlayMatch playerID="0" />
        </div>
      );
    } else if (this.state.currentMatch == null) {
      return (
        <MainMenu
          onCreate={() => this.createMatch()}
          onCreatePassAndPlay={(numPlayers) =>
            this.createPassAndPlayMatch(numPlayers)
          }
          onJoin={(matchID: string) => this.joinMatch(matchID)}
        />
      );
    } else {
      const CantStopClient = Client({
        game: CantStop,
        numPlayers: MAX_PLAYERS,
        board: CantStopBoard,
        multiplayer: SocketIO({ server: SERVER }),
        // debug: { impl: Debug },
      });

      const { matchID, playerID, playerCredentials } = this.state.currentMatch;
      return (
        <div>
          <Background />
          {/* TODO add some "are you sure?" */}
          <CantStopClient
            playerID={playerID}
            matchID={matchID}
            credentials={playerCredentials}
          />
          {/*<button
            onClick={() => {
              this.client.leaveMatch("cantstop", matchID, {
                playerID,
                credentials: playerCredentials,
              });
            }}
          >
            Leave Match
            </button>*/}
        </div>
      );
    }
  }
}

export default App;
