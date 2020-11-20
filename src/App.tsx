import React from "react";
import CantStop from "./Game";
import Home from "./components/Home";
import { CantStopBoard } from "./components/CantStopBoard";
import { LobbyClient } from "boardgame.io/client";
import { Client } from "boardgame.io/react";
import { SocketIO, Local } from "boardgame.io/multiplayer";
import { PlayerID } from "./types";
import { SERVER, MAX_PLAYERS } from "./constants";
import { BrowserRouter, Switch, Route } from "react-router-dom";
import Page from "./components/PageTemplate";
import HowToPlay from "./components/HowToPlay";
import About from "./components/About";
// import { Debug } from 'boardgame.io/debug';
//
const TITLE = 'Can\'t Stop! - The classic "push your luck" dice game';

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
  });

  return <CantStopClient playerID="0" />;
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
        "There was a problem. Make sure you have the right url and try again."
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
        <this.CantStopClient
          playerID={this.state.playerID}
          matchID={this.props.matchID}
          credentials={this.state.playerCredentials}
        />
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
    let matchID;
    try {
      const resp = await this.lobbyClient.createMatch("cantstop", {
        // This is the maximum number of players. We will adjust the turns if less players
        // join.
        numPlayers: MAX_PLAYERS,
        setupData: {
          passAndPlay: false,
        },
      });
      matchID = resp.matchID;
    } catch (e) {
      alert("There was a problem creating the match. Please try again.");
    }
    if (matchID != null) {
      window.location.href = `${SERVER}/match/${matchID}`;
    }
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
              return (
                <Page
                  wrap={false}
                  title={`Local Match ${numPlayers} Player${
                    numPlayers > 1 ? "s" : ""
                  } | ${TITLE}`}
                >
                  <PassAndPlayMatch {...{ numPlayers }} />
                </Page>
              );
            }}
          />

          {/* Regular match with match ID */}
          <Route
            path="/match/:matchID"
            render={(props) => {
              const { matchID } = props.match.params;
              return (
                <Page wrap={false} title={"Match | " + TITLE}>
                  <Match {...{ matchID, lobbyClient }} />
                </Page>
              );
            }}
          />

          {/* How to play */}
          <Route
            path="/howtoplay"
            render={(props) => {
              return (
                <Page path="/howtoplay" title={"How To Play | " + TITLE}>
                  <HowToPlay />
                </Page>
              );
            }}
          />

          {/* About */}
          <Route
            path="/about"
            render={(props) => {
              return (
                <Page path="/about" title={"About | " + TITLE}>
                  <About />
                </Page>
              );
            }}
          />

          <Route path="/patate" component={About} />

          {/* Redirect to the home page for anything else.
              This has to be *after* all the other routes.*/}
          <Route
            path="/:other"
            render={(props) => {
              window.location.replace(`${SERVER}`);
            }}
          />
          {/* Home */}
          <Route
            path="/"
            render={(props) => {
              return (
                <Page path="/" title={TITLE} showFooterContact={true}>
                  <Home onCreate={() => this.createMatch()} />
                </Page>
              );
            }}
          ></Route>
        </Switch>
      </BrowserRouter>
    );
  }
}

export default App;
