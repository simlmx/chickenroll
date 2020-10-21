import React from "react";

import { Die } from "./Dice";

/* The 4 dice in a 2x2 square */
class Dice extends React.Component<{ diceValues: number[] }> {
  render() {
    return (
      <div className="diceContainer">
        <div className="diceRow">
          {this.props.diceValues.slice(0, 2).map((value, i) => {
            return <Die value={value} key={i} />;
          })}
        </div>
        <div className="diceRow">
          {this.props.diceValues.slice(-2).map((value, i) => {
            return <Die value={value} key={i} />;
          })}
        </div>
      </div>
    );
  }
}

export class DiceBoard extends React.Component<{ diceValues: number[] }> {
  render() {
    return <Dice diceValues={this.props.diceValues} />;
  }
}
