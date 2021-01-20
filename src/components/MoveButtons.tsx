import React, { useState, useEffect } from "react";
import { GameType, ShowProbsType } from "../Game";
import { PlayerID } from "../types";
import { SumOption, isSumOptionSplit } from "../math";
import { BustProb } from "./Bust";
import { DiceSplit } from "./icons";
import getSoundPlayer from "../audio";

interface ActionButtonsProps {
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
    onRoll,
    color,
    itsMe,
    onStop,
    currentPlayerHasStarted,
    showProbs,
    bustProb,
  } = props;

  const soundPlayer = getSoundPlayer();

  let className = "btn btnAction";

  if (itsMe) {
    className += ` bgcolor${color}`;
  } else {
    className += " btn-secondary";
  }

  let rollClassName = className;

  if (!currentPlayerHasStarted && itsMe) {
    rollClassName += " flashVibrate";
  }

  return (
    <div className="actionButtons">
      <button
        onClick={() => {
          onRoll();
          soundPlayer.init();
        }}
        className={rollClassName}
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
          onStop();
        }}
        className={className}
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
  lastPickedDiceSumOption?: number[];
  diceSumOptions?: SumOption[];
  itsMe: boolean;
  onMouseEnter: (buttonRow: number, buttonColumn: number) => void;
  onMouseLeave: () => void;
  color: number;
  imThePrevious: boolean;
  currentPlayerHasStarted: boolean;
}> {
  touch: boolean;
  constructor(props) {
    super(props);
    this.touch = false;
  }

  render() {
    const {
      lastPickedDiceSumOption,
      diceSumOptions,
      itsMe,
      imThePrevious,
      color,
      moves,
      onMouseEnter,
      onMouseLeave,
      currentPlayerHasStarted,
    } = this.props;
    return (
      <div className="actionButtons">
        {diceSumOptions != null &&
          diceSumOptions.map((sumOption: SumOption, i: number) => {
            // If both sums have the same "enabled" value and if they are not split,
            // then we'll have 2 buttons.
            const justOneButton =
              sumOption.enabled[0] === sumOption.enabled[1] &&
              !isSumOptionSplit(sumOption);

            // We make sure we have an array of arrays of sum.
            // [[7, 12]] means one button with 2 sums.
            // [[7], [12]] means 2 different buttons.
            const sumsList = justOneButton
              ? [sumOption.diceSums]
              : sumOption.diceSums.map((x) => [x]);

            const buttons: JSX.Element[] = [];

            sumsList.forEach((sums, j) => {
              const enabled = sumOption.enabled[j];

              const wasSelected =
                lastPickedDiceSumOption != null &&
                lastPickedDiceSumOption[0] === i &&
                lastPickedDiceSumOption[1] === j;

              let className = "btn btnAction btnPossibilities";

              let buttonType: string;
              // If we were the previous and the current player has not started, then
              // those are our possibilities that we are seeing, so that's the same as
              // if we were the current player.
              if (itsMe || (imThePrevious && !currentPlayerHasStarted)) {
                if (enabled) {
                  buttonType = ` bgcolor${color}`;
                } else {
                  buttonType = " btn-secondary";
                }
              } else {
                buttonType = " btn-secondary notMe";
                if (wasSelected) {
                  buttonType += " lastChoiceOtherPlayer";
                } else if (!enabled) {
                  buttonType += " notMeDisabled";
                }
              }

              className += buttonType;

              let pairHighlight = [false, false];
              if (justOneButton) {
                pairHighlight = [true, true];
              } else {
                pairHighlight[j] = true;
              }

              buttons.push(
                <button
                  type="button"
                  key={j}
                  onClick={() => {
                    itsMe && enabled && moves.pickSumOption(i, j);
                  }}
                  // Using mouse over and mouse out because the behaviour is
                  // nicer!
                  onMouseOver={() =>
                    itsMe && enabled && !this.touch && onMouseEnter(i, j)
                  }
                  onMouseLeave={() => {
                    itsMe && enabled && !this.touch && onMouseLeave();
                  }}
                  onTouchStart={() => {
                    this.touch = true;
                  }}
                  onTouchEnd={() => {
                    this.touch = false;
                  }}
                  disabled={!this.props.itsMe || !enabled}
                  {...{ className }}
                >
                  <DiceSplit split={i} pairHighlight={pairHighlight} />
                  {sums.length === 1 ? (
                    <div className="possNumber">{sums[0]}</div>
                  ) : (
                    <>
                      <div className="possNumber">{sums[0]}</div>
                      <div className="possNumberSeparator"></div>
                      <div className="possNumber">{sums[1]}</div>
                    </>
                  )}
                </button>
              );
            });

            return buttons.length > 0 ? (
              <div className="possibilitiesRow" key={i}>
                {buttons}
              </div>
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
  playerID: PlayerID | null;
  playerColor: number;
  onMouseEnter: (buttonRow: number, buttonColumn: number) => void;
  onMouseLeave: () => void;
  onRoll: () => void;
  onStop: () => void;
  showProbs: ShowProbsType;
  bustProb: number;
}

// export default class MoveButtons extends React.Component<MoveButtonsProps> {
const MoveButtons = (props: MoveButtonsProps) => {
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
  } = props;
  const currentPlayer = ctx.currentPlayer;
  const stage = ctx.activePlayers[currentPlayer];
  const itsMe = playerID === currentPlayer;
  const {
    lastPickedDiceSumOption,
    diceSumOptions,
    currentPlayerHasStarted,
    previousPlayer,
    lastOutcome,
  } = props.G;

  const imThePrevious = playerID === previousPlayer;

  // There are two possibilities: either we show the Roll/Stop buttons, or we show the
  // Possibilities.
  const [showPossibilities, setShowPossibilities] = useState(
    stage === "moving"
  );

  // Decide if we show the Roll/Stop buttons or the Possibility buttons. We do it in a
  // `useEffect` because of the timeouts.
  useEffect(() => {
    // If I'm playing, I want to see the real thing!
    if (itsMe) {
      setShowPossibilities(stage === "moving");
      return;
    }

    // If I'm not playing I'll always see the possibilities when showProbs != before.
    // There is no need to see the Roll/Stop buttons. We still show it while the current
    // player has not started, otherwise there would be nothing to show.
    if (showProbs !== "before") {
      setShowPossibilities(currentPlayerHasStarted);
      return;
    }

    // If I was the previous player and I busted, I'll see all the impossible choices
    // that made me bust. We show it for a couple seconds or until the current player starts.
    if (!currentPlayerHasStarted && lastOutcome === "bust") {
      setShowPossibilities(true);
      const timeout = setTimeout(() => {
        setShowPossibilities(false);
      }, 3000);
      return () => {
        setShowPossibilities(false);
        clearTimeout(timeout);
      };
    }

    // If in showProbs=before it's a bit tricky: we want to show the choice but also the
    // rolling button (because it contains a probability).
    // The solution is to keep showing the possibilities a few milliseconds
    // after the player has chosen them. Then we'll show the rolling buttons.
    if (stage === "rolling" && currentPlayerHasStarted) {
      setShowPossibilities(true);

      const timeout = setTimeout(() => {
        setShowPossibilities(false);
      }, 300);
      return () => {
        setShowPossibilities(false);
        clearTimeout(timeout);
      };
    }
    setShowPossibilities(stage === "moving");
  }, [stage, itsMe, showProbs, currentPlayerHasStarted, lastOutcome]);

  if (showPossibilities) {
    return (
      <Possibilities
        onMouseEnter={(buttonRow, buttonColumn) =>
          onMouseEnter(buttonRow, buttonColumn)
        }
        onMouseLeave={() => onMouseLeave()}
        {...{
          moves,
          itsMe,
          color: playerColor,
          lastPickedDiceSumOption,
          diceSumOptions,
          previousPlayer,
          imThePrevious,
          currentPlayerHasStarted,
        }}
      />
    );
  } else {
    return (
      <ActionButtons
        {...{
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
  }
};

export default MoveButtons;
