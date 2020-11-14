import React from "react";

import { Die } from "./Die";

/* The 4 dice in a 2x2 square */
export class DiceBoard extends React.Component<{
  diceValues: number[];
  color?: number | number[];
  diceHighlight: boolean[];
  diceSplit?: number;
  onClick?: (number) => void;
}> {
  getDie(index: number) {
    const { diceValues, color, diceHighlight, diceSplit, onClick } = this.props;

    // Hack for the diagonal dice split.
    let diceSplitStr;
    if (diceSplit === 2) {
      diceSplitStr = `${diceSplit}${index}`;
    } else if (diceSplit != null) {
      diceSplitStr = diceSplit.toString();
    }

    const opts = {};
    if (onClick) {
      opts["onClick"] = () => onClick(index);
    }

    return (
      <Die
        value={diceValues[index]}
        color={Array.isArray(color) ? color[index] : color}
        key={index}
        highlight={diceHighlight[index]}
        split={diceSplitStr}
        {...opts}
      />
    );
  }
  render() {
    return (
      <div className="diceContainer">
        <div className="diceRow">
          {this.getDie(0)}
          {this.getDie(1)}
        </div>
        <div className="diceRow">
          {this.getDie(2)}
          {this.getDie(3)}
        </div>
      </div>
    );
  }
}
