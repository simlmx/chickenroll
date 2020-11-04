import React from "react";
import { PlayerID } from "../types";

interface ScoreBoardProps {
  scores: { [key: string]: number };
  numVictories: { [key: string]: number };
  playerNames: { [key: string]: string };
  currentPlayer: PlayerID;
  playOrder: PlayerID[];
}

export class ScoreBoard extends React.Component<ScoreBoardProps> {
  render() {
    const content = this.props.playOrder.map((playerID) => {
      const name = this.props.playerNames[playerID];
      const points = this.props.scores[playerID];
      // 3 is the maximum number of points but you can finish with up to 5
      const tds = Array(5)
        .fill(null)
        .map((_, i) => {
          const hasStar = points > i;
          if (i >= 3 && !hasStar) {
            return null;
          }
          const className = hasStar ? ` color${playerID}` : ` emptyStar`;
          return (
            <td className="starCol" key={i}>
              <div {...{ className }} key={playerID}>
                ★
              </div>
            </td>
          );
        });
      let className = `scoreBoardPlayerName bgcolor${playerID}`;
      if (playerID === this.props.currentPlayer) {
        className += " scoreBoardPlayerNameCurrent";
      }
      return (
        <tr key={playerID}>
          <td className="numVictoriesCol">
            <div className={`badge bgcolor${playerID}`}>
              {this.props.numVictories[playerID] || ""}
            </div>
          </td>
          <td className="nameCol">
            <div {...{ className }}>{name}</div>
          </td>
          {tds}
        </tr>
      );
    });

    return (
      <table className="scoreBoard">
        <tbody>{content}</tbody>
      </table>
    );
  }
}
