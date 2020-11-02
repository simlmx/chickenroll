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
import { BrowserRouter, Switch, Route } from "react-router-dom";
// import { Debug } from 'boardgame.io/debug';

const MAX_PLAYERS = 4;

class Home extends React.Component<{ onCreate: () => void }> {
  diceValues: number[];
  colorIdx: string;

  constructor(props) {
    super(props);
    this.diceValues = Array(4)
      .fill(null)
      .map(() => Math.floor(Math.random() * 6) + 1);
    this.colorIdx = Math.floor(Math.random() * 5).toString();
  }

  render() {
    return (
      <div className="backgroundWrap">
        <Background />
        <div className="homeWrap">
          <h1 className="homeTitle"> Can't Stop! </h1>
          <DiceBoard
            diceValues={this.diceValues}
            diceHighlight={[false, false, false, false]}
            currentPlayer={this.colorIdx}
          />
          <p className="homeReference">
            This is an online version of the classic game{" "}
            <a href="https://en.wikipedia.org/wiki/Can%27t_Stop_(board_game)">
              Can't Stop
            </a>
            .
          </p>
          <p className="homeHowToPlay">
            You can learn how to play by watching{" "}
            <a href="https://youtu.be/VUGvOQatVDc">this video</a>.
          </p>
          <div>
            <h2> Play over the internet </h2>
            <form>
              <div className="form-group">
                <button
                  className="btn btn-primary"
                  onClick={() => this.props.onCreate()}
                >
                  Create a new match
                </button>
                <small className="form-text text-muted">
                  You will be able to send an invitation link to your friends.
                </small>
              </div>
            </form>
            <hr />
            <h2>Play on one device</h2>
            <div>
              <p>Choose the number of players:</p>
              {Array(MAX_PLAYERS)
                .fill(null)
                .map((_, i) => (
                  <button
                    className="btn btn-primary"
                    onClick={() => {
                      window.location.href = `${SERVER}/${i + 1}`;
                    }}
                    key={i}
                  >
                    {/* `*/}
                    {i + 1}
                  </button>
                ))}
            </div>
          </div>
        </div>
      </div>
    );
  }
}

const PassAndPlayMatch = (props: { numPlayers: number }) => {
  // We use playerID=0 but we will let all the players play for everyone,
  // because we are assuming players are passing the device around
  const CantStopClient = Client({
    game: CantStop,
    numPlayers: props.numPlayers,
    board: CantStopBoard,
    multiplayer: Local(),
    debug: false,
    // debug: true,
  });

  return (
    <div className="backgroundWrap">
      <Background />
      <CantStopClient playerID="0" />
    </div>
  );
};

class Match extends React.Component<
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
      multiplayer: SocketIO({ server: SERVER }),
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
    window.localStorage.setItem(`playerID for matchID=${matchID}`, playerID);
    window.localStorage.setItem(
      `playerCredentials for matchID=${matchID}`,
      playerCredentials
    );
  }

  render() {
    if (this.state.playerID == null) {
      return <div>Loading...</div>;
    } else {
      return (
        <div className="backgroundWrap">
          <Background />
          <this.CantStopClient
            playerID={this.state.playerID}
            matchID={this.props.matchID}
            credentials={this.state.playerCredentials}
          />
        </div>
      );
    }
  }
}

class App extends React.Component {
  lobbyClient: LobbyClient;

  constructor(props) {
    super(props);
    this.lobbyClient = new LobbyClient({ server: SERVER });
  }

  async createMatch(): Promise<void> {
    const { matchID } = await this.lobbyClient.createMatch("cantstop", {
      // This is the maximum number of players. We will adjust the turns if less players
      // join.
      numPlayers: MAX_PLAYERS,
      setupData: {
        passAndPlay: false,
      },
    });
    window.location.replace(`${SERVER}/match/${matchID}`);
  }

  render() {
    const lobbyClient = this.lobbyClient;
    return (
      <BrowserRouter>
        <Switch>
          {/* Pass and play match */}
          <Route
            path="/:numPlayers([1234])"
            render={(props) => {
              const numPlayers = parseInt(props.match.params.numPlayers);
              return <PassAndPlayMatch {...{ numPlayers }} />;
            }}
          />

          {/* Regular match with match ID */}
          <Route
            path="/match/:matchID"
            render={(props) => {
              const { matchID } = props.match.params;
              return <Match {...{ matchID, lobbyClient }} />;
            }}
          />

          {/* Redirect to the home page for anything else */}
          <Route
            path="/:other"
            render={(props) => {
              window.location.replace(`${SERVER}`);
            }}
          />
          {/* Home */}
          <Route path="/">
            <Home onCreate={() => this.createMatch()} />
          </Route>
        </Switch>
      </BrowserRouter>
    );
  }
}

export default App;
