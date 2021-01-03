import React from "react";
import { GameType, ShowProbsType } from "../Game";
import { SumOption, DiceSum, PlayerID } from "../types";
import { BustProb } from "./Bust";

interface ActionButtonsProps {
  moves: any;
  itsMe: boolean;
  color: number;
  currentPlayerHasStarted: boolean;
  onRoll: () => void;
  onStop: () => void;
  showProbs: ShowProbsType;
  bustProb: number;
}
/* Roll / Stop buttons */
const ActionButtons = (props: ActionButtonsProps) => {
  const {
    moves,
    onRoll,
    color,
    itsMe,
    onStop,
    currentPlayerHasStarted,
    showProbs,
    bustProb,
  } = props;

  return (
    <div className="actionButtons">
      <button
        onClick={() => {
          moves.rollDice();
          onRoll();
        }}
        className={`btn btnAction bgcolor${color}${
          currentPlayerHasStarted ? "" : " flashVibrate"
        }`}
        disabled={!itsMe}
      >
        <div>Roll</div>
        {showProbs === "before" && bustProb > 0 && (
          <span className="rollBust">
            <BustProb prob={bustProb} />
          </span>
        )}
      </button>
      <button
        onClick={() => {
          moves.stop();
          onStop();
        }}
        className={`btn btnAction bgcolor${color}`}
        disabled={!itsMe}
      >
        Stop
      </button>
    </div>
  );
};

/* Dice sum possibilities we can choose from */
class Possibilities extends React.Component<{
  moves: any;
  // We'll highlight the last selected option
  lastPickedDiceSumOption: null | number[];
  diceSumOptions?: SumOption[];
  itsMe: boolean;
  onMouseEnter: (diceSplit: number, dicePairs: number[]) => void;
  onMouseLeave: () => void;
  color: number;
}> {
  touch: boolean;
  constructor(props) {
    super(props);
    this.touch = false;
  }

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

            const buttons: JSX.Element[] = [];

            sumsList.forEach((sums, j) => {
              const filteredSums = sums.filter((x) => x != null);
              if (filteredSums.length === 0) {
                return;
              }

              const wasSelected =
                last != null && last[0] === i && last[1] === j;

              let className = "btn btnAction ";

              let buttonType: string;
              if (this.props.itsMe) {
                buttonType = `bgcolor${this.props.color}`;
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

              if (sums.length === 0) {
                return;
              }

              buttons.push(
                <button
                  type="button"
                  key={j}
                  onClick={() => {
                    this.props.moves.pickSumOption(i, j);
                    this.props.onMouseLeave();
                  }}
                  // Using mouse over and mouse out because the behaviour is
                  // nicer!
                  onMouseOver={() =>
                    !this.touch && this.props.onMouseEnter(i, diceComboIndices)
                  }
                  onMouseLeave={() => {
                    !this.touch && this.props.onMouseLeave();
                  }}
                  onTouchStart={() => {
                    this.touch = true;
                  }}
                  onTouchEnd={() => {
                    this.touch = false;
                  }}
                  disabled={!this.props.itsMe}
                  {...{ className }}
                >
                  {sums
                    .filter((x) => x != null)
                    .map(String)
                    .join(" · ")}
                </button>
              );
            });

            return buttons.length > 0 ? (
              <div className="possibilitiesRow">{buttons}</div>
            ) : null;
          })}
      </div>
    ); // render return
  } // render
} // class

interface MoveButtonsProps {
  ctx: any;
  moves: any;
  G: GameType;
  playerID: PlayerID;
  playerColor: number;
  onMouseEnter: (diceSplit: number, dicePairs: number[]) => void;
  onMouseLeave: () => void;
  onRoll: () => void;
  onStop: () => void;
  showProbs: ShowProbsType;
  bustProb: number;
}

export default class MoveButtons extends React.Component<MoveButtonsProps> {
  render() {
    const {
      moves,
      onRoll,
      onStop,
      onMouseEnter,
      onMouseLeave,
      playerID,
      ctx,
      playerColor,
      showProbs,
      bustProb,
    } = this.props;
    const currentPlayer = ctx.currentPlayer;
    const stage = ctx.activePlayers[currentPlayer];
    const itsMe = playerID === currentPlayer;
    const {
      lastPickedDiceSumOption,
      diceSumOptions,
      currentPlayerHasStarted,
    } = this.props.G;
    if (itsMe && stage === "rolling") {
      return (
        <ActionButtons
          {...{
            moves,
            itsMe,
            color: playerColor,
            currentPlayerHasStarted,
            onRoll,
            onStop,
            showProbs,
            bustProb,
          }}
        />
      );
    } else {
      return (
        <Possibilities
          onMouseEnter={(diceSplit, dicePairs) =>
            onMouseEnter(diceSplit, dicePairs)
          }
          onMouseLeave={() => onMouseLeave()}
          {...{
            moves,
            itsMe,
            color: playerColor,
            lastPickedDiceSumOption,
            diceSumOptions,
          }}
        />
      );
    }
  }
}
