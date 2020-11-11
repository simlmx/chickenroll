import React from "react";
import { DiceBoard } from "./DiceBoard";
import { SERVER, MAX_PLAYERS } from "../constants";

class Home extends React.Component<{ onCreate: () => void }> {
  diceValues: number[];
  colorIdx: string;

  constructor(props) {
    super(props);
    this.diceValues = Array(4)
      .fill(null)
      .map(() => Math.floor(Math.random() * 6) + 1);
    this.colorIdx = Math.floor(Math.random() * 5).toString();
  }

  render() {
    const diceBoard = (
      <div className="text-center">
        <DiceBoard
          diceValues={this.diceValues}
          diceHighlight={[false, false, false, false]}
          currentPlayer={this.colorIdx}
        />
      </div>
    );

    const ref = (
      <p className="text-center">
        This is an online version of the classic game{" "}
        <a href="https://en.wikipedia.org/wiki/Can%27t_Stop_(board_game)">
          Can't Stop
        </a>
        .
      </p>
    );

    const playInternet = (
      <div className="form-group">
        <button
          className="btn btn-primary"
          onClick={() => this.props.onCreate()}
        >
          Create a new match
        </button>
        <small className="form-text text-muted">
          You will be able to send an invitation link to your friends.
        </small>
      </div>
    );

    const playDevice = (
      <div>
        <p>
          Choose the number of players:
          <div style={{ display: "inline-block" }}>
            {Array(MAX_PLAYERS)
              .fill(null)
              .map((_, i) => (
                <button
                  className="btn btn-primary"
                  onClick={() => {
                    window.location.href = `${SERVER}/${i + 1}`;
                  }}
                  key={i}
                >
                  {i + 1}
                </button>
              ))}
          </div>
        </p>
      </div>
    );

    return (
      <div className="homeContent">
        <h1> Can't Stop! </h1>
        <div>
          {diceBoard}
          {ref}
          <h2> Play over the internet </h2>
          {playInternet}
          <h2>Play on one device</h2>
          {playDevice}
        </div>
      </div>
    );
  }
}

export default Home;
