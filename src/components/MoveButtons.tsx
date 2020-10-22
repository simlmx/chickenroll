import React from "react";
import { GameType } from "../Game";

/* Roll / Stop buttons */
class ActionButtons extends React.Component<{ moves: any; itsMe: boolean }> {
  render() {
    return (
      <div>
        <div>
          <button
            onClick={() => this.props.moves.rollDice()}
            className="btn btn-success"
            disabled={!this.props.itsMe}
          >
            Roll
          </button>
        </div>
        <div>
          <button
            onClick={() => this.props.moves.stop()}
            className="btn btn-success"
            disabled={!this.props.itsMe}
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
  lastPickedDiceSumOption: null | number[];
  diceSumOptions: null | number[][][];
  itsMe: boolean;
}> {
  render() {
    const last = this.props.lastPickedDiceSumOption;
    return (
      <div>
        {this.props.diceSumOptions != null &&
          this.props.diceSumOptions.map((sumsList, i) => {
            return (
              <div key={i}>
                {sumsList.map((sums, j) => {
                  const isSelected =
                    last != null && last[0] === i && last[1] === j;

                  let className = "btn ";

                  let buttonType: string;
                  if (this.props.itsMe) {
                    buttonType = "success";
                  } else if (isSelected) {
                    buttonType = "dark";
                  } else {
                    buttonType = "secondary";
                  }

                  className += "btn-" + buttonType;
                  className += " sum";

                  return (
                    sums.length > 0 && (
                      <button
                        type="button"
                        key={j}
                        onClick={() => this.props.moves.pickSumOption(i, j)}
                        disabled={!this.props.itsMe}
                        {...{ className }}
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
  playerID: string;
}

export default class MoveButtons extends React.Component<MoveButtonsProps> {
  render() {
    const currentPlayer = this.props.ctx.currentPlayer;
    const stage = this.props.ctx.activePlayers[currentPlayer];
    const itsMe = this.props.playerID === this.props.ctx.currentPlayer;
    if (itsMe && stage === "rolling") {
      return <ActionButtons moves={this.props.moves} itsMe={itsMe} />;
    } else {
      return (
        <Possibilities
          moves={this.props.moves}
          lastPickedDiceSumOption={this.props.G.lastPickedDiceSumOption}
          diceSumOptions={this.props.G.diceSumOptions}
          itsMe={itsMe}
        />
      );
    }
  }
}
