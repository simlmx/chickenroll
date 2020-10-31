import React from "react";
import CantStop from "./Game";
import { CantStopBoard } from "./components/CantStopBoard";
import { LobbyClient } from "boardgame.io/client";
import { Client } from "boardgame.io/react";
import { SocketIO, Local } from "boardgame.io/multiplayer";
import { PlayerID } from "./types";
import { Background } from "./components/Die";
import { DiceBoard } from "./components/DiceBoard";
import { SERVER } from "./constants";
// import { Debug } from 'boardgame.io/debug';

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
      <div className="welcomeWrap">
        <div className="welcomeTitleWrap">
          <h1 className="welcomeTitle"> Can't Stop! </h1>
          <DiceBoard
            diceValues={Array(4)
              .fill(null)
              .map(() => Math.floor(Math.random() * 6) + 1)}
            diceHighlight={[false, false, false, false]}
            currentPlayer={Math.floor(Math.random() * 5).toString()}
          />
          <p className="welcomeReference">
            This is an online version of the classic game{" "}
            <a href="https://en.wikipedia.org/wiki/Can%27t_Stop_(board_game)">
              Can't Stop
            </a>
            .
          </p>
        </div>
        <div className="welcomeContentWrap">
          <div className="welcomeContentInner">
            <h2>Play on one device</h2>
            <div>
              <p>Choose the number of players:</p>
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
            <hr />
            <h2> Play over the internet </h2>
            <form className="form-inline">
              <div className="form-row">
                <button
                  type="submit"
                  className="btn btn-success"
                  onClick={() => this.props.onJoin(this.state.matchID)}
                >
                  Join a match
                </button>
                <input
                  type="text"
                  className="form-control"
                  onChange={(event) =>
                    this.setState({ matchID: event.target.value })
                  }
                  placeholder="Enter the match code"
                  required
                />
              </div>
            </form>
            <div>
              <div className="form-row">
                <button
                  className="btn btn-primary"
                  onClick={() => this.props.onCreate()}
                >
                  Create a new match
                </button>
              </div>
            </div>
          </div>
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

  componentDidMount() {
    // Parse the query params to extract the match id if present.
    const urlParams = new URLSearchParams(window.location.search);
    const matchID = urlParams.get("m");
    if (matchID != null) {
      this.joinMatch(matchID);
    }
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
    window.location.replace(`${SERVER}/?m=${matchID}`);
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
      window.location.replace(`${SERVER}/`);
      return;
    }

    let playerID: string | null;
    let playerCredentials: string | null;

    // Try to get our login information from the local store if it's there
    playerID = window.localStorage.getItem(`playerID for matchID=${matchID}`);
    playerCredentials = window.localStorage.getItem(
      `playerCredentials for matchID=${matchID}`
    );
    if (playerID != null && playerCredentials != null) {
      this.setState({
        currentMatch: {
          matchID,
          playerID,
          playerCredentials,
        },
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
      resp = await this.client.joinMatch("cantstop", matchID, {
        playerID,
        playerName: playerID,
      });
    } catch (e) {
      alert("Could not join the game. Try again.");
    }

    // If we get here it means we successfully joined the match.
    playerCredentials = resp.playerCredentials as string;
    this.setState({
      currentMatch: { matchID, playerCredentials, playerID },
      passAndPlayMatch: undefined,
    });
    window.localStorage.setItem(`playerID for matchID=${matchID}`, playerID);
    window.localStorage.setItem(
      `playerCredentials for matchID=${matchID}`,
      playerCredentials
    );
  }

  // We separate it to add the background to everything.
  render() {
    return (
      <div id="megaWrap">
        {this._render()}
        <Background />
      </div>
    );
  }

  _render() {
    if (this.state.passAndPlayMatch != null) {
      return (
        <div>
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
        <CantStopClient
          playerID={playerID}
          matchID={matchID}
          credentials={playerCredentials}
        />
      );
    }
  }
}

export default App;
