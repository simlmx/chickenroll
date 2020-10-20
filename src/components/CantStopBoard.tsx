import React from "react";

import { DiceBoard } from "./DiceBoard";
import { Mountain } from "./Mountain";

export class CantStopBoard extends React.Component<any> {
  render() {
    return [
      <DiceBoard
        G={this.props.G}
        moves={this.props.moves}
        ctx={this.props.ctx}
        key={1}
      />,
      <Mountain
        checkpointPositions={this.props.G.checkpointPositions}
        currentPositions={this.props.G.currentPositions}
        key={2}
      />,
    ];
  }
}
