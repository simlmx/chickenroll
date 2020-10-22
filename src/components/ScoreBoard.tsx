import React from "react";

interface ScoreBoardProps {
  scores: { [number: string]: number };
}

export class ScoreBoard extends React.Component<ScoreBoardProps> {
  render() {
    const content = Object.entries(this.props.scores).map(
      ([playerID, points]) => {
        const pointOpt = { className: `color${playerID} scoreBoardPlayer` };
        // 3 is the maximum number of points
        const tds = Array(3)
          .fill(null)
          .map((_, i) => {
            if (points >= i + 1) {
              return (
                <td key={i}>
                  <div {...pointOpt} key={playerID}>
                    ★
                  </div>
                </td>
              );
            } else {
              return <td key={i}></td>;
            }
          });
        return <tr key={playerID}>{tds}</tr>;
      }
    );

    return (
      <div>
        <table className="scoreBoard">
          <tbody>{content}</tbody>
        </table>
      </div>
    );
  }
}
