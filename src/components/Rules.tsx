import React from "react";
import { Die } from "./Die";
import { PlayerID } from "../types";
import { Climber, Mountain } from "./Mountain";

interface RulesProps {
  playerID?: PlayerID;
}

const Rules = (props) => {
  const playerID = props.playerID == null ? "0" : props.playerID;
  const makeDie = (value: number) => (
    <Die value={value} currentPlayer={playerID} />
  );
  const dice = [1, 2, 3, 6].map((value) => makeDie(value));
  const runner = (
    <span title="Runner">
      <Climber playerID={playerID} current={true} />
    </span>
  );
  const token = (
    <span title="Color Token">
      <Climber playerID={playerID} />
    </span>
  );

  const actionBtn = (text: string) => (
    <button className={`btn btnAction bgcolor${playerID}`}>{text}</button>
  );

  const mountainOptions = {
    currentPositions: { "9": 1 },
    checkpointPositions: {
      "0": { "2": 2, "5": 2 },
      "1": { "7": 5, "8": 3, "6": 6, "3": 1 },
      "2": { "12": 2, "10": 4, "3": 1, "6": 2 },
      "3": { "12": 2, "10": 5, "3": 1, "6": 2 },
    },
    blockedSums: {},
    currentPlayer: playerID,
  };

  const placeAtBottom = (
    <div className="mountainWrap">
      <Mountain
        {...{
          ...mountainOptions,
          minCol: 6,
          maxCol: 8,
          maxRow: 3,
          currentPositions: { 7: 1, 9: 1 },
        }}
      />
    </div>
  );

  const placeAfter = (
    <div className="mountainWrap">
      <Mountain
        {...{
          ...mountainOptions,
          minCol: 4,
          maxCol: 6,
          maxRow: 3,
          currentPositions: { 5: 3 },
        }}
      />
    </div>
  );

  const moveUp = (
    <div className="mountainWrap">
      <Mountain
        {...{
          ...mountainOptions,
          minCol: 8,
          maxCol: 10,
          maxRow: 3,
          // Ok now this is ugly
          mouseOverPossibility: { diceSplit: 0, dicePairs: [0] },
          diceSumOptions: [{ diceSums: [9, null] }],
        }}
      />
    </div>
  );

  const both = (
    <div className="mountainWrap">
      <Mountain
        {...{
          ...mountainOptions,
          minCol: 5,
          maxCol: 7,
          maxRow: 3,
          currentPositions: { 5: 3, 7: 1 },
        }}
      />
    </div>
  );

  const moveUpTable = (
    <div className="container-fluid">
      <div className="row movesWrap no-gutters">
        <div className="col-sm-6">
          <div className="movesBox">
            <div className="movesLeft">
              <p>Add a new {runner} at the bottom of a column.</p>
            </div>
            <div className="movesRight">
              {dice[0]}
              {dice[3]} &nbsp;→&nbsp;
              {placeAtBottom}
            </div>
          </div>
        </div>
        <div className="col-sm-6">
          <div className="movesBox">
            <div className="movesLeft">
              <p>Continue right above one of your {token}.</p>
            </div>
            <div className="movesRight">
              {dice[1]}
              {dice[2]} &nbsp;→&nbsp; {placeAfter}
            </div>
          </div>
        </div>
        <div className="col-sm-6">
          <div className="movesBox">
            <div className="movesLeft">
              <p>Move an already placed {runner} up one step.</p>
            </div>
            <div className="movesRight">
              {dice[1]}
              {dice[3]} &nbsp;→&nbsp;
              {moveUp}
            </div>
          </div>
        </div>
        <div className="col-sm-6">
          <div className="movesBox">
            <div className="movesLeft">
              <p>If you can use both pairs, you must do it.</p>
            </div>
            <div className="movesRight">
              <div className="doubleDiceWrap">
                <div className="doubleDiceRow">
                  {dice[1]} {dice[2]}
                </div>
                <hr />
                <div className="doubleDiceRow">
                  {dice[0]} {dice[3]}
                </div>
              </div>
              &nbsp;→&nbsp; {both}
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const bust = (
    <div className="bust badge badge-danger">
      <strong>bust</strong>
    </div>
  );

  return (
    <div className="rules">
      <h2>Overview</h2>
      <p>
        You must climb the different columns faster than your opponents, by
        rolling different dice sums for each column. You can keep rolling to
        move faster but you might bust and lose your progress. Will you be able
        to stop in time?
      </p>
      <div className="fullMountain">
        <Mountain {...mountainOptions} />
      </div>
      <h2>On your turn </h2>
      <p>
        You can either {actionBtn("Roll")} or {actionBtn("Stop")}. When rolling,
        you try to make your (up to three) <strong>runners</strong> ({runner})
        progress. When stopping, you end your turn but keep the progress you
        made this turn using <strong>tokens</strong> of your color ({token}).
        You can {actionBtn("Roll")} as many times as you like until you either{" "}
        {actionBtn("Stop")} or {bust}.{" "}
      </p>
      <h3>Roll</h3>
      <p>
        You roll the four dice {dice} and split them into two pairs ({dice[0]}
        {dice[1]}|{dice[2]}
        {dice[3]} or {dice[0]}
        {dice[2]}|{dice[1]}
        {dice[3]} or {dice[0]}
        {dice[3]}|{dice[1]}
        {dice[2]}). For each pair, you can add or move a {runner} up on the
        corresponding column. You can have up to three different {runner} par
        turn.
      </p>
      {moveUpTable}
      <p>
        If you can't do any action for any pair, you {bust}. You lose the
        progress made by the {runner} and your turn ends.
      </p>

      <h3>Stop</h3>
      <p>
        If you have a {runner} at the end of a column, the column is{" "}
        <strong>blocked</strong> by you. From now on, no one can use it. The
        first player to <strong>block</strong> three columns{" "}
        <strong>wins</strong>.
      </p>
      <p>
        You change your {runner} into {token} and end your turn.
      </p>
      <p></p>
    </div>
  );
};

export default Rules;
