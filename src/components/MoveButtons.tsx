import React from "react";
import { GameType } from "../Game";
import { SumOption, DiceSum, PlayerID } from "../types";

/* Roll / Stop buttons */
class ActionButtons extends React.Component<{
  moves: any;
  itsMe: boolean;
  currentPlayer: string;
}> {
  render() {
    return (
      <div className="actionButtons">
        <button
          onClick={() => this.props.moves.rollDice()}
          className={`btn bgcolor${this.props.currentPlayer}`}
          disabled={!this.props.itsMe}
        >
          Roll
        </button>
        <button
          onClick={() => this.props.moves.stop()}
          className={`btn bgcolor${this.props.currentPlayer}`}
          disabled={!this.props.itsMe}
        >
          Stop
        </button>
      </div>
    );
  }
}

/* Dice sum possibilities we can choose from */
class Possibilities extends React.Component<{
  moves: any;
  // We'll highlight the last selected option
  lastPickedDiceSumOption: null | number[];
  diceSumOptions?: SumOption[];
  itsMe: boolean;
  onMouseOver: (diceSplit: number, dicePairs: number[]) => void;
  onMouseOut: () => void;
  currentPlayer: string;
}> {
  render() {
    const last = this.props.lastPickedDiceSumOption;
    return (
      <div className="possibilitiesWrap">
        {this.props.diceSumOptions != null &&
          this.props.diceSumOptions.map((sumOption: SumOption, i: number) => {
            // We make sure we have an array of arrays of sum.
            // [[7, 12]] means one button with 2 sums.
            // [[7, null]] means one button with 7.
            // [[7], [12]] means 2 different buttons.
            //
            const sumsList = sumOption?.split
              ? sumOption.diceSums.map((x: DiceSum | null) => [x])
              : [sumOption.diceSums];
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
                    buttonType = `bgcolor${this.props.currentPlayer}`;
                  } else if (wasSelected) {
                    buttonType = "btn-secondary lastChoiceOtherPlayer";
                  } else {
                    buttonType = "btn-secondary";
                  }

                  className += buttonType;
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
                          .join(" · ")}
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
  playerID: PlayerID;
  onMouseOver: (diceSplit: number, dicePairs: number[]) => void;
  onMouseOut: () => void;
}

export default class MoveButtons extends React.Component<MoveButtonsProps> {
  render() {
    const currentPlayer = this.props.ctx.currentPlayer;
    const { moves } = this.props;
    const stage = this.props.ctx.activePlayers[currentPlayer];
    const itsMe = this.props.playerID === this.props.ctx.currentPlayer;
    const { lastPickedDiceSumOption, diceSumOptions } = this.props.G;
    if (itsMe && stage === "rolling") {
      return <ActionButtons {...{ moves, itsMe, currentPlayer }} />;
    } else {
      return (
        <Possibilities
          onMouseOver={(diceSplit, dicePairs) =>
            this.props.onMouseOver(diceSplit, dicePairs)
          }
          onMouseOut={() => this.props.onMouseOut()}
          {...{
            moves,
            itsMe,
            currentPlayer,
            lastPickedDiceSumOption,
            diceSumOptions,
          }}
        />
      );
    }
  }
}
