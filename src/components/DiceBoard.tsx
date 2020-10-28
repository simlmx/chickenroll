import React from "react";

import { Die } from "./Die";

/* The 4 dice in a 2x2 square */
export class DiceBoard extends React.Component<{
  diceValues: number[];
  currentPlayer: string;
  diceHighlightPairs: { [key: number]: number };
  diceSplit?: number;
}> {
  getDie(index: number) {
    const {
      diceValues,
      currentPlayer,
      diceHighlightPairs,
      diceSplit,
    } = this.props;
    const thereIsSomeHighlight = Object.keys(diceHighlightPairs).length > 0;

    const highlightPair = diceHighlightPairs[index];

    // Hack for the diagonal dice split.
    let diceSplitStr;
    if (diceSplit === 2) {
      diceSplitStr = `${diceSplit}${index}`;
    } else if (diceSplit != null) {
      diceSplitStr = diceSplit.toString();
    }
    return (
      <Die
        value={diceValues[index]}
        currentPlayer={currentPlayer}
        key={index}
        highlight={diceHighlightPairs[index]}
        noHighlight={highlightPair == null && thereIsSomeHighlight}
        split={diceSplitStr}
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
