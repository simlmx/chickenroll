import React, { useState, useEffect, useMemo } from "react";

import { DiceBoard } from "./DiceBoard";
import { Mountain } from "./Mountain";
import { ScoreBoard } from "./ScoreBoard";
import GameSetup from "./GameSetup";
import MoveButtons from "./MoveButtons";
import MoveHistory from "./MoveHistory";
import { DICE_INDICES } from "../math";
import { GameType } from "../Game";
import { PlayerID, PlayerInfo } from "../types";
import InGameIcons from "./InGameIcons";
import Rules from "./Rules";
import getSoundPlayer from "../audio";
import localStorage from "../utils/localStorage";
import { isIOS } from "../utils/platform";
import { BustProb } from "./Bust";

export class Info extends React.Component<{
  info?: { code: string; playerID?: PlayerID };
  endOfTurnBustProb?: number;
  onClick: () => void;
  playerInfos: { [key: string]: PlayerInfo };
  // playerID of the client instance.
  playerID: PlayerID;
  // When it's your turn, we add it to the Info.
  itsYourTurn: boolean;
}> {
  renderContent(): JSX.Element | undefined {
    const { info, playerInfos, itsYourTurn, endOfTurnBustProb } = this.props;

    if (info == null) {
      return undefined;
    }

    const { code } = info;

    const itsMe = this.props.playerID === info.playerID;

    const playerName = itsMe
      ? "You"
      : info.playerID && playerInfos[info.playerID].name;

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
      <div
        className={`itsYourTurn color${playerInfos[this.props.playerID].color}`}
      >
        It's your turn!
      </div>
    ) : undefined;

    let playerNameTag: JSX.Element | undefined;

    if (["bust", "stop", "win"].includes(code)) {
      playerNameTag = (
        <strong
          className={`infoPlayerName color${
            playerInfos[info.playerID as PlayerID].color
          }`}
        >
          {playerName}
        </strong>
      );
    }

    switch (code) {
      case "bust":
        return (
          <div>
            {itsYourTurnTag}
            <div>
              {playerNameTag}{" "}
              <span className="badge badge-danger">cracked</span>
            </div>
            {probMsg}
          </div>
        );
      case "stop":
        return (
          <div>
            {itsYourTurnTag}
            <div>
              {playerNameTag}{" "}
              <span className="badge badge-success">stopped</span>
            </div>
            {probMsg}
          </div>
        );
      case "win":
        return (
          <span>
            {playerNameTag} won!{" "}
            <span role="img" aria-label="party">
              🎉
            </span>
          </span>
        );
      case "start":
        return itsYourTurnTag;
      default:
        return undefined;
    }
  }

  render() {
    const content = this.renderContent();
    if (content == null) {
      return null;
    }

    return (
      <div className="infoWrap" onClick={() => this.props.onClick()}>
        <div className="infoBackground">
          <div className="text-center info">{content}</div>
        </div>
      </div>
    );
  }
}

interface CantStopBoardProps {
  G: GameType;
  playerID: PlayerID;
  matchID: string;
  ctx: any;
  moves: any;
  log: any;
  isActive: boolean;
  isConnected: boolean;
  plugins: any;
  _undo: any;
  _redo: any;
  _stateID: any;
  events: any;
  reset: any;
  undo: any;
  redo: any;
  isMultiplayer: boolean;
}

