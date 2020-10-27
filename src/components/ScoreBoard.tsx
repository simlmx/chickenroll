import React from "react";
import { PlayerID } from "../types";

interface ScoreBoardProps {
  scores: { [number: string]: number };
  playerNames: { [number: string]: number };
  currentPlayer: PlayerID;
  playOrder: PlayerID[];
}

export class ScoreBoard extends React.Component<ScoreBoardProps> {
  render() {
    const content = this.props.playOrder.map((playerID) => {
      const name = this.props.playerNames[playerID];
      const points = this.props.scores[playerID];
      const pointOpt = { className: `color${playerID} scoreBoardPlayer` };
      // 3 is the maximum number of points
      const tds = Array(points)
        .fill(null)
        .map((_, i) => (
          <td key={i}>
            <div {...pointOpt} key={playerID}>
              ★
            </div>
          </td>
        ));
      let className = `scoreBoardPlayerName bgcolor${playerID}`;
      if (playerID === this.props.currentPlayer) {
        className += " scoreBoardPlayerNameCurrent";
      }
      return (
        <tr key={playerID}>
          <td>
            <div className="scoreBoardPlayerNameContainer">
              <div {...{ className }}>{name}</div>
            </div>
          </td>
          {tds}
        </tr>
      );
    });

    return (
      <div className="scoreBoardContainer">
        <table className="scoreBoard">
          <tbody>{content}</tbody>
        </table>
      </div>
    );
  }
}
