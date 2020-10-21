import React from "react";

import { Die } from "./Dice";
import { GameType } from "../Game";

/* Roll / Stop buttons */
class ActionButtons extends React.Component<{ moves: any }> {
  render() {
    return (
      <div>
        <div>
          <button
            onClick={this.props.moves.rollDice}
            className="btn btn-success"
          >
            Roll
          </button>
        </div>
        <div>
          <button onClick={this.props.moves.stop} className="btn btn-success">
            Stop
          </button>
        </div>
      </div>
    );
  }
}

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

/* Dice sum possibilities we can choose from */
class Possibilities extends React.Component<{
  moves: any;
  diceSumOptions: number[][][];
}> {
  render() {
    return (
      <div>
        {this.props.diceSumOptions.map((sumsList, i) => {
          return (
            <div key={i}>
              {sumsList.map((sums, j) => {
                return (
                  sums.length > 0 && (
                    <button
                      type="button"
                      className="btn btn-success sums"
                      key={j}
                      onClick={() => this.props.moves.pickSumOption(i, j)}
                    >
                      {sums.map(String).join(" ")}
                    </button>
                  )
                );
              })}
            </div>
          );
        })}
      </div>
    );
  }
}

interface DiceBoardProps {
  G: GameType;
  moves: any;
  ctx: any;
  playerID: string;
}

export class DiceBoard extends React.Component<DiceBoardProps> {
  render() {
    const itsMe = this.props.playerID === this.props.ctx.currentPlayer;
    const currentPlayer = this.props.ctx.currentPlayer;
    const stage = this.props.ctx.activePlayers[currentPlayer];

    let content: JSX.Element | null = null;
    if (itsMe) {
      if (stage === "rolling") {
        content = <ActionButtons moves={this.props.moves} />;
      } else {
        content = (
          <Possibilities
            moves={this.props.moves}
            diceSumOptions={this.props.G.diceSumOptions}
          />
        );
      }
    }

    return (
      <div className="diceBoard">
        <Dice diceValues={this.props.G.diceValues} />
        {content}
      </div>
    );
  }
}
