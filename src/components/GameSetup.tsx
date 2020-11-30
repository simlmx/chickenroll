import React, { useState, useEffect, useRef } from "react";
import { PlayerID, PlayerInfo } from "../types";
import { SERVER, NUM_COLORS } from "../constants";
import QRCode from "qrcode.react";
import InGameIcons from "./InGameIcons";

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

    if (!ready) {
      moves.setNotReady(playerID);
    } else {
      moves.setName(currentName, playerID);
    }
  };

  let className = `gameSetupPlayer border${color} bgcolor${color}`;

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

interface GameSetupProps {
  playerInfos: { [key: string]: PlayerInfo };
  playerID: PlayerID;
  moves: any;
  maxNumPlayers: number;
  matchID: string;
  passAndPlay: boolean;
}

const GameSetup = (props: GameSetupProps): JSX.Element => {
  const {
    playerInfos,
    maxNumPlayers,
    passAndPlay,
    matchID,
    moves,
    playerID,
  } = props;

  // Using a state is how I made the auto-focus on the start button once everyone is
  // ready possible.
  const [allReady, setAllReady] = useState(false);

  const [showQr, setShowQr] = useState(false);

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

  const startButton = playerID === "0" && (
    <button
      className="btn btn-primary startButton"
      onClick={() => moves.startGame()}
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

  return (
    <div className="gameSetupWrap">
      <InGameIcons />
      {inviteHeader}
      <div className="gameSetupPlayersWrap">
        {activePlayers}
        {freeSpots}
        {startButton}
      </div>
    </div>
  );
};

export default GameSetup;
