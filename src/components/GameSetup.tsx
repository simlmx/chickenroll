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

    if (this.props.itsMe && this.props.name === "") {
      return (
        <div {...{ className }}>
          {/* On <enter> same as clicking ready */}
          <input
            type="text"
            className="form-control playerNameInput"
            onChange={(event) => this.setState({ myName: event.target.value })}
            placeholder="Enter your name"
            autoFocus
            maxLength={16}
            onKeyDown={(e) => {
              if (e.keyCode === 13) {
                this.props.moves.setName(this.state.myName);
                return false;
              }
              return true;
            }}
          />
          <button
            type="submit"
            id="readyButton"
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
      );
    } else {
      return <div {...{ className }}>{this.props.name || "..."}</div>;
    }
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
    const matchLink = `${SERVER}/match/${this.props.matchID}`;
    return (
      <div className="gameSetupWrap">
        <div className="gameSetupInviteWrap alert alert-success">
          <div>
            <b>Share this link to invite players</b>
          </div>
          <div className="inviteLinkWrap">
            <span className="inviteLink badge badge-success user-select-all">
              {matchLink}
            </span>
            <button
              type="button"
              className="btn btn-outline-success btn-sm copyBtn"
              onClick={() => navigator.clipboard.writeText(matchLink)}
            >
              Copy
            </button>
          </div>
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
              className="btn btn-primary startButton"
              onClick={() => this.props.moves.startGame()}
              disabled={Object.values(this.props.playerNames).some(
                (name) => !name
              )}
              key="last"
            >
              Start with {numPlayers} player
              {numPlayers === 1 ? "" : "s"}!
            </button>
          )}
        </div>
      </div>
    );
  }
}
