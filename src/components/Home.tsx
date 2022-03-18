import React, { useState } from "react";
import { DiceBoard } from "./DiceBoard";
import { URL_PREFIX, MAX_PLAYERS } from "../constants";
import { rollDie, pickColor } from "../math/probs";

const Home = (): JSX.Element => {
  const [colors, setColors] = useState([0, 1, 2, 3]);
  const [diceValues, setDiceValues] = useState([1, 2, 3, 6]);

  // For some reason clicking highlights the text from the next <div>, so we
  // call preventDefault() to stop it.
  const diceBoard = (
    <div className="text-center" onMouseDown={(e) => e.preventDefault()}>
      <DiceBoard
        diceValues={diceValues}
        diceHighlight={[false, false, false, false]}
        color={colors}
        onClick={(index: number) => {
          const newColors = [...colors];
          newColors[index] = pickColor();
          setColors(newColors);

          const newDiceValues = [...diceValues];
          newDiceValues[index] = rollDie();
          setDiceValues(newDiceValues);
        }}
      />
    </div>
  );

  const playInternet = (
    <>
      <p className="small text-muted">
        You will be able to send an invitation link to your friends.
      </p>
      <div className="text-center">
        <a
          style={{ width: "50%", fontSize: "1.5rem" }}
          className="btn btn-primary"
          href="https://lefun.fun/g/chickenroll"
        >
          Play
        </a>
      </div>
      <div className="playLegacyWrap">
        <a href={`${URL_PREFIX}/match`}>Play (legacy version)</a>
      </div>
    </>
  );

  const playDevice = (
    <>
      <p className="text-muted small">
        You will pass the device between players after each turn.
      </p>
      <p>
        Number of players:
        <span style={{ display: "inline-block" }}>
          {Array(MAX_PLAYERS - 1)
            .fill(null)
            .map((_, i) => (
              <button
                className="btn btn-primary btn-sm"
                onClick={() => {
                  window.location.href = `${URL_PREFIX}/${i + 2}`;
                }}
                key={i}
              >
                {i + 2}
              </button>
            ))}
        </span>
      </p>
    </>
  );

  return (
    <div className="homeContent">
      <div className="newVersionWrap">
        <span className="newVersionText">Chicken Roll has moved to</span>
        <a
          className="lefunLink btn btn-primary btn-sm playEmphasis"
          href="https://lefun.fun"
        >
          lefun.fun
        </a>
        <span className="lefunDetails">
          It now has a chat, extra options, and <b>more</b>! 🙊
        </span>
      </div>
      <h1>
        {" "}
        Chicken Roll{" "}
        <span role="img" aria-label="chicken">
          🐓
        </span>
      </h1>
      <p className="text-muted small text-center">
        Online alternative to the classic board game{" "}
        <i>
          <a
            href="https://en.wikipedia.org/wiki/Can%27t_Stop_(board_game)"
            className="homePageLink text-muted"
          >
            Can't Stop
          </a>
        </i>
      </p>
      <div>
        {diceBoard}
        <h2> Play remotely </h2>
        {playInternet}
        <h2>Play locally</h2>
        {playDevice}
      </div>
    </div>
  );
};

export default Home;
