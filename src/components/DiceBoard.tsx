import React from "react";

import { Dice } from "./Dice";

interface DiceBoardProps {
  G: any;
  moves: any;
  ctx: any;
}

export class DiceBoard extends React.Component<DiceBoardProps> {
  render() {
    const currentPlayer = this.props.ctx.currentPlayer;
    const stage = this.props.ctx.activePlayers[currentPlayer];

    /* The 4 dice in a 2x2 square */
    const dice = (
      <div className="diceContainer" key={0}>
        <div className="diceRow">
          {this.props.G.diceValues.slice(0, 2).map((value, i) => {
            return <Dice value={value} key={i} />;
          })}
        </div>
        <div className="diceRow">
          {this.props.G.diceValues.slice(-2).map((value, i) => {
            return <Dice value={value} key={i} />;
          })}
        </div>
      </div>
    );

    const buttons = (
      <div key={1}>
        <div>
          <button
            onClick={this.props.moves.rollDice}
            className="btn btn-success"
          >
            Roll
          </button>
          <button onClick={this.props.moves.stop} className="btn btn-success">
            Stop
          </button>
        </div>
      </div>
    );

    const possibilities = this.props.G.diceSumOptions.map((sumsList, i) => {
      return sumsList.map((sums, j) => {
        return (
          sums.length > 0 && (
            <button
              type="button"
              className="btn btn-success sums"
              key={`${i},${j}`}
              onClick={() => this.props.moves.pickSumOption(i, j)}
            >
              {sums.map(String).join(" ")}
            </button>
          )
        );
      });
    });

    return (
      <div id="diceBoard">
        {[dice, stage === "rolling" ? buttons : possibilities]}
      </div>
    );
  }
}
