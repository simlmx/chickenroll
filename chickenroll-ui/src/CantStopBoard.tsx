import React, { useState, useEffect, useMemo } from "react";

import { UserId } from "bgkit";
import { useSelector, useDispatch, playSound, useUsername } from "bgkit-ui";

import {
  ChickenrollBoard,
  isSumOptionSplit,
  PlayerInfo,
  roll,
  stop,
} from "chickenroll-game";

import "./index.scss";

import { State } from "./types";
import { DiceBoard } from "./DiceBoard";
import { Mountain, EggsLeft, Climber } from "./Mountain";
import { ScoreBoard } from "./ScoreBoard";
import MoveButtons from "./MoveButtons";
import MoveHistory from "./MoveHistory";

import InGameIcons from "./InGameIcons";
import Rules from "./Rules";
import { BustProb } from "./Bust";

interface InfoProps {
  info?: { code: string; userId?: UserId };
  endOfTurnBustProb?: number;
  onClick: () => void;
  playerInfos: { [key: string]: PlayerInfo };
  // userId of the client instance.
  userId: UserId;
  // When it's your turn, we add it to the Info.
  itsYourTurn: boolean;
}

export const Info = ({
  userId,
  info,
  playerInfos,
  itsYourTurn,
  endOfTurnBustProb,
  onClick,
}: InfoProps) => {
  const username = useUsername(info.userId);

  if (info == null) {
    return undefined;
  }

  const { code } = info;

  const itsMe = userId === info.userId;

  const playerName = itsMe ? "You" : info.userId && username;

  const probMsg = endOfTurnBustProb != null && (
    <div className="probMsgWrap">
      <BustProb
        prob={endOfTurnBustProb}
        prob2text={(prob) =>
          `The probability of cracking was ${(prob * 100).toFixed(1)}%`
        }
      />
    </div>
  );

  const itsYourTurnTag = itsYourTurn ? (
    <div className={`itsYourTurn color${playerInfos[userId].color}`}>
      It's your turn!
    </div>
  ) : undefined;

  let playerNameTag: JSX.Element | undefined;

  if (["bust", "stop", "win"].includes(code)) {
    playerNameTag = (
      <strong
        className={`infoPlayerName color${
          playerInfos[info.userId as UserId].color
        }`}
      >
        {playerName}
      </strong>
    );
  }

  let content;
  switch (code) {
    case "bust":
      content = (
        <div>
          {itsYourTurnTag}
          <div>
            {playerNameTag} <span className="badge badge-danger">cracked</span>
          </div>
          {probMsg}
        </div>
      );
      break;
    case "stop":
      content = (
        <div>
          {itsYourTurnTag}
          <div>
            {playerNameTag} <span className="badge badge-success">stopped</span>
          </div>
          {probMsg}
        </div>
      );
      break;
    case "win":
      content = (
        <span>
          {playerNameTag} won!{" "}
          <span role="img" aria-label="party">
            🎉
          </span>
        </span>
      );
      break;
    case "start":
      content = itsYourTurnTag;
      break;
    default:
      content = undefined;
  }

  if (content == null) {
    return null;
  }

  return (
    <div className="infoWrap" onClick={() => onClick()}>
      <div className="infoBackground">
        <div className="text-center info">{content}</div>
      </div>
    </div>
  );
};

