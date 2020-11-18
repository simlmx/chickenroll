import React, { useState } from "react";
import { DiceBoard } from "./DiceBoard";
import { SERVER, MAX_PLAYERS, NUM_COLORS } from "../constants";

const pickColor = (): number => Math.floor(Math.random() * NUM_COLORS);
const pickDiceValue = (): number => Math.floor(Math.random() * 6) + 1;

const Home = (props: { onCreate: () => void }): JSX.Element => {
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
          newDiceValues[index] = pickDiceValue();
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
      <div className="form-group">
        <button className="btn btn-primary" onClick={() => props.onCreate()}>
          Create a new match
        </button>
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
          {Array(MAX_PLAYERS)
            .fill(null)
            .map((_, i) => (
              <button
                className="btn btn-primary btn-sm"
                onClick={() => {
                  window.location.href = `${SERVER}/${i + 1}`;
                }}
                key={i}
              >
                {i + 1}
              </button>
            ))}
        </span>
      </p>
    </>
  );

  return (
    <div className="homeContent">
      <h1> Can't Stop! </h1>
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
