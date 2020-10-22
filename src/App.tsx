import React from "react";
import { Client } from "boardgame.io/react";
import CantStop from "./Game";
import { CantStopBoard } from "./components/CantStopBoard";
import { SocketIO } from "boardgame.io/multiplayer";

const numPlayers = 2;

const CantStopClient = Client({
  game: CantStop,
  numPlayers: numPlayers,
  board: CantStopBoard,
  multiplayer: SocketIO({ server: "localhost:8000" }),
  debug: false,
});

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

class App extends React.Component<{}, { choice: string | null }> {
  constructor(props) {
    super(props);
    this.state = { choice: null };
  }
  render() {
    if (this.state.choice == null) {
      return <Choices setId={(id) => this.setState({ choice: id })} />;
    } else {
      return (
        <div className="clients">
          <CantStopClient playerID={this.state.choice} />
        </div>
      );
    }
  }
}
export default App;