export const Board = () => {
  const [mouseOverPossibility, setMouseOverPossibility] = useState<
    { buttonRow: number; buttonColumn: number } | undefined
  >(undefined);

  const dispatch = useDispatch();

  //FIXME useSelector instead of this
  const board = useSelector((state: State) => state.board);
  const userId = useSelector((state: State) => state.userId);

  const {
    checkpointPositions,
    currentPositions,
    blockedSums,
    diceSumOptions,
    playerInfos,
    diceValues,
    scores,
    bustProb,
    endOfTurnBustProb,
    numColsToWin,
    moveHistory,
    showProbs,
    mountainShape,
    sameSpace,
    currentPlayer,
    numPlayers,
    playerOrder,
    stage,
  } = board;

  const [showInfo, setShowInfo] = useState(true);
  const [modal, setModal] = useState<undefined | "history" | "rules">(
    undefined
  );
  const itsYourTurn = currentPlayer === userId;

  const infoCode = board.info?.code;
  const infoTs = board.info?.ts;

  // Deal with the info popup. If it changes, we cleanup the last timer and start a new
  // one.
  useEffect(() => {
    if (infoCode == null) {
      return;
    }
    // Show the info now, but in 3-10seconds, stop it.
    setShowInfo(true);
    const timeoutDuration = infoCode === "win" || itsYourTurn ? 100000 : 3000;
    const infoTimeout = setTimeout(() => setShowInfo(false), timeoutDuration);

    // Return a function that cleans up the timeout.
    return () => {
      setShowInfo(false);
      clearTimeout(infoTimeout);
    };
  }, [infoCode, infoTs, itsYourTurn]);

  // Make the web page's title flash when it's your turn!
  useEffect(() => {
    if (!itsYourTurn) {
      return;
    }
    const title = document.title;
    let interval;
    if (itsYourTurn) {
      const titles = ["It's your turn!", title];
      // Call it right way to display "It's your turn!" as fast as possible. Then re-run
      // every 1.5 seconds.
      document.title = titles[0];
      let i = 1;
      interval = setInterval(() => {
        document.title = titles[i];
        i = 1 - i;
      }, 1500);
    }

    return () => {
      clearInterval(interval);
      document.title = title;
    };
  }, [itsYourTurn]);

  // Make a sound when it's your turn.
  useEffect(() => {
    if (itsYourTurn) {
      playSound("yourturn");
    }
  }, [itsYourTurn]);

  // Add listener to close modals on "escape".
  useEffect(() => {
    const escHandler = (e) => {
      if (e.keyCode === 27) {
        setModal(undefined);
      }
    };
    window.addEventListener("keydown", escHandler);
    return () => window.removeEventListener("keydown", escHandler);
  }, []);

  // We want to forget about mouseOverPossibility as soon as we are not in the moving
  // stage. This prevents some flickering of the black eggs.
  const stageIsMoving = stage === "moving";
  const realMouseOverPossibility = stageIsMoving
    ? mouseOverPossibility
    : undefined;

  // We need to set back the mouseOverPossibility to undefined after we have clicked on
  // a picked a choice. I think here might be the best place.
  useEffect(() => {
    if (!stageIsMoving) {
      setMouseOverPossibility(undefined);
    }
  }, [stageIsMoving]);

  const mountain = useMemo(() => {
    return (
      <Mountain
        {...{
          checkpointPositions,
          currentPositions,
          blockedSums,
          currentPlayer,
          diceSumOptions,
          mouseOverPossibility: realMouseOverPossibility,
          playerInfos,
          mountainShape,
          sameSpace,
        }}
      />
    );
  }, [
    checkpointPositions,
    currentPositions,
    blockedSums,
    currentPlayer,
    diceSumOptions,
    realMouseOverPossibility,
    playerInfos,
    mountainShape,
    sameSpace,
  ]);

  const scoreBoard = (
    <ScoreBoard
      {...{
        scores,
        playerInfos,
        currentPlayer,
        playerOrder,
        numColsToWin,
      }}
    />
  );

  const currentPlayerColor = playerInfos[currentPlayer].color;

  const diceBoard = (
    <DiceBoard
      {...{
        diceValues,
        color: currentPlayerColor,
      }}
    />
  );

  const buttons =
    stage === "gameover" ? null : (
      <MoveButtons
        {...{
          userId,
          // Use this player's color if there is a player otherwise use the current
          // player's color.
          playerColor:
            playerInfos[userId == null ? currentPlayer : userId].color,
          onRoll: () => {
            dispatch(roll());
            setShowInfo(false);
          },
          onStop: () => {
            dispatch(stop());
            setShowInfo(false);
          },
          showProbs,
          bustProb,
        }}
        onMouseEnter={(buttonRow, buttonColumn) => {
          setMouseOverPossibility({ buttonRow, buttonColumn });
        }}
        onMouseLeave={() => {
          setMouseOverPossibility(undefined);
        }}
      />
    );

  const infoTag = showInfo ? (
    <Info
      {...{
        info: board.info,
        endOfTurnBustProb:
          showProbs === "never" ? undefined : endOfTurnBustProb,
        onClick: () => setShowInfo(false),
        playerInfos,
        userId: userId == null ? "-1" : userId,
        itsYourTurn,
      }}
    />
  ) : null;

  const rulesModal = (
    <div className="modal" tabIndex={-1}>
      <div className="modal-dialog modal-lg modal-dialog-scrollable">
        <div className="modal-content">
          <div className="modal-header">
            <h5 className="modal-title">How To Play</h5>
            <button
              type="button"
              className="close"
              data-dismiss="modal"
              aria-label="Close"
              onClick={() => setModal(undefined)}
            >
              <span aria-hidden="false">&times;</span>
            </button>
          </div>
          <div className="modal-body">
            <div className="rules">
              <Rules />
            </div>
          </div>
          <div className="modal-footer">
            <button
              type="button"
              className="btn btn-primary"
              data-dismiss="modal"
              onClick={() => setModal(undefined)}
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  const historyModal = (
    <div className="modal" tabIndex={-1}>
      <div className="modal-dialog moveHistoryModal modal-sm modal-dialog-scrollable">
        <div className="modal-content">
          <div className="modal-header">
            <h5 className="modal-title">Move History</h5>
            <button
              type="button"
              className="close"
              data-dismiss="modal"
              aria-label="Close"
              onClick={() => setModal(undefined)}
            >
              <span aria-hidden="false">&times;</span>
            </button>
          </div>
          <div className="modal-body">
            <div className="moveHistoryWrap">
              <div className="moveHistory">
                <MoveHistory {...{ moveHistory, playerInfos }} />
              </div>
            </div>
          </div>
          <div className="modal-footer">
            <button
              type="button"
              className="btn btn-primary"
              data-dismiss="modal"
              onClick={() => setModal(undefined)}
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  const inGameIcons = (
    <InGameIcons
      howToPlayOnClick={() => setModal(modal === "rules" ? undefined : "rules")}
      historyOnClick={() =>
        setModal(modal === "history" ? undefined : "history")
      }
    />
  );

  // How many eggs would move from the side to the mountain for the mouse-over option.
  let mouseOverNumEggsMoveIn = 0;
  if (realMouseOverPossibility != null && diceSumOptions != null) {
    const { buttonRow, buttonColumn } = realMouseOverPossibility;

    const sumOption = diceSumOptions[buttonRow];

    let sums;

    if (isSumOptionSplit(sumOption)) {
      sums = [sumOption.diceSums[buttonColumn]];
    } else {
      sums = sumOption.diceSums;
      // In the case of both numbers being the same, we'll actually only need one egg,
      // so we hackily remove one of the two here.
      if (sums[0] === sums[1]) {
        sums = [sums[0]];
      }
    }

    sums.forEach((sum) => {
      if (currentPositions[sum] == null) {
        mouseOverNumEggsMoveIn++;
      }
    });
  }

  const eggsLeft = (
    <EggsLeft
      n={3 - Object.keys(currentPositions).length}
      color={currentPlayerColor}
      nDownlight={mouseOverNumEggsMoveIn}
    />
  );

  // This is a hack to make sure the dice are centered even though we have eggs next to
  // it.
  const invisibleEggs = (
    <div className="eggsLeftWrap">
      <Climber current={true} side={true} transparent={true} />
    </div>
  );

  // The onClick is necessary to disable the double-click zoom on ios.
  // See stackoverflow.com/a/54753520/1067132
  return (
    <div className="cantStopBoard manipulation" onClick={() => {}}>
      {infoTag}
      {modal === "rules" && rulesModal}
      {modal === "history" && historyModal}
      {inGameIcons}
      <div className={`megaWrap ${mountainShape}MountainWrap`}>
        <div className="bigHspace"></div>
        <div className="boardContent">
          <div className="bandBegin"></div>
          <div className="mountainWrap">
            {/* First column: the mountain. */}
            {mountain}
          </div>
          <div className="bandMiddle"></div>
          {/* Second column: dice / actions / score board */}
          <div className="rightWrap">
            {scoreBoard}
            {/* Section with Dice and Buttons */}
            <div className="diceButtons">
              <div className="diceButtonsBefore"></div>
              <div className="eggsAndDice">
                {eggsLeft}
                {diceBoard}
                {invisibleEggs}
              </div>
              <div className="diceButtonsMiddle"></div>
              <div className="diceButtonsMiddle"></div>
              {/* Buttons */}
              <div className="buttonsWrap">{buttons}</div>
              <div className="diceButtonsBefore"></div>
            </div>
          </div>
          <div className="bandEnd"></div>
        </div>
        <div className="bigHspace"></div>
      </div>
    </div>
  );
};
