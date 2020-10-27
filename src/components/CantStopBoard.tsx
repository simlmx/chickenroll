import React from "react";

import { DiceBoard } from "./DiceBoard";
import { Mountain } from "./Mountain";
import { ScoreBoard } from "./ScoreBoard";
import GameSetup from "./GameSetup";
import MoveButtons from "./MoveButtons";

export class CantStopBoard extends React.Component<any> {
  render() {
    const playerID = this.props.G.passAndPlay
      ? this.props.ctx.currentPlayer
      : this.props.playerID;
    const phase = this.props.ctx.phase;

    if (phase === "setup") {
      return (
        <GameSetup
          playerNames={this.props.G.playerNames}
          playerID={this.props.playerID}
          moves={this.props.moves}
          maxNumPlayers={this.props.ctx.numPlayers}
          matchID={this.props.matchID}
        />
      );
    }

    const info = this.props.G.info;
    const { level, message } = info || { message: "", level: "white" };
    const infoOpts = {
      className: `alert alert-${level} text-center info`,
    };

    return (
      <div className="cantStopBoard">
        <div {...infoOpts} role="alert">
          {message}
        </div>
        <div className="upperSection">
          <div className="upperLeft">
            <ScoreBoard
              scores={this.props.G.scores}
              playerNames={this.props.G.playerNames}
              currentPlayer={this.props.ctx.currentPlayer}
            />
          </div>
          <div className="upperCenter">
            <DiceBoard
              diceValues={this.props.G.diceValues}
              currentPlayer={this.props.ctx.currentPlayer}
            />
          </div>
          <div className="upperRight">
            <MoveButtons
              moves={this.props.moves}
              ctx={this.props.ctx}
              G={this.props.G}
              playerID={playerID}
            />
          </div>
        </div>
        <div className="mountainContainer">
          <Mountain
            checkpointPositions={this.props.G.checkpointPositions}
            currentPositions={this.props.G.currentPositions}
            blockedSums={this.props.G.blockedSums}
            currentPlayer={this.props.ctx.currentPlayer}
          />
          <div className="playAgainContainer">
            {this.props.ctx.phase === "gameover" && (
              <button
                onClick={() => this.props.moves.playAgain()}
                className="btn btn-primary"
              >
                Play Again
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }
}