export const CantStopBoard = (props: CantStopBoardProps): JSX.Element => {
  const [mouseOverPossibility, setMouseOverPossibility] = useState<
    { diceSplit: number; dicePairs: number[] } | undefined
  >(undefined);

  const { moves, matchID, ctx, G } = props;
  const {
    checkpointPositions,
    currentPositions,
    blockedSums,
    diceSumOptions,
    playerInfos,
    diceValues,
    scores,
    numVictories,
    bustProb,
    endOfTurnBustProb,
    passAndPlay,
    numColsToWin,
    moveHistory,
    showProbs,
    mountainShape,
    sameSpace,
  } = G;
  const { currentPlayer, phase, numPlayers, playOrder } = ctx;

  const [showInfo, setShowInfo] = useState(true);
  const [modal, setModal] = useState<undefined | "history" | "rules">(
    undefined
  );
  const soundPlayer = getSoundPlayer();

  const setPlayerVolume = (volume: number): void => {
    // We map our 0-3 volume non-linearly between 0. and 1.
    let volumeInPlayer: number;
    switch (volume) {
      case 0:
        volumeInPlayer = 0.0;
        break;
      case 1:
        volumeInPlayer = 0.1;
        break;
      case 2:
        volumeInPlayer = 0.4;
        break;
      case 3:
        volumeInPlayer = 1.0;
        break;
      default:
        volumeInPlayer = 0.0;
        break;
    }
    soundPlayer.setVolume(volumeInPlayer);
  };

  const getInitVolume = () => {
    // Load the volume setting we have in storage.
    const initVol = parseInt(
      localStorage.getItem("volume", isIOS() ? "3" : "2") as string
    );
    // Use it to set the player's volume.
    setPlayerVolume(initVol);

    return initVol;
  };

  const [volume, _setVolume] = useState(getInitVolume);

  const changeVolume = () => {
    let newVolume;
    if (isIOS()) {
      // On iOS we just toggle on/off.
      if (volume === 0) {
        newVolume = 3;
      } else {
        newVolume = 0;
      }
    } else {
      // On other devices we cycle between 0 and 3.
      newVolume = (volume + 1) % 4;
    }

    setPlayerVolume(newVolume);
    localStorage.setItem("volume", newVolume.toString());
    _setVolume(newVolume);
  };

  const itsYourTurn =
    phase === "main" &&
    !props.G.passAndPlay &&
    props.ctx.currentPlayer === props.playerID;

  // This verifies if the game has already started without us.
  // Once the game is started, `G.numPlayers` is set to the number of players that
  // have joined. If our playerID is bigger than that, it means we are not part of
  // those players.
  const gameStartedWithoutYou = parseInt(props.playerID) >= props.G.numPlayers;

  const infoCode = props.G.info?.code;
  const infoTs = props.G.info?.ts;

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
    if (!itsYourTurn || volume === 0) {
      return;
    }

    soundPlayer.play("yourturn");

    // eslint-disable-next-line react-hooks/exhaustive-deps
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

  // Highlight or not for each die.
  let diceHighlight: boolean[] = Array(4).fill(false);
  let diceSplit: number | undefined = undefined;
  if (mouseOverPossibility != null) {
    diceSplit = mouseOverPossibility.diceSplit;
    const { dicePairs } = mouseOverPossibility;

    const splitIndices: number[][] = DICE_INDICES[diceSplit];

    dicePairs.forEach((pairIndex, i) => {
      splitIndices[pairIndex].forEach((diceIndex) => {
        diceHighlight[diceIndex] = true;
      });
    });
  }

  // We want to forget about mouseOverPossibility as soon as we are not in the moving
  // stage. This prevents some flickering of the black eggs.
  const stageIsMoving = ctx.activePlayers[currentPlayer] === "moving";
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

  // If the game has already started we show a sorry message with a crying cat.
  if (gameStartedWithoutYou) {
    return (
      <>
        <InGameIcons />
        <div className="gameStartedWithoutYou container">
          <div>
            <p>It seems like this match has already started... without you!</p>
            <h1>
              <span role="img" aria-label="crying cat">
                😿
              </span>
            </h1>
            <a className="btn btn-primary" href="/match">
              Create a new match of your own!
            </a>
          </div>
        </div>
      </>
    );
  }

  // If we are in pass-and-play mode, then the playerID is always "0". The
  // "currentPlayer" is what we mean.
  const playerID = passAndPlay ? currentPlayer : props.playerID;

  if (phase === "setup") {
    return (
      <GameSetup
        {...{
          playerInfos,
          playerID,
          moves,
          maxNumPlayers: numPlayers,
          matchID,
          passAndPlay,
          numColsToWin,
          showProbs,
          mountainShape,
          sameSpace,
        }}
      />
    );
  }

  const scoreBoard = (
    <ScoreBoard
      {...{
        scores,
        playerInfos,
        currentPlayer,
        playOrder,
        numVictories,
        numColsToWin,
      }}
    />
  );

  const diceBoard = (
    <DiceBoard
      {...{
        diceValues,
        color: playerInfos[currentPlayer].color,
        diceHighlight,
        diceSplit,
      }}
    />
  );

  const buttons =
    props.ctx.phase === "gameover" ? (
      <div className="actionButtons">
        <button
          onClick={() => {
            moves.playAgain();
            setShowInfo(false);
          }}
          className={`btn btnAction bgcolor${playerInfos[playerID].color}`}
        >
          Play again!
        </button>
      </div>
    ) : (
      <MoveButtons
        {...{
          moves,
          ctx,
          G,
          playerID,
          playerColor: playerInfos[playerID].color,
          onRoll: () => {
            moves.rollDice();
            setShowInfo(false);
          },
          onStop: () => {
            moves.stop();
            setShowInfo(false);
          },
          showProbs,
          bustProb,
        }}
        onMouseEnter={(diceSplit, dicePairs) => {
          setMouseOverPossibility({ diceSplit, dicePairs });
        }}
        onMouseLeave={() => {
          setMouseOverPossibility(undefined);
        }}
      />
    );

  const infoTag = showInfo ? (
    <Info
      {...{
        info: G.info,
        endOfTurnBustProb:
          showProbs === "never" ? undefined : endOfTurnBustProb,
        onClick: () => setShowInfo(false),
        playerInfos,
        // For pass and play we ignore the playerID.
        // This means we never right "You" but always "player name".
        playerID: passAndPlay ? -1 : playerID,
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
      volume={volume}
      changeVolume={() => {
        changeVolume();
      }}
      showVolume={!passAndPlay}
      historyOnClick={() =>
        setModal(modal === "history" ? undefined : "history")
      }
    />
  );

  // The onClick is necessary to disable the double-click zoom on ios.
  // See stackoverflow.com/a/54753520/1067132
  return (
    <div className="cantStopBoard manipulation" onClick={() => {}}>
      {infoTag}
      {modal === "rules" && rulesModal}
      {modal === "history" && historyModal}
      {inGameIcons}
      <div className="megaWrap">
        <div className="bigHspace"></div>
        <div className="boardContent">
          <div className="bandBegin"></div>
          <div className={`mountainWrap ${mountainShape}MountainWrap`}>
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
              {/* Dice */}
              {diceBoard}
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
