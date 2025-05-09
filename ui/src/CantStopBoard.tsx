import "./index.scss";

import { UserId } from "@lefun/core";
import {
  makeUseMakeMove,
  makeUseSelector,
  playSound,
  useIsPlayer,
  useUsername,
} from "@lefun/ui";
import { ReactNode, useEffect, useMemo, useState } from "react";

import {
  ChickenrollGame,
  ChickenrollGameState,
  PlayerInfo,
} from "chickenroll-game";

import { BustProb } from "./Bust";
import { DiceBoard } from "./DiceBoard";
import InGameIcons from "./InGameIcons";
import { Climber, EggsLeft, Mountain } from "./Mountain";
import MoveButtons from "./MoveButtons";
import MoveHistory from "./MoveHistory";
import { ScoreBoard } from "./ScoreBoard";
import { fromBoardSelector } from "./selectors";
import { State } from "./types";

const useSelector = makeUseSelector<ChickenrollGameState>();
const useMakeMove = makeUseMakeMove<ChickenrollGame>();

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
  const username = useUsername(info?.userId);

  if (info == null) {
    return null;
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

  let playerNameTag: ReactNode;

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
            {playerNameTag} <span className="badge bg-danger">cracked</span>
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
            {playerNameTag} <span className="badge bg-success">stopped</span>
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

  const makeMove = useMakeMove();
  const isPlayer = useIsPlayer();

  //FIXME useSelector instead of this
  //Otherwise since we return an object we'll rerender everything for every change.
  const board = useSelector((state: State) => state.board);
  const userId = useSelector((state: State) => state.userId);
  const showProbs = useSelector(fromBoardSelector((board) => board.showProbs));

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
    mountainShape,
    sameSpace,
    currentPlayer,
    playerOrder,
    stage,
  } = board;

  const [showInfo, setShowInfo] = useState(true);
  const [modal, setModal] = useState<undefined | "history">(undefined);
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

  // Make a sound when it's your turn.
  useEffect(() => {
    if (itsYourTurn) {
      playSound("yourturn");
    }
  }, [itsYourTurn]);

  // Add listener to close modals on "escape".
  useEffect(() => {
    const escHandler = (e: KeyboardEvent) => {
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
            playerInfos[userId == null || !isPlayer ? currentPlayer : userId]
              .color,
          onRoll: () => {
            makeMove("roll");
            setShowInfo(false);
          },
          onStop: () => {
            makeMove("stop");
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

  const historyModal = (
    <div className="modal" tabIndex={-1}>
      <div className="modal-dialog moveHistoryModal modal-sm modal-dialog-scrollable">
        <div className="modal-content">
          <div className="modal-header">
            <h5 className="modal-title">Move History</h5>
            <button
              type="button"
              className="btn-close"
              data-dismiss="modal"
              aria-label="Close"
              onClick={() => setModal(undefined)}
            ></button>
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

    let sums: number[];

    if (sumOption.split) {
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
    <div
      className="cantStopBoard manipulation"
      onClick={() => {
        /**/
      }}
    >
      {infoTag}
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
