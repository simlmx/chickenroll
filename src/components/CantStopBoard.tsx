import React from "react";

import { DiceBoard } from "./DiceBoard";
import { Mountain } from "./Mountain";
import { ScoreBoard } from "./ScoreBoard";
import MoveButtons from "./MoveButtons";

export class CantStopBoard extends React.Component<any> {
  render() {
    const info = this.props.G.info;
    const { level, message } = info || { message: "", level: "white" };
    const infoOpts = {
      className: `alert alert-${level} text-center info`,
    };
    const playerBannerOpts = {
      className: `playerBanner bgcolor${this.props.playerID}`,
    };

    return (
      <div className="cantStopBoard">
        <div {...infoOpts} role="alert">
          {message}
        </div>
        <div {...playerBannerOpts}></div>
        <div className="upperSection">
          <div className="upperLeft">
            <ScoreBoard scores={this.props.G.scores} />
          </div>
          <div className="upperCenter">
            <DiceBoard diceValues={this.props.G.diceValues} />
          </div>
          <div className="upperRight">
            <MoveButtons moves={this.props.moves} ctx={this.props.ctx} G={this.props.G} playerID={this.props.playerID}/>
          </div>
        </div>
        <div>
          <Mountain
            checkpointPositions={this.props.G.checkpointPositions}
            currentPositions={this.props.G.currentPositions}
            blockedSums={this.props.G.blockedSums}
          />
        </div>
      </div>
    );
  }
}
