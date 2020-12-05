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
  return <span {...{ className }}></span>;
};

interface ClimberPlaceholderProps {
  color?: number;
  top?: boolean;
  bottom?: boolean;
  side?: boolean;
}

export const ClimberPlaceholder = ({
  color,
  top,
  bottom,
  side,
}: ClimberPlaceholderProps) => {
  let className = "colFg colFgMiddle";
  let wrapClass = "colBg";

  if (top) {
    wrapClass += " colBgTop";
  } else if (bottom) {
    wrapClass += " colBgBottom";
  }

  if (color != null) {
    className += ` bgcolor${color}`;
    wrapClass += ` bgcolor${color}alpha40`;
  } else {
    className += " colFgNotBlocked";
    if (!side) {
      wrapClass += " colBgNotBlocked";
    }
  }

  return (
    <div className={wrapClass}>
      <div {...{ className }}></div>
    </div>
  );
};

export const ColNum = (props: {
  colNum: number;
  blockedColor?: number;
  top?: boolean;
}) => {
  // Below row 0 we write the dice sum.
  const { colNum, blockedColor, top } = props;

  let wrapClassName = "colBg";
  let className = "";
  if (top) {
    className += " colFgTop";
    wrapClassName += " colBgTop";
  } else {
    className += " colFgBottom";
    wrapClassName += " colBgBottom";
  }
  if (blockedColor != null) {
    className += ` bgcolor${blockedColor}`;
    wrapClassName += ` bgcolor${blockedColor} bgcolor${blockedColor}alpha40`;
  } else {
    className += " colFgNotBlocked";
    wrapClassName += " colBgNotBlocked";
  }

  if (colNum >= 10) {
    className += " twoDigits";
  }

  return (
    <div className={wrapClassName}>
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
    minRow = minRow == null ? 1 : minRow;
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

        if (row === 1 || row === totalNumSteps) {
          content = (
            <ColNum
              colNum={col}
              blockedColor={playerInfos[blockedBy]?.color}
              top={row !== 1}
            />
          );
        } else if (row < totalNumSteps) {
          content = (
            <ClimberPlaceholder color={playerInfos[blockedBy]?.color} key={0} />
          );
        } else if ([13, 12, 11].includes(row) && col === 12) {
          // We place the left climbers in the top left of the table.
          const numClimbersLeft =
            3 - Object.keys(updatedCurrentPositions).length;
          content = (
            <ClimberPlaceholder
              key={0}
              top={row === 13}
              bottom={row === 11}
              side={true}
            />
          );
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
          content = <div className="colBg"></div>;
        }

        content = <div className="colBgWrap">{content}</div>;

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
            <>
              {content}
              <div className="climberGroup" key={1}>
                {climbers}
              </div>
            </>
          );
        }

        cols.push(<div className="mountainCell">{content}</div>);
      }
      rows.push(
        <div className="mountainRow" key={row}>
          {cols}
        </div>
      );
    }

    return <div className="mountain">{rows}</div>;
  }
}
