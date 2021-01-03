import React, { useState, useEffect, useRef } from "react";
import { PlayerID, PlayerInfo } from "../types";
import {
  SERVER,
  NUM_COLORS,
  AUTO_NUM_COLS_TO_WIN,
  PLAYER_NAME_MAX_LEN,
} from "../constants";
import QRCode from "qrcode.react";
import InGameIcons from "./InGameIcons";
import getSoundPlayer from "../audio";
import localStorage from "../utils/localStorage";
import { ShowProbsType } from "../Game";

// We need this to close the popup when we click outside.
// https://stackoverflow.com/a/42234988
function useOutsideAlerter(ref, onClickOutside: () => void) {
  useEffect(() => {
    /**
     * Alert if clicked on outside of element
     */
    function handleClickOutside(event) {
      if (ref.current && !ref.current.contains(event.target)) {
        onClickOutside();
      }
    }
    // Bind the event listener
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      // Unbind the event listener on clean up
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [ref, onClickOutside]);
}

/**
 * Component that alerts if you click outside of it
 */
function OutsideAlerter(props: {
  onClickOutside: () => void;
  children: JSX.Element | JSX.Element[];
  className?: string;
}) {
  const { className, children, onClickOutside } = props;

  const wrapperRef = useRef(null);

  useOutsideAlerter(wrapperRef, onClickOutside);

  return (
    <div {...{ className }} ref={wrapperRef}>
      {children}
    </div>
  );
}

interface ColorPickerProps {
  color: number;
  onColorChange?: (number) => void;
  colorAvailabilityMap: boolean[];
  disabled?: boolean;
}

const ColorPicker = (props: ColorPickerProps) => {
  const { color, onColorChange, colorAvailabilityMap, disabled } = props;
  const [visible, setVisible] = useState(false);

  let btnClassName = `btn gameSetupColorButton bgcolor${color}`;
  if (disabled) {
    btnClassName += " gameSetupColorButtonDisabled";
  }

  return (
    <div className="colorWrap">
      <div>
        <button
          className={btnClassName}
          onClick={() => setVisible(true)}
          disabled={disabled}
        >
          <div>◢</div>
        </button>
      </div>
      {visible && (
        <OutsideAlerter onClickOutside={() => setVisible(false)}>
          <div className="colorPopupWrap">
            {colorAvailabilityMap.map((available, i) => {
              // Skip colors that are not available.
              if (!available) {
                return null;
              }
              return (
                (available || i === color) && (
                  <button
                    className={`btn gameSetupColorButton bgcolor${i}`}
                    onClick={() => {
                      onColorChange && onColorChange(i);
                      setVisible(false);
                    }}
                    key={i}
                    tabIndex={0}
                  ></button>
                )
              );
            })}
          </div>
        </OutsideAlerter>
      )}
    </div>
  );
};

interface PlayerProps {
  moves: any;
  itsMe: boolean;
  playerInfo: PlayerInfo;
  playerID: PlayerID;
  colorAvailabilityMap: boolean[];
  passAndPlay: boolean;
}

export const Player = (props: PlayerProps): JSX.Element => {
  const {
    moves,
    playerInfo,
    itsMe,
    playerID,
    colorAvailabilityMap,
    passAndPlay,
  } = props;

  const { name, color, ready } = playerInfo;

  // Using an intenral state instead of only using the prop makes the changing more
  // responsive.
  const [currentName, setCurrentName] = useState(name);
  const [currentReady, setCurrentReady] = useState(ready);
  const [editingName, setEditingName] = useState(false);

  const soundPlayer = getSoundPlayer();

  // Update the name when it changes in the server.
  useEffect(() => {
    setCurrentName(name);
  }, [name]);

  // Same for the ready status.
  useEffect(() => {
    setCurrentReady(ready);
  }, [ready]);

  const setReady = (ready: boolean): void => {
    // This was the simplest way to not have any effects when clicking on other player's
    // names.
    if (!itsMe) {
      return;
    }

    setCurrentReady(ready);

    // This is a hack for iphone (and more?) where we need to play some sound as part of
    // a user interaction before we can play sound.
    soundPlayer.init();

    moves.setReady(playerID, ready);
  };

  /*
   * Set the state's `currentName` as the player's name.
   */
  const setName = (): void => {
    setEditingName(false);
    moves.setName(currentName, playerID);
    if (!passAndPlay && currentName !== name) {
      localStorage.setItem("playerName", currentName);
    }
  };

  const setColor = (color: number): void => {
    moves.setColor(color, playerID);
    if (!passAndPlay) {
      localStorage.setItem("playerColor", color.toString());
    }
  };

  let nameElement: JSX.Element;

  if (itsMe && editingName) {
    nameElement = (
      <OutsideAlerter
        className="playerNameInput"
        onClickOutside={() => setName()}
      >
        <input
          type="text"
          className="form-control user-select-all"
          onChange={(e) => setCurrentName(e.target.value)}
          placeholder="Enter your name"
          maxLength={PLAYER_NAME_MAX_LEN}
          size={3}
          value={currentName}
          autoFocus={true}
          onFocus={(e) => e.target.select()}
          onKeyDown={(e) => {
            if (e.keyCode === 13) {
              setName();
              return false;
            }
            return true;
          }}
        />
      </OutsideAlerter>
    );
  } else {
    nameElement = (
      <div
        className="playerName"
        onClick={(e) => !currentReady && setEditingName(true)}
      >
        {name || "..."}
      </div>
    );
  }

  const readyButton = (
    <div
      className="readyWrap pointer"
      onClick={(e) => {
        setReady(!currentReady);
      }}
    >
      <div className="readyText badge">
        {currentReady ? "Ready" : "Not Ready"}
      </div>
      <div className="custom-control custom-switch">
        <input
          type="checkbox"
          className="custom-control-input pointer"
          id={`customSwitch-${playerID}`}
          checked={currentReady}
          readOnly={true}
          onClick={(e) => {
            // Not sure how this works but it does!
            e.preventDefault();
            e.stopPropagation();
          }}
        />
        <label
          className="custom-control-label"
          htmlFor={`customSwitch-${playerID}`}
        ></label>
      </div>
    </div>
  );

  const colorPicker = (
    <ColorPicker
      color={color}
      onColorChange={(c) => setColor(c)}
      colorAvailabilityMap={colorAvailabilityMap}
      disabled={!itsMe || ready}
    />
  );

  return (
    <div className="gameSetupPlayer">
      {colorPicker}
      {nameElement}
      {!passAndPlay && readyButton}
    </div>
  );
};

interface GameSetupProps {
  playerInfos: { [key: string]: PlayerInfo };
  playerID: PlayerID;
  moves: any;
  maxNumPlayers: number;
  matchID: string;
  passAndPlay: boolean;
  numColsToWin: number | "auto";
  showProbs: ShowProbsType;
}

const GameSetup = (props: GameSetupProps): JSX.Element => {
  const {
    playerInfos,
    maxNumPlayers,
    passAndPlay,
    matchID,
    moves,
    playerID,
    numColsToWin,
    showProbs,
  } = props;

  // Using a state is how I made the auto-focus on the start button once everyone is
  // ready possible.
  const [allReady, setAllReady] = useState(false);

  const [showQr, setShowQr] = useState(false);

  useEffect(() => {
    // If it's the first time we join that game, we tell the game. It's going to assign
    // us a default name and color.

    if (!playerInfos.hasOwnProperty(playerID)) {
      // Use the name/color from localStorage if there is one.
      const playerName = localStorage.getItem("playerName");
      const playerColor = localStorage.getItem("playerColor");
      let playerColorInt: number | undefined;
      if (playerColor != null) {
        playerColorInt = parseInt(playerColor);
      }
      moves.join(playerName, playerColorInt);
    }
    setAllReady(Object.values(playerInfos).every((info) => info.ready));
  }, [playerInfos, moves, playerID]);

  const numPlayers = Object.values(playerInfos).length;
  const numFreeSpots = maxNumPlayers - Object.keys(playerInfos).length;
  const matchLink = `${SERVER}/match/${matchID}`;
  const imTheOwner = playerID === "0";

  const qrcode = (
    <OutsideAlerter onClickOutside={() => setShowQr(false)}>
      <div className="qrcodeWrap" onMouseDown={() => setShowQr(false)}>
        <QRCode className="qrcode" value={matchLink} />
      </div>
    </OutsideAlerter>
  );

  const inviteHeader = !passAndPlay ? (
    <div className="gameSetupInviteWrap alert alert-primary">
      <div>
        <div className="inviteContentWrap">
          <b>Share this link to invite players</b>
          <div className="inviteLinkWrap">
            <span className="inviteLink badge badge-primary user-select-all">
              {matchLink}
            </span>
            <button
              type="button"
              className="btn btn-outline-primary btn-sm copyBtn"
              onClick={() => navigator.clipboard.writeText(matchLink)}
            >
              Copy
            </button>
          </div>
          <button
            type="button"
            className="btn btn-outline-dark btn-sm copyBtn"
            onMouseDown={(e) => {
              e.stopPropagation();
              setShowQr(!showQr);
            }}
          >
            QR
          </button>
          {showQr && qrcode}
        </div>
      </div>
    </div>
  ) : null;

  // In pass-and-play mode, we can edit all the player's names. What we do is we
  // auto-focus on the *first* one that is not ready.
  // In remote mode we autofocus on everything because only one will be editable
  // anyway.
  const activePlayers = Object.entries(playerInfos).map(
    ([currentPlayerID, playerInfo], i) => {
      // Find the available colors for that players, i.e. all those which are not
      // taken already.
      const colorAvailabilityMap = Array(NUM_COLORS).fill(true);

      Object.values(playerInfos).forEach(
        (playerInfo) => (colorAvailabilityMap[playerInfo.color] = false)
      );

      return (
        <Player
          moves={moves}
          playerInfo={playerInfo}
          itsMe={passAndPlay || currentPlayerID === playerID}
          playerID={currentPlayerID}
          key={currentPlayerID}
          colorAvailabilityMap={colorAvailabilityMap}
          passAndPlay={passAndPlay}
        />
      );
    }
  );

  const freeSpot = numFreeSpots > 0 && (
    <div className="gameSetupPlayer gameSetupPlayerFree">
      Waiting for player to join
    </div>
  );

  const canStart = passAndPlay || (allReady && numPlayers >= 2);

  const startButton = imTheOwner && (
    <button
      className="btn btn-primary startButton"
      onClick={() => moves.startMatch()}
      // Disabled if not everyone is ready
      disabled={!canStart}
      key="last"
      ref={(input) => input && allReady && input.focus()}
    >
      {passAndPlay
        ? "Start the match!"
        : numPlayers >= 2
        ? `Start with ${numPlayers} players!`
        : "You need at least 2 players"}
    </button>
  );

  let numColsToWinValues: (number | "auto")[] = [];
  const autoValue: number = AUTO_NUM_COLS_TO_WIN.get(numPlayers) || 3;

  if ([0, 1, 2].includes(numPlayers)) {
    numColsToWinValues = [2, 3, 4, "auto"];
  } else if (numPlayers === 3) {
    numColsToWinValues = [2, "auto", 4];
  } else if (numPlayers === 4) {
    numColsToWinValues = [2, "auto"];
  } else if (numPlayers === 5) {
    numColsToWinValues = ["auto"];
  } else {
    throw new Error("unsuported number of players");
  }

  // If the value we had selected is not the right one, we set it to default.
  if (
    imTheOwner &&
    numColsToWin !== "auto" &&
    !numColsToWinValues.includes(numColsToWin)
  ) {
    moves.setNumColsToWin("auto");
  }

  const settings = (
    <div className="settingsWrap">
      <div className="form-group">
        <label htmlFor="numColsToWin">Num of columns to win</label>
        <select
          className="custom-select custom-select-sm"
          id="numColsToWin"
          disabled={!imTheOwner}
          onChange={(e) =>
            moves.setNumColsToWin(
              e.target.value === "auto" ? "auto" : parseInt(e.target.value)
            )
          }
          value={numColsToWin}
        >
          {numColsToWinValues.map((value) => {
            return (
              <option value={value} key={value}>
                {value === "auto" ? `Auto (${autoValue})` : value}
              </option>
            );
          })}
        </select>
      </div>
      <div className="form-group mb-3">
        <label htmlFor="showProbs">Show probability of busting</label>
        <select
          className="custom-select custom-select-sm"
          id="showProbs"
          disabled={!imTheOwner}
          onChange={(e) => moves.setShowProbs(e.target.value)}
          value={showProbs}
        >
          {[
            ["before", "Before every roll"],
            ["after", "At the of the turn"],
            ["never", "Never"],
          ].map(([optionName, optionLabel]) => {
            return (
              <option value={optionName} key={optionName}>
                {optionLabel}
              </option>
            );
          })}
        </select>
      </div>
    </div>
  );

  return (
    <div className="gameSetupWrap">
      <InGameIcons />
      {inviteHeader}
      <div className="container gameSetupContentWrapWrap">
        <div className="gameSetupContentWrap">
          <div className="sectionName">Players</div>
          {activePlayers}
          {freeSpot}
          <div className="sectionName">Options</div>
          {settings}
          {startButton}
        </div>
      </div>
    </div>
  );
};

export default GameSetup;
