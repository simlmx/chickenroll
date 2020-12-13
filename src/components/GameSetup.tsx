import React, { useState, useEffect, useRef } from "react";
import { PlayerID, PlayerInfo } from "../types";
import { SERVER, NUM_COLORS, AUTO_NUM_COLS_TO_WIN } from "../constants";
import QRCode from "qrcode.react";
import InGameIcons from "./InGameIcons";
import getSoundPlayer from "../audio";

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
}) {
  const wrapperRef = useRef(null);
  useOutsideAlerter(wrapperRef, props.onClickOutside);

  return <div ref={wrapperRef}>{props.children}</div>;
}

interface ColorPickerProps {
  initialColor: number;
  onColorChange?: (number) => void;
  colorAvailabilityMap: boolean[];
  disabled?: boolean;
}

const ColorPicker = (props: ColorPickerProps) => {
  const [color, setColor] = useState(props.initialColor);
  const [visible, setVisible] = useState(false);

  let btnClassName = `btn gameSetupColorButton bgcolor${color}`;
  if (props.disabled) {
    btnClassName += " gameSetupColorButtonDisabled";
  }

  return (
    <div className="colorWrap">
      <div>
        <button
          className={btnClassName}
          onClick={() => setVisible(true)}
          disabled={props.disabled}
        >
          <div>◢</div>
        </button>
      </div>
      {visible && (
        <OutsideAlerter onClickOutside={() => setVisible(false)}>
          <div className="colorPopupWrap">
            {props.colorAvailabilityMap.map((available, i) => {
              // Skip colors that are not available.
              if (!available) {
                return null;
              }

              // If it's the first one we add auto-focus.
              const opts = {};
              if (i === 0) {
                opts["autoFocus"] = true;
              }

              return (
                (available || i === props.initialColor) && (
                  <button
                    className={`btn gameSetupColorButton bgcolor${i}`}
                    onClick={() => {
                      setColor(i);
                      props.onColorChange && props.onColorChange(i);
                      setVisible(false);
                    }}
                    key={i}
                    tabIndex={0}
                    {...opts}
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
  autoFocus?: boolean;
}

export const Player = (props: PlayerProps): JSX.Element => {
  const { moves, playerInfo, itsMe, playerID, colorAvailabilityMap } = props;

  const { name, color, ready } = playerInfo;

  const [currentName, setCurrentName] = useState(name);

  const inputRef = useRef<HTMLInputElement>(null);

  const soundPlayer = getSoundPlayer();

  useEffect(() => {
    if (props.autoFocus && inputRef && inputRef.current) {
      inputRef.current.focus();
    }
  });

  const setReady = (ready: boolean): void => {
    // This was the simplest way to not have any effects when clicking on other player's
    // names.
    if (!itsMe) {
      return;
    }

    // This is a hack for iphone (and more?) where we need to play some sound as part of
    // a user interaction before we can play sound.
    soundPlayer.init();

    if (!ready) {
      moves.setNotReady(playerID);
    } else {
      moves.setName(currentName, playerID);
    }
  };

  let className = `gameSetupPlayer bgcolor${color}alpha40`;

  if (!itsMe && !name) {
    className += " gameSetupPlayerWaiting";
  }

  let nameElement: JSX.Element;

  if (!ready && itsMe) {
    nameElement = (
      <input
        type="text"
        className="form-control playerNameInput user-select-all"
        onChange={(e) => setCurrentName(e.target.value)}
        placeholder="Enter your name"
        maxLength={16}
        size={3}
        value={currentName}
        ref={inputRef}
        onFocus={(e) => e.target.select()}
        onKeyDown={(e) => {
          // On <enter> same as clicking ready
          if (e.keyCode === 13) {
            setReady(true);
            return false;
          }
          return true;
        }}
      />
    );
  } else {
    nameElement = (
      <div className="playerName" onClick={(e) => setReady(false)}>
        {name || "..."}
      </div>
    );
  }

  const readyButton = (
    <div className="readyWrap">
      <div className="readyText badge" onClick={(e) => setReady(!ready)}>
        {ready ? "Ready" : "Not Ready"}
      </div>
      <div className="custom-control custom-switch">
        <input
          type="checkbox"
          className="custom-control-input"
          id={`customSwitch-${playerID}`}
          checked={ready}
          onChange={(e) => setReady(e.target.checked)}
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
      initialColor={color}
      onColorChange={(c) => moves.setColor(c, playerID)}
      colorAvailabilityMap={colorAvailabilityMap}
      disabled={!itsMe}
    />
  );

  return (
    <div {...{ className }}>
      {colorPicker}
      {nameElement}
      <div className="gameButtonWrap">{readyButton}</div>
    </div>
  );
};

const Gear = () => {
  return (
    <svg
      className="gear"
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
    >
      <path d="M24 13.616v-3.232c-1.651-.587-2.694-.752-3.219-2.019v-.001c-.527-1.271.1-2.134.847-3.707l-2.285-2.285c-1.561.742-2.433 1.375-3.707.847h-.001c-1.269-.526-1.435-1.576-2.019-3.219h-3.232c-.582 1.635-.749 2.692-2.019 3.219h-.001c-1.271.528-2.132-.098-3.707-.847l-2.285 2.285c.745 1.568 1.375 2.434.847 3.707-.527 1.271-1.584 1.438-3.219 2.02v3.232c1.632.58 2.692.749 3.219 2.019.53 1.282-.114 2.166-.847 3.707l2.285 2.286c1.562-.743 2.434-1.375 3.707-.847h.001c1.27.526 1.436 1.579 2.019 3.219h3.232c.582-1.636.75-2.69 2.027-3.222h.001c1.262-.524 2.12.101 3.698.851l2.285-2.286c-.744-1.563-1.375-2.433-.848-3.706.527-1.271 1.588-1.44 3.221-2.021zm-12 2.384c-2.209 0-4-1.791-4-4s1.791-4 4-4 4 1.791 4 4-1.791 4-4 4z" />
    </svg>
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
  } = props;

  // Using a state is how I made the auto-focus on the start button once everyone is
  // ready possible.
  const [allReady, setAllReady] = useState(false);

  const [showQr, setShowQr] = useState(false);

  const [showOptions, setShowOptions] = useState(false);

  useEffect(() => {
    // If it's the first time we join that game, we tell the game. It's going to assign
    // us a default name and color.
    if (!playerInfos.hasOwnProperty(playerID)) {
      moves.join();
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
  let foundFirstNotReady = false;
  const activePlayers = Object.entries(playerInfos).map(
    ([currentPlayerID, playerInfo], i) => {
      // Find the available colors for that players, i.e. all those which are not
      // taken already.
      const colorAvailabilityMap = Array(NUM_COLORS).fill(true);

      Object.values(playerInfos).forEach(
        (playerInfo) => (colorAvailabilityMap[playerInfo.color] = false)
      );

      let autoFocus: boolean;
      if (!playerInfo.ready && !foundFirstNotReady) {
        foundFirstNotReady = true;
        autoFocus = true;
      } else {
        autoFocus = false;
      }

      return (
        <Player
          moves={moves}
          playerInfo={playerInfo}
          itsMe={passAndPlay || currentPlayerID === playerID}
          playerID={currentPlayerID}
          key={currentPlayerID}
          colorAvailabilityMap={colorAvailabilityMap}
          autoFocus={passAndPlay ? autoFocus : true}
        />
      );
    }
  );

  const freeSpots = Array(numFreeSpots)
    .fill(null)
    .map((_, i) => (
      <div className="gameSetupPlayer gameSetupPlayerFree" key={numPlayers + i}>
        Waiting for player to join
      </div>
    ));

  const startButton = imTheOwner && (
    <button
      className="btn btn-primary startButton"
      onClick={() => moves.startMatch()}
      // Disabled if not everyone is ready
      disabled={!allReady}
      key="last"
      ref={(input) => input && allReady && input.focus()}
    >
      {passAndPlay
        ? "Start the match!"
        : `Start with ${numPlayers} player${numPlayers === 1 ? "" : "s"}!`}
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
      <div className="settingsButtonWrap">
        <span
          className="settingsButton pointer"
          onClick={() => setShowOptions(!showOptions)}
        >
          <Gear />
        </span>
      </div>
      {showOptions && (
        <div className="gameSetupSettings input-group mb-3">
          <div className="input-group-prepend">
            <label className="input-group-text" htmlFor="numColsToWin">
              Number of columns to win
            </label>
          </div>
          <select
            className="custom-select"
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
      )}
    </div>
  );

  return (
    <div className="gameSetupWrap">
      <InGameIcons />
      {inviteHeader}
      <div className="gameSetupContentWrap container">
        {activePlayers}
        {freeSpots}
        {settings}
        {startButton}
      </div>
    </div>
  );
};

export default GameSetup;
