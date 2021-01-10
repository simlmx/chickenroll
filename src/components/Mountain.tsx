import React, { useMemo, useEffect } from "react";
import { getNumStepsForSum } from "../math";
import { PlayerID, SumOption, PlayerInfo } from "../types";
import { cloneDeep } from "lodash";

const NUM_ROWS = 13;
const NUM_COLS = 11;

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
  checkpointPositions: { [key: string]: { [key: number]: number } };
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

class Profiler {
  _start: any;
  _data: any;

  constructor() {
    this.reset();
  }

  start(name: string): void {
    this._start[name] = new Date().getTime();
  }

  stop(name: string): void {
    const delta = new Date().getTime() - this._start[name];

    if (this._data[name] == null) {
      this._data[name] = 0;
    }
    this._data[name] += delta;
  }

  stopStart(stop_name: string, start_name: string): void {
    this.stop(stop_name);
    this.start(start_name);
  }

  getData() {
    return this._data;
  }

  reset() {
    this._start = {};
    this._data = {};
  }
}

interface MountainCell {
  element?: JSX.Element;
  climbers: JSX.Element[];
  current?: JSX.Element;
}

const useLog = (name, something) => {
  useEffect(() => {
    console.log("changed " + name);
    console.log(something);
  }, [something, name]);
};

// export class Mountain extends React.Component<MountainProps> {
// render() {
export const Mountain = (props: MountainProps) => {
  const {
    mouseOverPossibility,
    diceSumOptions,
    checkpointPositions,
    currentPlayer,
    currentPositions,
    playerInfos,
    blockedSums,
  } = props;

  console.log('begin render mountain')

  useLog("mouseOverPos", mouseOverPossibility);
  useLog("diceSumOption", diceSumOptions);
  useLog("checkpointPositions", checkpointPositions);
  useLog("currentPlayer", currentPlayer);
  useLog("currentPositions", currentPositions);
  useLog("playerInfos", playerInfos);
  useLog("blockedSums", blockedSums);

  const profiler = new Profiler();

  profiler.start("begin");

  // First we need to copy the prop.
  const updatedCurrentPositions: typeof currentPositions = {};
  Object.assign(updatedCurrentPositions, currentPositions);

  let { minCol, maxCol, minRow, maxRow } = props;
  if (minCol == null) {
    minCol = 2;
  }
  minCol = minCol == null ? 2 : minCol;
  maxCol = maxCol == null ? 12 : maxCol;
  minRow = minRow == null ? 1 : minRow;
  maxRow = maxRow == null ? 13 : maxRow;

  profiler.stopStart("begin", "matrix");

  // Build a matrix of components for the parts of the mountain that don't change in a
  // given turn. This is everything but the checkpoints. We memoize that part for faster
  // re-render.

  let elMatrix: MountainCell[][] = useMemo(() => {
    console.log("recomputing memo");
    const elMatrix: MountainCell[][] = Array(NUM_ROWS)
      .fill(undefined)
      .map(() =>
        Array(NUM_COLS)
          .fill(undefined)
          .map(() => {
            return { climbers: [] };
          })
      );

    for (let j = 0; j < NUM_COLS; ++j) {
      const col = j + 2;

      const blockedBy = blockedSums[col];

      // Bottom of column.
      elMatrix[0][j].element = (
        <ColNum
          colNum={col}
          top={false}
          blockedColor={playerInfos[blockedBy]?.color}
        />
      );

      const topIndex = getNumStepsForSum(col) - 1;

      // Top of column.
      elMatrix[topIndex][j].element = (
        <ColNum
          colNum={col}
          top={true}
          blockedColor={playerInfos[blockedBy]?.color}
        />
      );

      // Everything between the bottom and the top of the column.
      for (let i = 1; i < topIndex; ++i) {
        elMatrix[i][j].element = (
          <ClimberPlaceholder color={playerInfos[blockedBy]?.color} />
        );
      }
    }

    // Add the checkpoint climbers.
    Object.entries(checkpointPositions).forEach(([playerID, positions]) => {
      Object.entries(positions).forEach(([diceSumStr, numSteps]) => {
        const diceSum = parseInt(diceSumStr);
        elMatrix[numSteps - 1][diceSum - 2].climbers.push(
          <Climber color={playerInfos[playerID].color} key={playerID} />
        );
      });
    });

    return elMatrix;
  }, [checkpointPositions, playerInfos, blockedSums]);

  // Add the current placeholders, i.e. what changes often.
  //
  


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

  const currentElements: JSX.Element[][] = Array(NUM_ROWS)
    .fill(undefined)
    .map(() => Array(NUM_COLS).fill(undefined));

  // Left tokens in the top right.
  const numLeft = 3 - Object.keys(currentPositions).length;
  const numLeftAfterUpdate = 3 - Object.keys(updatedCurrentPositions).length;
  for (let i = 0; i < 3; ++i) {
    const col = NUM_COLS - 1;
    const row = NUM_ROWS - 1 - i;

    let el: JSX.Element;
    if (numLeftAfterUpdate > i) {
      el = (
        <Climber
          key={-1}
          current={true}
          color={playerInfos[currentPlayer].color}
        />
      );
    } else if (numLeft > i) {
      el = (
        <Climber
          key={-1}
          current={true}
          color={playerInfos[currentPlayer].color}
          downlight={true}
        />
      );
    } else {
      el = <ClimberPlaceholder key={0} side={true} />;
    }

    currentElements[row][col] = el;
  }

  // Highlighted current climbers.
  Object.entries(updatedCurrentPositions).forEach(([colStr, step]) => {
    const col = parseInt(colStr);

    currentElements[step - 1][col - 2] = (
      <Climber
        key={-1}
        current={true}
        color={playerInfos[currentPlayer].color}
        highlight={true}
      />
    );
  });

  // Downlighted current climbers.
  Object.entries(currentPositions).forEach(([colStr, step]) => {
    if (updatedCurrentPositions[colStr] === step) {
      return;
    }
    const col = parseInt(colStr);
    currentElements[step - 1][col - 2] = (
      <Climber
        key={-1}
        current={true}
        color={playerInfos[currentPlayer].color}
        downlight={true}
      />
    );
  });

  profiler.stopStart("matrix", "final");

  // Draw the whole thing.
  const content = elMatrix.reverse().map((row, i) => {
    return (
      <div className="mountainRow" key={i}>
        {row.map((col, j) => {
          let climbers = col.climbers;
          if (currentElements[NUM_ROWS - i - 1][j] != null) {
            climbers = [...climbers, currentElements[NUM_ROWS - i - 1][j]];
          }
          return (
            <div className="mountainCell" key={j}>
              <div className="colBgWrap" key={j}>
                {col.element}
                <div className="climberGroup" key={1}>
                  {climbers}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    );
  });

  profiler.stop("final");

  // return <div className="mountain">{content}</div>;
  //
  //
  /*
  profiler.start("v2");

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
      } else if ([13, 12, 11].includes(row) && col === 11) {
        // We place the left climbers in the top left of the table.
        const numClimbersLeft = 3 - Object.keys(updatedCurrentPositions).length;
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

      // profiler.stopStart("matrix", "slow");

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

      // profiler.stopStart("slow", "matrix");

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

      cols.push(
        <div className="mountainCell" key={col}>
          {content}
        </div>
      );
    }
    rows.push(
      <div className="mountainRow" key={row}>
        {cols}
      </div>
    );
  }

  profiler.stop("v2");
  */

  console.log(profiler.getData());
  return <div className="mountain">{content}</div>;
};
