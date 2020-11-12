import React from "react";
import { getNumStepsForSum } from "../math";
import { PlayerID, SumOption, PlayerInfo } from "../types";

export const Climber = (props: {
  color?: number;
  current?: boolean;
  highlight?: boolean;
  downlight?: boolean;
}) => {
  let className = "climber";
  if (!props.current) {
    className += ` bgcolor${props.color}`;
  } else {
    className += ` climberCurrent border${props.color}`;
  }
  if (props.highlight) {
    className += " highlight";
  } else if (props.downlight) {
    className += " downlight";
  }
  return <div {...{ className }}></div>;
};

export const ClimberPlaceholder = (props: {
  color?: number;
  columnParity?: number;
}) => {
  let className = ""; //"climberPlaceholder";
  if (props.color != null) {
    className += ` bgcolor${props.color} climberPlaceholderBlocked`;
  } else if (props.columnParity != null) {
    className += ` climberPlaceholder climberPlaceholderParity${props.columnParity}`;
  }
  return (
    <div className="climberPlaceholderWrap">
      <div {...{ className }}></div>
    </div>
  );
};

export const ColNum = (props: { colNum: number; blockedColor?: number }) => {
  // Below row 0 we write the dice sum.
  const { colNum, blockedColor } = props;
  let className = "badge colNumbers";
  if (blockedColor != null) {
    className += ` bgcolor${blockedColor}`;
  } else {
    // className += columnParity ? ' colNumbersOdd' : ' colNumbersEven';
    className += ` colParity${colNum % 2}`;
  }
  return (
    <div className="colNumbersWrap">
      <div {...{ className }} key={0}>
        {colNum}
      </div>
    </div>
  );
};

interface MountainProps {
  currentPositions: { [key: number]: number };
  checkpointPositions: object;
  playerInfos: { [key: string]: PlayerInfo };
  blockedSums: { [key: number]: string };
  currentPlayer: PlayerID;
  diceSumOptions?: SumOption[];
  mouseOverPossibility?: { diceSplit: number; dicePairs: number[] };
  // Those options were introduced to be used in the How To Play seciton.
  // It's useful to show a subset of the Mountain.
  minCol?: number;
  maxCol?: number;
  minRow?: number;
  maxRow?: number;
}

export class Mountain extends React.Component<MountainProps> {
  render() {
    const {
      mouseOverPossibility,
      diceSumOptions,
      checkpointPositions,
      currentPlayer,
      currentPositions,
      playerInfos,
      blockedSums,
    } = this.props;

    // First we need to copy the prop.
    const updatedCurrentPositions = {};
    Object.assign(updatedCurrentPositions, currentPositions);

    let { minCol, maxCol, minRow, maxRow } = this.props;
    minCol = minCol == null ? 2 : minCol;
    maxCol = maxCol == null ? 12 : maxCol;
    minRow = minRow == null ? 0 : minRow;
    maxRow = maxRow == null ? 13 : maxRow;

    // If we want to highlight, we'll compute where the new positions will be!
    let highlightSums: number[] = [];
    if (mouseOverPossibility != null && diceSumOptions != null) {
      const { diceSplit, dicePairs } = mouseOverPossibility;

      const diceSumOption = diceSumOptions[diceSplit];
      highlightSums = dicePairs
        .map((i) => diceSumOption.diceSums[i])
        .filter((x) => x != null) as number[];

      highlightSums.forEach((sum) => {
        let checkpoint = checkpointPositions[currentPlayer][sum];
        checkpoint = checkpoint == null ? 0 : checkpoint;

        if (updatedCurrentPositions.hasOwnProperty(sum)) {
          updatedCurrentPositions[sum] += 1;
        } else {
          updatedCurrentPositions[sum] = checkpoint + 1;
        }
      });
    }

    let rows: JSX.Element[] = [];
    for (let row = maxRow; row >= minRow; --row) {
      let cols: any[] = [];
      for (let col = minCol; col < maxCol + 1; ++col) {
        let content: JSX.Element | string | (JSX.Element | string)[];

        const totalNumSteps = getNumStepsForSum(col);
        const currentIsThere = currentPositions[col] === row;
        const currentWillBeHere = updatedCurrentPositions[col] === row;
        const blockedBy = blockedSums[col];

        let climbers: JSX.Element[] = [];
        const columnParity = col % 2;

        if (row === 0 || row === totalNumSteps) {
          content = (
            <ColNum colNum={col} blockedColor={playerInfos[blockedBy]?.color} />
          );
        } else if (row < totalNumSteps) {
          content = (
            <ClimberPlaceholder
              color={playerInfos[blockedBy]?.color}
              key={0}
              {...{ columnParity }}
            />
          );
        } else if ([13, 12, 11].includes(row) && col === 12) {
          // We place the left climbers in the top left of the table.
          const numClimbersLeft =
            3 - Object.keys(updatedCurrentPositions).length;
          content = <ClimberPlaceholder key={0} {...{ columnParity }} />;
          if (row >= 14 - numClimbersLeft) {
            climbers.push(
              <Climber
                key={-1}
                current={true}
                color={playerInfos[currentPlayer].color}
              />
            );
          } else if (row >= 11 + Object.keys(currentPositions).length) {
            climbers.push(
              <Climber
                key={-1}
                current={true}
                color={playerInfos[currentPlayer].color}
                downlight={true}
              />
            );
          }
        } else {
          content = "";
        }

        // It's not efficient to do this every time by... javascript :shrug:
        Object.entries(checkpointPositions).forEach(([playerID, positions]) => {
          Object.entries(positions).forEach(([diceSumStr, numSteps]) => {
            const diceSum = parseInt(diceSumStr);
            if (diceSum === col && numSteps === row) {
              climbers.push(
                <Climber color={playerInfos[playerID].color} key={playerID} />
              );
            }
          });
        });

        if (currentIsThere) {
          climbers.push(
            <Climber
              key={-1}
              current={true}
              color={playerInfos[currentPlayer].color}
              downlight={highlightSums.includes(col)}
            />
          );
        } else if (currentWillBeHere) {
          climbers.push(
            <Climber
              key={-1}
              current={true}
              color={playerInfos[currentPlayer].color}
              highlight={true}
            />
          );
        }

        if (climbers.length > 0) {
          content = (
            <div className="mountainCell">
              <div className="climberGroupBackground">{content}</div>
              <div className="climberGroup" key={1}>
                {climbers}
              </div>
            </div>
          );
        } else {
          content = <div className="mountainCell"> {content} </div>;
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
