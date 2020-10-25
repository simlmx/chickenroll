import React from "react";
import { PlayerID } from "../types";

interface GameSetupProps {
  playerNames: { [key: string]: string };
  playerID: PlayerID;
  moves: any;
}

interface GameSetupState {
  yourName: string;
}

export default class GameSetup extends React.Component<
  GameSetupProps,
  GameSetupState
> {
  constructor(props) {
    super(props);
    // Let's tell the server we are in.
    let yourName = props.playerNames[props.playerID];
    if (yourName == null) {
      // This means it's the first time we "log in".
      // Let's create a placeholder for our name.
      props.moves.setName("");
      yourName = "";
    }
    this.state = {
      yourName: yourName,
    };
  }

  render() {
    const numPlayers = Object.values(this.props.playerNames).length;
    return (
      <div>
        {Object.entries(this.props.playerNames).map(([playerID, name]) => {
          if (playerID === this.props.playerID && !name) {
            // If it's us and we have no name yet.
            return (
              <div>
                <form>
                  <input
                    className="form-control"
                    onChange={(event) =>
                      this.setState({ yourName: event.target.value })
                    }
                    autoFocus
                  />
                  <button
                    type="submit"
                    className="btn btn-primary"
                    placeholder="Enter your name"
                    onClick={(e) => {
                      e.preventDefault();
                      this.props.moves.setName(this.state.yourName);
                    }}
                    disabled={this.state.yourName === ""}
                  >
                    Ready!
                  </button>
                </form>
              </div>
            );
          } else {
            return <div>{name}</div>;
          }
        })}
        {this.props.playerID === "0" && (
          <button
            className="btn btn-success"
            onClick={() => this.props.moves.startGame()}
            disabled={Object.values(this.props.playerNames).some((name) => !name)}
          >
            Start the match with {numPlayers} player{numPlayers === 1? '' :'s'}!
          </button>
        )}
      </div>
    );
  }
}
