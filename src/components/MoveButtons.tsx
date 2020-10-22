import React from "react";
import { GameType } from "../Game";

/* Roll / Stop buttons */
class ActionButtons extends React.Component<{ moves: any }> {
  render() {
    return (
      <div>
        <div>
          <button
            onClick={() => this.props.moves.rollDice()}
            className="btn btn-success"
          >
            Roll
          </button>
        </div>
        <div>
          <button
            onClick={() => this.props.moves.stop()}
            className="btn btn-success"
          >
            Stop
          </button>
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

interface MoveButtonsProps {
  ctx: any;
  moves: any;
  G: GameType;
}

export default class MoveButtons extends React.Component<MoveButtonsProps> {
  render() {
    const currentPlayer = this.props.ctx.currentPlayer;
    const stage = this.props.ctx.activePlayers[currentPlayer];
    if (stage === "rolling") {
      return <ActionButtons moves={this.props.moves} />;
    } else {
      return (
        <Possibilities
          moves={this.props.moves}
          diceSumOptions={this.props.G.diceSumOptions}
        />
      );
    }
  }
}
