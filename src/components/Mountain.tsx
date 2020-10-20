import React from "react";
import { sumSteps } from "../math";

interface MountainProps {
  currentPositions: { [key: number]: number };
  checkpointPositions: object;
}

export class Mountain extends React.Component<MountainProps> {
  render() {
    let rows: JSX.Element[] = [];
    for (let row = 13; row >= 0; --row) {
      let cols: any[] = [];
      for (let col = 2; col < 13; ++col) {
        let content: JSX.Element | string | (JSX.Element | string)[];

        const totalNumSteps = sumSteps(col);
        const currentIsThere = this.props.currentPositions[col] === row;

        if (row === 0) {
          // Below row 0 we write the dice sum.
          content = <div className="badge badge-dark">{col}</div>;
        } else if (row === totalNumSteps) {
          content = <div className="badge badge-dark">★</div>;
        } else if (row < totalNumSteps) {
          content = <div>○</div>;
        } else {
          content = "";
        }

        let climbers: JSX.Element[] = [];

        // It's not efficient to do this every time by... javascript :shrug:
        Object.entries(this.props.checkpointPositions).forEach(
          ([playerId, positions]) => {
            Object.entries(positions).forEach(([diceSumStr, numSteps]) => {
              const diceSum = parseInt(diceSumStr);
              if (diceSum === col && numSteps === row) {
                const opt = { className: `color${playerId} climber` };
                climbers.push(<div {...opt}>●</div>);
              }
            });
          }
        );

        if (currentIsThere) {
          climbers.push(<div className="climber">●</div>);
        }

        if (climbers.length > 0) {
          content = [content, <div className="climberGroup">{climbers}</div>];
        }

        cols.push(
          <td key={col} className="mountainCol">
            {content}
          </td>
        );
      }
      rows.push(<tr key={row}>{cols}</tr>);
    }

    return (
      <table className="table table-sm table-borderless mountain">
        <tbody>{rows}</tbody>
      </table>
    );
  }
}
