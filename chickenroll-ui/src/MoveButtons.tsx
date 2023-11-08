import React, { useState, useEffect, useRef } from "react";

import { UserId } from "bgkit";
import { useSelector, useDispatch } from "bgkit-ui";
import {
  ShowProbsType,
  SumOption,
  pick,
  canStop,
  pickDuration,
  rollDuration,
} from "chickenroll-game";

import { State } from "./types";
import { BustProb } from "./Bust";
import { DiceSplit } from "./icons";

import classNames from "classnames";

/*
 * Given if it's us playing (itsMe) and if the button should be enabled, we return the
 * class names of the action uttons.
 */
const getButtonClassNames = (
  itsMe: boolean,
  enabled: boolean,
  color: number
): string => {
  let className = "btn btnAction";

  if (!itsMe) {
    className += " notMe";
  }

  if (itsMe && enabled) {
    className += ` bgcolor${color}`;
  } else if (!itsMe || !enabled) {
    className += " btn-secondary";
  }
  if (!itsMe && !enabled) {
    className += " notMeDisabled";
  }

  return className;
};

interface ActionButtonsProps {
  itsMe: boolean;
  color: number;
  currentPlayerHasStarted: boolean;
  onRoll: () => void;
  onStop: () => void;
  showProbs: ShowProbsType;
  bustProb: number;
  lastAction?: "roll" | "stop" | null;
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
    lastAction = null,
  } = props;

  const currentPlayerCanStop = useSelector((state: State) =>
    canStop(state.board)
  );

  const rollClassName = getButtonClassNames(itsMe, true, color);
  const stopClassName = getButtonClassNames(itsMe, currentPlayerCanStop, color);

  return (
    <div className="actionButtons">
      <button
        onClick={() => {
          onRoll();
        }}
        className={classNames(
          rollClassName,
          !currentPlayerHasStarted && itsMe && "flashVibrate",
          lastAction === "roll" && !itsMe && "lastChoiceOtherPlayer"
        )}
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
        className={classNames(
          stopClassName,
          lastAction === "stop" && !itsMe && "lastChoiceOtherPlayer"
        )}
        disabled={!itsMe || !currentPlayerCanStop}
      >
        Stop
      </button>
    </div>
  );
};

/* Dice sum possibilities we can choose from */
const Possibilities = (props: {
  // We'll highlight the last selected option
  lastPickedDiceSumOption?: number[];
  diceSumOptions?: SumOption[];
  itsMe: boolean;
  onMouseEnter: (buttonRow: number, buttonColumn: number) => void;
  onMouseLeave: () => void;
  color: number;
  imThePrevious: boolean;
  currentPlayerHasStarted: boolean;
}) => {
  const touch = useRef(false);

  const dispatch = useDispatch();

  const {
    lastPickedDiceSumOption,
    diceSumOptions,
    itsMe,
    imThePrevious,
    color,
    onMouseEnter,
    onMouseLeave,
    currentPlayerHasStarted,
  } = props;
  return (
    <div className="actionButtons">
      {diceSumOptions != null &&
        diceSumOptions.map((sumOption: SumOption, i: number) => {
          // We make sure we have an array of arrays of sum.
          // [[7, 12]] means one button with 2 sums.
          // [[7], [12]] means 2 different buttons.
          const sumsList = sumOption.split
            ? sumOption.diceSums.map((x) => [x])
            : [sumOption.diceSums];

          const buttons: JSX.Element[] = [];

          sumsList.forEach((sums, j) => {
            const enabled = sumOption.enabled[j];

            const wasSelected =
              lastPickedDiceSumOption != null &&
              lastPickedDiceSumOption[0] === i &&
              lastPickedDiceSumOption[1] === j;

            let className = "btnPossibilities ";

            className += getButtonClassNames(
              itsMe || (imThePrevious && !currentPlayerHasStarted),
              enabled,
              color
            );

            if (wasSelected) {
              className += " lastChoiceOtherPlayer";
            }

            let pairHighlight = [false, false];
            if (!sumOption.split) {
              pairHighlight = [true, true];
            } else {
              pairHighlight[j] = true;
            }

            buttons.push(
              <button
                type="button"
                key={j}
                onClick={() => {
                  itsMe &&
                    enabled &&
                    dispatch(
                      pick({
                        diceSplitIndex: i,
                        choiceIndex: j,
                      })
                    );
                }}
                // Using mouse over and mouse out because the behaviour is
                // nicer!
                onMouseOver={() =>
                  itsMe && enabled && !touch.current && onMouseEnter(i, j)
                }
                onMouseLeave={() => {
                  itsMe && enabled && !touch.current && onMouseLeave();
                }}
                onTouchStart={() => {
                  touch.current = true;
                }}
                onTouchEnd={() => {
                  touch.current = false;
                }}
                disabled={!itsMe || !enabled}
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
  );
};

interface MoveButtonsProps {
  userId: UserId | null;
  playerColor: number;
  onMouseEnter: (buttonRow: number, buttonColumn: number) => void;
  onMouseLeave: () => void;
  onRoll: () => void;
  onStop: () => void;
  showProbs: ShowProbsType;
  bustProb: number;
}

const MoveButtons = (props: MoveButtonsProps) => {
  const {
    onRoll,
    onStop,
    onMouseEnter,
    onMouseLeave,
    playerColor,
    showProbs,
    bustProb,
  } = props;

  const userId = useSelector((state: State) => state.userId);
  const currentPlayer = useSelector(
    (state: State) => state.board.currentPlayer
  );
  const stage = useSelector((state: State) => state.board.stage);
  const lastPickedDiceSumOption = useSelector(
    (state: State) => state.board.lastPickedDiceSumOption
  );
  const lastAction = useSelector((state: State) => state.board.lastAction);
  const diceSumOptions = useSelector(
    (state: State) => state.board.diceSumOptions
  );
  const currentPlayerHasStarted = useSelector(
    (state: State) => state.board.currentPlayerHasStarted
  );
  const previousPlayer = useSelector(
    (state: State) => state.board.previousPlayer
  );
  const lastOutcome = useSelector((state: State) => state.board.lastOutcome);

  const itsMe = userId === currentPlayer;
  const imThePrevious = userId === previousPlayer;

  // There are two possibilities: either we show the Roll/Stop buttons, or we show the
  // Possibilities.
  const _stageIsMoving = stage === "moving";
  const _justBusted = !currentPlayerHasStarted && lastOutcome === "bust";

  const wasRolling = _stageIsMoving;

  const [showPossibilities, setShowPossibilities] = useState(_stageIsMoving);

  useEffect(() => {
    if (itsMe) {
      setShowPossibilities(_stageIsMoving);
      return;
    }
    const delay = (wasRolling ? rollDuration : pickDuration) * 0.5;
    const t = setTimeout(() => {
      setShowPossibilities(_stageIsMoving);
    }, delay);
    return () => clearTimeout(t);
  }, [_stageIsMoving, itsMe, wasRolling]);

  if (showPossibilities || (_justBusted && !itsMe)) {
    return (
      <Possibilities
        onMouseEnter={(buttonRow, buttonColumn) =>
          onMouseEnter(buttonRow, buttonColumn)
        }
        onMouseLeave={() => onMouseLeave()}
        {...{
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
          lastAction,
        }}
      />
    );
  }
};

export default MoveButtons;
