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
      <div key={1}>
        <div>
          {this.props.G.diceValues.slice(0, 2).map((value, i) => {
            return <Dice value={value} key={i} />;
          })}
        </div>
        <div>
          {this.props.G.diceValues.slice(-2).map((value, i) => {
            return <Dice value={value} key={i} />;
          })}
        </div>
        <div>
          {
            /* TODO won't work for multiplayer */
            stage === "rolling" && (
              <button
                onClick={this.props.moves.rollDice}
                className="btn btn-success"
              >
                Roll
              </button>
            )
          }
        </div>
      </div>
    );

    const possibilities = this.props.G.diceSumOptions.map((sumsList, i) => {
      return sumsList.map((sums, j) => {
        return (
          <button
            type="button"
            className="btn btn-success sums"
            key={i}
            onClick={() => this.props.moves.pickSumOption(i, j)}
          >
            {sums.map(String).join(" ")}
          </button>
        );
      });
    });

    return <div id="diceBoard">{[dice, possibilities]}</div>;
  }
}
