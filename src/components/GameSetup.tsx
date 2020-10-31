import React from "react";
import { PlayerID } from "../types";
import { SERVER } from "../constants";

interface PlayerProps {
  moves: any;
  itsMe: boolean;
  name: string;
  playerID: PlayerID;
}

export class Player extends React.Component<PlayerProps, { myName: string }> {
  constructor(props: PlayerProps) {
    super(props);
    this.state = {
      myName: props.name,
    };
  }
  render() {
    let className = `gameSetupPlayer border${this.props.playerID} bgcolor${this.props.playerID}`;
    if (!this.props.itsMe && !this.props.name) {
      className += " gameSetupPlayerWaiting";
    }
    return (
      <div {...{ className }}>
        {this.props.itsMe && this.props.name === "" ? (
          <form className="playerNameForm">
            <div className="form-group row">
              <div className="col-sm">
                <input
                  type="text"
                  className="form-control"
                  onChange={(event) =>
                    this.setState({ myName: event.target.value })
                  }
                  placeholder="Enter your name"
                  autoFocus
                  maxLength={16}
                />
              </div>
              <div className="col-sm-auto">
                <button
                  type="submit"
                  className="btn btn-primary"
                  placeholder="Enter your name"
                  onClick={(e) => {
                    e.preventDefault();
                    this.props.moves.setName(this.state.myName);
                  }}
                  disabled={this.state.myName === ""}
                >
                  Ready!
                </button>
              </div>
            </div>
          </form>
        ) : (
          <div className="gameSetupPlayerName">{this.props.name || "..."}</div>
        )}
      </div>
    );
  }
}

interface GameSetupProps {
  playerNames: { [key: string]: string };
  playerID: PlayerID;
  moves: any;
  maxNumPlayers: number;
  matchID: string;
}

export default class GameSetup extends React.Component<GameSetupProps> {
  constructor(props) {
    super(props);
    // Let's tell the server we are in.
    const yourName = props.playerNames[props.playerID];
    if (yourName == null) {
      // This means it's the first time we "log in".
      // Let's create a placeholder for our name.
      props.moves.setName("");
    }
  }

  render() {
    const numPlayers = Object.values(this.props.playerNames).length;
    const maxNumPlayers = this.props.maxNumPlayers;
    const numFreeSpots =
      maxNumPlayers - Object.keys(this.props.playerNames).length;
    const matchLink = `${SERVER}/?m=${this.props.matchID}`;
    return (
      <div className="gameSetup">
        <div className="gameSetupInviteWrap alert alert-success">
          <div>
            <b>Share this link to invite players</b>
          </div>
          <div className="inviteLink badge badge-success user-select-all">
            {matchLink}
          </div>
          <button
            type="button"
            className="btn btn-outline-success btn-sm copyBtn"
            onClick={() => navigator.clipboard.writeText(matchLink)}
          >
            Copy
          </button>
        </div>
        <div className="gameSetupPlayersWrap">
          {Object.entries(this.props.playerNames).map(([playerID, name]) => (
            <Player
              moves={this.props.moves}
              name={name}
              itsMe={playerID === this.props.playerID}
              playerID={playerID}
              key={playerID}
            />
          ))}
          {Array(numFreeSpots)
            .fill(null)
            .map((_, i) => (
              <div
                className="gameSetupPlayer gameSetupPlayerFree"
                key={numPlayers + i}
              >
                Waiting for player to join
              </div>
            ))}
          {this.props.playerID === "0" && (
            <button
              className="btn btn-primary"
              onClick={() => this.props.moves.startGame()}
              disabled={Object.values(this.props.playerNames).some(
                (name) => !name
              )}
              key="last"
            >
              Start the match with {numPlayers} player
              {numPlayers === 1 ? "" : "s"}!
            </button>
          )}
        </div>
      </div>
    );
  }
}
