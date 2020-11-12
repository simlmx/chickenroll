import React, { useState, useEffect, useRef } from "react";
import { PlayerID, PlayerInfo } from "../types";
import { SERVER, NUM_COLORS } from "../constants";
import { DieLogo } from "./Die";

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
  return (
    <div className="colorWrap">
      <button
        className={`btn gameSetupColorButton bgcolor${color} ${
          props.disabled ? "gameSetupColorButtonDisabled" : ""
        }`}
        onClick={() => setVisible(true)}
        disabled={props.disabled}
      ></button>
      {visible && (
        <OutsideAlerter onClickOutside={() => setVisible(false)}>
          <div className="colorPopupWrap">
            {props.colorAvailabilityMap.map(
              (available, i) =>
                (available || i === props.initialColor) && (
                  <button
                    className={`btn gameSetupColorButton bgcolor${i}`}
                    onClick={() => {
                      setColor(i);
                      props.onColorChange && props.onColorChange(i);
                      setVisible(false);
                    }}
                    key={i}
                  ></button>
                )
            )}
          </div>
        </OutsideAlerter>
      )}
    </div>
  );
};

interface PlayerProps {
  moves: any;
  itsMe: boolean;
  playerName: string;
  playerID: PlayerID;
  playerColor: number;
  colorAvailabilityMap: boolean[];
}

export const Player = (props: PlayerProps): JSX.Element => {
  const {
    moves,
    playerName,
    itsMe,
    playerID,
    playerColor,
    colorAvailabilityMap,
  } = props;

  const [currentName, setCurrentName] = useState(playerName);
  const [editing, setEditing] = useState(itsMe && playerName === "");

  let className = `gameSetupPlayer border${playerColor} bgcolor${playerColor}`;

  if (!itsMe && !playerName) {
    className += " gameSetupPlayerWaiting";
  }

  const doneEditing = () => {
    moves.setName(currentName, playerID);
    setEditing(false);
  };

  let nameElement: JSX.Element;
  let button: JSX.Element;
  const fakeButton = (
    <button className="btn btn-primary fakeButton" disabled>
      .
    </button>
  );

  if (editing) {
    nameElement = (
      <input
        type="text"
        className="form-control playerNameInput"
        onChange={(event) => setCurrentName(event.target.value)}
        placeholder="Enter your name"
        autoFocus
        maxLength={16}
        value={currentName}
        onKeyDown={(e) => {
          // On <enter> same as clicking ready
          if (e.keyCode === 13) {
            doneEditing();
            return false;
          }
          return true;
        }}
      />
    );
    button = itsMe ? (
      <button
        type="submit"
        id="readyButton"
        className="btn btn-primary"
        onClick={(e) => {
          e.preventDefault();
          doneEditing();
        }}
        disabled={currentName === ""}
      >
        Done
      </button>
    ) : (
      fakeButton
    );
  } else {
    nameElement = <div className="playerName">{playerName || "..."}</div>;
    button = itsMe ? (
      <button
        id="editButton"
        className="btn btn-primary"
        onClick={(e) => {
          e.preventDefault();
          setEditing(true);
        }}
      >
        Edit
      </button>
    ) : (
      fakeButton
    );
  }

  const colorPicker = (
    <ColorPicker
      initialColor={playerColor}
      onColorChange={(color) => moves.setColor(color, playerID)}
      colorAvailabilityMap={colorAvailabilityMap}
      disabled={!itsMe}
    />
  );

  return (
    <div {...{ className }}>
      {colorPicker}
      {nameElement}
      <div className="gameButtonWrap">{button}</div>
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

export default class GameSetup extends React.Component<GameSetupProps> {
  constructor(props) {
    super(props);
    const { playerInfos, playerID } = props;

    // If it's the first time we join that game, we tell the game. It's going to assign
    // us a default name and color.
    if (!playerInfos.hasOwnProperty(playerID)) {
      props.moves.join();
    }
  }

  render() {
    const {
      playerInfos,
      maxNumPlayers,
      passAndPlay,
      matchID,
      moves,
      playerID,
    } = this.props;

    const numPlayers = Object.values(playerInfos).length;
    const numFreeSpots = maxNumPlayers - Object.keys(playerInfos).length;
    const matchLink = `${SERVER}/match/${matchID}`;
    return (
      <div className="gameSetupWrap">
        {passAndPlay && (
          <a href="/" title="Home" className="homeLink">
            <DieLogo />
          </a>
        )}
        {!passAndPlay && (
          <div className="gameSetupInviteWrap alert alert-success">
            <div>
              <b>Share this link to invite players</b>
            </div>
            <div className="inviteLinkWrap">
              <span className="inviteLink badge badge-success user-select-all">
                {matchLink}
              </span>
              <button
                type="button"
                className="btn btn-outline-success btn-sm copyBtn"
                onClick={() => navigator.clipboard.writeText(matchLink)}
              >
                Copy
              </button>
            </div>
          </div>
        )}
        <div className="gameSetupPlayersWrap">
          {Object.entries(playerInfos).map(([currentPlayerID, playerInfo]) => {
            // Find the available colors for that players, i.e. all those which are not
            // taken already.
            const colorAvailabilityMap = Array(NUM_COLORS).fill(true);
            Object.values(playerInfos).forEach(
              (playerInfo) => (colorAvailabilityMap[playerInfo.color] = false)
            );

            return (
              <Player
                moves={moves}
                playerName={playerInfo.name}
                itsMe={passAndPlay || currentPlayerID === playerID}
                playerID={currentPlayerID}
                key={currentPlayerID}
                playerColor={playerInfo.color}
                colorAvailabilityMap={colorAvailabilityMap}
              />
            );
          })}
          {Array(numFreeSpots)
            .fill(null)
            .map((_, i) => (
              <div
                className="gameSetupPlayer gameSetupPlayerFree"
                key={numPlayers + i}
              >
                Waiting for player to join
              </div>
            ))}
          {playerID === "0" && (
            <button
              className="btn btn-primary startButton"
              onClick={() => moves.startGame()}
              disabled={Object.values(playerInfos).some((info) => !info.name)}
              key="last"
            >
              {passAndPlay
                ? "Start"
                : `Start with ${numPlayers} player${
                    numPlayers === 1 ? "" : "s"
                  }!`}
            </button>
          )}
        </div>
      </div>
    );
  }
}
