import React from "react";
import CantStop from "./Game";
import { CantStopBoard } from "./components/CantStopBoard";
import { LobbyClient } from "boardgame.io/client";
import { Client } from "boardgame.io/react";
import { SocketIO, Local } from "boardgame.io/multiplayer";

const { protocol, hostname, port } = window.location;

const SERVER = `${protocol}//${hostname}:${port}`;

const numPlayers = 2;

const CantStopClient = Client({
  game: CantStop,
  numPlayers,
  board: CantStopBoard,
  multiplayer: SocketIO({ server: SERVER }),
  debug: false,
});

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
    onCreatePassAndPlay: () => void;
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
        <div>
          <button onClick={() => this.props.onCreatePassAndPlay()}>
            Create a pass-and-play match
          </button>
        </div>
        <div>
          <button onClick={() => this.props.onCreate()}>
            Create a new match
          </button>
        </div>
        <div>
          <input
            onChange={(event) => this.setState({ matchID: event.target.value })}
          />
          <button onClick={() => this.props.onJoin(this.state.matchID)}>
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
  matches?: any[];
  // Current joined match
  currentMatch?: {
    matchID: string;
    playerCredentials: string;
    playerID: string;
  };
  passAndPlay: boolean;
}

class App extends React.Component<{}, AppState> {
  client: LobbyClient;

  constructor(props) {
    super(props);
    this.state = {
      playerName: "",
      passAndPlay: false,
    };
    this.client = new LobbyClient({ server: SERVER });
  }

  async refreshMatches(): Promise<void> {
    const { matches } = await this.client.listMatches("cantstop");
    this.setState({ matches });
  }

  componentDidMount() {
    this.refreshMatches();
    setInterval(async () => {
      // TODO Just stop the interval when inside a game.
      if (this.state.currentMatch != null) {
        this.refreshMatches();
      }
    }, 2000);
  }

  async createMatch(): Promise<void> {
    const { matchID } = await this.client.createMatch("cantstop", {
      // This is the maximum number of players. We will adjust the turns if less players
      // join.
      numPlayers,
      setupData: {
        passAndPlay: false,
      },
    });
    await this.joinMatch(matchID);
    this.refreshMatches();
  }

  createPassAndPlayMatch() {
    this.setState({ passAndPlay: true, currentMatch: undefined });
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
    this.setState({ currentMatch: { matchID, playerCredentials, playerID } });
  }

  render() {
    if (this.state.passAndPlay) {
      const CantStopClient = Client({
        game: CantStop,
        numPlayers,
        board: CantStopBoard,
        multiplayer: Local(),
        debug: false,
      });

      return (
        <div>
          {/* We use playerID=0 but we will let all the players play for everyone,
            because we are assuming players are passing the device around */}
          <CantStopClient playerID="0" />
        </div>
      );
    } else if (this.state.currentMatch == null) {
      return (
        <div>
          <div>
            {this.state.matches == null
              ? "Loading..."
              : `There are ${this.state.matches.length} games.`}
          </div>
          <MainMenu
            onCreate={() => this.createMatch()}
            onCreatePassAndPlay={() => this.createPassAndPlayMatch()}
            onJoin={(matchID: string) => this.joinMatch(matchID)}
          />
        </div>
      );
    } else {
      const { matchID, playerID, playerCredentials } = this.state.currentMatch;
      return (
        <div>
          <div> Match code: {matchID}</div>
          <div> player ID: {playerID}</div>
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
