import React from "react";
import { GameType } from "../Game";
import { SumOption, DiceSum } from "../types";

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
  // We'll highlighted the last selected option
  lastPickedDiceSumOption: null | number[];
  diceSumOptions?: SumOption[];
  itsMe: boolean;
  onMouseOver: (diceSplit: number, dicePairs: number[]) => void;
  onMouseOut: () => void;
}> {
  render() {
    const last = this.props.lastPickedDiceSumOption;
    return (
      <div className="possibilitiesWrap">
        {this.props.diceSumOptions != null &&
          this.props.diceSumOptions.map((sumOption: SumOption, i) => {
            // We make sure we have an array of arrays of sum.
            // [[7, 12]] means one button with 2 sums.
            // [[7, null]] means one button with 7.
            // [[7], [12]] means 2 different buttons.
            //
            const sumsList = sumOption?.split
              ? sumOption.sums.map((x: DiceSum | null) => [x])
              : [sumOption.sums];
            return (
              <div key={i}>
                {sumsList.map((sums, j) => {
                  const filteredSums = sums.filter((x) => x != null);
                  if (filteredSums.length === 0) {
                    return null;
                  }

                  const wasSelected =
                    last != null && last[0] === i && last[1] === j;

                  let className = "btn ";

                  let buttonType: string;
                  if (this.props.itsMe) {
                    buttonType = "success";
                  } else if (wasSelected) {
                    buttonType = "dark";
                  } else {
                    buttonType = "secondary";
                  }

                  className += "btn-" + buttonType;
                  className += " sum";

                  // If we are not in a split case, we'll highlight the non null
                  // options.
                  // If we are in a split case, then we'll highlight only the j-th dice
                  // split.
                  const diceComboIndices = (!sumOption?.split
                    ? sums
                        .map((sum, i) => (sum == null ? null : i))
                        .filter((x) => x != null)
                    : [j]) as number[];

                  return (
                    sums.length > 0 && (
                      <button
                        type="button"
                        key={j}
                        onClick={() => {
                          this.props.moves.pickSumOption(i, j);
                          this.props.onMouseOut();
                        }}
                        onMouseOver={() =>
                          this.props.onMouseOver(i, diceComboIndices)
                        }
                        onMouseOut={() => this.props.onMouseOut()}
                        disabled={!this.props.itsMe}
                        {...{ className }}
                      >
                        {sums
                          .filter((x) => x != null)
                          .map(String)
                          .join(" ")}
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
  onMouseOver: (diceSplit: number, dicePairs: number[]) => void;
  onMouseOut: () => void;
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
          onMouseOver={(diceSplit, dicePairs) =>
            this.props.onMouseOver(diceSplit, dicePairs)
          }
          onMouseOut={() => this.props.onMouseOut()}
        />
      );
    }
  }
}
