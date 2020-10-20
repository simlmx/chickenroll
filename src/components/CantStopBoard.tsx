import React from "react";

import { DiceBoard } from "./DiceBoard";
import { Mountain } from "./Mountain";

export class CantStopBoard extends React.Component<any> {
  render() {
    const info = this.props.G.info;
    const { level, message } = info || { message: "", level: "white" };
    const infoOpts = {
      className: `alert alert-${level} text-center info`,
    };
    return [
      <div {...infoOpts} key={0} role='alert'>
        {message}
      </div>,
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
